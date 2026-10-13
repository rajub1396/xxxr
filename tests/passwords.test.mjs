import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword } from '../lib/passwords.mjs';
import { safeReturnTo } from '../lib/navigation.mjs';
import { isAllowedOrigin } from '../lib/request-origin.mjs';
test('password hashes have unique salts and verify only the correct password', async () => {
  const password = 'A long test password 123!';
  const first = await hashPassword(password); const second = await hashPassword(password);
  assert.notEqual(first, second); assert.equal(await verifyPassword(password, first), true);
  assert.equal(await verifyPassword('Wrong password 456!', first), false);
});
test('malformed stored hashes fail closed', async () => {
  for (const hash of ['', 'scrypt', 'scrypt:bad:hash', 'other:abc:def']) assert.equal(await verifyPassword('password', hash), false);
});
test('login redirects reject external URLs and preserve local paths', () => {
  for (const path of ['https://evil.test', '//evil.test', '/\\evil.test', null, undefined]) assert.equal(safeReturnTo(path), '/watch/index.html');
  assert.equal(safeReturnTo('/admin?tab=videos'), '/admin?tab=videos');
});
test('custom-domain origins are accepted only when explicitly configured', () => {
  const settings = { appUrl: 'https://www.xxxr.online/', allowedOrigins: 'https://xxxr.online, https://xxxr.onrender.com' };
  for (const origin of ['https://www.xxxr.online', 'https://xxxr.online', 'https://xxxr.onrender.com']) {
    assert.equal(isAllowedOrigin(new Request('http://localhost:10000/api/auth/login', { headers: { Origin: origin } }), settings), true);
  }
  for (const origin of ['https://www.xxxr.online.evil.test', 'http://www.xxxr.online', 'https://www.xxxr.online:8443', 'null', 'invalid', 'https://attacker.test']) {
    assert.equal(isAllowedOrigin(new Request('http://localhost:10000/api/auth/login', { headers: { Origin: origin } }), settings), false);
  }
  assert.equal(isAllowedOrigin(new Request('http://localhost:10000/api/auth/login'), settings), false);
});
