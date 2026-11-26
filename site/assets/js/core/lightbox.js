/**
 * Native `<dialog class="lightbox">` viewer for `[data-lightbox]` triggers.
 * Temporarily moves `.cursor` inside the modal top-layer while open so the
 * custom cursor remains visible above the dialog backdrop.
 */

export function initLightbox() {
  const triggers = document.querySelectorAll('[data-lightbox]');
  if (!triggers.length || typeof HTMLDialogElement === 'undefined') return;

  let dialog;

  function ensureDialog() {
    if (dialog) return dialog;
    dialog = document.createElement('dialog');
    dialog.className = 'lightbox';
    const closeLabel = document.documentElement.lang.toLowerCase().startsWith('pt') ? 'Fechar' : 'Close';
    dialog.innerHTML = `
      <button type="button" class="button lightbox__close" data-close>${closeLabel}</button>
      <img alt="">
    `;
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog || event.target.hasAttribute('data-close')) {
        dialog.close();
      }
    });

    const cursor = document.querySelector('.cursor');
    if (cursor) {
      const originalParent = cursor.parentNode;
      const originalNextSibling = cursor.nextSibling;
      dialog.addEventListener('close', () => {
        originalParent.insertBefore(cursor, originalNextSibling);
      });
      dialog.cursor = cursor;
    }

    return document.body.appendChild(dialog);
  }

  for (const trigger of triggers) {
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      const modal = ensureDialog();
      const modalImg = modal.querySelector('img');
      const thumbImg = trigger.querySelector('img');
      modalImg.src = trigger.dataset.lightbox || thumbImg?.currentSrc || thumbImg?.src || '';
      modalImg.alt = thumbImg?.alt || '';
      modal.showModal();
      if (modal.cursor) modal.appendChild(modal.cursor);
    });
  }
}
