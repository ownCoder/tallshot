/**
 * Tallshot — store screenshot templates.
 *
 * Each template renders a real product surface (same markup and same design
 * tokens as the shipped UI) inside a branded marketing frame. Reusing the
 * product's own CSS is deliberate: what a shopper sees in the store is
 * literally what the extension looks like, so the listing cannot drift from
 * the build.
 *
 * The demo web page shown inside the editor is invented for this purpose
 * ("Northwind Analytics"). No real brand, site or person is depicted.
 */

const BRAND_MARK = `
<svg class="mark" viewBox="0 0 32 32" aria-hidden="true">
  <defs><linearGradient id="m" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#9B85FF"/><stop offset="1" stop-color="#5B3FE0"/>
  </linearGradient></defs>
  <rect width="32" height="32" rx="7" fill="url(#m)"/>
  <rect x="10" y="-2" width="12" height="24" rx="2.5" fill="#fff" opacity=".95"/>
  <rect x="12.5" y="4" width="7" height="1.6" rx=".8" fill="#5B3FE0" opacity=".55"/>
  <rect x="12.5" y="7.6" width="5" height="1.6" rx=".8" fill="#5B3FE0" opacity=".55"/>
  <rect x="12.5" y="11.2" width="7" height="1.6" rx=".8" fill="#5B3FE0" opacity=".55"/>
  <path d="M16 21.5 L21 26.5 L11 26.5 Z" fill="#FFB020"/>
</svg>`;

const FRAME_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 1280px; height: 800px; overflow: hidden; }
  body {
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    background: radial-gradient(1100px 700px at 18% -8%, #8B6BFF 0%, #6B4CE8 42%, #4C33C4 100%);
    color: #fff;
    display: flex; flex-direction: column;
    padding: 46px 56px;
  }
  .head { display: flex; align-items: center; gap: 12px; margin-bottom: 6px; }
  .mark { width: 30px; height: 30px; border-radius: 7px; }
  .wordmark { font-size: 18px; font-weight: 650; letter-spacing: -.015em; opacity: .95; }
  h1 {
    font-size: 42px; line-height: 1.1; font-weight: 680;
    letter-spacing: -.028em; max-width: 20ch; margin-top: 14px;
  }
  .sub { margin-top: 12px; font-size: 17px; font-weight: 450; opacity: .82; max-width: 62ch; }
  .stagewrap { flex: 1; display: flex; align-items: center; justify-content: center; margin-top: 26px; }
  .shot {
    border-radius: 14px; overflow: hidden;
    box-shadow: 0 34px 80px rgba(15,10,50,.5), 0 0 0 1px rgba(255,255,255,.14);
    background: #161A23;
  }
  .pills { display: flex; gap: 9px; margin-top: 16px; flex-wrap: wrap; }
  .pill {
    padding: 7px 14px; border-radius: 999px; font-size: 13px; font-weight: 560;
    background: rgba(255,255,255,.15); border: 1px solid rgba(255,255,255,.24);
  }
  .pill--amber { background: rgba(255,176,32,.24); border-color: rgba(255,176,32,.6); }
`;

/** Shared product tokens, matching src/ui/theme.css. */
const TOKENS = `
  --violet:#7A5CFF; --violet-lift:#9B85FF; --amber:#FFB020;
  --ink:#0F1117; --surface:#161A23; --surface2:#1E2430; --surface3:#2A3242;
  --line:#333C4E; --text:#EEF1F7; --text2:#A6B0C3; --text3:#6F7A8F;
  --success:#2ED3A7; --danger:#FF5C7A;
`;

function page({ title, sub, pills = [], stage, extraCss = '' }) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    :root { ${TOKENS} }
    ${FRAME_CSS}
    ${extraCss}
  </style></head><body>
    <div class="head">${BRAND_MARK}<span class="wordmark">Tallshot</span></div>
    <h1>${title}</h1>
    <p class="sub">${sub}</p>
    ${pills.length ? `<div class="pills">${pills.map((p, i) => `<span class="pill${i === 0 ? ' pill--amber' : ''}">${p}</span>`).join('')}</div>` : ''}
    <div class="stagewrap">${stage}</div>
  </body></html>`;
}

