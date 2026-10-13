import { resolve4 } from 'node:dns/promises';
import { request } from 'node:https';
import { isIP } from 'node:net';
/** @param {unknown} value */
export function previewUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return '';
  if (value.length > 2048) throw new Error('Preview image URL is too long.');
  const url = new URL(value.trim());
  if (url.protocol !== 'https:' || url.username || url.password || url.port || isIP(url.hostname) || !url.hostname.includes('.') || /\.(local|localhost|internal)$/i.test(url.hostname)) throw new Error('Use a public HTTPS preview image URL.');
  return url.href;
}
/** @param {string} address */
export function publicIpv4(address) {
  if (isIP(address) !== 4) return false;
  const [a,b,c] = address.split('.').map(Number);
  return !(a === 0 || a === 10 || a === 127 || a >= 224 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && (b === 168 || (b === 0 && [0,2].includes(c)))) || (a === 100 && b >= 64 && b <= 127) || (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) || (a === 203 && b === 0 && c === 113));
}
/** Fetch only public, DNS-pinned HTTPS hosts; revalidate every redirect. @param {string} value @param {number} [redirects] */
export async function publicPage(value, redirects = 0) {
  const url = new URL(previewUrl(value));
  const addresses = await resolve4(url.hostname);
  if (!addresses.length || !addresses.every(publicIpv4)) throw new Error('Private address rejected.');
  const response = await new Promise((resolve, reject) => {
    const req = request(url, { family: 4, lookup: (_host, _options, callback) => callback(null, addresses[0], 4), headers: { Accept: 'text/html,application/json', 'User-Agent': 'RedX-Preview/1.0' } }, res => {
      if ([301,302,303,307,308].includes(res.statusCode || 0)) { res.destroy(); resolve({ redirect: res.headers.location, text: '' }); return; }
      if (res.statusCode !== 200) { res.destroy(); reject(new Error('Preview unavailable.')); return; }
      const chunks = []; let size = 0;
      res.on('data', chunk => { size += chunk.length; if (size > 512000) req.destroy(new Error('Preview page too large.')); else chunks.push(chunk); });
      res.on('end', () => resolve({ text: Buffer.concat(chunks).toString('utf8') }));
      res.on('error', reject);
    });
    const timer = setTimeout(() => req.destroy(new Error('Preview request timed out.')), 4000);
    req.on('close', () => clearTimeout(timer)); req.on('error', reject); req.end();
  });
  if (response.redirect) {
    if (redirects >= 2) throw new Error('Too many redirects.');
    return publicPage(new URL(response.redirect, url).href, redirects + 1);
  }
  return response.text;
}
/** @param {string} value */
const decode = value => value.replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/&#(\d+);/g, (_m,n) => String.fromCodePoint(Math.min(Number(n), 0x10ffff)));
/** @param {string} html @param {string} base */
export function extractPreview(html, base) {
  for (const tag of html.match(/<meta\b[^>]*>|<video\b[^>]*>/gi) || []) {
    const attributes = Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/gs)].map(match => [match[1].toLowerCase(), decode(match[3])]));
    const candidate = /^(og:image(?::secure_url)?|twitter:image(?::src)?)$/i.test(attributes.property || attributes.name || '') ? attributes.content : attributes.poster;
    if (candidate) { try { return previewUrl(new URL(candidate, base).href); } catch {} }
  }
  const structured = html.match(/"thumbnailUrl"\s*:\s*(?:\[\s*)?("(?:[^"\\]|\\.)*")/i);
  if (structured) { try { return previewUrl(new URL(JSON.parse(structured[1]), base).href); } catch {} }
  const playerPoster = html.match(/\bsetThumbUrl(?:169)?\(\s*(["'])(.*?)\1\s*\)/i);
  if (playerPoster) { try { return previewUrl(new URL(decode(playerPoster[2]).replace(/\\\//g, '/'), base).href); } catch {} }
  const configuredPoster = html.match(/["'](?:poster|posterUrl|thumbnail_url|thumbnail|preview_image)["']\s*:\s*("(?:[^"\\]|\\.)*")/i);
  if (configuredPoster) { try { return previewUrl(new URL(JSON.parse(configuredPoster[1]), base).href); } catch {} }
  return '';
}
/** @param {string} embed */
export function youtubePreview(embed) {
  const url = new URL(embed);
  if (['www.youtube-nocookie.com','www.youtube.com','youtube.com'].includes(url.hostname)) {
    const id = url.pathname.split('/').pop();
    if (id && /^[\w-]{11}$/.test(id)) return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  }
  return '';
}
/** @param {string} embed @param {unknown} [custom] */
export async function resolvePreview(embed, custom) {
  const provided = previewUrl(custom);
  if (provided) return provided;
  const youtube = youtubePreview(embed); if (youtube) return youtube;
  try {
    const url = new URL(embed);
    if (url.hostname === 'player.vimeo.com') {
      const id = url.pathname.split('/').pop();
      if (id && /^\d+$/.test(id)) {
        const data = JSON.parse(await publicPage(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(`https://vimeo.com/${id}`)}`));
        if (data.thumbnail_url) return previewUrl(data.thumbnail_url);
      }
    }
    return extractPreview(await publicPage(embed), embed);
  } catch { return ''; }
}
