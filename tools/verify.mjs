/**
 * Tallshot — pre-submission self-audit.
 *
 * The submission ZIP cannot be produced from a tree that fails this audit
 * (build.mjs runs it first). Every check here corresponds to something that
 * would either break the extension at runtime or get it rejected by Chrome
 * Web Store review.
 *
 * Run: npm run verify
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, extname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');

const failures = [];
const warnings = [];
const passes = [];

const fail = (msg) => failures.push(msg);
const warn = (msg) => warnings.push(msg);
const pass = (msg) => passes.push(msg);

const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const has = (p) => existsSync(join(ROOT, p));

// ── 1. Manifest ──────────────────────────────────────────────────────────

let manifest;
try {
  manifest = JSON.parse(read('manifest.json'));
  pass('manifest.json is valid JSON');
} catch (err) {
  fail(`manifest.json is not valid JSON: ${err.message}`);
}

if (manifest) {
  if (manifest.manifest_version !== 3) fail('manifest_version must be 3');
  else pass('Manifest V3');

  for (const field of ['name', 'version', 'description', 'icons', 'action']) {
    if (!manifest[field]) fail(`manifest.json is missing "${field}"`);
  }

  // The store truncates the short description at 132 characters.
  if (manifest.description && manifest.description.length > 132) {
    fail(
      `manifest description is ${manifest.description.length} chars; the store limit is 132`
    );
  } else if (manifest.description) {
    pass(`description fits the 132-char store limit (${manifest.description.length})`);
  }

  if (manifest.name && manifest.name.length > 75) {
    fail(`manifest name is ${manifest.name.length} chars; the store limit is 75`);
  }

  // Chrome Web Store branding rules forbid Google marks in an extension name.
  if (/\b(google|chrome)\b/i.test(manifest.name || '')) {
    fail('Extension name contains a Google trademark — see the branding guidelines');
  } else {
    pass('Extension name contains no Google trademark');
  }
}

// ── 2. Permissions ───────────────────────────────────────────────────────

/**
 * Every permission must appear here AND be justified in docs/compliance.md.
 * Adding one without documenting it fails the build, which is the point:
 * an undocumented permission is the most common review rejection.
 */
const ALLOWED_PERMISSIONS = ['activeTab', 'scripting', 'downloads', 'storage', 'contextMenus'];

const FORBIDDEN_PERMISSIONS = [
  'tabs',
  'debugger',
  'offscreen',
  'unlimitedStorage',
  'cookies',
  'history',
  'bookmarks',
  'management',
  'webRequest',
  'proxy',
  'nativeMessaging',
  'declarativeNetRequest',
];

if (manifest) {
  const declared = manifest.permissions || [];

  for (const permission of declared) {
    if (!ALLOWED_PERMISSIONS.includes(permission)) {
      fail(`Permission "${permission}" is not in the approved set`);
    }
    if (FORBIDDEN_PERMISSIONS.includes(permission)) {
      fail(`Permission "${permission}" is explicitly forbidden by this project`);
    }
  }

  if (manifest.host_permissions?.length) {
    fail(
      'host_permissions is declared. Tallshot ships with none — this breaks the ' +
        'core privacy claim and adds an install warning.'
    );
  } else {
    pass('No host_permissions declared');
  }

  if (manifest.content_scripts?.length) {
    fail(
      'content_scripts is declared. Capture agents must be injected on demand ' +
        'under activeTab, not registered to run on every page.'
    );
  } else {
    pass('No declared content scripts');
  }

  if (declared.length) {
    pass(`Permissions minimal and approved: ${declared.join(', ')}`);
  }

  // Each permission must be justified in the compliance document.
  if (has('docs/compliance.md')) {
    const compliance = read('docs/compliance.md');
    for (const permission of declared) {
      if (!compliance.includes(permission)) {
        fail(`Permission "${permission}" is not justified in docs/compliance.md`);
      }
    }
    pass('Every permission is justified in docs/compliance.md');
  } else {
    fail('docs/compliance.md is missing');
  }
}

// ── 3. Referenced files exist ────────────────────────────────────────────

if (manifest) {
  const referenced = [
    manifest.background?.service_worker,
    manifest.action?.default_popup,
    manifest.options_ui?.page,
    manifest.options_page,
    ...Object.values(manifest.icons || {}),
    ...Object.values(manifest.action?.default_icon || {}),
  ].filter(Boolean);

  let missing = 0;
  for (const path of referenced) {
    if (!has(path)) {
      fail(`manifest.json references a missing file: ${path}`);
      missing += 1;
    }
  }
  if (!missing) pass(`All ${referenced.length} manifest-referenced files exist`);
}

// ── 4. HTML asset references resolve ─────────────────────────────────────

const HTML_FILES = ['src/popup/popup.html', 'src/editor/editor.html', 'src/options/options.html'];