/** A fictional web page used as the captured content in mockups. */
function demoPage() {
  return `
  <div class="demo">
    <div class="demo__nav">
      <div class="demo__logo"><i></i>Northwind Analytics</div>
      <div class="demo__links"><span>Product</span><span>Pricing</span><span>Docs</span>
        <span class="demo__cta">Start free</span></div>
    </div>
    <div class="demo__hero">
      <h2>Understand your data<br/>without a data team</h2>
      <p>Connect a source, ask a question, get an answer. No SQL required.</p>
      <div class="demo__row"><span class="demo__btn">Start free</span><span class="demo__btn2">Book a demo</span></div>
    </div>
    <div class="demo__cards">
      <div class="demo__card"><b>Starter</b><em>$0</em><span>Up to 3 sources</span><span>7-day history</span><span>Email support</span></div>
      <div class="demo__card demo__card--hi"><b>Team</b><em>$24</em><span>Unlimited sources</span><span>1-year history</span><span>Priority support</span></div>
      <div class="demo__card"><b>Business</b><em>$79</em><span>SSO &amp; audit log</span><span>Unlimited history</span><span>Dedicated CSM</span></div>
    </div>
    <div class="demo__strip">
      <div><b>4.9/5</b><span>average rating</span></div>
      <div><b>18k</b><span>teams onboard</span></div>
      <div><b>99.99%</b><span>uptime</span></div>
    </div>
    <div class="demo__feat">
      <h3>Everything you need to answer a question</h3>
      <div class="demo__grid">
        ${[
          ['Connect anything', 'Postgres, BigQuery, Sheets and 40 more.'],
          ['Ask in plain English', 'No SQL, no query builder, no training.'],
          ['Share a link', 'Every answer is a live, permission-aware page.'],
          ['Alerts that matter', 'Get told when a number moves, not every hour.'],
          ['Version history', 'Every change to every dashboard, forever.'],
          ['Audit trail', 'Know who saw what, and when.'],
        ]
          .map(([t, d]) => `<div class="demo__f"><b>${t}</b><span>${d}</span></div>`)
          .join('')}
      </div>
    </div>
    <div class="demo__faq">
      ${[
        'Do I need a data engineer to set this up?',
        'Can I keep our data in our own warehouse?',
        'How does billing work for seasonal teams?',
        'Is there a discount for non-profits?',
      ]
        .map((q) => `<div class="demo__q"><span>${q}</span><i>+</i></div>`)
        .join('')}
    </div>
    <div class="demo__foot">
      <span>© 2026 Northwind Analytics</span>
      <span>Privacy · Terms · Status · Careers</span>
    </div>
  </div>`;
}

const DEMO_CSS = `
  .demo { width: 900px; background:#fff; color:#17202E; font-size:13px; line-height:1.45; }
  .demo__nav { display:flex; align-items:center; justify-content:space-between;
    padding: 14px 22px; border-bottom: 1px solid #E6E9F0; }
  .demo__logo { display:flex; align-items:center; gap:8px; font-weight:700; font-size:14px; }
  .demo__logo i { width:16px; height:16px; border-radius:5px; background:linear-gradient(135deg,#3B9EFF,#1E5FD8); display:block; }
  .demo__links { display:flex; align-items:center; gap:18px; color:#5C6880; font-size:12px; }
  .demo__cta { background:#17202E; color:#fff; padding:6px 12px; border-radius:6px; font-weight:600; }
  .demo__hero { padding: 44px 22px 30px; text-align:center; background:linear-gradient(180deg,#F6F8FE,#fff); }
  .demo__hero h2 { font-size: 30px; line-height:1.18; letter-spacing:-.02em; }
  .demo__hero p { margin-top:12px; color:#5C6880; font-size:14px; }
  .demo__row { display:flex; gap:10px; justify-content:center; margin-top:20px; }
  .demo__btn { background:#3B6BFF; color:#fff; padding:9px 18px; border-radius:7px; font-weight:600; }
  .demo__btn2 { border:1px solid #D3D9E6; padding:9px 18px; border-radius:7px; font-weight:600; }
  .demo__cards { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; padding: 26px 22px; }
  .demo__card { border:1px solid #E6E9F0; border-radius:10px; padding:16px; display:flex; flex-direction:column; gap:7px; }
  .demo__card--hi { border-color:#3B6BFF; box-shadow:0 6px 20px rgba(59,107,255,.16); }
  .demo__card b { font-size:13px; } .demo__card em { font-size:26px; font-style:normal; font-weight:700; }
  .demo__card span { color:#5C6880; font-size:11.5px; }
  .demo__strip { display:grid; grid-template-columns:repeat(3,1fr); border-top:1px solid #E6E9F0; }
  .demo__strip div { padding:18px; text-align:center; }
  .demo__strip b { display:block; font-size:20px; } .demo__strip span { color:#5C6880; font-size:11.5px; }
  .demo__feat { padding: 30px 22px 26px; border-top:1px solid #E6E9F0; }
  .demo__feat h3 { font-size:19px; letter-spacing:-.015em; text-align:center; }
  .demo__grid { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; margin-top:20px; }
  .demo__f { border:1px solid #EDF0F6; border-radius:9px; padding:13px; display:flex;
    flex-direction:column; gap:5px; background:#FAFBFE; }
  .demo__f b { font-size:12.5px; } .demo__f span { color:#5C6880; font-size:11.5px; }
  .demo__faq { padding: 6px 22px 24px; }
  .demo__q { display:flex; justify-content:space-between; align-items:center;
    padding:13px 4px; border-bottom:1px solid #EDF0F6; font-size:12.5px; font-weight:600; }
  .demo__q i { font-style:normal; color:#98A2B6; font-weight:700; }
  .demo__foot { display:flex; justify-content:space-between; padding:16px 22px;
    background:#F6F8FE; color:#5C6880; font-size:11.5px; }
`;

