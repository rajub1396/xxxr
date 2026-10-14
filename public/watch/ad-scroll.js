// Keep ad-frame gestures connected to the library's Flutter scroll view.
(() => {
  let previousY = null;
  function send(delta) {
    if (!Number.isFinite(delta) || delta === 0) return;
    parent.postMessage(JSON.stringify({type: 'xxxr-ad-scroll', delta: Math.max(-1000, Math.min(1000, delta))}), '*');
  }
  window.addEventListener('touchstart', event => {
    previousY = event.touches.length === 1 ? event.touches[0].screenY : null;
  }, {capture: true, passive: true});
  window.addEventListener('touchmove', event => {
    if (previousY === null || event.touches.length !== 1) return;
    const nextY = event.touches[0].screenY;
    send(previousY - nextY);
    previousY = nextY;
  }, {capture: true, passive: true});
  for (const name of ['touchend', 'touchcancel']) window.addEventListener(name, () => { previousY = null; }, {capture: true, passive: true});
  window.addEventListener('wheel', event => {
    send(event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1));
    event.preventDefault();
  }, {capture: true, passive: false});
})();
