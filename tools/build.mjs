/**
 * Tallshot — release builder.
 *
 * Produces the submission ZIP and assembles the entire `Store Upload/` folder,
 * so that submitting is "open one folder and go" rather than a scavenger hunt.
 *
 * The audit runs first and the build aborts if it fails, which is the point:
 * a non-compliant tree must not be able to produce a package.
 *
 * Run: npm run build   (or npm run release for the full pipeline)
 */

import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  rmSync,
  existsSync,
  readdirSync,
  statSync,
  copyFileSync,
} from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createZip } from './zip.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const UPLOAD_DIR = join(ROOT, 'Store Upload');

const manifest = JSON.parse(readFileSync(join(ROOT, 'manifest.json'), 'utf8'));

// ── 1. Audit gate ────────────────────────────────────────────────────────

console.log('Running pre-submission audit…\n');
try {
  execFileSync(process.execPath, [join(HERE, 'verify.mjs')], { stdio: 'inherit' });
} catch {
  console.error('\nBuild aborted: the audit must pass before a package is produced.\n');
  process.exit(1);
}

// ── 2. Collect runtime files ─────────────────────────────────────────────

/**
 * Only what the extension needs at runtime goes in the ZIP.
 * Documentation, build tooling, store assets and the Pages site are all
 * excluded — shipping them would bloat the package and expand the review
 * surface for no benefit.
 */
const INCLUDE_ROOTS = ['manifest.json', 'src', 'assets/icons', 'LICENSE'];

const EXCLUDE = [
  /(^|\/)\.git/,
  /(^|\/)node_modules(\/|$)/,
  /(^|\/)\.screenshot-tmp(\/|$)/,
  /(^|\/)Store Upload(\/|$)/,
  /(^|\/)docs(\/|$)/,
  /(^|\/)tools(\/|$)/,
  /(^|\/)privacy(\/|$)/,
  /(^|\/)assets\/store(\/|$)/,
  /\.map$/,
  /(^|\/)Thumbs\.db$/,
  /(^|\/)\.DS_Store$/,
];

const excluded = (relPath) => EXCLUDE.some((rx) => rx.test(relPath));

function collect(target, out = []) {
  const abs = join(ROOT, target);
  if (!existsSync(abs)) return out;
  if (statSync(abs).isFile()) {
    if (!excluded(target)) out.push(target);
    return out;
  }
  for (const entry of readdirSync(abs)) {
    collect(`${target}/${entry}`, out);
  }
  return out;
}

const files = INCLUDE_ROOTS.flatMap((root) => collect(root)).sort();

// ── 3. Write the ZIP ─────────────────────────────────────────────────────

mkdirSync(UPLOAD_DIR, { recursive: true });

const entries = files.map((name) => ({
  name,
  data: readFileSync(join(ROOT, name)),
}));

const zip = createZip(entries);
const zipPath = join(UPLOAD_DIR, 'Extension.zip');
writeFileSync(zipPath, zip);

const unpackedBytes = entries.reduce((sum, e) => sum + e.data.length, 0);

console.log(`\nPackaged ${entries.length} files`);
console.log(`  unpacked  ${(unpackedBytes / 1024).toFixed(1)} KB`);
console.log(`  zipped    ${(zip.length / 1024).toFixed(1)} KB`);
console.log(`  ->        Store Upload/Extension.zip`);

// ── 4. Assemble Store Upload/ ────────────────────────────────────────────

const ASSETS_DIR = join(UPLOAD_DIR, 'Store Assets');
const PRIVACY_DIR = join(UPLOAD_DIR, 'Privacy');

// Rebuilt from scratch every time so a renamed or deleted asset cannot linger.
for (const dir of [ASSETS_DIR, PRIVACY_DIR]) {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
}

const SCREENSHOT_NAMES = {
  '01-full-page.png': 'Screenshot 1 — Full page capture.png',
  '02-editor.png': 'Screenshot 2 — Editor.png',
  '03-redaction.png': 'Screenshot 3 — Blur and redaction.png',
  '04-sticky.png': 'Screenshot 4 — Sticky headers.png',
  '05-privacy.png': 'Screenshot 5 — Privacy.png',
  'promo-440x280.png': 'Promo tile 440x280.png',
};

for (const [source, target] of Object.entries(SCREENSHOT_NAMES)) {
  copyFileSync(join(ROOT, 'assets/store', source), join(ASSETS_DIR, target));
}

for (const size of [16, 32, 48, 128]) {
  copyFileSync(
    join(ROOT, `assets/icons/icon-${size}.png`),
    join(ASSETS_DIR, `icon-${size}.png`)
  );
}

copyFileSync(join(ROOT, 'docs/store-listing.md'), join(ASSETS_DIR, 'Store Listing Copy.md'));
copyFileSync(join(ROOT, 'PRIVACY.md'), join(PRIVACY_DIR, 'Privacy Policy.md'));
copyFileSync(join(ROOT, 'TERMS.md'), join(PRIVACY_DIR, 'Terms of Use.md'));
copyFileSync(join(ROOT, 'privacy/index.html'), join(PRIVACY_DIR, 'privacy-policy.html'));
copyFileSync(join(ROOT, 'privacy/terms.html'), join(PRIVACY_DIR, 'terms-of-use.html'));

const PRIVACY_URL = 'https://owncoder.github.io/tallshot/';
const TERMS_URL = 'https://owncoder.github.io/tallshot/terms.html';

writeFileSync(
  join(PRIVACY_DIR, 'Privacy Policy URL.txt'),
  [
    'Tallshot — Chrome Web Store submission URLs',
    '',
    'Paste this into the "Privacy policy URL" field on the Privacy practices tab:',
    '',
    `  ${PRIVACY_URL}`,
    '',
    'Terms of use (optional, may go in the listing description or support field):',
    '',
    `  ${TERMS_URL}`,
    '',
    'Support / issues URL:',
    '',
    '  https://github.com/ownCoder/tallshot/issues',
    '',
    'Homepage URL:',
    '',
    '  https://github.com/ownCoder/tallshot',
    '',
    'Both pages are served by GitHub Pages from the gh-pages branch of the',
    'ownCoder/tallshot repository. They are static HTML with no scripts and no',
    'external requests.',
    '',
  ].join('\n'),
  'utf8'
);

console.log(`\nAssembled Store Upload/`);
console.log(`  Extension.zip`);
console.log(`  Store Assets/   ${readdirSync(ASSETS_DIR).length} files`);
console.log(`  Privacy/        ${readdirSync(PRIVACY_DIR).length} files`);
console.log(`  Upload Guide.md`);
console.log(`\nVersion ${manifest.version} is ready to submit.\n`);