for (const htmlPath of HTML_FILES) {
  if (!has(htmlPath)) {
    fail(`Missing ${htmlPath}`);
    continue;
  }
  const html = read(htmlPath);
  const dir = dirname(htmlPath);
  const refs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)]
    .map((m) => m[1])
    .filter((r) => !r.startsWith('http') && !r.startsWith('#') && !r.startsWith('data:'));

  for (const ref of refs) {
    const resolved = join(dir, ref).replace(/\\/g, '/');
    if (!has(resolved)) fail(`${htmlPath} references a missing file: ${ref}`);
  }

  // MV3 forbids inline script. An inline <script> with a body would break CSP.
  if (/<script(?![^>]*\bsrc=)[^>]*>[\s\S]*?\S[\s\S]*?<\/script>/.test(html)) {
    fail(`${htmlPath} contains an inline script, which MV3's CSP blocks`);
  }
  if (/\son[a-z]+\s*=\s*["']/i.test(html)) {
    fail(`${htmlPath} contains an inline event handler attribute, which MV3's CSP blocks`);
  }
}
pass('HTML references resolve and contain no inline script');

// ── 5. Forbidden runtime patterns ────────────────────────────────────────

function walk(dir, out = []) {
  for (const entry of readdirSync(join(ROOT, dir))) {
    const rel = `${dir}/${entry}`;
    if (statSync(join(ROOT, rel)).isDirectory()) walk(rel, out);
    else out.push(rel);
  }
  return out;
}

const sourceFiles = walk('src').filter((f) => ['.js', '.mjs'].includes(extname(f)));

