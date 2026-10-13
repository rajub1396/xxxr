/** @param {string | null | undefined} value */
function origin(value) {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.origin : null;
  } catch { return null; }
}
/** @param {Request} request @param {{ appUrl?: string; allowedOrigins?: string }} [settings] */
export function isAllowedOrigin(request, settings = {}) {
  const incoming = origin(request.headers.get('origin'));
  if (!incoming) return false;
  const configured = settings.appUrl ? [settings.appUrl] : [request.url];
  const allowed = [...configured, ...(settings.allowedOrigins || '').split(',')].map(origin).filter(Boolean);
  return allowed.includes(incoming);
}
