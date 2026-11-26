/**
 * Interactive Clippy assistant (`[data-clippy]`):
 * - SVG cubic-Bezier morphing body rig (`[data-clippy-poses]`, idle/wave/tail/recoil)
 * - Draggable, pinnable, hover/focus-aware dialogue bubble persisted to `localStorage["clippy-position"]`
 * - Scripted branching conversation tree (`[data-clippy-script]`) with word-by-word stagger & height FLIP
 * - Mouse-tracking saccadic pupils, autonomous gaze wandering, natural blinking,
 *   eye-poke annoyance escalation (`.is-mad` / `.is-furious`), and shake-to-dizzy animation (`clippy-dizzy`)
 */

import { CLIPPY_SCRIPT } from '../data/clippy-script.js';
import { onScrollFrame } from '../core/scroll.js';

const CLIPPY_POS_KEY = 'clippy-position';

const RIG_CLIPS = {
  idle: { frames: [0, 3, 0], duration: 6000, loop: true },
  tail: { frames: [0, 2, 4, 0], duration: 1400, loop: false },
  wave: { frames: [0, 5, 0, 5, 0], duration: 1800, loop: false },
  recoil: { frames: [1, 0], duration: 380, loop: false, enter: 0, easing: 'out' },
};

const DEFAULT_ENTER_MS = 160;
const EASINGS = {
  inOut: (t) => (t < 0.5 ? 2 * t * t : 1 - (1 - t) * (1 - t) * 2),
  out: (t) => 1 - (1 - t) * (1 - t) * (1 - t),
};

const EYE_BOUNDS = { w: 34, h: 27 };
const BLINK_MS = 180;
const BLINK_MIN_MS = 2800;
const BLINK_MAX_MS = 7000;
const WANDER_MIN_MS = 10000;
const WANDER_MAX_MS = 20000;
const WANDER_HOLD_MIN_MS = 1000;
const WANDER_HOLD_MAX_MS = 2000;
const BLINK_MID_MS = 110;
const DIZZY_DURATION_MS = 4200;
const DIZZY_TURNS = 5;
const WORD_STAGGER_MS = 40;
const REACTION_HOLD_MS = 2600;
const POKE_RESET_MS = 2000;
const MAD_POKES = 3;
const FURIOUS_POKES = 6;
const FURIOUS_SQUINT_FACTOR = 0.5;
const MAD_COOLDOWN_MS = 3000;
const SACCADE_MIN_PX = 2.4;
const SACCADE_MIN_MS = 260;
const SACCADE_MAX_MS = 460;
const MAD_PROXIMITY_PX = 260;
const MIN_EYE_OPEN = 0.3;
const CLIPPY_SESSION_KEY = 'clippy-session';

function loadClippySession() {
  const fallback = {
    scheduleAnswered: false,
    scheduleOutcome: null,
    lastVariantByNode: {},
    visitedRandomIds: [],
  };
  try {
    const raw = window.sessionStorage.getItem(CLIPPY_SESSION_KEY);
    const saved = raw ? JSON.parse(raw) : null;
    if (!saved || typeof saved !== 'object') return fallback;
    return {
      scheduleAnswered: Boolean(saved.scheduleAnswered),
      scheduleOutcome: typeof saved.scheduleOutcome === 'string' ? saved.scheduleOutcome : null,
      lastVariantByNode:
        saved.lastVariantByNode && typeof saved.lastVariantByNode === 'object'
          ? saved.lastVariantByNode
          : {},
      visitedRandomIds: Array.isArray(saved.visitedRandomIds) ? saved.visitedRandomIds : [],
    };
  } catch {
    return fallback;
  }
}

function saveClippySession(session) {
  try {
    window.sessionStorage.setItem(CLIPPY_SESSION_KEY, JSON.stringify(session));
  } catch {
    // Ignora falhas de armazenamento da sessão
  }
}

