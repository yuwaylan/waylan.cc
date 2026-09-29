import { defineMiddleware } from 'astro:middleware';
import { isSearchHiddenPath } from './data/projects';
const hiddenHeaders = {
  'Cache-Control': 'private, no-store',
  'X-Robots-Tag': 'noindex, nofollow, noarchive, noimageindex',
};
export const onRequest = defineMiddleware(async (context, next) => {
  if (isSearchHiddenPath(context.url.pathname) && context.url.pathname.startsWith('/images/')) {
    return new Response('Not Found', {
      status: 404,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'X-Frame-Options': 'DENY',
        ...hiddenHeaders,
      },
    });
  }
  const response = await next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-Frame-Options', 'DENY');
  if (
    context.url.pathname.startsWith('/admin') ||
    context.url.pathname.startsWith('/api/auth') ||
    context.url.pathname.startsWith('/api/admin')
  ) {
    response.headers.set('Cache-Control', 'private, no-store');
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }
  if (isSearchHiddenPath(context.url.pathname)) {
    response.headers.set('Cache-Control', hiddenHeaders['Cache-Control']);
    response.headers.set('X-Robots-Tag', hiddenHeaders['X-Robots-Tag']);
  }
  return response;
});