/** The real popup markup, using the shipped class names. */
function popupMock() {
  const row = (icon, title, sub, key, primary) => `
    <button class="capture${primary ? ' capture--primary' : ''}">
      <span class="capture__icon">${icon}</span>
      <span class="capture__text">
        <span class="capture__title">${title}</span>
        <span class="capture__sub">${sub}</span>
      </span><kbd>${key}</kbd>
    </button>`;

  return `<div class="pop">
    <div class="pop__head">
      <div class="brand">${BRAND_MARK}<span class="brand__name">Tallshot</span></div>
      <span class="gear">⚙</span>
    </div>
    <div class="pop__actions">
      ${row('<svg viewBox="0 0 24 24"><rect x="5" y="2.5" width="14" height="19" rx="2.5"/><path d="M9 8h6M9 12h4M9 16h6"/></svg>', 'Full page', 'Everything, top to bottom', 'Alt ⇧ F', true)}
      ${row('<svg viewBox="0 0 24 24"><rect x="2.5" y="5" width="19" height="14" rx="2.5"/></svg>', 'Visible area', "What's on screen now", 'Alt ⇧ V')}
      ${row('<svg viewBox="0 0 24 24"><path d="M3 8V4.5A1.5 1.5 0 0 1 4.5 3H8"/><path d="M16 3h3.5A1.5 1.5 0 0 1 21 4.5V8"/><path d="M21 16v3.5a1.5 1.5 0 0 1-1.5 1.5H16"/><path d="M8 21H4.5A1.5 1.5 0 0 1 3 19.5V16"/><rect x="8" y="8" width="8" height="8" rx="1"/></svg>', 'Select region', 'Drag to choose an area', 'Alt ⇧ R')}
    </div>
    <div class="pop__foot">
      <div class="after"><span>After capture</span><span class="sel">Open editor ▾</span></div>
      <div class="privacy">🔒 Everything stays on this device.</div>
    </div>
  </div>`;
}

