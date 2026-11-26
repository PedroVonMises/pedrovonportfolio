/**
 * Sticky `.nav-bar` scroll reveal and responsive `[data-menu]` drawer
 * with keyboard Escape handling and Tab focus trapping.
 */

import { onScrollFrame } from './scroll.js';

const MOBILE_MENU_MEDIA = '(max-width: 40rem)';

export function initNavBar() {
  const navBar = document.querySelector('.nav-bar');
  if (!navBar) return;

  let prevScrollY = window.scrollY;

  onScrollFrame((currentY) => {
    const scrollingUp = currentY < prevScrollY;
    navBar.classList.toggle('is-visible', scrollingUp && currentY > 300);
    prevScrollY = currentY;
  });
}

export function initMenus() {
  const menuRoots = document.querySelectorAll('[data-menu]');
  if (!menuRoots.length) return;

  const mediaQuery = window.matchMedia(MOBILE_MENU_MEDIA);

  function bindMenu(root) {
    const toggle = root.querySelector('.menu-toggle');
    const list = root.querySelector('.menu-list');
    if (!toggle || !list) return null;

    toggle.hidden = false;

    function open() {
      root.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', toggle.dataset.labelClose || 'Close menu');
      document.documentElement.classList.add('is-menu-open');
      document.addEventListener('keydown', onKeyDown);
    }

    function close({ restoreFocus = true } = {}) {
      if (!root.classList.contains('is-open')) return;
      root.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', toggle.dataset.labelOpen || 'Open menu');
      document.documentElement.classList.remove('is-menu-open');
      document.removeEventListener('keydown', onKeyDown);
      if (restoreFocus) toggle.focus();
    }

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        close();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusables = [toggle, ...list.querySelectorAll('a[href]')];
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    toggle.addEventListener('click', () => {
      if (root.classList.contains('is-open')) close();
      else open();
    });

    list.addEventListener('click', (event) => {
      if (event.target.closest('a[href]')) {
        close({ restoreFocus: false });
      }
    });

    return { close };
  }

  const controllers = [...menuRoots].map(bindMenu).filter(Boolean);
  if (!controllers.length) return;

  mediaQuery.addEventListener('change', (event) => {
    if (!event.matches) {
      controllers.forEach((ctrl) => ctrl.close({ restoreFocus: false }));
    }
  });
}
