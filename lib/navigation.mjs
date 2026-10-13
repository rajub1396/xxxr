/** @param {unknown} value @param {string} [fallback] */
export function safeReturnTo(value, fallback = '/watch/index.html') {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return fallback;
  try {
    const url = new URL(value, 'https://app.local');
    return url.origin === 'https://app.local' ? `${url.pathname}${url.search}${url.hash}` : fallback;
  } catch { return fallback; }
}