const POPUP_CSS = `
  .pop { width: 328px; background: var(--surface); color: var(--text); font-size: 13px; }
  .pop__head { display:flex; align-items:center; justify-content:space-between; padding:12px 14px 10px; }
  .brand { display:flex; align-items:center; gap:9px; }
  .brand .mark { width:22px; height:22px; }
  .brand__name { font-size:16px; font-weight:620; letter-spacing:-.011em; }
  .gear { color: var(--text3); font-size: 15px; }
  .pop__actions { display:flex; flex-direction:column; gap:7px; padding:2px 12px 12px; }
  .capture { display:flex; align-items:center; gap:11px; width:100%; min-height:56px;
    padding:10px 12px; text-align:left; border:1px solid var(--line);
    border-radius:9px; background:var(--surface2); color:var(--text); }
  .capture--primary { background:linear-gradient(180deg, rgba(122,92,255,.16), rgba(122,92,255,.07));
    border-color: rgba(122,92,255,.5); }
  .capture__icon { display:grid; place-items:center; width:34px; height:34px; flex:none;
    border-radius:6px; background:var(--surface3); color:var(--violet-lift); }
  .capture--primary .capture__icon { background:rgba(122,92,255,.22); color:#fff; }
  .capture__icon svg { width:18px; height:18px; fill:none; stroke:currentColor;
    stroke-width:1.75; stroke-linecap:round; stroke-linejoin:round; }
  .capture__text { display:flex; flex-direction:column; gap:1px; flex:1; }
  .capture__title { font-size:13px; font-weight:600; }
  .capture__sub { font-size:11px; color:var(--text2); }
  kbd { font-family: ui-monospace, Consolas, monospace; font-size:10px; font-weight:600;
    padding:2px 5px; border-radius:4px; background:var(--surface3); color:var(--text2);
    border:1px solid var(--line); white-space:nowrap; }
  .pop__foot { border-top:1px solid var(--line); padding:11px 14px 12px; }
  .after { display:flex; align-items:center; justify-content:space-between; font-size:12px; color:var(--text2); }
  .sel { padding:6px 8px; border-radius:6px; border:1px solid var(--line);
    background:var(--surface3); color:var(--text); font-size:12px; }
  .privacy { margin-top:10px; font-size:11px; color:var(--text3); }
`;

/** The editor chrome, using the shipped class names. */
function editorMock({ inner, bannerText = '', dims = '1440 × 8320', host = 'northwind.example' }) {
  const tools = ['↖', '⬚', '↗', '▭', '◯', '⁄', '✎', '▬', 'T', '①', '▓', '▒'];
  const active = 2;
  return `<div class="ed">
    <div class="ed__bar">
      <div class="ed__left">${BRAND_MARK}
        <div class="ed__meta"><span class="ed__host">${host}</span><span class="ed__dims">${dims}</span></div>
      </div>
      <div class="ed__right">
        <span class="ed__b">↶</span><span class="ed__b">↷</span>
        <span class="ed__b">Copy</span>
        <span class="ed__save">⤓ Save PNG</span><span class="ed__caret">▾</span>
      </div>
    </div>
    ${bannerText ? `<div class="ed__banner">${bannerText}</div>` : ''}
    <div class="ed__body">
      <div class="ed__rail">${tools.map((t, i) => `<span class="ed__tool${i === active ? ' is-on' : ''}">${t}</span>`).join('')}</div>
      <div class="ed__stage">${inner}</div>
    </div>
    <div class="ed__ctx">
      <span class="ed__lbl">Colour</span>
      <span class="sw" style="background:#FF4D4F;outline:2px solid #EEF1F7;outline-offset:2px"></span>
      <span class="sw" style="background:#FFB020"></span><span class="sw" style="background:#2ED3A7"></span>
      <span class="sw" style="background:#3B9EFF"></span><span class="sw" style="background:#7A5CFF"></span>
      <span class="sw" style="background:#12151C"></span>
      <span class="ed__lbl" style="margin-left:18px">Width</span><span class="ed__range"><i></i></span>
      <span style="flex:1"></span>
      <span class="ed__lbl">68%</span><span class="ed__b">Fit</span><span class="ed__b">1:1</span>
    </div>
  </div>`;
}

