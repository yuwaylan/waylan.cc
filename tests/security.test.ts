import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  sign,
  verify,
  encryptIP,
  decryptIP,
  normalizeIP,
  requestIP,
  ipHash,
  sameOrigin,
  smallJSON,
  safePath,
  sourceHost,
} from '../src/lib/security';
const key = '12'.repeat(32),
  other = '34'.repeat(32),
  secret = 'test-secret-with-at-least-thirty-two-characters';
test('session rejects tampering, expiry, wrong key and wrong formats', () => {
  const payload = { kind: 'admin', id: '29536621', exp: Date.now() + 10000 };
  const token = sign(payload, secret);
  assert.deepEqual(verify(token, secret), payload);
  assert.equal(verify(token + 'x', secret), null);
  assert.equal(verify(token, other), null);
  assert.equal(verify(token, secret, Date.now() + 11000), null);
  assert.equal(verify('x.y.z', secret), null);
  assert.equal(verify(undefined, secret), null);
  assert.equal(verify(token, 'short'), null);
});
test('IP encryption is randomized and authenticated; hash stays stable', () => {
  for (const ip of ['203.0.113.4', '2001:db8::9']) {
    const a = encryptIP(ip, key),
      b = encryptIP(ip, key);
    assert.notEqual(a, b);
    assert.equal(decryptIP(a, key), ip);
    assert.equal(a.includes(ip), false);
    assert.throws(() => decryptIP(a, other));
    const pieces = a.split('.');
    pieces[3] = Buffer.from('modified').toString('base64url');
    assert.throws(() => decryptIP(pieces.join('.'), key));
    assert.equal(ipHash(ip, key), ipHash(ip, key));
    assert.notEqual(ipHash(ip, key), ipHash(ip, other));
  }
  assert.throws(() => encryptIP('invalid', key));
});
test('IP source trusts Vercel overwrite only and normalizes IPv6', () => {
  const headers = new Headers({
    'x-forwarded-for': '1.1.1.1',
    'x-vercel-forwarded-for': '203.0.113.42, 192.0.2.1',
  });
  assert.equal(requestIP(headers, true, '127.0.0.1'), '203.0.113.42');
  assert.equal(requestIP(headers, false, '127.0.0.1'), '127.0.0.1');
  assert.equal(requestIP(new Headers({ 'x-forwarded-for': '1.1.1.1' }), true, '127.0.0.1'), null);
  assert.equal(normalizeIP('2001:0DB8:0000:0000:0000:0000:0000:0001'), '2001:db8::1');
  assert.equal(normalizeIP('::ffff:192.0.2.1'), '192.0.2.1');
  assert.equal(normalizeIP('fe80::1%eth0'), null);
  assert.equal(normalizeIP('unknown'), null);
});
test('only same-origin writes accepted and referrer query is discarded', () => {
  const origin = 'https://waylan.cc';
  assert.equal(sameOrigin(new Request(origin, { headers: { origin } }), origin), true);
  assert.equal(
    sameOrigin(new Request(origin, { headers: { origin: 'https://evil.test' } }), origin),
    false,
  );
  assert.equal(sameOrigin(new Request(origin), origin), false);
  assert.equal(
    sameOrigin(
      new Request(origin, { headers: { origin, 'sec-fetch-site': 'cross-site' } }),
      origin,
    ),
    false,
  );
  assert.equal(sourceHost('https://example.test/private?email=secret#fragment'), 'example.test');
  assert.equal(sourceHost('javascript:alert(1)'), '');
  assert.equal(sourceHost('invalid'), '');
});
test('visit routes are allowlisted; arbitrary paths and payloads rejected', async () => {
  const allowed = new Set(['/', '/archive/']);
  assert.equal(safePath('/archive', allowed), '/archive/');
  assert.equal(safePath('/admin/', allowed), null);
  assert.equal(safePath('/?email=secret', allowed), null);
  assert.equal(safePath('//evil.test', allowed), null);
  const req = (body: string) =>
    new Request('https://waylan.cc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
  assert.deepEqual(await smallJSON(req('{"path":"/"}')), { path: '/' });
  await assert.rejects(smallJSON(req('[')));
  await assert.rejects(smallJSON(req('[]')));
  await assert.rejects(smallJSON(req('null')));
  await assert.rejects(smallJSON(req('x'.repeat(5000))));
});
