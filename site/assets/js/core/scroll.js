/**
 * Single passive scroll scheduler shared by all scroll-driven features.
 * One listener, one requestAnimationFrame per frame, cached scrollY.
 */

const subscribers = new Set();
let queued = false;
let listening = false;

function flush() {
  queued = false;
  const scrollY = window.scrollY;
  for (const subscriber of subscribers) subscriber(scrollY);
}

function onScroll() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(flush);
}

export function onScrollFrame(subscriber) {
  subscribers.add(subscriber);
  if (!listening) {
    window.addEventListener('scroll', onScroll, { passive: true });
    listening = true;
  }
  return () => {
    subscribers.delete(subscriber);
    if (!subscribers.size && listening) {
      window.removeEventListener('scroll', onScroll);
      listening = false;
    }
  };
}