function initBodyRig(root, { prefersReducedMotion = false } = {}) {
  const bodyPath = root.querySelector('#body');
  const faceGroup = root.querySelector('#face');
  const posesScript = root.querySelector('[data-clippy-poses]');
  if (!bodyPath || !posesScript) return null;

  let poses;
  try {
    poses = JSON.parse(posesScript.textContent);
  } catch {
    return null;
  }
  if (!Array.isArray(poses) || poses.length < 2) return null;

  function computeFaceAnchor(pose) {
    const x = (pose[30] + pose[24] + pose[36]) / 3;
    const y = (pose[31] + pose[25] + pose[37]) / 3;
    return { x, y, tilt: Math.atan2(pose[31] - y, pose[30] - x) };
  }

  const restPose = poses[0];
  const restAnchor = computeFaceAnchor(restPose);
  const workPose = new Array(restPose.length);

  let activeAnim = null;
  let animStart = 0;
  let rafId = null;
  let visible = false;
  let currentPose = restPose.slice();
  let isAtRest = true;

  function applyPose(pose) {
    if (pose !== currentPose) currentPose = pose.slice();
    isAtRest = pose === restPose;

    let d = `M${pose[0]} ${pose[1]}`;
    for (let i = 0; i < 10; i += 1) {
      const idx = 2 + i * 6;
      d += `C${pose[idx]} ${pose[idx + 1]} ${pose[idx + 2]} ${pose[idx + 3]} ${pose[idx + 4]} ${pose[idx + 5]}`;
    }
    bodyPath.setAttribute('d', d);

    if (!faceGroup) return;
    const anchor = computeFaceAnchor(pose);
    let deltaTilt = ((anchor.tilt - restAnchor.tilt + Math.PI) % (Math.PI * 2)) - Math.PI;
    if (deltaTilt < -Math.PI) deltaTilt += Math.PI * 2;
    const angleDeg = ((deltaTilt * 180) / Math.PI) * 0.5;
    faceGroup.setAttribute(
      'transform',
      `translate(${(anchor.x - restAnchor.x).toFixed(2)} ${(anchor.y - restAnchor.y).toFixed(2)}) rotate(${angleDeg.toFixed(2)} ${anchor.x.toFixed(2)} ${anchor.y.toFixed(2)})`
    );
  }

  function step(now) {
    rafId = null;
    if (!activeAnim) return;

    const segCount = activeAnim.frames.length - 1;
    const progress = (now - animStart) / activeAnim.duration;

    if (progress >= 1) {
      if (!activeAnim.loop) {
        applyPose(activeAnim.frames[segCount]);
        activeAnim = null;
        if (visible && !document.hidden) play('idle');
        return;
      }
      if (activeAnim.entry) {
        activeAnim.frames.shift();
        activeAnim.duration -= activeAnim.enterMs;
        activeAnim.entry = false;
      }
      animStart = now;
    }

    const scaled = Math.min(Math.max(progress % 1, 0), 1) * (activeAnim.frames.length - 1);
    const frameIndex = Math.min(Math.floor(scaled), activeAnim.frames.length - 2);
    const fromPose = activeAnim.frames[frameIndex];
    const toPose = activeAnim.frames[frameIndex + 1];
    const t = activeAnim.ease(scaled - frameIndex);

    for (let i = 0; i < workPose.length; i += 1) {
      workPose[i] = fromPose[i] + (toPose[i] - fromPose[i]) * t;
    }
    applyPose(workPose);
    rafId = requestAnimationFrame(step);
  }

  function play(clipName, { loop } = {}) {
    const clip = RIG_CLIPS[clipName];
    if (!clip || prefersReducedMotion || !visible || document.hidden) return;

    const frames = clip.frames.map((idx) => poses[idx]);
    const needsBlend = !isAtRest || activeAnim !== null;
    if (needsBlend) frames.unshift(currentPose.slice());
    const enterMs = clip.enter ?? DEFAULT_ENTER_MS;

    activeAnim = {
      frames,
      duration: clip.duration + (needsBlend ? enterMs : 0),
      loop: loop ?? clip.loop,
      ease: EASINGS[clip.easing] || EASINGS.inOut,
      entry: needsBlend,
      enterMs,
    };
    animStart = performance.now();
    if (rafId === null) rafId = requestAnimationFrame(step);
  }

  function stop() {
    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = null;
    activeAnim = null;
    applyPose(restPose);
  }

  if (prefersReducedMotion) return { play: () => {}, stop: () => {} };

  const syncIdle = () => {
    if (visible && !document.hidden) play('idle');
    else stop();
  };

  document.addEventListener('visibilitychange', syncIdle);

  let wavedOnce = false;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !wavedOnce) {
          wavedOnce = true;
          play('wave');
          setTimeout(syncIdle, RIG_CLIPS.wave.duration);
          return;
        }
        syncIdle();
      },
      { rootMargin: '100px' }
    ).observe(root);
  } else {
    visible = true;
    syncIdle();
  }

  return { play, stop };
}

