import { Inject, Injectable, Logger } from '@nestjs/common';
import { DB, Db, schema } from '../db/db';

/** Avisa a Next.js qué tags de caché invalidar: los cambios del panel se ven al instante. */
@Injectable()
export class Revalidator {
  private log = new Logger('Revalidate');
  async tags(...tags: string[]) {
    const url = `${process.env.WEB_URL ?? 'http://localhost:3000'}/internal/revalidate`;
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-revalidate-secret': process.env.REVALIDATE_SECRET ?? '' },
        body: JSON.stringify({ tags }),
        signal: AbortSignal.timeout(4000),
      });
    } catch {
      this.log.warn(`No se pudo revalidar (${tags.join(', ')}): ¿la web está corriendo?`);
    }
  }
}

@Injectable()
export class ActivityLog {
  constructor(@Inject(DB) private db: Db) {}
  async add(userName: string, action: string, entity: string, summary = '') {
    await this.db.insert(schema.activity).values({ userName, action, entity, summary });
  }
}

export const slugify = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, ' y ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
