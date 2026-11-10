// Tiempo virtual: rAF y performance.now avanzan sólo cuando lo indica la grabación
(() => {
  let vt = 0;
  const reg = new WeakMap();
  const raf = window.requestAnimationFrame.bind(window);
  performance.now = () => vt;
  window.requestAnimationFrame = (cb) => raf(() => cb(vt));
  // motion sincroniza sus animaciones WAAPI con su propio reloj: se registra ese inicio en tiempo virtual
  const st = Object.getOwnPropertyDescriptor(Animation.prototype, 'startTime');
  Object.defineProperty(Animation.prototype, 'startTime', { configurable: true, get() { return st.get.call(this); }, set(v) { if (v == null) { st.set.call(this, v); return; } reg.set(this, Number(v)); try { this.pause(); } catch {} } });
  const orig = Element.prototype.animate;
  Element.prototype.animate = function (...args) { const a = orig.apply(this, args); try { reg.set(a, vt); a.pause(); } catch {} return a; };
  window.__tick = (v, y, sx) => {
    vt = v;
    if (y != null) window.scrollTo(0, y);
    if (sx != null) { const ul = document.querySelector('section[aria-labelledby="h-news"] ul'); if (ul) { ul.style.scrollSnapType = 'none'; ul.scrollLeft = sx; } }
    for (const a of document.getAnimations()) {
      try {
        if (!reg.has(a)) reg.set(a, v - (Number(a.currentTime) || 0));
        const ct = v - reg.get(a), end = a.effect ? a.effect.getComputedTiming().endTime : Infinity;
        if (ct >= end) a.finish(); else { if (a.playState !== 'paused') a.pause(); a.currentTime = Math.max(0, ct); }
      } catch {}
    }
    return new Promise((r) => raf(() => raf(() => r())));
  };
})();
