// Validate the sending frame using browser window identity before notifying Dart.
window.addEventListener('message', event => {
  if (event.origin !== 'null' || typeof event.data !== 'string' || event.data.length > 200) return;
  const frameUrl = new URL('native-ad.html', document.baseURI).href;
  const trusted = Array.from(document.querySelectorAll('iframe')).some(frame => frame.src === frameUrl && event.source === frame.contentWindow);
  if (!trusted) return;
  let message;
  try { message = JSON.parse(event.data); } catch { return; }
  if (!message || message.type !== 'xxxr-ad-scroll' || typeof message.delta !== 'number' || !Number.isFinite(message.delta) || Math.abs(message.delta) > 1000) return;
  window.dispatchEvent(new CustomEvent('xxxr-ad-scroll', {detail: String(message.delta)}));
});
