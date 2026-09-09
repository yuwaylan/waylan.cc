import type { APIRoute } from 'astro';
import { projects } from '../../data/projects';
import { dbConfigured } from '../../lib/db';
import { env, siteOrigin } from '../../lib/env';
import { sameOrigin, smallJSON, safePath, sourceHost, requestIP } from '../../lib/security';
import { recordVisit } from '../../lib/analytics';
export const prerender = false;
const allowed = new Set(['/', '/archive/', ...projects.map((p) => `/work/${p.slug}/`)]);
export const POST: APIRoute = async (ctx) => {
  const response = (status = 204) =>
    new Response(null, { status, headers: { 'Cache-Control': 'no-store' } });
  if (!sameOrigin(ctx.request, siteOrigin())) return response(403);
  if (ctx.request.headers.get('dnt') === '1' || ctx.request.headers.get('sec-gpc') === '1')
    return response();
  if (!dbConfigured() || !env('IP_ENCRYPTION_KEY')) return response();
  // Preview deployments never contaminate production analytics.
  if (env('VERCEL_ENV') === 'preview') return response();
  let payload: Record<string, unknown>;
  try {
    payload = await smallJSON(ctx.request);
  } catch {
    return response(400);
  }
  const path = safePath(payload.path, allowed);
  if (!path) return response(400);
  const ip = requestIP(ctx.request.headers, env('VERCEL') === '1', ctx.clientAddress);
  if (!ip) return response();
  const country = env('VERCEL') === '1' ? ctx.request.headers.get('x-vercel-ip-country') || '' : '';
  try {
    await recordVisit(
      ip,
      path,
      sourceHost(payload.referrer),
      /^[A-Z]{2}$/.test(country) ? country : '',
    );
  } catch (error) {
    console.error(
      'Visit storage unavailable',
      import.meta.env.DEV && error instanceof Error ? error.message : '',
    );
    return response(503);
  }
  return response();
};
