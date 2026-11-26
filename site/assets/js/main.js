/**
 * Main ES Module entrypoint for the Pedro Augusto portfolio.
 * Core UI bootstrap plus deferred page-specific enhancements.
 */

import { initReveal } from './core/reveal.js';
import { initNavBar, initMenus } from './core/navigation.js';
import { initCopyButtons } from './core/clipboard.js';
import { initLightbox } from './core/lightbox.js';
import { initMarquees } from './core/marquee.js';
import { initParallax } from './core/parallax.js';
import { initCursor } from './core/cursor.js';
import { initDraggables } from './core/draggable.js';

document.documentElement.classList.add('js');

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

// Immediate core UI bootstrap
initReveal({ prefersReducedMotion });
initNavBar();
initMenus();
initCopyButtons();
initLightbox();
initMarquees();

// Deferred enhancement & page-specific feature modules
const scheduleIdle = window.requestIdleCallback || ((cb) => setTimeout(cb, 200));

scheduleIdle(() => {
  if (!prefersReducedMotion) initParallax();
  if (finePointer && !prefersReducedMotion) initCursor();
  initDraggables();

  if (document.querySelector('.home')) {
    import('./modules/home.js').then(({ initHome }) =>
      initHome({ prefersReducedMotion, finePointer })
    );
  }
  if (document.querySelector('[data-clippy]')) {
    import('./modules/clippy.js').then(({ initClippy }) =>
      initClippy({ prefersReducedMotion, finePointer })
    );
  }
});
