import { BadRequestException, Body, Controller, Delete, Get, Inject, NotFoundException, Param, ParseIntPipe, Patch, Post, Put, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { asc, desc, eq, sql } from 'drizzle-orm';
import { AuthGuard, CurrentUser, Roles, SessionUser } from '../auth/auth';
import { DB, Db, schema } from '../db/db';
import { ImageService } from '../common/image.service';
import { ActivityLog, Revalidator } from '../common/services';

const { media } = schema;

@Controller('admin/media')
@UseGuards(AuthGuard)
export class MediaController {
  constructor(@Inject(DB) private db: Db, private images: ImageService, private rv: Revalidator, private log: ActivityLog) {}

  @Get() list() { return this.db.select().from(media).orderBy(asc(media.position), desc(media.id)); }

  @Post()
  @UseInterceptors(FilesInterceptor('files', 30, { limits: { fileSize: 20 * 1024 * 1024 } }))
  async upload(@UploadedFiles() files: Express.Multer.File[], @CurrentUser() u: SessionUser) {
    if (!files?.length) throw new BadRequestException('No llegó ninguna imagen');
    // Las nuevas van primero
    await this.db.update(media).set({ position: sql`${media.position} + ${files.length}` });
    const out: (typeof media.$inferSelect)[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (!/^image\//.test(f.mimetype)) throw new BadRequestException(`${f.originalname} no es una imagen`);
      const img = await this.images.process(f.buffer);
      const alt = f.originalname.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
      const [row] = await this.db.insert(media).values({ ...img, alt, position: i }).returning();
      out.push(row);
    }
    await this.log.add(u.name, 'subió', 'imágenes', `${files.length} archivo(s)`);
    return out;
  }

  @Put('reorder')
  async reorder(@Body() b: { ids: number[] }) {
    await this.db.transaction(async (tx) => {
      for (let i = 0; i < b.ids.length; i++) await tx.update(media).set({ position: i }).where(eq(media.id, Number(b.ids[i])));
    });
    return { ok: true };
  }

  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() b: { alt?: string }) {
    const [row] = await this.db.update(media).set({ alt: String(b.alt ?? '') }).where(eq(media.id, id)).returning();
    if (!row) throw new NotFoundException();
    await this.rv.tags('products', 'site');
    return row;
  }

  @Delete(':id')
  @Roles('admin')
  async remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() u: SessionUser) {
    const [row] = await this.db.delete(media).where(eq(media.id, id)).returning();
    if (!row) throw new NotFoundException();
    await this.images.remove(row.path);
    await this.log.add(u.name, 'eliminó', 'imagen', row.alt);
    await this.rv.tags('products', 'site');
    return { ok: true };
  }
}