function initClippyShell(root) {
  const toggle = root.querySelector('[data-clippy-toggle]');
  const panel = root.querySelector('[data-clippy-panel]');
  const closeBtn = root.querySelector('[data-clippy-close]');
  if (!toggle || !panel) return null;

  const hoverCapable = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  let pinned = false;
  let dismissedByHover = false;
  let openedAt = 0;
  let autoCloseTimer = null;
  let hovered = false;

  function setExpanded(open) {
    panel.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
  }

  function openPanel({ pin = false } = {}) {
    if (pin) pinned = true;
    clearTimeout(autoCloseTimer);
    if (panel.hidden) openedAt = performance.now();
    setExpanded(true);
  }

  function closePanel({ unpin = true } = {}) {
    if (unpin) pinned = false;
    clearTimeout(autoCloseTimer);
    setExpanded(false);
  }

  function scheduleAutoClose() {
    clearTimeout(autoCloseTimer);
    const remaining = 10000 - (performance.now() - openedAt);
    if (remaining <= 0) {
      closePanel({ unpin: false });
      return;
    }
    autoCloseTimer = setTimeout(() => {
      if (!pinned && !hovered) closePanel({ unpin: false });
    }, remaining);
  }

  function setPosition(rawX, rawY) {
    const width = root.offsetWidth;
    const height = root.offsetHeight;
    const maxLeft = Math.max(8, window.innerWidth - width - 8);
    const maxTop = Math.max(8, window.innerHeight - height - 8);
    const left = Math.min(Math.max(rawX, 8), maxLeft);
    const top = Math.min(Math.max(rawY, 8), maxTop);

    root.style.setProperty('--clippy-x', `${left}px`);
    root.style.setProperty('--clippy-y', `${top}px`);
    root.style.setProperty('--clippy-right', 'auto');
    root.style.setProperty('--clippy-bottom', 'auto');
    root.classList.toggle('is-left', left + width / 2 < window.innerWidth / 2);
    root.classList.toggle('is-top', top < window.innerHeight * 0.4);
    return { left, top };
  }

  function savePosition({ left, top }) {
    try {
      window.localStorage.setItem(
        CLIPPY_POS_KEY,
        JSON.stringify({ x: left / window.innerWidth, y: top / window.innerHeight })
      );
    } catch {
      // Ignore storage quota / privacy mode errors
    }
  }

  function restorePosition() {
    let saved;
    try {
      saved = JSON.parse(window.localStorage.getItem(CLIPPY_POS_KEY) || 'null');
    } catch {
      return;
    }
    if (!saved || typeof saved.x !== 'number' || typeof saved.y !== 'number') return;
    setPosition(saved.x * window.innerWidth, saved.y * window.innerHeight);
  }

  restorePosition();
  window.addEventListener('resize', restorePosition, { passive: true });

  // Pointer drag + shake-to-dizzy detection
  let pointerDown = false;
  let moved = false;
  let grabOffsetX = 0;
  let grabOffsetY = 0;
  let startX = 0;
  let startY = 0;
  let prevX = 0;
  let prevY = 0;
  let prevTime = 0;
  let smoothedVx = 0;
  let shakeMs = 0;

  toggle.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    const rect = root.getBoundingClientRect();
    grabOffsetX = event.clientX - rect.left;
    grabOffsetY = event.clientY - rect.top;
    startX = event.clientX;
    startY = event.clientY;
    prevX = event.clientX;
    prevY = event.clientY;
    prevTime = event.timeStamp;
    smoothedVx = 0;
    shakeMs = 0;
    pointerDown = true;
    moved = false;
  });

  toggle.addEventListener('pointermove', (event) => {
    if (!pointerDown) return;
    if (!moved) {
      if (Math.hypot(event.clientX - startX, event.clientY - startY) < 4) return;
      moved = true;
      root.classList.add('is-dragging');
      toggle.setPointerCapture(event.pointerId);
    }

    setPosition(event.clientX - grabOffsetX, event.clientY - grabOffsetY);

    const dt = event.timeStamp - prevTime;
    if (dt > 0) {
      const dx = event.clientX - prevX;
      const dy = event.clientY - prevY;
      smoothedVx = smoothedVx * 0.7 + (dx / dt) * 0.3;
      const swayDeg = Math.max(-14, Math.min(14, -smoothedVx * 10));
      root.style.setProperty('--clippy-sway', `${swayDeg.toFixed(1)}deg`);

      const speed = Math.hypot(dx, dy) / dt;
      shakeMs = speed > 0.35 ? shakeMs + dt : Math.max(0, shakeMs - dt);
      if (shakeMs >= 1500) {
        shakeMs = 0;
        root.dispatchEvent(new CustomEvent('clippy-dizzy'));
      }
    }

    prevX = event.clientX;
    prevY = event.clientY;
    prevTime = event.timeStamp;
  });

  function finishDrag(event) {
    if (!pointerDown) return;
    pointerDown = false;
    root.classList.remove('is-dragging');
    root.style.removeProperty('--clippy-sway');
    if (toggle.hasPointerCapture?.(event.pointerId)) {
      toggle.releasePointerCapture(event.pointerId);
    }
    if (moved) {
      const rect = root.getBoundingClientRect();
      savePosition(setPosition(rect.left, rect.top));
      root.dispatchEvent(new CustomEvent('clippy-drag-end'));
    }
  }

  toggle.addEventListener('pointerup', finishDrag);
  toggle.addEventListener('pointercancel', finishDrag);

  toggle.addEventListener('click', (event) => {
    if (moved) {
      moved = false;
      event.preventDefault();
      return;
    }
    if (pinned) closePanel();
    else openPanel({ pin: true });
  });

  if (hoverCapable) {
    root.addEventListener('pointerenter', () => {
      hovered = true;
      if (!pointerDown && !dismissedByHover) openPanel();
    });
    root.addEventListener('pointerleave', () => {
      hovered = false;
      if (!pointerDown) {
        dismissedByHover = false;
        if (!pinned) scheduleAutoClose();
      }
    });
  }

  root.addEventListener('focusin', (event) => {
    if (!pointerDown && (panel.contains(event.target) || event.target.matches(':focus-visible'))) {
      openPanel();
    }
  });

  root.addEventListener('focusout', (event) => {
    if (!pinned && !root.contains(event.relatedTarget)) {
      scheduleAutoClose();
    }
  });

  closeBtn?.addEventListener('click', () => {
    closePanel();
    dismissedByHover = true;
    toggle.focus();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !panel.hidden) {
      closePanel();
      dismissedByHover = true;
      toggle.focus();
    }
  });

  function closeIfIdle() {
    if (!pinned && !hovered) closePanel({ unpin: false });
  }

  return { openPanel, closePanel, closeIfIdle };
}