const EDITOR_CSS = `
  .ed { width: 1000px; color: var(--text); font-size: 12px; background: var(--ink); }
  .ed__bar { display:flex; align-items:center; justify-content:space-between; gap:16px;
    padding:9px 14px; background:var(--surface); border-bottom:1px solid var(--line); }
  .ed__left, .ed__right { display:flex; align-items:center; gap:10px; }
  .ed__left .mark { width:24px; height:24px; }
  .ed__meta { display:flex; flex-direction:column; line-height:1.25; }
  .ed__host { font-size:12px; font-weight:620; }
  .ed__dims { font-family: ui-monospace, Consolas, monospace; font-size:11px; color:var(--text3); }
  .ed__b { padding:6px 10px; border-radius:6px; color:var(--text2); font-weight:550; }
  .ed__save { padding:7px 12px; border-radius:6px 0 0 6px; background:var(--violet); color:#fff; font-weight:600; }
  .ed__caret { padding:7px 6px; border-radius:0 6px 6px 0; background:var(--violet); color:#fff;
    border-left:1px solid rgba(255,255,255,.24); }
  .ed__banner { padding:8px 16px; font-size:11px; background:rgba(255,176,32,.14);
    border-bottom:1px solid rgba(255,176,32,.36); }
  .ed__body { display:flex; height: 452px; }
  .ed__rail { display:flex; flex-direction:column; gap:3px; padding:8px 7px;
    background:var(--surface); border-right:1px solid var(--line); }
  .ed__tool { display:grid; place-items:center; width:36px; height:36px; border-radius:6px;
    color:var(--text2); font-size:14px; }
  .ed__tool.is-on { background:var(--surface3); color:var(--amber); border:1px solid rgba(255,176,32,.45); }
  .ed__stage { flex:1; overflow:hidden; display:grid; place-items:start center; padding:16px;
    background-image:
      linear-gradient(45deg,#12151d 25%,transparent 25%), linear-gradient(-45deg,#12151d 25%,transparent 25%),
      linear-gradient(45deg,transparent 75%,#12151d 75%), linear-gradient(-45deg,transparent 75%,#12151d 75%);
    background-size:18px 18px; background-position:0 0,0 9px,9px -9px,-9px 0; background-color:var(--ink); }
  .ed__ctx { display:flex; align-items:center; gap:8px; padding:8px 14px;
    background:var(--surface); border-top:1px solid var(--line); }
  .ed__lbl { font-size:11px; color:var(--text3); }
  .sw { width:19px; height:19px; border-radius:5px; display:inline-block; }
  .ed__range { width:100px; height:4px; border-radius:2px; background:var(--surface3); position:relative; display:inline-block; }
  .ed__range i { position:absolute; left:0; top:0; bottom:0; width:44%; border-radius:2px; background:var(--violet); }
  .canvasFrame { position:relative; line-height:0; box-shadow:0 18px 46px rgba(0,0,0,.42); border-radius:3px; overflow:hidden; }
`;

// ── Templates ────────────────────────────────────────────────────────────

