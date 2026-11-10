import { BadRequestException, Body, Controller, Delete, Get, Inject, NotFoundException, Param, ParseIntPipe, Patch, Post, Put, Type, UseGuards } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';
import { z } from 'zod';
import { AuthGuard, CurrentUser, Roles, SessionUser } from '../auth/auth';
import { DB, Db } from '../db/db';
import { ActivityLog, Revalidator, slugify } from '../common/services';

type Opts = { path: string; table: PgTable & Record<string, any>; schema: z.ZodObject<any>; label: string; tags: string[]; nameKey?: string; slugFrom?: string };

/** Fábrica de controladores CRUD para las tablas simples del panel. */
export function crud({ path, table, schema, label, tags, nameKey = 'name', slugFrom }: Opts): Type<any> {
  const parse = (body: unknown, partial = false) => {
    const r = (partial ? schema.partial() : schema).safeParse(body);
    if (!r.success) throw new BadRequestException(r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(' · '));
    return r.data as Record<string, any>;
  };

  @Controller(`admin/${path}`)
  @UseGuards(AuthGuard)
  class CrudController {
    constructor(@Inject(DB) readonly db: Db, readonly rv: Revalidator, readonly log: ActivityLog) {}

    @Get()
    list() {
      return this.db.select().from(table).orderBy(asc(table.position), asc(table.id));
    }

    @Post()
    async create(@Body() body: unknown, @CurrentUser() u: SessionUser) {
      const data = parse(body);
      if (slugFrom && !data.slug) data.slug = slugify(data[slugFrom]);
      const [row] = (await this.db.insert(table).values(data).returning()) as any[];
      await this.log.add(u.name, 'creó', label, row[nameKey] ?? '');
      await this.rv.tags(...tags);
      return row;
    }

    @Put('reorder')
    async reorder(@Body() body: { ids: number[] }) {
      if (!Array.isArray(body?.ids)) throw new BadRequestException('ids requerido');
      await this.db.transaction(async (tx) => {
        for (let i = 0; i < body.ids.length; i++) await tx.update(table).set({ position: i }).where(eq(table.id, Number(body.ids[i])));
      });
      await this.rv.tags(...tags);
      return { ok: true };
    }

    @Patch(':id')
    async update(@Param('id', ParseIntPipe) id: number, @Body() body: unknown, @CurrentUser() u: SessionUser) {
      const data = parse(body, true);
      if (slugFrom && data.slug === '') data.slug = slugify(data[slugFrom] ?? '');
      const [row] = (await this.db.update(table).set(data).where(eq(table.id, id)).returning()) as any[];
      if (!row) throw new NotFoundException();
      await this.log.add(u.name, 'editó', label, row[nameKey] ?? '');
      await this.rv.tags(...tags);
      return row;
    }

    @Delete(':id')
    @Roles('admin')
    async remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() u: SessionUser) {
      const [row] = (await this.db.delete(table).where(eq(table.id, id)).returning()) as any[];
      if (!row) throw new NotFoundException();
      await this.log.add(u.name, 'eliminó', label, row[nameKey] ?? '');
      await this.rv.tags(...tags);
      return { ok: true };
    }
  }
  return CrudController;
}
