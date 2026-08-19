/**
 * Tallshot — region selection agent.
 *
 * Injected on demand under activeTab, same as page-agent.js, and subject to
 * the same rules: classic script (no import/export), reads geometry only,
 * never touches page content.
 *
 * Draws a dimmed overlay with a draggable selection box in a closed shadow
 * root, resolves with the chosen rectangle in CSS pixels relative to the
 * viewport, and restores the page on cancel.
 */

(() => {
  if (window.__tallshotRegion) {
    window.__tallshotRegion.destroy();
  }

  const HOST_ID = 'tallshot-region-root';
  const MIN_SIZE = 8;
  const SELECT_TIMEOUT_MS = 120000;

  const state = {
    host: null,
    shadow: null,
    nodes: {},
    dragging: false,
    start: { x: 0, y: 0 },
    rect: null,
    resolve: null,
    settled: false,
    keyHandler: null,
    activeEdge: 'br',
  };

  function build() {
    const host = document.createElement('div');
    host.id = HOST_ID;
    host.style.cssText = [
      'all: initial',
      'position: fixed',
      'inset: 0',
      'z-index: 2147483647',
    ].join(';');

    const shadow = host.attachShadow({ mode: 'closed' });
    shadow.innerHTML = `
      <style>
        :host { all: initial; }
        .stage {
          position: fixed; inset: 0; cursor: crosshair;
          font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
          user-select: none; -webkit-user-select: none;
        }
        /* Four panels around the selection dim everything except the choice,
           which keeps the selected pixels at true colour so the user judges
           the crop accurately. */
        .shade { position: fixed; background: rgba(9, 11, 16, .45); }
        .box {
          position: fixed; box-sizing: border-box;
          border: 1.5px solid #7A5CFF;
          box-shadow: 0 0 0 1px rgba(255,255,255,.35);
        }
        .grid { position: absolute; inset: 0; opacity: .5; }
        .grid i {
          position: absolute; background: rgba(255,255,255,.4);
        }
        .grid i.v { top: 0; bottom: 0; width: 1px; }
        .grid i.h { left: 0; right: 0; height: 1px; }
        .handle {
          position: absolute; width: 9px; height: 9px; border-radius: 2px;
          background: #fff; border: 1.5px solid #7A5CFF;
        }
        .size {
          position: fixed; padding: 4px 8px; border-radius: 6px;
          background: #0F1117; color: #EEF1F7; white-space: nowrap;
          font-size: 11px; font-weight: 600; font-variant-numeric: tabular-nums;
          border: 1px solid #333C4E;
        }
        .bar {
          position: fixed; display: flex; gap: 6px; padding: 6px;
          border-radius: 10px; background: #161A23; border: 1px solid #333C4E;
          box-shadow: 0 12px 32px rgba(0,0,0,.45);
        }
        .bar button {
          font: inherit; font-size: 12px; font-weight: 550;
          padding: 7px 12px; border-radius: 7px; cursor: pointer;
          border: 1px solid transparent; background: #1E2430; color: #EEF1F7;
        }
        .bar button.primary { background: #7A5CFF; color: #fff; }
        .bar button:hover { filter: brightness(1.12); }
        .bar button:focus-visible { outline: 2px solid #FFB020; outline-offset: 2px; }
        .tip {
          position: fixed; left: 50%; top: 18px; transform: translateX(-50%);
          padding: 8px 14px; border-radius: 999px;
          background: #161A23; color: #EEF1F7; border: 1px solid #333C4E;
          font-size: 12px; font-weight: 500;
        }
        .hidden { display: none !important; }
      </style>
      <div class="stage" id="stage">
        <div class="shade" id="sTop"></div>
        <div class="shade" id="sBottom"></div>
        <div class="shade" id="sLeft"></div>
        <div class="shade" id="sRight"></div>
        <div class="tip" id="tip">Drag to select an area &nbsp;·&nbsp; Esc to cancel</div>
        <div class="box hidden" id="box">
          <div class="grid">
            <i class="v" style="left:33.33%"></i><i class="v" style="left:66.66%"></i>
            <i class="h" style="top:33.33%"></i><i class="h" style="top:66.66%"></i>
          </div>
          <div class="handle" style="left:-5px;top:-5px"></div>
          <div class="handle" style="right:-5px;top:-5px"></div>
          <div class="handle" style="left:-5px;bottom:-5px"></div>
          <div class="handle" style="right:-5px;bottom:-5px"></div>
        </div>
        <div class="size hidden" id="size">0 &times; 0</div>
        <div class="bar hidden" id="bar">
          <button type="button" class="primary" id="ok">Capture</button>
          <button type="button" id="redo">Redo</button>
          <button type="button" id="cancel">Cancel</button>
        </div>
      </div>
    `;

    (document.body || document.documentElement).appendChild(host);
    state.host = host;
    state.shadow = shadow;
    state.nodes = {
      stage: shadow.getElementById('stage'),
      box: shadow.getElementById('box'),
      size: shadow.getElementById('size'),
      bar: shadow.getElementById('bar'),
      tip: shadow.getElementById('tip'),
      ok: shadow.getElementById('ok'),
      redo: shadow.getElementById('redo'),
      cancel: shadow.getElementById('cancel'),
      shades: {
        top: shadow.getElementById('sTop'),
        bottom: shadow.getElementById('sBottom'),
        left: shadow.getElementById('sLeft'),
        right: shadow.getElementById('sRight'),
      },
    };

    wire();
    layoutShades(null);
  }

  function wire() {
    const { stage, ok, redo, cancel } = state.nodes;

    stage.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      // Clicks on the confirm bar must not start a new drag.
      if (e.composedPath().includes(state.nodes.bar)) return;
      state.dragging = true;
      state.start = { x: e.clientX, y: e.clientY };
      state.rect = { x: e.clientX, y: e.clientY, width: 0, height: 0 };
      state.nodes.bar.classList.add('hidden');
      state.nodes.tip.classList.add('hidden');
      stage.setPointerCapture(e.pointerId);
      render();
      e.preventDefault();
    });

    stage.addEventListener('pointermove', (e) => {
      if (!state.dragging) return;
      state.rect = rectFrom(state.start, { x: e.clientX, y: e.clientY });
      render();
    });

    stage.addEventListener('pointerup', (e) => {
      if (!state.dragging) return;
      state.dragging = false;
      try {
        stage.releasePointerCapture(e.pointerId);
      } catch {
        /* pointer already released */
      }
      state.rect = rectFrom(state.start, { x: e.clientX, y: e.clientY });
      if (state.rect.width < MIN_SIZE || state.rect.height < MIN_SIZE) {
        // Treat a stray click as "no selection yet" rather than capturing a
        // 2x3px sliver.
        state.rect = null;
        state.nodes.tip.classList.remove('hidden');
      }
      render();
    });

    ok.addEventListener('click', () => settle(state.rect));
    redo.addEventListener('click', () => {
      state.rect = null;
      state.nodes.tip.classList.remove('hidden');
      render();
    });
    cancel.addEventListener('click', () => settle(null));

    state.keyHandler = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        settle(null);
        return;
      }
      if (e.key === 'Enter' && state.rect) {
        e.preventDefault();
        e.stopPropagation();
        settle(state.rect);
        return;
      }
      if ((e.key === 'a' || e.key === 'A') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        state.rect = {
          x: 0,
          y: 0,
          width: document.documentElement.clientWidth,
          height: document.documentElement.clientHeight,
        };
        state.nodes.tip.classList.add('hidden');
        render();
        return;
      }
      if (state.rect && e.key.startsWith('Arrow')) {
        e.preventDefault();
        const stepPx = e.shiftKey ? 10 : 1;
        const r = { ...state.rect };
        if (e.key === 'ArrowRight') r.width += stepPx;
        if (e.key === 'ArrowLeft') r.width -= stepPx;
        if (e.key === 'ArrowDown') r.height += stepPx;
        if (e.key === 'ArrowUp') r.height -= stepPx;
        r.width = Math.max(MIN_SIZE, r.width);
        r.height = Math.max(MIN_SIZE, r.height);
        state.rect = clampToViewport(r);
        render();
      }
    };
    window.addEventListener('keydown', state.keyHandler, true);
  }

  function rectFrom(a, b) {
    return clampToViewport({
      x: Math.min(a.x, b.x),
      y: Math.min(a.y, b.y),
      width: Math.abs(b.x - a.x),
      height: Math.abs(b.y - a.y),
    });
  }

  function clampToViewport(r) {
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    const x = Math.max(0, Math.min(r.x, vw));
    const y = Math.max(0, Math.min(r.y, vh));
    return {
      x,
      y,
      width: Math.max(0, Math.min(r.width, vw - x)),
      height: Math.max(0, Math.min(r.height, vh - y)),
    };
  }

  function render() {
    const { box, size, bar } = state.nodes;
    const r = state.rect;
    if (!r || r.width < 1 || r.height < 1) {
      box.classList.add('hidden');
      size.classList.add('hidden');
      bar.classList.add('hidden');
      layoutShades(null);
      return;
    }

    box.classList.remove('hidden');
    box.style.left = `${r.x}px`;
    box.style.top = `${r.y}px`;
    box.style.width = `${r.width}px`;
    box.style.height = `${r.height}px`;

    size.classList.remove('hidden');
    size.textContent = `${Math.round(r.width)} × ${Math.round(r.height)}`;
    // Place the readout above the box, or inside it when there is no room.
    const above = r.y > 28;
    size.style.left = `${r.x}px`;
    size.style.top = above ? `${r.y - 26}px` : `${r.y + 6}px`;

    layoutShades(r);

    if (!state.dragging) {
      bar.classList.remove('hidden');
      const barTop = r.y + r.height + 10;
      const vh = document.documentElement.clientHeight;
      bar.style.left = `${r.x}px`;
      bar.style.top = barTop + 46 > vh ? `${Math.max(6, r.y - 52)}px` : `${barTop}px`;
    } else {
      bar.classList.add('hidden');
    }
  }

  /** Dim everything outside the selection using four panels. */
  function layoutShades(r) {
    const { top, bottom, left, right } = state.nodes.shades;
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;

    if (!r) {
      top.style.cssText = shadeCss(0, 0, vw, vh);
      bottom.style.cssText = shadeCss(0, 0, 0, 0);
      left.style.cssText = shadeCss(0, 0, 0, 0);
      right.style.cssText = shadeCss(0, 0, 0, 0);
      return;
    }
    top.style.cssText = shadeCss(0, 0, vw, r.y);
    bottom.style.cssText = shadeCss(0, r.y + r.height, vw, vh - (r.y + r.height));
    left.style.cssText = shadeCss(0, r.y, r.x, r.height);
    right.style.cssText = shadeCss(r.x + r.width, r.y, vw - (r.x + r.width), r.height);
  }

  function shadeCss(x, y, w, h) {
    return (
      'position:fixed;background:rgba(9,11,16,.45);' +
      `left:${x}px;top:${y}px;width:${Math.max(0, w)}px;height:${Math.max(0, h)}px;`
    );
  }

  function settle(rect) {
    if (state.settled) return;
    state.settled = true;
    const resolve = state.resolve;
    state.resolve = null;
    const valid =
      rect && rect.width >= MIN_SIZE && rect.height >= MIN_SIZE ? { ...rect } : null;
    if (!valid) destroy();
    resolve?.(valid);
  }

  /**
   * Hide the overlay without tearing it down.
   * Called just before captureVisibleTab so the selection chrome does not
   * appear in the captured pixels.
   */
  function hide() {
    if (state.host) state.host.style.display = 'none';
    return true;
  }

  function destroy() {
    if (state.keyHandler) {
      window.removeEventListener('keydown', state.keyHandler, true);
      state.keyHandler = null;
    }
    state.host?.remove();
    state.host = null;
    state.shadow = null;
    state.nodes = {};
    state.rect = null;
    state.dragging = false;
    return true;
  }

  /** Resolve with the chosen rect in CSS px, or null if cancelled. */
  function select() {
    state.settled = false;
    build();
    return new Promise((resolve) => {
      state.resolve = resolve;
      // A page the user walks away from should not leave the worker awaiting
      // a promise forever.
      setTimeout(() => settle(null), SELECT_TIMEOUT_MS);
    });
  }

  window.__tallshotRegion = { select, hide, destroy };
})();