export const TEMPLATES = [
  {
    name: '01-full-page',
    build: () =>
      page({
        title: 'The whole page — not just what fits on screen',
        sub: 'One key captures every pixel from top to bottom, however long the page is.',
        pills: ['Free forever', 'No account', 'No watermark'],
        extraCss:
          DEMO_CSS +
          POPUP_CSS +
          `
          .split { display:flex; align-items:flex-start; gap:40px; }
          /* The capture is shown clipped at the bottom on purpose: the point of
             the image is that the page is longer than any one screen. */
          .tall { position:relative; width:392px; height:404px; overflow:hidden;
            border-radius:12px; background:#fff;
            box-shadow:0 30px 70px rgba(15,10,50,.5), 0 0 0 1px rgba(255,255,255,.14); }
          .tallInner { width:900px; transform: scale(.4356); transform-origin: top left; }
          .tall::after { content:""; position:absolute; left:0; right:0; bottom:0; height:64px;
            background:linear-gradient(180deg, rgba(255,255,255,0), rgba(255,255,255,.96)); }
          .popShell { border-radius:12px; overflow:hidden;
            box-shadow:0 30px 70px rgba(15,10,50,.5), 0 0 0 1px rgba(255,255,255,.14); }
          .tag { margin-top:11px; font-size:12.5px; opacity:.86; text-align:center; font-weight:550; }
        `,
        stage: `<div class="split">
          <div><div class="popShell">${popupMock()}</div></div>
          <div><div class="tall"><div class="tallInner">${demoPage()}</div></div>
            <div class="tag">8,320px — captured as one image</div></div>
        </div>`,
      }),
  },
  {
    name: '02-editor',
    build: () =>
      page({
        title: 'A complete editor. Free, permanently.',
        sub: 'Arrows, boxes, text, highlighter, numbered steps and crop — with nothing behind a paywall.',
        pills: ['12 tools', 'Undo & redo', 'PNG · JPG · WebP · PDF'],
        extraCss:
          DEMO_CSS +
          EDITOR_CSS +
          `
          /* The demo page is 900px wide; 0.66 fits it into the 594px canvas. */
          .shotInner { width:900px; transform: scale(.66); transform-origin: top left; }
          .anno { position:absolute; pointer-events:none; }
          .boxed { border:3px solid #FF4D4F; border-radius:7px; }
          .stepdot { width:32px; height:32px; border-radius:50%; background:#FF4D4F; color:#fff;
            display:grid; place-items:center; font-weight:700; font-size:15px; line-height:1;
            border:2px solid rgba(255,255,255,.92); }
          .noted { background:#FFB020; color:#12151C; font-weight:700; font-size:14px; line-height:1.3;
            padding:4px 10px; border-radius:5px; }
        `,
        stage: editorMock({
          inner: `<div class="canvasFrame" style="width:594px;height:420px;background:#fff;overflow:hidden">
            <div class="shotInner">${demoPage()}</div>
            <!-- Annotations sit in canvas space: the middle pricing card of the
                 0.66-scaled demo lands at roughly x=205 y=203, 180x120. -->
            <div class="anno boxed" style="left:205px;top:203px;width:180px;height:120px"></div>
            <div class="anno stepdot" style="left:188px;top:189px">1</div>
            <svg class="anno" style="left:354px;top:114px;width:170px;height:96px" viewBox="0 0 170 96">
              <path d="M158 16 L52 74" stroke="#FF4D4F" stroke-width="5" stroke-linecap="round" fill="none"/>
              <path d="M38 82 L64 76 L56 58 Z" fill="#FF4D4F"/>
            </svg>
            <div class="anno noted" style="left:436px;top:78px">Most popular</div>
          </div>`,
        }),
      }),
  },
  {
    name: '03-redaction',
    build: () =>
      page({
        title: 'Blur what should never be shared',
        sub: 'Blur and pixelate are built in and free — the market leader has no redaction at any price.',
        pills: ['Blur & pixelate', 'Runs on your device', 'Nothing uploaded'],
        extraCss:
          EDITOR_CSS +
          `
          .tick { width: 620px; background:#fff; color:#17202E; font-size:13px; }
          .tick__h { padding:14px 18px; border-bottom:1px solid #E6E9F0; display:flex;
            justify-content:space-between; align-items:center; }
          .tick__h b { font-size:14px; }
          .tick__badge { background:#FFEDD3; color:#9A5B00; padding:4px 10px; border-radius:999px; font-size:11px; font-weight:700; }
          .tick__row { display:flex; padding:11px 18px; border-bottom:1px solid #F0F2F7; gap:14px; }
          .tick__k { width:120px; color:#5C6880; font-size:12px; }
          .tick__v { flex:1; font-weight:600; position:relative; }
          /* Redaction must actually destroy legibility in the marketing image —
             a screenshot showing "blurred" text you can still read would be a
             false claim about the product. */
          .redact { position:relative; display:inline-block; }
          .redact::after { content:""; position:absolute; inset:-4px -7px; border-radius:3px;
            backdrop-filter: blur(9px) saturate(.6);
            background:rgba(126,132,148,.55); }
          .pixel { position:relative; display:inline-block; }
          .pixel::after { content:""; position:absolute; inset:-4px -7px; border-radius:2px;
            backdrop-filter: blur(10px) contrast(.75);
            background-image:
              repeating-linear-gradient(90deg, rgba(30,36,50,.20) 0 11px, rgba(255,255,255,.20) 11px 22px),
              repeating-linear-gradient(0deg, rgba(30,36,50,.20) 0 11px, rgba(255,255,255,.20) 11px 22px);
            background-color: rgba(128,134,150,.42); }
          .tick__msg { padding:14px 18px; border-bottom:1px solid #F0F2F7; }
          .tick__msg b { display:block; font-size:12px; margin-bottom:6px; }
          .tick__msg p { color:#41506B; font-size:12.5px; line-height:1.6; }
          .tick__att { display:flex; gap:9px; align-items:center; padding:12px 18px;
            color:#5C6880; font-size:12px; }
          .tick__att i { width:26px; height:26px; border-radius:6px; background:#EDF1F9;
            display:grid; place-items:center; font-style:normal; font-size:12px; }
        `,
        stage: editorMock({
          host: 'support.example',
          dims: '1240 × 2180',
          inner: `<div class="canvasFrame" style="width:620px">
            <div class="tick">
              <div class="tick__h"><b>Ticket #48213 — Export fails on large report</b>
                <span class="tick__badge">Awaiting customer</span></div>
              <div class="tick__row"><div class="tick__k">Customer</div>
                <div class="tick__v"><span class="redact">Dana Whitfield</span></div></div>
              <div class="tick__row"><div class="tick__k">Email</div>
                <div class="tick__v"><span class="redact">d.whitfield@acme-corp.example</span></div></div>
              <div class="tick__row"><div class="tick__k">Account ID</div>
                <div class="tick__v"><span class="pixel">AC-99321-7740</span></div></div>
              <div class="tick__row"><div class="tick__k">Plan</div><div class="tick__v">Business — annual</div></div>
              <div class="tick__row"><div class="tick__k">Error</div>
                <div class="tick__v" style="font-family:ui-monospace,Consolas,monospace;font-size:12px;font-weight:500">
                  ExportTimeout: worker exceeded 30000ms</div></div>
              <div class="tick__row"><div class="tick__k">Reported</div><div class="tick__v">19 Aug 2026, 14:02</div></div>
              <div class="tick__msg">
                <b>Customer wrote</b>
                <p>Exporting the Q3 revenue report times out every time once it goes past
                about 40,000 rows. Smaller exports finish fine. This started after the
                update last Tuesday — it worked the week before. I've attached the console
                output. We need this resolved before month-end close.</p>
              </div>
              <div class="tick__msg" style="border:0">
                <b>Internal note</b>
                <p>Reproduced on staging with a 45k-row dataset. The export worker is
                hitting the 30s ceiling before the CSV is flushed. Raising to engineering.</p>
              </div>
              <div class="tick__att"><i>📎</i>console-output-2026-08-19.txt · 14 KB</div>
            </div>
          </div>`,
        }),
      }),
  },
  {
    name: '04-sticky',
    build: () =>
      page({
        title: 'Sticky headers appear once — where they belong',
        sub: 'Fixed navbars, cookie bars and chat widgets are frozen during capture, then restored exactly.',
        pills: ['No repeated headers', 'Lazy images pre-loaded', 'Long pages finish'],
        extraCss: `
          .cmp { display:flex; gap:30px; align-items:flex-start; }
          .col { width: 330px; }
          .col__cap { display:flex; align-items:center; gap:8px; margin-bottom:11px; font-size:13px; font-weight:600; }
          .dot { width:18px; height:18px; border-radius:50%; display:grid; place-items:center;
            font-size:12px; font-weight:800; color:#12151C; }
          .dot--bad { background:#FF5C7A; } .dot--good { background:#2ED3A7; }
          .paper { background:#fff; border-radius:11px; overflow:hidden; height:392px;
            box-shadow:0 26px 60px rgba(15,10,50,.45), 0 0 0 1px rgba(255,255,255,.14); }
          .nav { background:#17202E; color:#fff; padding:9px 13px; font-size:11px; font-weight:700;
            display:flex; justify-content:space-between; }
          .nav span { opacity:.65; font-weight:500; }
          .txt { padding:11px 13px; }
          .txt i { display:block; height:7px; border-radius:3px; background:#E3E7F0; margin-bottom:7px; }
          .txt i.s { width:62%; } .txt i.m { width:84%; }
          .img { height:56px; margin:0 13px 10px; border-radius:6px;
            background:linear-gradient(135deg,#DCE4F5,#C3CFEA); }
          .seam { height:2px; background:repeating-linear-gradient(90deg,#FF5C7A 0 7px,transparent 7px 14px); }
        `,
        stage: (() => {
          const body = `
            <div class="txt"><i class="m"></i><i></i><i class="s"></i></div>
            <div class="img"></div>
            <div class="txt"><i></i><i class="m"></i></div>`;
          const nav = `<div class="nav">Northwind Analytics<span>Product · Pricing · Docs</span></div>`;
          return `<div class="cmp">
            <div class="col">
              <div class="col__cap"><span class="dot dot--bad">✕</span>Other tools</div>
              <div class="paper">
                ${nav}${body}<div class="seam"></div>${nav}${body}<div class="seam"></div>${nav}
                <div class="txt"><i class="m"></i><i class="s"></i></div>
              </div>
            </div>
            <div class="col">
              <div class="col__cap"><span class="dot dot--good">✓</span>Tallshot</div>
              <div class="paper">
                ${nav}${body}${body}
                <div class="txt"><i class="m"></i><i></i><i class="s"></i></div>
                <div class="img"></div>
              </div>
            </div>
          </div>`;
        })(),
      }),
  },
  {
    name: '05-privacy',
    build: () =>
      page({
        title: 'No account. No uploads. No tracking.',
        sub: 'Tallshot asks for no site access at all, so Chrome shows no permission warning when you install it.',
        pills: ['Zero host permissions', 'No network code', 'Open source'],
        extraCss: `
          .cards { display:grid; grid-template-columns:repeat(2,1fr); gap:16px; width: 940px; }
          .c { background:rgba(255,255,255,.11); border:1px solid rgba(255,255,255,.2);
            border-radius:13px; padding:20px 22px; }
          .c h3 { font-size:15px; font-weight:650; display:flex; align-items:center; gap:9px; }
          .c h3 em { width:22px; height:22px; border-radius:6px; background:rgba(46,211,167,.3);
            display:grid; place-items:center; font-style:normal; font-size:13px; }
          .c p { margin-top:8px; font-size:13px; line-height:1.55; opacity:.85; }
          .perm { grid-column: span 2; background:#161A23; border-color:#333C4E; padding:0; overflow:hidden; }
          .perm__h { padding:13px 18px; border-bottom:1px solid #333C4E; font-size:13px; font-weight:650;
            display:flex; align-items:center; gap:10px; }
          .perm__h .mark { width:20px; height:20px; }
          .perm__b { padding:14px 18px; display:flex; gap:26px; align-items:center; }
          .perm__b ul { list-style:none; font-size:12.5px; color:#A6B0C3; }
          .perm__b li { padding:3px 0; display:flex; gap:8px; align-items:center; }
          .perm__b li b { color:#EEF1F7; font-weight:600; }
          .ok { color:#2ED3A7; font-weight:800; }
          .no { color:#FF5C7A; font-weight:800; }
        `,
        stage: `<div class="cards">
          <div class="c"><h3><em>✓</em>Processed on your device</h3>
            <p>Captures are stitched, edited and saved entirely inside your browser. There is no server to send them to.</p></div>
          <div class="c"><h3><em>✓</em>Nothing to sign up for</h3>
            <p>No account, no email, no licence key. Install it and press one key.</p></div>
          <div class="perm c">
            <div class="perm__h">${BRAND_MARK}What Tallshot asks for</div>
            <div class="perm__b">
              <ul>
                <li><span class="ok">✓</span><b>activeTab</b> — only the tab you ask it to capture</li>
                <li><span class="ok">✓</span><b>downloads</b> — to save your image</li>
                <li><span class="ok">✓</span><b>storage</b> — your settings, nothing else</li>
              </ul>
              <ul>
                <li><span class="no">✕</span>Read your data on all websites</li>
                <li><span class="no">✕</span>Browsing history</li>
                <li><span class="no">✕</span>Analytics or telemetry</li>
              </ul>
            </div>
          </div>
        </div>`,
      }),
  },
];

