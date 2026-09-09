import type { APIRoute } from 'astro';
import { timingSafeEqual } from 'node:crypto';
import { env } from '../../../lib/env';
import { prune } from '../../../lib/analytics';
import { json } from '../../../lib/security';
export const prerender = false;
export const GET: APIRoute = async ({ request }) => {
  const secret = env('CRON_SECRET');
  const header = request.headers.get('authorization') || '';
  const expected = `Bearer ${secret}`;
  if (
    secret.length < 32 ||
    Buffer.byteLength(header) !== Buffer.byteLength(expected) ||
    !timingSafeEqual(Buffer.from(header), Buffer.from(expected))
  )
    return json({ error: 'Unauthorized' }, 401);
  try {
    return json({ deleted: await prune() });
  } catch {
    return json({ error: 'Cleanup failed' }, 503);
  }
};
