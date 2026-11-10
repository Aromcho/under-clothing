import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { config } from 'dotenv';
import path from 'node:path';
import * as schema from './schema';

// .env vive en la raíz del monorepo
config({ path: path.resolve(process.cwd(), '../../.env'), quiet: true });
config({ path: path.resolve(process.cwd(), '.env'), quiet: true });

export const DB = 'DB';
export type Db = NodePgDatabase<typeof schema>;
export const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');

export function createDb() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  return { db: drizzle(pool, { schema }) as Db, pool };
}
export { schema };