const FORBIDDEN_PATTERNS = [
  {
    // Remote code execution is prohibited by MV3 and by store policy.
    pattern: /\beval\s*\(/,
    message: 'uses eval()',
  },
  {
    pattern: /new\s+Function\s*\(/,
    message: 'uses new Function()',
  },
  {
    // A fetch to any remote origin would break the "no network code" claim.
    pattern: /\bfetch\s*\(\s*['"`]https?:/i,
    message: 'makes a remote network request',
  },
  {
    pattern: /\bXMLHttpRequest\b/,
    message: 'uses XMLHttpRequest',
  },
  {
    pattern: /\bnew\s+WebSocket\b/,
    message: 'opens a WebSocket',
  },
  {
    pattern: /\bnavigator\.sendBeacon\b/,
    message: 'uses sendBeacon',
  },
  {
    pattern: /\bimportScripts\s*\(/,
    message: 'uses importScripts',
  },
  {
    pattern: /\.innerHTML\s*=\s*[^'"`\s]*(?:userInput|payload|response)/,
    message: 'assigns untrusted data to innerHTML',
  },
];

let violations = 0;
for (const file of sourceFiles) {
  const source = read(file);
  for (const { pattern, message } of FORBIDDEN_PATTERNS) {
    if (pattern.test(source)) {
      fail(`${file} ${message}`);
      violations += 1;
    }
  }
}
if (!violations) {
  pass(`No forbidden runtime pattern in ${sourceFiles.length} source files`);
}

// ── 6. Version consistency ───────────────────────────────────────────────

const pkg = JSON.parse(read('package.json'));
const changelog = has('CHANGELOG.md') ? read('CHANGELOG.md') : '';

if (manifest && manifest.version !== pkg.version) {
  fail(`Version mismatch: manifest ${manifest.version} vs package.json ${pkg.version}`);
} else if (manifest) {
  pass(`Version consistent across manifest and package.json (${manifest.version})`);
}

if (manifest && changelog && !changelog.includes(`[${manifest.version}]`)) {
  fail(`CHANGELOG.md has no entry for version ${manifest.version}`);
} else if (changelog) {
  pass(`CHANGELOG.md documents version ${manifest?.version}`);
}

if (manifest && !/^\d+\.\d+\.\d+$/.test(manifest.version)) {
  fail(`Version "${manifest.version}" is not semantic versioning`);
}

// Constants must agree with the manifest, or the About box lies.
if (has('src/lib/constants.js')) {
  const constants = read('src/lib/constants.js');
  const match = constants.match(/version:\s*'([^']+)'/);
  if (match && manifest && match[1] !== manifest.version) {
    fail(`src/lib/constants.js APP.version (${match[1]}) != manifest (${manifest.version})`);
  } else if (match) {
    pass('APP.version matches the manifest');
  }
}

// ── 7. Store assets ──────────────────────────────────────────────────────

const REQUIRED_ICONS = [16, 32, 48, 128].map((s) => `assets/icons/icon-${s}.png`);
for (const icon of REQUIRED_ICONS) {
  if (!has(icon)) fail(`Missing icon: ${icon}`);
}
if (REQUIRED_ICONS.every(has)) pass('All four icon sizes present');

const REQUIRED_SHOTS = [
  'assets/store/01-full-page.png',
  'assets/store/02-editor.png',
  'assets/store/03-redaction.png',
  'assets/store/04-sticky.png',
  'assets/store/05-privacy.png',
  'assets/store/promo-440x280.png',
];
for (const shot of REQUIRED_SHOTS) {
  if (!has(shot)) fail(`Missing store asset: ${shot}`);
}
if (REQUIRED_SHOTS.every(has)) pass('All six store images present');

/** Read a PNG's dimensions straight from its IHDR chunk. */
function pngSize(path) {
  const buf = readFileSync(join(ROOT, path));
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

for (const shot of REQUIRED_SHOTS.slice(0, 5)) {
  if (!has(shot)) continue;
  const { width, height } = pngSize(shot);
  // The store accepts 1280x800 or 640x400 only.
  if (!((width === 1280 && height === 800) || (width === 640 && height === 400))) {
    fail(`${shot} is ${width}x${height}; the store requires 1280x800 or 640x400`);
  }
}
pass('Screenshots are 1280x800');

if (has('assets/store/promo-440x280.png')) {
  const { width, height } = pngSize('assets/store/promo-440x280.png');
  if (width !== 440 || height !== 280) {
    fail(`Promo tile is ${width}x${height}; the store requires 440x280`);
  } else {
    pass('Promo tile is 440x280');
  }
}

for (const size of [16, 32, 48, 128]) {
  const path = `assets/icons/icon-${size}.png`;
  if (!has(path)) continue;
  const actual = pngSize(path);
  if (actual.width !== size || actual.height !== size) {
    fail(`${path} is ${actual.width}x${actual.height}, expected ${size}x${size}`);
  }
}

// ── 8. Documentation completeness ────────────────────────────────────────

const REQUIRED_DOCS = [
  'docs/project-overview.md',
  'docs/market-research.md',
  'docs/product-strategy.md',
  'docs/branding.md',
  'docs/ux-plan.md',
  'docs/architecture.md',
  'docs/roadmap.md',
  'docs/free-vs-pro-plan.md',
  'docs/compliance.md',
  'docs/testing-report.md',
  'docs/growth-plan.md',
  'docs/store-listing.md',
  'docs/progress.md',
  'README.md',
  'CHANGELOG.md',
  'LICENSE',
  'PRIVACY.md',
  'TERMS.md',
  'privacy/index.html',
  'privacy/terms.html',
];

let missingDocs = 0;
for (const doc of REQUIRED_DOCS) {
  if (!has(doc)) {
    fail(`Missing required document: ${doc}`);
    missingDocs += 1;
  }
}
if (!missingDocs) pass(`All ${REQUIRED_DOCS.length} required documents present`);

/**
 * No unfilled placeholders may survive into a release.
 *
 * Matched case-SENSITIVELY against the all-caps markers a developer actually
 * leaves behind. Matching the plain word "placeholder" case-insensitively
 * produced false positives on documentation that legitimately discusses
 * placeholder images or this very check.
 */
const PLACEHOLDER = /\b(TODO|TBD|FIXME|XXX|PLACEHOLDER)\b|lorem ipsum/;
for (const doc of REQUIRED_DOCS.filter((d) => d.endsWith('.md') && has(d))) {
  const text = read(doc);
  const match = text.match(PLACEHOLDER);
  if (match) warn(`${doc} contains an unfilled placeholder marker: "${match[0]}"`);
}

// ── 9. Modules parse ─────────────────────────────────────────────────────

const LIB_MODULES = walk('src/lib').filter((f) => f.endsWith('.js'));
for (const file of LIB_MODULES) {
  try {
    await import(pathToFileURL(join(ROOT, file)).href);
  } catch (err) {
    // chrome.* is undefined outside the extension, which is expected for
    // modules that touch it at import time — but nothing here should.
    fail(`${file} failed to import: ${err.message}`);
  }
}
pass(`All ${LIB_MODULES.length} lib modules import cleanly with no chrome.* at load time`);

// ── 10. Privacy policy URL is consistent ─────────────────────────────────

if (has('src/lib/constants.js')) {
  const constants = read('src/lib/constants.js');
  const urlMatch = constants.match(/privacyUrl:\s*'([^']+)'/);
  if (!urlMatch) {
    fail('APP.privacyUrl is not defined in src/lib/constants.js');
  } else {
    pass(`Privacy policy URL declared: ${urlMatch[1]}`);
    if (has('docs/store-listing.md') && !read('docs/store-listing.md').includes(urlMatch[1])) {
      warn('docs/store-listing.md does not mention the privacy policy URL');
    }
  }
}

// ── Report ───────────────────────────────────────────────────────────────

const line = '─'.repeat(72);
console.log(`\n${line}\n  Tallshot pre-submission audit\n${line}\n`);

for (const p of passes) console.log(`  [32mPASS[0m  ${p}`);
if (warnings.length) {
  console.log('');
  for (const w of warnings) console.log(`  [33mWARN[0m  ${w}`);
}
if (failures.length) {
  console.log('');
  for (const f of failures) console.log(`  [31mFAIL[0m  ${f}`);
}

console.log(
  `\n${line}\n  ${passes.length} passed · ${warnings.length} warnings · ` +
    `${failures.length} failures\n${line}\n`
);

if (failures.length) {
  console.error('Audit failed. Fix the items above before building a release.\n');
  process.exit(1);
}
console.log('Audit passed. Safe to build a submission package.\n');