function scheduleGazeWander({ onLook, onReturn }) {
  let timer = null;

  const scheduleNext = () => {
    clearTimeout(timer);
    const delay = WANDER_MIN_MS + Math.random() * (WANDER_MAX_MS - WANDER_MIN_MS);
    timer = setTimeout(() => {
      if (document.hidden) {
        scheduleNext();
        return;
      }
      onLook();
      const hold = WANDER_HOLD_MIN_MS + Math.random() * (WANDER_HOLD_MAX_MS - WANDER_HOLD_MIN_MS);
      timer = setTimeout(() => {
        onReturn();
        scheduleNext();
      }, hold);
    }, delay);
  };

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      clearTimeout(timer);
      onReturn();
    } else {
      scheduleNext();
    }
  });

  scheduleNext();
}

function initEyeTracking(root, { blinkAll } = {}) {
  const pupils = root.querySelectorAll('.pupil');
  if (!pupils.length) return;

  const svg = pupils[0].closest('svg');
  const offsets = new WeakMap();
  let rafPending = false;
  let mouseX = 0;
  let mouseY = 0;
  let hasMouse = false;
  let gazeLocked = false;
  const pupilRects = new WeakMap();
  let svgRect = null;

  function measureGeometry() {
    for (const pupil of pupils) pupilRects.set(pupil, pupil.getBoundingClientRect());
    if (svg) svgRect = svg.getBoundingClientRect();
  }
  measureGeometry();
  window.addEventListener('resize', measureGeometry, { passive: true });
  onScrollFrame(measureGeometry);
  root.addEventListener('clippy-drag-end', measureGeometry);

  function setPupil(pupil, x, y) {
    offsets.set(pupil, { x, y });
    pupil.style.setProperty('--px', `${x.toFixed(1)}px`);
    pupil.style.setProperty('--py', `${y.toFixed(1)}px`);
  }

  function computeTarget(pupil) {
    const rect = pupilRects.get(pupil) || pupil.getBoundingClientRect();
    const cur = offsets.get(pupil) || { x: 0, y: 0 };
    const scale = rect.width / EYE_BOUNDS.w || 1;
    const dx = mouseX - (rect.left + rect.width / 2 - cur.x * scale);
    const dy = mouseY - (rect.top + rect.height / 2 - cur.y * scale);
    return {
      x: Math.min(Math.abs(dx) / 4 / scale, EYE_BOUNDS.w / 2) * Math.sign(dx),
      y: Math.min(Math.abs(dy) / 4 / scale, EYE_BOUNDS.h / 2) * Math.sign(dy),
    };
  }

  let lastSaccade = 0;
  let saccadeWait = 0;
  let saccadeTimer = null;

  function updateSaccade({ force = false } = {}) {
    clearTimeout(saccadeTimer);
    const now = performance.now();
    const nextPositions = [...pupils].map((p) => [p, computeTarget(p)]);

    if (!force) {
      let maxDelta = 0;
      for (const [pupil, pos] of nextPositions) {
        const cur = offsets.get(pupil) || { x: 0, y: 0 };
        maxDelta = Math.max(maxDelta, Math.hypot(pos.x - cur.x, pos.y - cur.y));
      }
      if (maxDelta < SACCADE_MIN_PX) return;

      const wait = lastSaccade + saccadeWait - now;
      if (wait > 0) {
        saccadeTimer = setTimeout(() => updateSaccade(), wait + 10);
        return;
      }
    }

    for (const [pupil, pos] of nextPositions) setPupil(pupil, pos.x, pos.y);
    lastSaccade = now;
    saccadeWait = SACCADE_MIN_MS + Math.random() * (SACCADE_MAX_MS - SACCADE_MIN_MS);
  }

  function updateMadSquint() {
    if (!svg?.classList.contains('is-mad')) return;
    const rect = svgRect || svg.getBoundingClientRect();
    const dx = Math.max(rect.left - mouseX, 0, mouseX - rect.right);
    const dy = Math.max(rect.top - mouseY, 0, mouseY - rect.bottom);
    const normalized = Math.min(Math.hypot(dx, dy) / MAD_PROXIMITY_PX, 1);
    let open = MIN_EYE_OPEN + (1 - MIN_EYE_OPEN) * normalized;
    if (svg.classList.contains('is-furious')) {
      open = 1 - (1 - open) * FURIOUS_SQUINT_FACTOR;
    }
    svg.style.setProperty('--eye-open', open.toFixed(2));
  }

  if (svg && 'MutationObserver' in window) {
    new MutationObserver(updateMadSquint).observe(svg, {
      attributes: true,
      attributeFilter: ['class'],
    });
  }

  document.addEventListener(
    'pointermove',
    (event) => {
      mouseX = event.clientX;
      mouseY = event.clientY;
      hasMouse = true;
      if (!rafPending) {
        rafPending = true;
        requestAnimationFrame(() => {
          rafPending = false;
          if (!gazeLocked) updateSaccade();
          updateMadSquint();
        });
      }
    },
    { passive: true }
  );

  let blinkTransitionTimer = null;
  function blinkThen(callback) {
    clearTimeout(blinkTransitionTimer);
    blinkAll?.();
    blinkTransitionTimer = setTimeout(callback, BLINK_MID_MS);
  }

  let dizzyFrame = null;
  root.addEventListener('clippy-dizzy', () => {
    if (dizzyFrame !== null) return;
    gazeLocked = true;
    svg?.classList.add('is-dizzy');
    const started = performance.now();

    const animateDizzy = (now) => {
      const progress = Math.min((now - started) / DIZZY_DURATION_MS, 1);
      const angle = (1 - (1 - progress) ** 2) * DIZZY_TURNS * 2 * Math.PI;
      const radiusScale = 1 - progress * progress;

      [...pupils].forEach((pupil, index) => {
        const theta = angle + index * Math.PI;
        setPupil(
          pupil,
          Math.cos(theta) * (EYE_BOUNDS.w / 2) * 0.8 * radiusScale,
          Math.sin(theta) * (EYE_BOUNDS.h / 2) * 0.8 * radiusScale
        );
      });

      if (progress < 1) {
        dizzyFrame = requestAnimationFrame(animateDizzy);
        return;
      }

      dizzyFrame = null;
      svg?.classList.remove('is-dizzy');
      blinkThen(() => {
        gazeLocked = false;
        if (hasMouse) updateSaccade({ force: true });
      });
    };

    dizzyFrame = requestAnimationFrame(animateDizzy);
  });

  scheduleGazeWander({
    onLook() {
      gazeLocked = true;
      blinkThen(() => {
        const angle = Math.random() * Math.PI * 2;
        const px = Math.cos(angle) * (EYE_BOUNDS.w / 2) * (0.55 + Math.random() * 0.35);
        const py = Math.sin(angle) * (EYE_BOUNDS.h / 2) * (0.4 + Math.random() * 0.3);
        for (const pupil of pupils) setPupil(pupil, px, py);
      });
    },
    onReturn() {
      blinkThen(() => {
        gazeLocked = false;
        if (hasMouse) updateSaccade({ force: true });
        else {
          for (const pupil of pupils) setPupil(pupil, 0, 0);
        }
      });
    },
  });
}

