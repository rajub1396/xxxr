import pg from 'pg';
/** @type {import('pg').Pool | undefined} */
let pool;
/** @param {string | undefined} connectionString */
export function createPool(connectionString) {
  if (!connectionString) throw new Error('Database connection is not configured.');
  const url = new URL(connectionString);
  if (url.hostname.endsWith('.neon.tech')) url.searchParams.set('sslmode', 'verify-full');
  return new pg.Pool({ connectionString: url.toString(), max: 5, idleTimeoutMillis: 30000, connectionTimeoutMillis: 15000, enableChannelBinding: true });
}
export function getPool() {
  pool ??= createPool(process.env.DATABASE_URL);
  return pool;
}
