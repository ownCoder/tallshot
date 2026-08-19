/**
 * Tallshot — GitHub Pages generator.
 *
 * Renders PRIVACY.md and TERMS.md into the static site published at
 * https://owncoder.github.io/tallshot/.
 *
 * Generating rather than hand-writing the HTML means the published policy can
 * never drift from the source in the repository — which matters more than
 * usual here, because the whole product claim is "you can verify this".
 *
 * The output has no scripts, no external requests, no fonts and no trackers.
 * The page itself demonstrates the claim it makes.
 *
 * The Markdown subset supported is exactly what these two documents use:
 * headings, paragraphs, lists, tables, bold, italic, inline code, links,
 * horizontal rules and blockquotes. It is not a general-purpose parser and
 * does not need to be.
 *
 * Run: npm run pages
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const OUT_DIR = join(ROOT, 'privacy');

// ── Markdown → HTML ──────────────────────────────────────────────────────

const escapeHtml = (text) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * Parking slot for code-span contents while the rest of a line is processed.
 *
 * It has to be something that cannot occur in the source documents and that
 * survives HTML escaping unchanged. A plain numeric marker would not do — it
 * would happily match a figure in ordinary prose and corrupt it.
 */
const CODE_SENTINEL = String.fromCharCode(0);

/** Inline formatting. Code spans are pulled out first so their contents are
 *  never treated as markup. */
function inline(text) {
  const codeSpans = [];
  let out = text.replace(/`([^`]+)`/g, (_, code) => {
    codeSpans.push(code);
    return `${CODE_SENTINEL}${codeSpans.length - 1}${CODE_SENTINEL}`;
  });

  out = escapeHtml(out);

  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
    const external = /^https?:/.test(href);
    const rel = external ? ' target="_blank" rel="noopener noreferrer"' : '';
    return `<a href="${href}"${rel}>${label}</a>`;
  });

  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');

  const restore = new RegExp(`${CODE_SENTINEL}(\\d+)${CODE_SENTINEL}`, 'g');
  return out.replace(
    restore,
    (_, index) => `<code>${escapeHtml(codeSpans[Number(index)])}</code>`
  );
}

function renderTable(rows) {
  // rows[1] is the alignment separator, which carries no content.
  const cells = (row) =>
    row
      .replace(/^\||\|$/g, '')
      .split('|')
      .map((cell) => cell.trim());

  const head = cells(rows[0]);
  const body = rows.slice(2).map(cells);

  return (
    '<div class="table-wrap"><table><thead><tr>' +
    head.map((cell) => `<th>${inline(cell)}</th>`).join('') +
    '</tr></thead><tbody>' +
    body
      .map((row) => `<tr>${row.map((cell) => `<td>${inline(cell)}</td>`).join('')}</tr>`)
      .join('') +
    '</tbody></table></div>'
  );
}

function markdownToHtml(markdown) {
  const lines = markdown.split(/\r?\n/);
  const html = [];
  const paragraph = [];
  let i = 0;

  const flush = () => {
    if (paragraph.length) {
      html.push(`<p>${inline(paragraph.join(' '))}</p>`);
      paragraph.length = 0;
    }
  };

  const isBullet = (text) => /^[-*]\s+/.test(text) || /^\d+\.\s+/.test(text);

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      flush();
      i += 1;
      continue;
    }

    // Table — a header row followed by an alignment separator.
    if (line.startsWith('|') && /^\|[\s:|-]+\|$/.test(lines[i + 1] || '')) {
      flush();
      const rows = [];
      while (i < lines.length && lines[i].startsWith('|')) {
        rows.push(lines[i]);
        i += 1;
      }
      html.push(renderTable(rows));
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      flush();
      const level = heading[1].length;
      html.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      i += 1;
      continue;
    }

    if (/^-{3,}$/.test(line.trim())) {
      flush();
      html.push('<hr />');
      i += 1;
      continue;
    }

    if (line.startsWith('> ')) {
      flush();
      const quote = [];
      while (i < lines.length && lines[i].startsWith('> ')) {
        quote.push(lines[i].slice(2));
        i += 1;
      }
      html.push(`<blockquote>${inline(quote.join(' '))}</blockquote>`);
      continue;
    }

    if (isBullet(line)) {
      flush();
      const ordered = /^\d+\.\s+/.test(line);
      const items = [];
      while (i < lines.length && isBullet(lines[i])) {
        items.push(lines[i].replace(/^([-*]|\d+\.)\s+/, ''));
        i += 1;
      }
      const tag = ordered ? 'ol' : 'ul';
      html.push(
        `<${tag}>${items.map((item) => `<li>${inline(item)}</li>`).join('')}</${tag}>`
      );
      continue;
    }

    paragraph.push(line.trim());
    i += 1;
  }

  flush();
  return html.join('\n');
}

// ── Page shell ───────────────────────────────────────────────────────────

const MARK = `<svg class="mark" viewBox="0 0 32 32" aria-hidden="true">
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