function initEyesAndPoking(root, { prefersReducedMotion = false, bodyRig } = {}) {
  const eyes = ['r-eye', 'l-eye'].map((id) => root.querySelector(`#${id}`)).filter(Boolean);
  if (!eyes.length) return;

  const svg = eyes[0].closest('svg');
  let pokeResetTimer = null;
  let calmDownTimer = null;
  let pokeCount = 0;

  function registerPoke(eye) {
    clearTimeout(pokeResetTimer);
    pokeCount += 1;
    eye.classList.add('is-annoyed');

    if (pokeCount >= FURIOUS_POKES) bodyRig?.play('tail', { loop: true });
    else bodyRig?.play('recoil');

    root.dispatchEvent(new CustomEvent('clippy-poke', { detail: { count: pokeCount } }));

    pokeResetTimer = setTimeout(() => {
      pokeCount = 0;
    }, POKE_RESET_MS);

    if (pokeCount >= MAD_POKES) {
      svg?.classList.add('is-mad');
      if (pokeCount >= FURIOUS_POKES) svg?.classList.add('is-furious');
      clearTimeout(calmDownTimer);
      calmDownTimer = setTimeout(() => {
        svg?.classList.remove('is-mad', 'is-furious');
        bodyRig?.play('idle');
        svg?.style.removeProperty('--eye-open');
      }, MAD_COOLDOWN_MS);
    }
  }

  const reopenTimers = new WeakMap();
  const clearPokeTimers = new WeakMap();

  function blinkEye(eye, { poke = false } = {}) {
    clearTimeout(reopenTimers.get(eye));
    clearTimeout(clearPokeTimers.get(eye));

    if (poke) {
      eye.classList.remove('is-poked');
      requestAnimationFrame(() => eye.classList.add('is-poked'));
      registerPoke(eye);
    }

    eye.classList.remove('open');
    reopenTimers.set(
      eye,
      setTimeout(() => {
        eye.classList.add('open');
        eye.classList.remove('is-annoyed');
        if (poke) {
          clearPokeTimers.set(
            eye,
            setTimeout(() => eye.classList.remove('is-poked'), BLINK_MS)
          );
        }
      }, BLINK_MS)
    );
  }

  const blinkAll = () => {
    for (const eye of eyes) blinkEye(eye);
  };

  for (const eye of eyes) {
    eye.classList.add('clippy-eye');
    eye.addEventListener('click', (event) => {
      event.stopPropagation();
      blinkEye(eye, { poke: true });
    });
  }

  if (prefersReducedMotion) return blinkAll;

  let blinkLoopTimer = null;
  let visible = false;

  const stopBlinkLoop = () => {
    clearTimeout(blinkLoopTimer);
    blinkLoopTimer = null;
  };

  const scheduleBlink = () => {
    stopBlinkLoop();
    const delay = BLINK_MIN_MS + Math.random() * (BLINK_MAX_MS - BLINK_MIN_MS);
    blinkLoopTimer = setTimeout(() => {
      for (const eye of eyes) blinkEye(eye);
      if (Math.random() < 0.3) {
        setTimeout(() => {
          for (const eye of eyes) blinkEye(eye);
        }, BLINK_MS * 2);
      }
      scheduleBlink();
    }, delay);
  };

  const syncBlinking = () => {
    if (visible && !document.hidden) scheduleBlink();
    else stopBlinkLoop();
  };

  document.addEventListener('visibilitychange', syncBlinking);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        syncBlinking();
      },
      { rootMargin: '100px' }
    ).observe(root);
  } else {
    visible = true;
    syncBlinking();
  }

  return blinkAll;
}

