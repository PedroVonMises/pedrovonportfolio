/**
 * Seamless infinite marquee controller (`.marquee`).
 * Measures `.marquee__content`, sets `--marquee-duration` at 90px/s,
 * clones enough copies to overflow the container cleanly, and syncs animation.
 */

function layoutMarquee(marquee) {
  const tracks = [...marquee.querySelectorAll('.marquee__content')];
  const primary = tracks[0];
  if (!primary) return;

  const trackWidth = primary.getBoundingClientRect().width;
  if (!trackWidth) return;

  marquee.style.setProperty('--marquee-duration', `${(trackWidth / 90).toFixed(2)}s`);

  const containerWidth = marquee.getBoundingClientRect().width;
  const requiredCopies = Math.max(2, Math.ceil(containerWidth / trackWidth) + 1);
  if (tracks.length === requiredCopies) return;

  while (marquee.childElementCount > requiredCopies) {
    marquee.lastElementChild.remove();
  }
  for (let i = marquee.childElementCount; i < requiredCopies; i += 1) {
    const clone = primary.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    marquee.append(clone);
  }

  const allTracks = [...marquee.querySelectorAll('.marquee__content')];
  for (const track of allTracks) track.style.animation = 'none';
  // Force reflow to synchronize CSS animations across clones
  void marquee.offsetWidth;
  for (const track of allTracks) track.style.animation = '';
}

export function initMarquees() {
  const marquees = document.querySelectorAll('.marquee');
  if (!marquees.length) return;

  const updateAll = () => {
    for (const marquee of marquees) layoutMarquee(marquee);
  };

  updateAll();
  if (document.fonts?.ready) {
    document.fonts.ready.then(updateAll);
  }

  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(updateAll);
    for (const marquee of marquees) observer.observe(marquee);
  }
}
