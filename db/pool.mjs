import pg from 'pg';
/** @type {import('pg').Pool | undefined} */
let pool;
export function getPool() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured.');
  const url = new URL(process.env.DATABASE_URL);
  if (url.hostname.endsWith('.neon.tech')) url.searchParams.set('sslmode', 'verify-full');
  pool ??= new pg.Pool({ connectionString: url.toString(), max: 5, idleTimeoutMillis: 30000, connectionTimeoutMillis: 15000, enableChannelBinding: true });
  return pool;
}