export function initClippy({ prefersReducedMotion = false, finePointer = false } = {}) {
  const root = document.querySelector('[data-clippy]');
  if (!root) return;

  let script = CLIPPY_SCRIPT;
  const scriptEl = root.querySelector('[data-clippy-script]');
  if (scriptEl) {
    try {
      const parsed = JSON.parse(scriptEl.textContent);
      if (parsed && typeof parsed === 'object') script = parsed;
    } catch {
      // Mantém o roteiro padrão se o JSON inline for inválido
    }
  }

  const messageEl = root.querySelector('[data-clippy-message]');
  const buttonsEl = root.querySelector('[data-clippy-buttons]');
  const dialogEl = root.querySelector('.clippy-dialog');
  if (!messageEl || !buttonsEl) return;

  const session = loadClippySession();
  const saveSession = () => saveClippySession(session);
  let currentNodeId = 'welcome';
  let currentTurn = null;
  let hasSpokenOnce = false;
  let bodyRig = null;
  let shell = null;

  function resolveNode(nodeId) {
    const node = script[nodeId];
    if (!node) return null;
    const variants = node.variants;
    if (!Array.isArray(variants) || !variants.length) return node;

    let index = Math.floor(Math.random() * variants.length);
    if (variants.length > 1 && index === session.lastVariantByNode[nodeId]) {
      index = (index + 1) % variants.length;
    }
    session.lastVariantByNode[nodeId] = index;
    saveSession();
    return variants[index];
  }

  function pickFromPool(poolName) {
    const pool = script.pools?.[poolName];
    if (!Array.isArray(pool) || !pool.length) return null;

    let candidates = pool.filter(
      (id) => !session.visitedRandomIds.includes(id) && id !== currentNodeId
    );
    if (!candidates.length) {
      session.visitedRandomIds = session.visitedRandomIds.filter((id) => !pool.includes(id));
      candidates = pool.filter((id) => id !== currentNodeId);
      if (!candidates.length) candidates = pool.slice();
    }
    const picked = candidates[Math.floor(Math.random() * candidates.length)];
    session.visitedRandomIds.push(picked);
    saveSession();
    return picked;
  }

  function splitWordsForFade(container) {
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);

    let wordIndex = 0;
    for (const node of textNodes) {
      const frag = document.createDocumentFragment();
      for (const token of node.textContent.split(/(\s+)/)) {
        if (!token) continue;
        if (/^\s+$/.test(token)) {
          frag.append(token);
        } else {
          const span = document.createElement('span');
          span.className = 'clippy-word';
          span.style.setProperty('--fade-delay', `${wordIndex * WORD_STAGGER_MS}ms`);
          span.textContent = token;
          frag.append(span);
          wordIndex += 1;
        }
      }
      node.replaceWith(frag);
    }
    buttonsEl.style.setProperty('--fade-delay', `${wordIndex * WORD_STAGGER_MS + 80}ms`);
  }

  function animateButtonsIn(container) {
    container.classList.remove('is-arriving');
    void container.offsetWidth;
    container.classList.add('is-arriving');
  }

  function renderTurn(turn) {
    const prevHeight = dialogEl ? dialogEl.offsetHeight : 0;
    messageEl.innerHTML = turn.message;
    buttonsEl.replaceChildren();

    if (turn.anim) bodyRig?.play(turn.anim);

    (turn.options || []).forEach((option) => {
      const control = document.createElement(option.href ? 'a' : 'button');
      control.className = 'button button--ghost clippy-button';
      control.textContent = option.title;

      if (option.href) {
        control.href = option.href;
        if (/^https?:/i.test(option.href)) {
          control.target = '_blank';
          control.rel = 'noopener noreferrer';
        }
      } else {
        control.type = 'button';
        control.addEventListener('click', () => {
          if (option.action === 'close') {
            shell?.closePanel();
            return;
          }
          if (option.outcome) {
            session.scheduleAnswered = true;
            session.scheduleOutcome = option.outcome;
            saveSession();
          }
          if (option.nextPool) {
            const nextId = pickFromPool(option.nextPool);
            if (nextId) {
              goToNode(nextId);
              messageEl.focus();
              return;
            }
          }
          if (option.next) {
            goToNode(option.next);
            messageEl.focus();
            return;
          }
          messageEl.focus();
        });
      }
      buttonsEl.appendChild(control);
    });

    if (!dialogEl || prefersReducedMotion) return;
    if (!hasSpokenOnce) {
      hasSpokenOnce = true;
      dialogEl.classList.add('is-speaking');
      return;
    }

    splitWordsForFade(messageEl);
    if (buttonsEl.childElementCount) animateButtonsIn(buttonsEl);

    const nextHeight = dialogEl.offsetHeight;
    if (nextHeight !== prevHeight) {
      dialogEl.animate([{ height: `${prevHeight}px` }, { height: `${nextHeight}px` }], {
        duration: 260,
        easing: 'cubic-bezier(0.33, 0, 0.2, 1)',
      });
    }
  }

  function goToNode(nodeId) {
    if (!nodeId || !script[nodeId]) return;
    currentNodeId = nodeId;
    currentTurn = resolveNode(nodeId);
    if (currentTurn) renderTurn(currentTurn);
  }

  function renderCurrentNode() {
    if (!currentTurn) currentTurn = resolveNode(currentNodeId);
    if (currentTurn) renderTurn(currentTurn);
  }

  renderCurrentNode();

  shell = initClippyShell(root);
  const reactions = script.reactions || {};
  let reactionResetTimer = null;

  function showReaction(list, index, durationMs = REACTION_HOLD_MS) {
    if (!Array.isArray(list) || !list.length) return;
    clearTimeout(reactionResetTimer);
    renderTurn({ message: list[Math.min(index, list.length - 1)], options: [] });
    shell?.openPanel();
    reactionResetTimer = setTimeout(() => {
      shell?.closeIfIdle();
      renderCurrentNode();
    }, durationMs);
  }

  root.addEventListener('clippy-poke', (event) => {
    showReaction(reactions.poke, (event.detail?.count || 1) - 1);
  });

  root.addEventListener('clippy-dizzy', () => {
    const pool = reactions.dizzy;
    showReaction(pool, Math.floor(Math.random() * (pool?.length || 1)), DIZZY_DURATION_MS + 800);
  });

  bodyRig = initBodyRig(root, { prefersReducedMotion });
  const blinkAll = initEyesAndPoking(root, { prefersReducedMotion, bodyRig });
  if (finePointer && !prefersReducedMotion) {
    initEyeTracking(root, { blinkAll });
  }
}
