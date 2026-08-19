/**
 * Tallshot — page agent.
 *
 * Injected on demand by the service worker via chrome.scripting.executeScript
 * under activeTab. There is NO declared content script: this code only ever
 * runs on a page the user explicitly pointed Tallshot at, and only after their
 * gesture. That is the structural basis of the privacy claim.
 *
 * Injected with `files:`, so this runs as a classic script, not a module —
 * no import/export is available here. It installs a small API on the isolated
 * world's global object, which persists across subsequent executeScript calls
 * for the same page load.
 *
 * It reads geometry and computed styles only. It never reads DOM text, form
 * values, cookies or storage, and it sends nothing anywhere except frame
 * offsets back to our own service worker.
 */

(() => {
  // Injection is idempotent: the worker re-injects on every capture because it
  // cannot know whether the page has navigated since last time.
  if (window.__tallshotAgent) {
    window.__tallshotAgent.reset();
    return;
  }

  const FROZEN_FIXED = 'data-tallshot-fixed';
  const FROZEN_STICKY = 'data-tallshot-sticky';
  const STYLE_ID = 'tallshot-freeze-style';
  const OVERLAY_ID = 'tallshot-overlay-root';
  const MAX_ELEMENTS_SCANNED = 12000;

  /** Mutable per-capture state. */
  const state = {
    active: false,
    cancelled: false,
    savedScrollX: 0,
    savedScrollY: 0,
    frozen: false,
    overlayHost: null,
    shadow: null,
    nodes: {},
    keyHandler: null,
  };

  // ── Geometry ───────────────────────────────────────────────────────────

  /**
   * Full document size.
   *
   * Different site layouts report authoritatively on different nodes — some
   * put the scroll container on <html>, some on <body>, some disagree with
   * themselves. Taking the max across all four is the only reliable answer.
   */
  function measure() {
    const de = document.documentElement;
    const body = document.body;
    const pageHeight = Math.max(
      de.scrollHeight,
      de.offsetHeight,
      de.clientHeight,
      body ? body.scrollHeight : 0,
      body ? body.offsetHeight : 0
    );
    const pageWidth = Math.max(
      de.scrollWidth,
      de.offsetWidth,
      de.clientWidth,
      body ? body.scrollWidth : 0,
      body ? body.offsetWidth : 0
    );
    return {
      pageWidth,
      pageHeight,
      // clientWidth/Height exclude scrollbars, which is what captureVisibleTab
      // actually returns. Using innerWidth here would leave a scrollbar-width
      // strip of duplicated pixels down the right edge of the stitch.
      viewportWidth: de.clientWidth,
      viewportHeight: de.clientHeight,
      devicePixelRatio: window.devicePixelRatio || 1,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
    };
  }

  // ── Lazy-load pre-pass ─────────────────────────────────────────────────

  /**
   * Scroll the whole page once so lazy-loaded images and virtualised content
   * actually render, then return to the top.
   *
   * Without this, any image below the fold that has not yet entered the
   * viewport captures as a blank or placeholder box — the single most common
   * "half my screenshot is grey" complaint in this category.
   */
  async function preload({ maxSteps, stepDelay, settleDelay }) {
    const start = measure();
    const step = Math.max(200, start.viewportHeight);
    const steps = Math.min(maxSteps, Math.ceil(start.pageHeight / step) + 1);

    for (let i = 0; i < steps; i += 1) {
      if (state.cancelled) return;
      window.scrollTo(0, i * step);
      updateOverlay({ phase: 'preloading', value: (i + 1) / steps });
      await sleep(stepDelay);
    }

    window.scrollTo(0, 0);
    await sleep(settleDelay);

    // Give any images that started decoding a chance to finish. decode()
    // resolves immediately for already-decoded images, so this is cheap.
    try {
      const images = Array.from(document.images)
        .filter((img) => img.loading === 'lazy' || !img.complete)
        .slice(0, 80);
      await Promise.race([
        Promise.allSettled(images.map((img) => (img.decode ? img.decode() : null))),
        sleep(1200),
      ]);
    } catch {
      /* decode() rejects on broken images; the capture is unaffected */
    }
  }

  // ── Freeze ─────────────────────────────────────────────────────────────

  /**
   * Neutralise everything that would change between frames.
   *
   * Fixed elements are hidden (they have no natural place in the page, and
   * they were already captured once in frame 0). Sticky elements are made
   * static instead of hidden — sticky elements sit in normal flow anyway, so
   * making them static renders them exactly once at their real position
   * rather than leaving a hole where they belong.
   *
   * visibility:hidden is used rather than display:none deliberately:
   * display:none removes the element from layout, which reflows the document
   * and changes its height mid-capture.
   */
  function freeze() {
    if (state.frozen) return { fixed: 0, sticky: 0 };

    let fixedCount = 0;
    let stickyCount = 0;
    const all = document.querySelectorAll('*');
    const limit = Math.min(all.length, MAX_ELEMENTS_SCANNED);

    for (let i = 0; i < limit; i += 1) {
      const el = all[i];
      if (el.id === OVERLAY_ID) continue;
      let position;
      try {
        position = getComputedStyle(el).position;
      } catch {
        continue;
      }
      if (position === 'fixed') {
        el.setAttribute(FROZEN_FIXED, '');
        fixedCount += 1;
      } else if (position === 'sticky') {
        el.setAttribute(FROZEN_STICKY, '');
        stickyCount += 1;
      }
    }

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      html { scroll-behavior: auto !important; }
      /* Modals often lock scrolling on the root; capture needs it back. */
      html, body { overflow: visible !important; }
      /* Stop anything moving between one frame and the next. */
      *, *::before, *::after {
        animation-play-state: paused !important;
        transition: none !important;
      }
      [${FROZEN_STICKY}] { position: static !important; }
      [${FROZEN_FIXED}].tallshot-hide { visibility: hidden !important; }
    `;
    (document.head || document.documentElement).appendChild(style);

    state.frozen = true;
    return { fixed: fixedCount, sticky: stickyCount };
  }

  /**
   * Show or hide pinned elements.
   * Frame 0 keeps them visible — that is where a page header genuinely
   * belongs. Every later frame hides them, so they appear exactly once.
   */
  function setPinnedHidden(hidden) {
    const nodes = document.querySelectorAll(`[${FROZEN_FIXED}]`);
    for (const el of nodes) el.classList.toggle('tallshot-hide', hidden);
  }

  /** Undo every change made to the page. Must run on success, cancel AND error. */
  function unfreeze() {
    document.getElementById(STYLE_ID)?.remove();
    for (const el of document.querySelectorAll(`[${FROZEN_FIXED}]`)) {
      el.classList.remove('tallshot-hide');
      el.removeAttribute(FROZEN_FIXED);
    }
    for (const el of document.querySelectorAll(`[${FROZEN_STICKY}]`)) {
      el.removeAttribute(FROZEN_STICKY);
    }
    state.frozen = false;
  }

  // ── Capture stepping ───────────────────────────────────────────────────

  /**
   * Scroll to a frame and report where we ACTUALLY landed.
   *
   * The returned y is read back from the document, never the value we asked
   * for. The last frame of a page can almost never scroll a full step because
   * the page runs out of height, so stitching against the intended offset
   * duplicates a band of content at the bottom of the image. This is the
   * single most common stitching bug in this category.
   */
  async function step({ y, index, total, delay }) {
    if (state.cancelled) return { cancelled: true };
    setPinnedHidden(index > 0);
    window.scrollTo(0, y);
    await sleep(delay);
    return {
      cancelled: state.cancelled,
      y: window.scrollY,
      index,
      total,
    };
  }

  // ── Progress overlay ───────────────────────────────────────────────────

  /**
   * The overlay lives in a CLOSED shadow root so the host page's CSS cannot
   * restyle it and ours cannot leak into the page.
   *
   * It is deliberately NOT shown during the capture loop: it is position:fixed,
   * so it would be captured into every frame, and toggling it around each
   * capture would strobe at ~2Hz. During the loop, progress is reported on the
   * extension's toolbar badge instead, and the page is visibly scrolling.
   */
  function ensureOverlay() {
    if (state.overlayHost?.isConnected) return;

    const host = document.createElement('div');
    host.id = OVERLAY_ID;
    host.setAttribute('aria-hidden', 'false');
    host.style.cssText = [
      'all: initial',
      'position: fixed',
      'inset: 0',
      'z-index: 2147483647',
      'pointer-events: none',
    ].join(';');

    const shadow = host.attachShadow({ mode: 'closed' });
    shadow.innerHTML = `
      <style>
        :host { all: initial; }
        .wrap {
          position: fixed; inset: 0; display: flex;
          align-items: center; justify-content: center;
          background: rgba(9, 11, 16, .55);
          font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
          pointer-events: auto;
        }
        .card {
          min-width: 280px; max-width: 380px; padding: 22px 24px;
          border-radius: 14px; background: #161A23;
          border: 1px solid #333C4E;
          box-shadow: 0 18px 50px rgba(0,0,0,.45);
          color: #EEF1F7; text-align: left;
        }
        .row { display: flex; align-items: center; gap: 10px; }
        .dot {
          width: 22px; height: 22px; border-radius: 6px; flex: none;
          background: linear-gradient(150deg, #9B85FF, #5B3FE0);
        }
        .name { font-size: 13px; font-weight: 600; letter-spacing: -.01em; }
        .phase { margin-top: 14px; font-size: 13px; color: #EEF1F7; }
        .hint { margin-top: 6px; font-size: 11px; color: #A6B0C3; }
        .bar {
          margin-top: 12px; height: 5px; border-radius: 3px;
          background: #2A3242; overflow: hidden;
        }
        .fill {
          height: 100%; width: 0%; border-radius: 3px;
          background: linear-gradient(90deg, #7A5CFF, #9B85FF);
          transition: width .18s cubic-bezier(.2,0,0,1);
        }
        .btn {
          margin-top: 16px; width: 100%; padding: 9px 12px;
          border-radius: 8px; border: 1px solid #333C4E;
          background: #1E2430; color: #EEF1F7;
          font: inherit; font-size: 12px; font-weight: 550; cursor: pointer;
        }
        .btn:hover { background: #2A3242; }
        .btn:focus-visible { outline: 2px solid #7A5CFF; outline-offset: 2px; }
        .err .fill { background: #FF5C7A; }
        @media (prefers-reduced-motion: reduce) {
          .fill { transition: none; }
        }
      </style>
      <div class="wrap" role="status" aria-live="polite">
        <div class="card">
          <div class="row"><div class="dot"></div><div class="name">Tallshot</div></div>
          <div class="phase" id="phase">Measuring page</div>
          <div class="bar"><div class="fill" id="fill"></div></div>
          <div class="hint" id="hint">Press Esc to cancel</div>
          <button class="btn" id="cancel" type="button">Cancel</button>
        </div>
      </div>
    `;

    (document.body || document.documentElement).appendChild(host);
    state.overlayHost = host;
    state.shadow = shadow;
    state.nodes = {
      phase: shadow.getElementById('phase'),
      fill: shadow.getElementById('fill'),
      hint: shadow.getElementById('hint'),
      cancel: shadow.getElementById('cancel'),
      wrap: shadow.querySelector('.wrap'),
    };

    state.nodes.cancel.addEventListener('click', () => cancel());
  }

  const PHASE_LABEL = {
    measuring: 'Measuring page',
    preloading: 'Loading images',
    capturing: 'Capturing',
    stitching: 'Stitching image',
    finishing: 'Finishing up',
  };

  function updateOverlay({ phase, value = 0, label, hint, error }) {
    if (!state.overlayHost?.isConnected) return;
    const { nodes } = state;
    if (nodes.phase) nodes.phase.textContent = label || PHASE_LABEL[phase] || 'Working';
    if (nodes.fill) nodes.fill.style.width = `${Math.round(Math.min(1, Math.max(0, value)) * 100)}%`;
    if (nodes.hint && hint !== undefined) nodes.hint.textContent = hint;
    if (nodes.wrap) nodes.wrap.classList.toggle('err', Boolean(error));
    if (nodes.cancel) nodes.cancel.style.display = error ? 'none' : '';
  }

  function showOverlay(payload) {
    ensureOverlay();
    updateOverlay(payload || { phase: 'measuring' });
  }

  function hideOverlay() {
    state.overlayHost?.remove();
    state.overlayHost = null;
    state.shadow = null;
    state.nodes = {};
  }

  // ── Cancellation ───────────────────────────────────────────────────────

  function cancel() {
    state.cancelled = true;
    updateOverlay({ phase: 'finishing', label: 'Cancelling…', value: 1, hint: '' });
    try {
      chrome.runtime.sendMessage({ type: 'capture:cancel' });
    } catch {
      /* worker may already be gone; the flag still stops the loop */
    }
  }

  function attachKeys() {
    if (state.keyHandler) return;
    state.keyHandler = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        cancel();
      }
    };
    window.addEventListener('keydown', state.keyHandler, true);
  }

  function detachKeys() {
    if (!state.keyHandler) return;
    window.removeEventListener('keydown', state.keyHandler, true);
    state.keyHandler = null;
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────

  /**
   * Prepare the page and return the capture plan.
   * Runs measure → preload → re-measure → freeze.
   */
  async function prepare(options) {
    state.active = true;
    state.cancelled = false;
    const before = measure();
    state.savedScrollX = before.scrollX;
    state.savedScrollY = before.scrollY;

    showOverlay({ phase: 'measuring', value: 0.05 });
    attachKeys();

    if (options.preloadLazy) {
      await preload({
        maxSteps: options.maxPreloadSteps,
        stepDelay: options.preloadStepDelay,
        settleDelay: options.settleDelay,
      });
    }
    if (state.cancelled) return { cancelled: true };

    // Lazy content usually makes the page taller. Measuring again is what
    // stops the capture from being truncated at the pre-load height.
    const after = measure();
    const frozen = options.hideSticky ? freeze() : { fixed: 0, sticky: 0 };

    updateOverlay({ phase: 'capturing', value: 0 });

    return {
      cancelled: false,
      geometry: after,
      grew: after.pageHeight > before.pageHeight,
      frozen,
    };
  }

  /** Hide the overlay for the duration of the capture loop. */
  function beginFrames() {
    if (state.overlayHost) state.overlayHost.style.display = 'none';
    return true;
  }

  /** Bring the overlay back once frames are done. */
  function endFrames() {
    if (state.overlayHost) state.overlayHost.style.display = '';
    updateOverlay({ phase: 'stitching', value: 0.9, hint: '' });
    return true;
  }

  /** Restore the page exactly as we found it. */
  function finish() {
    unfreeze();
    window.scrollTo(state.savedScrollX, state.savedScrollY);
    detachKeys();
    hideOverlay();
    state.active = false;
    state.cancelled = false;
    return true;
  }

  /** Show a terminal error in the overlay, then tear down after a beat. */
  function fail(message, hint) {
    unfreeze();
    window.scrollTo(state.savedScrollX, state.savedScrollY);
    showOverlay({
      phase: 'finishing',
      label: message,
      hint: hint || '',
      value: 1,
      error: true,
    });
    setTimeout(() => {
      detachKeys();
      hideOverlay();
      state.active = false;
    }, 4200);
    return true;
  }

  function reset() {
    if (state.frozen) unfreeze();
    detachKeys();
    hideOverlay();
    state.active = false;
    state.cancelled = false;
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  window.__tallshotAgent = {
    measure,
    prepare,
    step,
    beginFrames,
    endFrames,
    finish,
    fail,
    reset,
    showOverlay,
    updateOverlay,
    isCancelled: () => state.cancelled,
  };
})();
