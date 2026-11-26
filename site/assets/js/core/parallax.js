/**
 * Scroll-driven vertical parallax engine for `[data-speed]` elements.
 * Computes each element's viewport center and clamped travel amplitude,
 * writing the offset to `--py`.
 */

import { onScrollFrame } from './scroll.js';

export function initParallax() {
  const items = Array.from(document.querySelectorAll('[data-speed]'))
    .map((el) => ({
      el,
      speed: parseFloat(el.dataset.speed) || 1,
      written: null,
      centre: 0,
      factor: 0,
      amplitude: 0,
    }))
    .filter((item) => item.speed > 0 && item.speed !== 1);

  if (!items.length) return;

  let measureQueued = false;

  function measure() {
    measureQueued = false;
    for (const item of items) {
      item.el.style.setProperty('--py', '0px');
    }
    const viewportHeight = window.innerHeight;
    const scrollY = window.scrollY;
    for (const item of items) {
      const rect = item.el.getBoundingClientRect();
      item.centre = scrollY + rect.top + rect.height / 2 - viewportHeight / 2;
      item.factor = item.speed - 1;
      item.amplitude = (Math.abs(item.factor) * (viewportHeight + rect.height)) / (2 * item.speed);
      item.written = null;
    }
    update();
  }

  function update(scrollY = window.scrollY) {
    for (const item of items) {
      const raw = (item.centre - scrollY) * item.factor;
      const clamped = Math.min(item.amplitude, Math.max(-item.amplitude, raw)).toFixed(2);
      if (clamped !== item.written) {
        item.written = clamped;
        item.el.style.setProperty('--py', `${clamped}px`);
      }
    }
  }

  function onResize() {
    if (!measureQueued) {
      measureQueued = true;
      requestAnimationFrame(measure);
    }
  }

  measure();
  onScrollFrame(update);
  window.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('load', onResize);
  if (document.fonts) {
    document.fonts.ready.then(onResize);
  }
}
