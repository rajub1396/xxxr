import assert from 'node:assert/strict';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { getPool } from '../db/pool.mjs';
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3100';
const origin = new URL(base).origin;
const email = `e2e-${randomUUID()}@example.invalid`;
const password = randomBytes(24).toString('hex');
let adminCookie = '', memberCookie = '', videoId, memberId;
async function request(path, { method = 'GET', body, cookie = '', expected = 200 } = {}) {
  const response = await fetch(`${base}${path}`, { method, redirect: 'manual', signal: AbortSignal.timeout(30000), headers: { Origin: origin, ...(body ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  assert.equal(response.status, expected, `${method} ${path}: expected ${expected}, got ${response.status}`);
  const data = await response.json();
  const setCookie = response.headers.getSetCookie().find(value => value.startsWith('redx_session='));
  return { data, cookie: setCookie?.split(';')[0] || '', setCookie };
}
const pool = getPool();
try {
  assert.ok(process.env.ADMIN_INITIAL_PASSWORD, 'Set ADMIN_INITIAL_PASSWORD to the configured administrator password for this test.');
  assert.equal((await request('/healthz')).data.status, 'ok');
  console.log('PASS Neon-backed health check');
  await request('/api/auth/login', { method: 'POST', body: { email: process.env.ADMIN_EMAIL || 'rajuit1396@gmail.com', password: 'Wrong test password!' }, expected: 401 });
  const login = await request('/api/auth/login', { method: 'POST', body: { email: process.env.ADMIN_EMAIL || 'rajuit1396@gmail.com', password: process.env.ADMIN_INITIAL_PASSWORD } });
  adminCookie = login.cookie;
  assert.ok(adminCookie); assert.match(login.setCookie, /HttpOnly/i); assert.match(login.setCookie, /SameSite=Lax/i);
  assert.equal((await request('/api/me', { cookie: adminCookie })).data.admin, true);
  const adminPage = await fetch(`${base}/admin`, { headers: { Cookie: adminCookie }, redirect: 'manual' });
  assert.equal(adminPage.status, 200); assert.match(await adminPage.text(), /Collection overview/);
  console.log('PASS administrator login, session cookie, and protected dashboard');
  const registered = await request('/api/auth/register', { method: 'POST', body: { email, password, admin: true } });
  memberCookie = registered.cookie;
  const me = (await request('/api/me', { cookie: memberCookie })).data;
  assert.equal(me.admin, false); assert.equal(me.premium, false);
  memberId = (await pool.query('SELECT id FROM members WHERE email=$1', [email])).rows[0].id;
  await request('/api/members', { cookie: memberCookie, expected: 403 });
  const members = (await request('/api/members', { cookie: adminCookie })).data;
  assert.ok(members.some(member => member.id === memberId));
  assert.ok(members.every(member => !('passwordHash' in member) && !('password_hash' in member)));
  console.log('PASS registration, member persistence, and admin authorization');
  const video = await request('/api/videos', { method: 'POST', cookie: adminCookie, body: { title: `E2E ${randomUUID()}`, description: 'Temporary integration test', category: 'Test', embed: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', premium: true }, expected: 201 });
  videoId = video.data.id;
  assert.equal((await pool.query('SELECT count(*)::int AS count FROM videos WHERE id=$1', [videoId])).rows[0].count, 1);
  const listed = (await request('/api/videos')).data;
  assert.ok(listed.some(item => item.id === videoId)); assert.ok(listed.every(item => !('embed' in item)));
  assert.match(listed.find(item => item.id === videoId).thumbnail, /^https:\/\/i\.ytimg\.com\//);
  const customPreview = 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg';
  await request(`/api/videos/${videoId}`, { method: 'PATCH', cookie: adminCookie, body: { thumbnail: customPreview } });
  assert.equal((await request('/api/videos')).data.find(item => item.id === videoId).thumbnail, customPreview);
  await request(`/api/videos/${videoId}`, { method: 'PATCH', cookie: adminCookie, body: { thumbnail: 'https://127.0.0.1/private' }, expected: 400 });
  await request(`/api/videos/${videoId}`, { method: 'PATCH', cookie: memberCookie, body: { thumbnail: customPreview }, expected: 403 });
  console.log('PASS automatic previews, custom-image updates, and preview permissions');
  await request(`/api/videos/${videoId}`, { expected: 403 });
  await request(`/api/videos/${videoId}`, { cookie: memberCookie, expected: 403 });
  console.log('PASS video create/read persistence and premium URL protection');
  await request(`/api/members/${memberId}`, { method: 'PATCH', cookie: adminCookie, body: { premium: true } });
  assert.equal((await request('/api/me', { cookie: memberCookie })).data.premium, true);
  assert.match((await request(`/api/videos/${videoId}`, { cookie: memberCookie })).data.embed, /youtube-nocookie\.com\/embed\//);
  await request(`/api/members/${memberId}`, { method: 'PATCH', cookie: adminCookie, body: { premium: false } });
  await request(`/api/videos/${videoId}`, { cookie: memberCookie, expected: 403 });
  console.log('PASS premium grant, playback authorization, and revoke');
  await request(`/api/videos/${videoId}`, { method: 'DELETE', cookie: adminCookie });
  await request(`/api/videos/${videoId}`, { expected: 404 }); videoId = undefined;
  await request('/api/auth/logout', { method: 'POST', cookie: memberCookie });
  assert.equal((await request('/api/me', { cookie: memberCookie })).data.email, null);
  console.log('PASS video deletion and session invalidation');
  console.log('Neon PostgreSQL end-to-end checks passed.');
} finally {
  if (videoId) await pool.query('DELETE FROM videos WHERE id=$1', [videoId]);
  if (memberId) await pool.query('DELETE FROM members WHERE id=$1 AND email=$2', [memberId, email]);
  await pool.query('DELETE FROM auth_limits WHERE key=$1', [createHash('sha256').update(email).digest('hex')]);
  if (adminCookie) {
    const hash = createHash('sha256').update(adminCookie.split('=')[1]).digest('hex');
    await pool.query('DELETE FROM sessions WHERE token_hash=$1', [hash]);
  }
  await pool.end();
  console.log('Temporary integration-test data cleaned up.');
}
