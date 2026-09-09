import type { APIRoute } from 'astro';
import { env, siteOrigin, authConfigured } from '../../../lib/env';
import { verify } from '../../../lib/security';
import { setSession } from '../../../lib/auth';
export const prerender = false;
export const GET: APIRoute = async ({ cookies, url, redirect }) => {
  const state = verify<{ state: string; verifier: string; exp: number }>(
    cookies.get('waylan_oauth')?.value,
    env('SESSION_SECRET'),
  );
  cookies.delete('waylan_oauth', { path: '/api/auth' });
  const fail = () => redirect('/admin/login/?error=auth');
  if (
    !authConfigured() ||
    !state ||
    state.state !== url.searchParams.get('state') ||
    !url.searchParams.get('code')
  )
    return fail();
  try {
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: env('GITHUB_CLIENT_ID'),
        client_secret: env('GITHUB_CLIENT_SECRET'),
        code: url.searchParams.get('code'),
        redirect_uri: `${siteOrigin()}/api/auth/callback`,
        code_verifier: state.verifier,
      }),
      signal: AbortSignal.timeout(10000),
    });
    const token = await tokenResponse.json();
    if (!tokenResponse.ok || !token.access_token) return fail();
    const result = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'waylan.cc',
      },
      signal: AbortSignal.timeout(10000),
    });
    const user = await result.json();
    if (!result.ok || String(user.id) !== env('ADMIN_GITHUB_ID')) return fail();
    setSession(cookies, String(user.id), user.login);
    return redirect('/admin/');
  } catch {
    return fail();
  }
};
