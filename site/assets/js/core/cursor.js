/**
 * Dual-ball custom pointer cursor for fine-pointer devices.
 * Tracks `.cursor__ball--big` (smooth lag) and `.cursor__ball--small` (snappy),
 * toggling `.is-pressed`, `.is-hovering`, and `.is-on-dark`.
 */

const INTERACTIVE_SELECTOR =
  'a, button, [role="button"], .hoverable, .draggable, [type="submit"]';

export function initCursor() {
  const cursor = document.querySelector('.cursor');
  if (!cursor) return;

  const bigBall = cursor.querySelector('.cursor__ball--big');
  const smallBall = cursor.querySelector('.cursor__ball--small');
  if (!bigBall || !smallBall) return;

  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let bigX = targetX;
  let bigY = targetY;
  let smallX = targetX;
  let smallY = targetY;
  let animating = false;

  function render() {
    bigX += (targetX - bigX) * 0.14;
    bigY += (targetY - bigY) * 0.14;
    smallX += (targetX - smallX) * 0.55;
    smallY += (targetY - smallY) * 0.55;

    bigBall.style.transform = `translate3d(${(bigX - 40).toFixed(1)}px, ${(bigY - 40).toFixed(1)}px, 0)`;
    smallBall.style.transform = `translate3d(${(smallX - 6).toFixed(1)}px, ${(smallY - 6).toFixed(1)}px, 0)`;

    if (Math.abs(targetX - bigX) < 0.1 && Math.abs(targetY - bigY) < 0.1) {
      animating = false;
      return;
    }
    requestAnimationFrame(render);
  }

  function scheduleRender() {
    if (!animating) {
      animating = true;
      requestAnimationFrame(render);
    }
  }

  document.addEventListener(
    'pointermove',
    (event) => {
      if (event.pointerType === 'mouse') {
        targetX = event.clientX;
        targetY = event.clientY;
        scheduleRender();
      }
    },
    { passive: true }
  );

  document.addEventListener('pointerdown', () => cursor.classList.add('is-pressed'));
  document.addEventListener('pointerup', () => cursor.classList.remove('is-pressed'));

  document.addEventListener(
    'pointerover',
    (event) => {
      cursor.classList.toggle('is-hovering', Boolean(event.target.closest?.(INTERACTIVE_SELECTOR)));
      cursor.classList.toggle('is-on-dark', Boolean(event.target.closest?.('.dark-bg')));
    },
    { passive: true }
  );

  document.addEventListener(
    'pointerout',
    (event) => {
      if (event.target.closest?.(INTERACTIVE_SELECTOR)) {
        cursor.classList.remove('is-hovering');
      }
    },
    { passive: true }
  );

  document.addEventListener('pointerleave', () => {
    cursor.classList.remove('is-hovering');
    cursor.classList.remove('is-on-dark');
  });
}
