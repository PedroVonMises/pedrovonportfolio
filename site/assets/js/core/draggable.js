/**
 * Pointer- and keyboard-draggable elements (`.draggable`) with inertial coasting.
 * Writes offsets to `--dx` and `--dy` CSS custom properties.
 */

const ARROW_DELTAS = {
  ArrowLeft: [-12, 0],
  ArrowRight: [12, 0],
  ArrowUp: [0, -12],
  ArrowDown: [0, 12],
};

function attachDraggable(element) {
  let offsetX = 0;
  let offsetY = 0;
  let velX = 0;
  let velY = 0;
  let lastX = 0;
  let lastY = 0;
  let dragging = false;
  let coastFrame = 0;

  function applyOffset() {
    element.style.setProperty('--dx', `${offsetX.toFixed(1)}px`);
    element.style.setProperty('--dy', `${offsetY.toFixed(1)}px`);
  }

  function coast() {
    velX *= 0.92;
    velY *= 0.92;
    offsetX += velX;
    offsetY += velY;
    applyOffset();
    if (Math.abs(velX) > 0.4 || Math.abs(velY) > 0.4) {
      coastFrame = requestAnimationFrame(coast);
    }
  }

  element.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    dragging = true;
    velX = 0;
    velY = 0;
    lastX = event.clientX;
    lastY = event.clientY;
    cancelAnimationFrame(coastFrame);
    element.setPointerCapture(event.pointerId);
    element.classList.add('is-dragging');
    event.preventDefault();
  });

  element.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    offsetX += dx;
    offsetY += dy;
    velX = dx;
    velY = dy;
    lastX = event.clientX;
    lastY = event.clientY;
    applyOffset();
  });

  function stopDrag(event) {
    if (!dragging) return;
    dragging = false;
    element.classList.remove('is-dragging');
    if (element.hasPointerCapture?.(event.pointerId)) {
      element.releasePointerCapture(event.pointerId);
    }
    if (Math.abs(velX) > 0.4 || Math.abs(velY) > 0.4) {
      coastFrame = requestAnimationFrame(coast);
    }
  }

  element.addEventListener('pointerup', stopDrag);
  element.addEventListener('pointercancel', stopDrag);

  element.tabIndex = 0;
  element.addEventListener('keydown', (event) => {
    const delta = ARROW_DELTAS[event.key];
    if (!delta) return;
    offsetX += delta[0];
    offsetY += delta[1];
    applyOffset();
    event.preventDefault();
  });
}

export function initDraggables() {
  const elements = document.querySelectorAll('.draggable');
  if (!elements.length) return;
  for (const el of elements) attachDraggable(el);
}
