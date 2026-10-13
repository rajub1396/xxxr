import assert from 'node:assert/strict';
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3100';
const request = (path, options = {}) => fetch(`${base}${path}`, { redirect: 'manual', ...options });
for (const path of ['/admin-login', '/login', '/watch/index.html']) {
  const response = await request(path);
  assert.equal(response.status, 200, path);
  assert.match(await response.text(), /RedX|RED|flutter/i, path);
}
const denied = await request('/admin');
assert.equal(denied.status, 307);
assert.equal(new URL(denied.headers.get('location'), base).pathname, '/admin-login');
const spoofed = await request('/admin', { headers: { 'oai-authenticated-user-id': 'fake', 'oai-authenticated-user-email': 'rajuit1396@gmail.com' } });
assert.equal(spoofed.status, 307, 'forged identity headers must not grant access');
const csrf = await request('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://untrusted.example' }, body: JSON.stringify({ email: 'rajuit1396@gmail.com', password: 'not a real password' }) });
assert.equal(csrf.status, 403, 'cross-origin login must be rejected');
const legacy = await request('/signin-with-chatgpt?return_to=%2Fadmin');
assert.equal(legacy.status, 302);
assert.equal(new URL(legacy.headers.get('location'), base).pathname, '/login');
console.log('HTTP smoke checks passed: pages, admin redirects, forged headers, CSRF, and legacy sign-in.');
