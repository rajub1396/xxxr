import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
const derive = promisify(scrypt);
/** @param {string} password */
export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const key = await derive(password, salt, 64);
  return `scrypt:${salt}:${Buffer.from(key).toString('hex')}`;
}
/** @param {string} password @param {string} encoded */
export async function verifyPassword(password, encoded) {
  const [algorithm, salt, hash] = encoded.split(':');
  if (algorithm !== 'scrypt' || !/^[a-f0-9]{32}$/.test(salt || '') || !/^[a-f0-9]{128}$/.test(hash || '')) return false;
  const key = Buffer.from(await derive(password, salt, 64));
  return timingSafeEqual(key, Buffer.from(hash, 'hex'));
}
