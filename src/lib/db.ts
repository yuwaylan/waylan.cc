import { mkdir } from 'node:fs/promises';
import { neon } from '@neondatabase/serverless';
import { env, localMode } from './env';
import schema from '../../db/schema.sql?raw';
type Params = (string | number | boolean | null)[];
type RecordRow = Record<string, unknown>;
let localPromise: Promise<import('@electric-sql/pglite').PGlite> | undefined;
async function localDatabase() {
  if (!localMode()) throw new Error('Local database is disabled');
  if (!localPromise)
    localPromise = (async () => {
      const { PGlite } = await import('@electric-sql/pglite');
      await mkdir('.local', { recursive: true });
      const db = new PGlite('.local/analytics');
      await db.exec(schema);
      return db;
    })().catch((error) => {
      localPromise = undefined;
      throw error;
    });
  return localPromise;
}
export function dbConfigured() {
  return Boolean(env('DATABASE_URL')) || localMode();
}
export async function query<T extends RecordRow = RecordRow>(
  text: string,
  params: Params = [],
): Promise<T[]> {
  if (env('DATABASE_URL')) {
    const sql = neon(env('DATABASE_URL'));
    return (await sql.query(text, params)) as T[];
  }
  const db = await localDatabase();
  return (await db.query<T>(text, params)).rows;
}
export { schema };
