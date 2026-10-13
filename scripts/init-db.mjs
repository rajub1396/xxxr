import { randomUUID } from 'node:crypto';
import { getPool } from '../db/pool.mjs';
import { hashPassword } from '../lib/passwords.mjs';
const pool = getPool();
try {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE,
      premium INTEGER NOT NULL DEFAULT 0 CHECK (premium IN (0,1)),
      password_hash TEXT NOT NULL, admin BOOLEAN NOT NULL DEFAULT FALSE
    );
    CREATE TABLE IF NOT EXISTS videos (
      id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL,
      category TEXT NOT NULL, embed TEXT NOT NULL,
      premium INTEGER NOT NULL DEFAULT 0 CHECK (premium IN (0,1)), created BIGINT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY, member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL
    );
    CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);
    CREATE TABLE IF NOT EXISTS auth_limits (
      key TEXT PRIMARY KEY, attempts INTEGER NOT NULL, resets_at TIMESTAMPTZ NOT NULL
    );
  `);
  const email = (process.env.ADMIN_EMAIL || 'rajuit1396@gmail.com').trim().toLowerCase();
  const existing = await pool.query('SELECT id, admin FROM members WHERE email=$1', [email]);
  if (!existing.rowCount) {
    const password = process.env.ADMIN_INITIAL_PASSWORD;
    if (!password || password.length < 12) throw new Error('Administrator password is missing or too short.');
    await pool.query('INSERT INTO members (id,email,password_hash,admin,premium) VALUES ($1,$2,$3,TRUE,1) ON CONFLICT (email) DO NOTHING', [randomUUID(), email, await hashPassword(password)]);
  } else if (!existing.rows[0].admin) {
    throw new Error('Administrator email belongs to a regular account.');
  }
  console.log('Database schema and administrator are ready.');
} catch {
  console.error('Database initialization failed. Verify Neon DATABASE_URL and ADMIN_INITIAL_PASSWORD. No credentials were logged.');
  process.exitCode = 1;
} finally { await pool.end(); }