/** 440x280 small promo tile for the store listing. */
export const PROMO_SMALL = {
  name: 'promo-440x280',
  width: 440,
  height: 280,
  build: () => `<!doctype html><html><head><meta charset="utf-8"><style>
    * { box-sizing:border-box; margin:0; padding:0; }
    html, body { width:440px; height:280px; overflow:hidden; }
    body { font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      background: radial-gradient(420px 300px at 22% -12%, #8B6BFF 0%, #6B4CE8 46%, #4C33C4 100%);
      color:#fff; padding: 28px 30px; display:flex; flex-direction:column; justify-content:center; }
    .row { display:flex; align-items:center; gap:11px; }
    .mark { width:38px; height:38px; border-radius:9px; }
    .name { font-size:26px; font-weight:700; letter-spacing:-.022em; }
    h2 { margin-top:16px; font-size:19px; font-weight:600; line-height:1.28; letter-spacing:-.016em; max-width:19ch; }
    .p { margin-top:12px; display:flex; gap:7px; flex-wrap:wrap; }
    .p span { font-size:11px; font-weight:600; padding:5px 10px; border-radius:999px;
      background:rgba(255,255,255,.16); border:1px solid rgba(255,255,255,.26); }
  </style></head><body>
    <div class="row">${BRAND_MARK}<span class="name">Tallshot</span></div>
    <h2>Full-page screenshots that actually work</h2>
    <div class="p"><span>Free forever</span><span>No account</span><span>Nothing uploaded</span></div>
  </body></html>`,
};
