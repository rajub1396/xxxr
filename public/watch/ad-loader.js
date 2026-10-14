(() => {
  const sources = ['https://biomanos.org/21/d82e2ef4e500984773e34fa088c1400a'];
  if (new URLSearchParams(location.search).get('placement') !== 'native') {
    sources.push('https://benchform.org/1/6d878111a0c91e920ca3bc82a847c225', 'https://biomanos.org/14/153f7a6ddbd44baa00f5983c70853201');
  }
  for (const source of sources) {
    const script = document.createElement('script');
    script.src = source;
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    document.body.append(script);
  }
})();
