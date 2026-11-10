import { BadRequestException, Body, Controller, Get, Inject, Param, Put, UseGuards } from '@nestjs/common';
import { AuthGuard, CurrentUser, SessionUser } from '../auth/auth';
import { DB, Db, schema } from '../db/db';
import { ActivityLog, Revalidator } from '../common/services';

export const SETTING_KEYS = ['business', 'hours', 'shipping', 'returns', 'payments', 'seo'] as const;
const LABELS: Record<string, string> = { business: 'datos del negocio', hours: 'horarios', shipping: 'envíos', returns: 'cambios y devoluciones', payments: 'medios de pago', seo: 'SEO' };

export async function loadSettings(db: Db) {
  const rows = await db.select().from(schema.settings);
  return Object.fromEntries(rows.map((r) => [r.key, r.value])) as Record<string, Record<string, any>>;
}

@Controller('admin/settings')
@UseGuards(AuthGuard)
export class SettingsController {
  constructor(@Inject(DB) private db: Db, private rv: Revalidator, private log: ActivityLog) {}

  @Get() all() { return loadSettings(this.db); }

  @Put(':key')
  async save(@Param('key') key: string, @Body() value: Record<string, any>, @CurrentUser() u: SessionUser) {
    if (!SETTING_KEYS.includes(key as any) || typeof value !== 'object' || !value) throw new BadRequestException('Clave inválida');
    await this.db.insert(schema.settings).values({ key, value }).onConflictDoUpdate({ target: schema.settings.key, set: { value, updatedAt: new Date() } });
    await this.log.add(u.name, 'editó', LABELS[key] ?? key);
    await this.rv.tags('site');
    return value;
  }
}
