import { randomUUID } from 'node:crypto';
import { createPool } from '../db/pool.mjs';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { fileURLToPath } from 'node:url';
import { hashPassword } from '../lib/passwords.mjs';
const pool = createPool(process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL);
try {
  const connection = new URL(process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL);
  if (connection.hostname.includes('-pooler.')) throw new Error('Migrations require DATABASE_URL_UNPOOLED.');
  await migrate(drizzle(pool), { migrationsFolder: fileURLToPath(new URL('../drizzle/postgres', import.meta.url)) });
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
