/**
 * Home page interactive features:
 * - `.switch-button-wrap` tagline mode switcher (`aria-pressed` & `.tagline-text.is-switched`)
 * - `.scroll-down` delayed cue (3500ms `.is-shown`, hidden on first scroll)
 * - `#windows-error` retro Win95-style cascading error window `<canvas>` trail
 */

import { onScrollFrame } from '../core/scroll.js';

function debounce(fn, waitMs) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), waitMs);
  };
}

function initTaglineSwitch() {
  const button = document.querySelector('.switch-button-wrap');
  const tagline = document.querySelector('.tagline-text');
  const phraseOne = document.querySelector('.phrase--one');
  const phraseTwo = document.querySelector('.phrase--two');
  if (!button || !tagline) return;

  button.addEventListener('click', () => {
    const pressed = button.getAttribute('aria-pressed') === 'true';
    const nextPressed = !pressed;
    button.setAttribute('aria-pressed', String(nextPressed));
    tagline.classList.toggle('is-switched', nextPressed);
    phraseOne?.setAttribute('aria-hidden', String(nextPressed));
    phraseTwo?.setAttribute('aria-hidden', String(!nextPressed));
  });
}

function initScrollDownCue() {
  const indicator = document.querySelector('.scroll-down');
  if (!indicator) return;

  let hasScrolled = false;
  let unsubscribe = () => {};
  unsubscribe = onScrollFrame(() => {
    hasScrolled = true;
    indicator.classList.add('is-scrolled');
    unsubscribe();
  });
  setTimeout(() => {
    if (!hasScrolled) indicator.classList.add('is-shown');
  }, 3500);
}

function initWindowsErrorCanvas({ interactive = true } = {}) {
  const canvas = document.getElementById('windows-error');
  const sprite = document.getElementById('window-frame');
  if (!canvas || !sprite) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let cachedRect = null;
  let rafPending = false;
  let pendingCoords = null;

  function stampWindow(x, y) {
    try {
      ctx.drawImage(sprite, x, y);
    } catch {
      // Ignore if image fails to decode
    }
  }

  function scatterInitialFrames(rect) {
    for (let i = 0; i < 60; i++) {
      stampWindow(Math.random() * rect.width - 200, Math.random() * rect.height - 100);
    }
  }

  function resizeAndSeed() {
    cachedRect = canvas.getBoundingClientRect();
    if (!cachedRect.width) return;
    canvas.width = cachedRect.width * dpr;
    canvas.height = cachedRect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    scatterInitialFrames(cachedRect);
  }

  function flushPointer() {
    rafPending = false;
    if (!pendingCoords || !cachedRect) return;
    stampWindow(pendingCoords[0], pendingCoords[1]);
    pendingCoords = null;
  }

  function start() {
    resizeAndSeed();

    if (interactive) {
      onScrollFrame(() => {
        cachedRect = null;
      });
      canvas.addEventListener(
        'pointermove',
        (event) => {
          if (!cachedRect) cachedRect = canvas.getBoundingClientRect();
          pendingCoords = [event.clientX - cachedRect.left - 200, event.clientY - cachedRect.top - 100];
          if (!rafPending) {
            rafPending = true;
            requestAnimationFrame(flushPointer);
          }
        },
        { passive: true }
      );
    }

    window.addEventListener('resize', debounce(resizeAndSeed, 200), { passive: true });
  }

  if (sprite.complete && sprite.naturalWidth) start();
  else sprite.addEventListener('load', start, { once: true });
}

export function initHome({ prefersReducedMotion = false, finePointer = false } = {}) {
  initTaglineSwitch();
  initScrollDownCue();
  if (!prefersReducedMotion) {
    initWindowsErrorCanvas({ interactive: finePointer });
  }
}
