/**
 * Scroll & viewport reveal controller.
 * Splits `.reveal-text` into indexed characters, assigns `--i` indices to
 * `.reveal-lines` / `.reveal-stamp`, measures SVG `.draw-path` lengths (`--len`),
 * and toggles `.is-revealed` via IntersectionObserver.
 */

function splitRevealText(element) {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  let node;
  while ((node = walker.nextNode())) {
    if (node.nodeValue.trim()) textNodes.push(node);
  }

  let charIndex = 0;
  for (const textNode of textNodes) {
    const fragment = document.createDocumentFragment();
    const parts = textNode.nodeValue.split(/(\s+)/);

    for (const part of parts) {
      if (!part) continue;
      if (/^\s+$/.test(part)) {
        fragment.appendChild(document.createTextNode(part));
        continue;
      }
      const wordSpan = document.createElement('span');
      wordSpan.className = 'word';
      for (const ch of Array.from(part)) {
        const charSpan = document.createElement('span');
        charSpan.className = 'char';
        charSpan.style.setProperty('--i', charIndex++);
        charSpan.textContent = ch;
        wordSpan.appendChild(charSpan);
      }
      fragment.appendChild(wordSpan);
    }

    textNode.parentNode.replaceChild(fragment, textNode);
  }

  if (!element.hasAttribute('aria-label')) {
    element.setAttribute('aria-label', element.textContent.replace(/\s+/g, ' ').trim());
  }
  for (const child of element.children) {
    child.setAttribute('aria-hidden', 'true');
  }
}

function indexRevealLines(element) {
  element.querySelectorAll('.line').forEach((line, idx) => {
    line.style.setProperty('--i', idx);
  });
}

function indexRevealStamps(element) {
  [...element.children].forEach((child, idx) => {
    child.style.setProperty('--i', idx);
  });
}

function measureDrawPaths(element) {
  for (const path of element.querySelectorAll('.draw-path')) {
    if (typeof path.getTotalLength === 'function') {
      try {
        path.style.setProperty('--len', Math.ceil(path.getTotalLength()));
      } catch {
        // Ignore unrendered or detached SVG paths
      }
    }
  }
}

export function initReveal({ prefersReducedMotion = false } = {}) {
  const targets = document.querySelectorAll(
    '.reveal, .reveal-text, .reveal-lines, .reveal-draw, .reveal-stamp'
  );
  if (!targets.length) return;

  if (!prefersReducedMotion) {
    for (const el of targets) {
      if (el.classList.contains('reveal-text')) splitRevealText(el);
      if (el.classList.contains('reveal-lines')) indexRevealLines(el);
      if (el.classList.contains('reveal-stamp')) indexRevealStamps(el);
      measureDrawPaths(el);
      el.classList.add('is-ready');
    }
  }

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    for (const el of targets) el.classList.add('is-revealed');
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      }
    },
    { rootMargin: '0px 0px -15% 0px', threshold: 0.01 }
  );

  for (const el of targets) observer.observe(el);
}
