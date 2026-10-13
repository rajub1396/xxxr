import { cookies } from 'next/headers';
import { createHash, randomBytes } from 'node:crypto';
import { getPool } from '../db/pool.mjs';
export const SESSION_COOKIE = 'redx_session';
export type User = { userId: string; email: string; admin: boolean };
const digest = (token: string) => createHash('sha256').update(token).digest('hex');
export async function getUser(): Promise<User | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const result = await getPool().query('SELECT m.id, m.email, m.admin FROM sessions s JOIN members m ON m.id=s.member_id WHERE s.token_hash=$1 AND s.expires_at>NOW()', [digest(token)]);
  const user = result.rows[0];
  return user ? { userId: user.id, email: user.email, admin: user.admin } : null;
}
export async function createSession(memberId: string) {
  await deleteSession();
  const token = randomBytes(32).toString('hex');
  await getPool().query('DELETE FROM sessions WHERE expires_at<NOW()');
  await getPool().query("INSERT INTO sessions (token_hash,member_id,expires_at) VALUES ($1,$2,NOW()+INTERVAL '7 days')", [digest(token), memberId]);
  (await cookies()).set(SESSION_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 604800 });
}
export async function deleteSession() {
  const jar = await cookies(); const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await getPool().query('DELETE FROM sessions WHERE token_hash=$1', [digest(token)]);
  jar.delete(SESSION_COOKIE);
}
export function validOrigin(req: Request) {
  return req.headers.get('origin') === (process.env.APP_URL || new URL(req.url).origin);
}
export { safeReturnTo } from '../lib/navigation.mjs';
