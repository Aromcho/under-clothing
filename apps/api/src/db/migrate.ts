import { migrate } from 'drizzle-orm/node-postgres/migrator';
import path from 'node:path';
import { createDb } from './db';

(async () => {
  const { db, pool } = createDb();
  await migrate(db, { migrationsFolder: path.resolve(process.cwd(), 'drizzle') });
  await pool.end();
  console.log('  Migraciones aplicadas');
})().catch((e) => { console.error(e); process.exit(1); });
