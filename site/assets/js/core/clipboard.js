/**
 * Click-to-copy contact triggers (`[data-copy]`) with randomized stamp tilt
 * (`--stamp-rotate`) and live-region announcement (`[data-copy-status]`).
 */

export function initCopyButtons() {
  const buttons = document.querySelectorAll('[data-copy]');
  if (!buttons.length || !navigator.clipboard) return;

  for (const button of buttons) {
    button.addEventListener('click', async () => {
      const container = button.closest('.footer-contacts-item') || button;
      if (container.classList.contains('is-copying')) return;

      try {
        await navigator.clipboard.writeText(button.dataset.copy);
      } catch {
        return;
      }

      const stamp = button.querySelector('.copied');
      if (stamp) {
        stamp.style.setProperty('--stamp-rotate', `${(Math.random() - 0.5) * 40}deg`);
      }

      const status =
        document.querySelector('[data-copy-status]') ||
        button.querySelector('[data-copy-status]');
      if (status) {
        status.textContent = button.dataset.copiedLabel || 'Copied to clipboard';
      }

      container.classList.add('is-copying');
      setTimeout(() => {
        container.classList.remove('is-copying');
        if (status) status.textContent = '';
      }, 2400);
    });
  }
}
