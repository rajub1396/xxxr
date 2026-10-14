// This provider requires its native unit to run in the top-level document.
(() => {
  const containerId = 'container-d82e2ef4e500984773e34fa088c1400a';
  const source = 'https://biomanos.org/21/d82e2ef4e500984773e34fa088c1400a';
  let lastY = null;
  function scroll(delta) {
    if (Number.isFinite(delta) && delta !== 0) window.dispatchEvent(new CustomEvent('xxxr-ad-scroll', {detail: String(Math.max(-1000, Math.min(1000, delta)))}));
  }
  function start() {
    const slot = document.getElementById(containerId);
    if (!slot) return false;
    const wrapper = slot.parentElement;
    wrapper.addEventListener('touchstart', event => {lastY = event.touches.length === 1 ? event.touches[0].screenY : null;}, {capture: true, passive: true});
    wrapper.addEventListener('touchmove', event => {
      if (lastY === null || event.touches.length !== 1) return;
      const nextY = event.touches[0].screenY;
      scroll(lastY - nextY); lastY = nextY;
    }, {capture: true, passive: true});
    for (const name of ['touchend', 'touchcancel']) wrapper.addEventListener(name, () => {lastY = null;}, {capture: true, passive: true});
    wrapper.addEventListener('wheel', event => {scroll(event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1));event.preventDefault();}, {capture: true, passive: false});
    const resize = () => {
      const height = Math.ceil(Math.max(slot.scrollHeight, slot.getBoundingClientRect().height));
      if (height >= 100 && height <= 1600) window.dispatchEvent(new CustomEvent('xxxr-native-ad-size', {detail: String(height)}));
    };
    new ResizeObserver(resize).observe(slot);
    if (!Array.from(document.scripts).some(script => script.src === source)) {
      const script = document.createElement('script');
      script.src = source; script.async = true; script.setAttribute('data-cfasync', 'false');
      document.body.append(script);
    }
    return true;
  }
  const observer = new MutationObserver(() => {if (start()) observer.disconnect();});
  if (!start()) observer.observe(document.documentElement, {childList: true, subtree: true});
})();
