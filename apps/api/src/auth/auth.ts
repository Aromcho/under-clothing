import {
  Body, CanActivate, Controller, ExecutionContext, ForbiddenException, Get, HttpCode, Inject, Injectable,
  Post, Req, Res, SetMetadata, UnauthorizedException, UseGuards, createParamDecorator,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { DB, Db, schema } from '../db/db';

export const COOKIE = 'uc_session';
export type SessionUser = { id: number; email: string; name: string; role: 'admin' | 'editor' };
const secret = () => process.env.JWT_SECRET || 'dev-secret';

export const Roles = (...roles: SessionUser['role'][]) => SetMetadata('roles', roles);
export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest().user as SessionUser);

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest<Request & { user?: SessionUser }>();
    const token = req.cookies?.[COOKIE];
    if (!token) throw new UnauthorizedException('Iniciá sesión');
    try {
      req.user = jwt.verify(token, secret()) as SessionUser;
    } catch {
      throw new UnauthorizedException('Sesión vencida');
    }
    const roles = this.reflector.getAllAndOverride<string[]>('roles', [ctx.getHandler(), ctx.getClass()]);
    if (roles?.length && !roles.includes(req.user.role)) throw new ForbiddenException('Tu rol no permite esta acción');
    return true;
  }
}

// Límite simple de intentos de login por IP
const attempts = new Map<string, { n: number; until: number }>();

@Controller('auth')
export class AuthController {
  constructor(@Inject(DB) private db: Db) {}

  @Post('login')
  @HttpCode(200)
  async login(@Body() body: { email?: string; password?: string }, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const ip = req.ip ?? 'x';
    const a = attempts.get(ip);
    if (a && a.n >= 8 && a.until > Date.now()) throw new UnauthorizedException('Demasiados intentos. Probá en unos minutos.');
    const email = String(body.email ?? '').trim().toLowerCase();
    const [u] = await this.db.select().from(schema.users).where(eq(schema.users.email, email));
    const ok = u && (await bcrypt.compare(String(body.password ?? ''), u.passwordHash));
    if (!ok) {
      attempts.set(ip, { n: (a && a.until > Date.now() ? a.n : 0) + 1, until: Date.now() + 10 * 60_000 });
      throw new UnauthorizedException('Email o contraseña incorrectos');
    }
    attempts.delete(ip);
    const user: SessionUser = { id: u.id, email: u.email, name: u.name, role: u.role };
    res.cookie(COOKIE, jwt.sign(user, secret(), { expiresIn: '7d' }), {
      httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' && process.env.COOKIE_INSECURE !== '1', maxAge: 7 * 864e5, path: '/',
    });
    return user;
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(COOKIE, { path: '/' });
    return { ok: true };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(@CurrentUser() user: SessionUser) { return user; }
}
