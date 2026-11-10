import { BadRequestException, Body, Controller, Delete, Get, Inject, NotFoundException, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { asc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { AuthGuard, CurrentUser, Roles, SessionUser } from '../auth/auth';
import { DB, Db, schema } from '../db/db';
import { ActivityLog } from '../common/services';

const { users } = schema;
const body = z.object({ name: z.string().min(1), email: z.string().email(), role: z.enum(['admin', 'editor']), password: z.string().min(6, 'La contraseña necesita 6 caracteres o más') });
const pub = { id: users.id, name: users.name, email: users.email, role: users.role, createdAt: users.createdAt };

@Controller('admin/users')
@UseGuards(AuthGuard)
@Roles('admin')
export class UsersController {
  constructor(@Inject(DB) private db: Db, private log: ActivityLog) {}

  @Get() list() { return this.db.select(pub).from(users).orderBy(asc(users.id)); }

  @Post()
  async create(@Body() b: unknown, @CurrentUser() u: SessionUser) {
    const r = body.safeParse(b);
    if (!r.success) throw new BadRequestException(r.error.issues[0].message);
    const { password, ...d } = r.data;
    const email = d.email.toLowerCase();
    const [dup] = await this.db.select(pub).from(users).where(eq(users.email, email));
    if (dup) throw new BadRequestException('Ya existe un usuario con ese email');
    const [row] = await this.db.insert(users).values({ ...d, email, passwordHash: await bcrypt.hash(password, 10) }).returning(pub);
    await this.log.add(u.name, 'creó', 'usuario', row.name);
    return row;
  }

  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() b: unknown, @CurrentUser() u: SessionUser) {
    const r = body.partial().safeParse(b);
    if (!r.success) throw new BadRequestException(r.error.issues[0].message);
    const { password, ...d } = r.data;
    const set: Record<string, any> = { ...d };
    if (d.email) set.email = d.email.toLowerCase();
    if (password) set.passwordHash = await bcrypt.hash(password, 10);
    if (id === u.id && d.role && d.role !== 'admin') throw new BadRequestException('No podés quitarte el rol de administrador');
    const [row] = await this.db.update(users).set(set).where(eq(users.id, id)).returning(pub);
    if (!row) throw new NotFoundException();
    await this.log.add(u.name, 'editó', 'usuario', row.name);
    return row;
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() u: SessionUser) {
    if (id === u.id) throw new BadRequestException('No podés eliminar tu propio usuario');
    const [row] = await this.db.delete(users).where(eq(users.id, id)).returning(pub);
    if (!row) throw new NotFoundException();
    await this.log.add(u.name, 'eliminó', 'usuario', row.name);
    return { ok: true };
  }
}
