import assert from 'node:assert/strict';
const origin = process.env.SITE_URL;
if (!origin?.startsWith('http://127.0.0.1:') || process.env.LOCAL_DEVELOPMENT !== 'true')
  throw new Error('Smoke tests run only against the explicitly configured local development site.');
const request = (path, options = {}) => fetch(origin + path, { ...options, redirect: 'manual' });
const post = (path, body, headers = {}) =>
  request(path, {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
let count = 0;
for (const path of [
  '/',
  '/archive/',
  '/work/be-water/',
  '/work/vtuber/',
  '/privacy/',
  '/sitemap.xml',
]) {
  const r = await request(path);
  assert.equal(r.status, 200, path);
  count++;
}
assert.equal((await request('/admin/')).status, 302);
count++;
assert.equal((await request('/api/admin/stats')).status, 401);
count++;
assert.equal((await post('/api/auth/local', {}, { Origin: 'https://foreign.test' })).status, 403);
count++;
const login = await post('/api/auth/local', {});
assert.equal(login.status, 303);
const cookie = login.headers.get('set-cookie').split(';')[0];
assert.match(login.headers.get('set-cookie'), /HttpOnly/i);
count++;
assert.equal((await request('/admin/', { headers: { Cookie: cookie } })).status, 200);
count++;
assert.equal(
  (await post('/api/visit', { path: '/' }, { Origin: 'https://foreign.test' })).status,
  403,
);
count++;
assert.equal((await post('/api/visit', { path: '/admin/' })).status, 400);
count++;
assert.equal(
  (
    await post('/api/visit', {
      path: '/',
      ip: '1.1.1.1',
      referrer: 'https://example.test/sensitive?discard=true',
    })
  ).status,
  204,
);
count++;
const read = async (q = '') => {
  const r = await request('/api/admin/stats' + q, { headers: { Cookie: cookie } });
  assert.equal(r.status, 200);
  assert.match(r.headers.get('cache-control'), /no-store/);
  return r.json();
};
const before = await read();
assert.ok(before.rows.length);
assert.equal(before.rows[0].ip, '127.0.0.1');
assert.equal('ip_encrypted' in before.rows[0], false);
count++;
const baseline = (await read('?path=/work/ocr-search/')).summary.views;
const firstBucket = Math.floor(Date.now() / 60000);
const writes = await Promise.all(
  Array.from({ length: 4 }, () => post('/api/visit', { path: '/work/ocr-search/' })),
);
assert.ok(writes.every((r) => r.status === 204));
const dedup = await read('?path=/work/ocr-search/');
const maxNew = Math.floor(Date.now() / 60000) - firstBucket + 1;
assert.ok(dedup.summary.views >= baseline && dedup.summary.views <= baseline + maxNew);
count++;
const protectedBefore = (await read()).summary.views;
await post('/api/visit', { path: '/work/skin-texture/' }, { DNT: '1' });
await post('/api/visit', { path: '/work/three/' }, { 'Sec-GPC': '1' });
assert.equal((await read()).summary.views, protectedBefore);
count++;
assert.equal((await read('?ip=203.0.113.99')).summary.views, 0);
count++;
assert.equal(
  (await request('/api/admin/stats?ip=invalid', { headers: { Cookie: cookie } })).status,
  400,
);
count++;
assert.equal(
  (await request('/api/admin/stats', { headers: { Cookie: cookie + 'tamper' } })).status,
  401,
);
count++;
assert.equal((await request('/api/auth/callback?state=invalid&code=invalid')).status, 302);
count++;
assert.equal((await request('/api/cron/prune')).status, 401);
count++;
const prune = await request('/api/cron/prune', {
  headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
});
assert.equal(prune.status, 200);
count++;
const logout = await post('/api/auth/logout', {});
assert.equal(logout.status, 303);
assert.match(logout.headers.get('set-cookie'), /waylan_admin=/);
count++;
console.log(`${count} HTTP integration checks passed. No credentials printed.`);
