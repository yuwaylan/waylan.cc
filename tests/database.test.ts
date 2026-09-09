import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { recordSQL } from '../src/lib/record-sql';
test('PostgreSQL schema: atomic deduplication, rate limit, aggregation and retention', async () => {
  const db = new PGlite();
  try {
    const schema = await readFile(new URL('../db/schema.sql', import.meta.url), 'utf8');
    await db.exec(schema);
    await db.exec(schema);
    const params = ['a'.repeat(64), 'encrypted', '/', 'example.test', 'TW', 100];
    await Promise.all(Array.from({ length: 8 }, () => db.query(recordSQL, params)));
    let result = await db.query<{ count: number }>('SELECT count(*)::int AS count FROM visits');
    assert.equal(result.rows[0].count, 1);
    await db.query(recordSQL, [...params.slice(0, 5), 101]);
    await db.query(recordSQL, ['b'.repeat(64), 'encrypted', '/archive/', '', 'JP', 101]);
    const totals = await db.query<{ views: number; ips: number }>(
      'SELECT count(*)::int AS views,count(DISTINCT ip_hash)::int AS ips FROM visits',
    );
    assert.deepEqual(totals.rows[0], { views: 3, ips: 2 });
    for (let i = 0; i < 65; i++)
      await db.query(recordSQL, ['c'.repeat(64), 'encrypted', `/test-${i}/`, '', '', 102]);
    result = await db.query<{ count: number }>(
      'SELECT count(*)::int AS count FROM visits WHERE ip_hash=$1',
      ['c'.repeat(64)],
    );
    assert.equal(result.rows[0].count, 60);
    await db.query("UPDATE visits SET viewed_at=now()-interval '31 days' WHERE ip_hash=$1", [
      'a'.repeat(64),
    ]);
    await db.query("DELETE FROM visits WHERE viewed_at < now()-($1::int*interval '1 day')", [30]);
    result = await db.query<{ count: number }>(
      'SELECT count(*)::int AS count FROM visits WHERE ip_hash=$1',
      ['a'.repeat(64)],
    );
    assert.equal(result.rows[0].count, 0);
    const page = await db.query(
      'SELECT id FROM visits ORDER BY viewed_at DESC,id DESC LIMIT 25 OFFSET 25',
    );
    assert.equal(page.rows.length, 25);
  } finally {
    await db.close();
  }
});
