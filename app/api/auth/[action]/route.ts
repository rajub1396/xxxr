import { createHash, randomUUID } from 'node:crypto';
import { getPool } from '../../../../db/pool.mjs';
import { hashPassword, verifyPassword } from '../../../../lib/passwords.mjs';
import { createSession, deleteSession, validOrigin, safeReturnTo } from '../../../session-auth';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const reply = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
async function allow(key: string, limit: number) {
  const result = await getPool().query(`INSERT INTO auth_limits (key,attempts,resets_at) VALUES ($1,1,NOW()+INTERVAL '15 minutes')
    ON CONFLICT (key) DO UPDATE SET attempts=CASE WHEN auth_limits.resets_at<NOW() THEN 1 ELSE auth_limits.attempts+1 END,
    resets_at=CASE WHEN auth_limits.resets_at<NOW() THEN NOW()+INTERVAL '15 minutes' ELSE auth_limits.resets_at END RETURNING attempts`, [key]);
  return result.rows[0].attempts <= limit;
}
export async function POST(req: Request, context: { params: Promise<{ action: string }> }) {
  if (!validOrigin(req)) return reply({ error: 'Invalid origin.' }, 403);
  try {
    const { action } = await context.params;
    if (action === 'logout') { await deleteSession(); return reply({ ok: true }); }
    if (!['login', 'register'].includes(action)) return reply({ error: 'Not found.' }, 404);
    if (Number(req.headers.get('content-length') || 0) > 4096) return reply({ error: 'Request too large.' }, 413);
    const body = await req.json();
    if (!body || typeof body !== 'object' || !('email' in body) || !('password' in body) || typeof body.email !== 'string' || typeof body.password !== 'string') return reply({ error: 'Enter your email and password.' }, 400);
    const email = body.email.trim().toLowerCase(); const password = body.password;
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length > 256 || password.length < 12) return reply({ error: 'Use a valid email and a password of 12–256 characters.' }, 400);
    if (!await allow('global', 150) || !await allow(createHash('sha256').update(email).digest('hex'), 15)) return reply({ error: 'Too many attempts. Try again in 15 minutes.' }, 429);
    const pool = getPool();
    let account = (await pool.query('SELECT id,email,password_hash,admin FROM members WHERE email=$1', [email])).rows[0];
    if (action === 'register') {
      if (account || email === (process.env.ADMIN_EMAIL || 'rajuit1396@gmail.com').toLowerCase()) return reply({ error: 'Unable to create this account. Try signing in.' }, 409);
      const id = randomUUID();
      const inserted = await pool.query('INSERT INTO members (id,email,password_hash) VALUES ($1,$2,$3) ON CONFLICT (email) DO NOTHING RETURNING id,email,admin', [id, email, await hashPassword(password)]);
      account = inserted.rows[0];
      if (!account) return reply({ error: 'Unable to create this account. Try signing in.' }, 409);
    } else {
      const hash = account?.password_hash || `scrypt:${'0'.repeat(32)}:${'0'.repeat(128)}`;
      const valid = await verifyPassword(password, hash);
      if (!account || !valid) return reply({ error: 'Email or password is incorrect.' }, 401);
    }
    await createSession(account.id);
    const requested = 'returnTo' in body ? body.returnTo : undefined;
    return reply({ ok: true, returnTo: safeReturnTo(requested, account.admin ? '/admin' : '/watch/index.html') });
  } catch { return reply({ error: 'Unable to sign in right now. Please try again.' }, 503); }
}