const STYLE = `
  :root {
    --violet:#6B4CE8; --ink:#131722; --text2:#4E586B; --text3:#7A8497;
    --line:#E3E7F0; --surface:#F7F8FC; --bg:#fff;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --violet:#9B85FF; --ink:#EEF1F7; --text2:#A6B0C3; --text3:#6F7A8F;
      --line:#2A3242; --surface:#161A23; --bg:#0F1117;
    }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 0 24px 80px;
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    font-size: 16px; line-height: 1.65; color: var(--ink); background: var(--bg);
    -webkit-font-smoothing: antialiased;
  }
  .wrap { max-width: 760px; margin: 0 auto; }
  header.site {
    display: flex; align-items: center; justify-content: space-between;
    gap: 16px; padding: 28px 0 22px; border-bottom: 1px solid var(--line);
    margin-bottom: 34px; flex-wrap: wrap;
  }
  .brand { display: flex; align-items: center; gap: 11px; }
  .mark { width: 30px; height: 30px; border-radius: 7px; }
  .brand b { font-size: 19px; font-weight: 650; letter-spacing: -.015em; }
  nav.site { display: flex; gap: 18px; font-size: 14px; }
  nav.site a { color: var(--text2); text-decoration: none; }
  nav.site a:hover, nav.site a[aria-current] { color: var(--violet); }
  h1 { font-size: 32px; line-height: 1.18; letter-spacing: -.024em; margin: 0 0 6px; }
  h2 { font-size: 21px; letter-spacing: -.016em; margin: 40px 0 10px;
       padding-top: 18px; border-top: 1px solid var(--line); }
  h3 { font-size: 16.5px; margin: 26px 0 6px; }
  p { margin: 0 0 14px; }
  a { color: var(--violet); }
  ul, ol { margin: 0 0 16px; padding-left: 22px; }
  li { margin-bottom: 6px; }
  /* Section breaks are carried by the h2 top border; the rule itself would
     double it, so hr is reduced to spacing. */
  hr { border: 0; margin: 22px 0 0; }
  strong { font-weight: 640; }
  code {
    font-family: ui-monospace, "SF Mono", "Cascadia Mono", Consolas, monospace;
    font-size: .88em; padding: 2px 5px; border-radius: 4px;
    background: var(--surface); border: 1px solid var(--line);
  }
  blockquote {
    margin: 0 0 18px; padding: 14px 18px; border-radius: 10px;
    background: var(--surface); border: 1px solid var(--line);
    border-left: 3px solid var(--violet); color: var(--text2);
  }
  .table-wrap { overflow-x: auto; margin: 0 0 18px; }
  table { border-collapse: collapse; width: 100%; font-size: 14.5px; }
  th, td { text-align: left; padding: 9px 12px; border-bottom: 1px solid var(--line);
           vertical-align: top; }
  th { font-weight: 620; background: var(--surface); white-space: nowrap; }
  footer.site {
    margin-top: 52px; padding-top: 20px; border-top: 1px solid var(--line);
    font-size: 13.5px; color: var(--text3);
  }
  footer.site a { color: var(--text2); }
  :focus-visible { outline: 2px solid var(--violet); outline-offset: 2px; border-radius: 4px; }
`;

const FAVICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'" +
  "%3E%3Crect width='32' height='32' rx='7' fill='%236B4CE8'/%3E%3Crect x='10' y='4'" +
  " width='12' height='16' rx='2' fill='white'/%3E%3Cpath d='M16 21.5 L21 26.5 L11 26.5 Z'" +
  " fill='%23FFB020'/%3E%3C/svg%3E";

function shell({ title, description, body, current }) {
  const nav = [
    { href: './', label: 'Privacy policy', key: 'privacy' },
    { href: './terms.html', label: 'Terms of use', key: 'terms' },
    { href: 'https://github.com/ownCoder/tallshot', label: 'Source', key: 'source' },
  ];

  const navHtml = nav
    .map((item) => {
      const currentAttr = item.key === current ? ' aria-current="page"' : '';
      const relAttr =
        item.key === 'source' ? ' target="_blank" rel="noopener noreferrer"' : '';
      return `<a href="${item.href}"${currentAttr}${relAttr}>${item.label}</a>`;
    })
    .join('\n      ');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<meta name="description" content="${description}" />
<meta name="robots" content="index, follow" />
<meta name="color-scheme" content="light dark" />
<link rel="icon" href="${FAVICON}" />
<style>${STYLE}</style>
</head>
<body>
<div class="wrap">
  <header class="site">
    <div class="brand">${MARK}<b>Tallshot</b></div>
    <nav class="site">
      ${navHtml}
    </nav>
  </header>
  <main>
${body}
  </main>
  <footer class="site">
    <p>Tallshot is an independent project and is not affiliated with, endorsed by,
    or sponsored by Google LLC. Chrome is a trademark of Google LLC.</p>
    <p>This page contains no scripts, no trackers and no external requests —
    which is rather the point.</p>
  </footer>
</div>
</body>
</html>
`;
}

// ── Build ────────────────────────────────────────────────────────────────

mkdirSync(OUT_DIR, { recursive: true });

const pages = [
  {
    source: 'PRIVACY.md',
    out: 'index.html',
    current: 'privacy',
    title: 'Privacy Policy — Tallshot',
    description:
      'Tallshot collects no data. Everything happens on your device: no server, ' +
      'no account, no analytics, no tracking.',
  },
  {
    source: 'TERMS.md',
    out: 'terms.html',
    current: 'terms',
    title: 'Terms of Use — Tallshot',
    description: 'Terms of use for the Tallshot browser extension.',
  },
];

for (const page of pages) {
  const markdown = readFileSync(join(ROOT, page.source), 'utf8');
  const html = shell({
    title: page.title,
    description: page.description,
    body: markdownToHtml(markdown),
    current: page.current,
  });
  writeFileSync(join(OUT_DIR, page.out), html, 'utf8');
  console.log(
    `  privacy/${page.out}  ${(html.length / 1024).toFixed(1)} KB  (from ${page.source})`
  );
}

// GitHub Pages runs Jekyll by default, which ignores files it does not
// understand and can mangle output. .nojekyll disables it.
writeFileSync(join(OUT_DIR, '.nojekyll'), '', 'utf8');

console.log('\nWrote the GitHub Pages site to privacy/');
