/**
 * Tallshot — store screenshot generator.
 *
 * Renders the templates in screenshot-templates.mjs to 1280x800 PNGs using
 * headless Chrome, which is already installed on any machine that can test
 * this extension. No image library, no design tool, no manual export step —
 * the store assets regenerate from source like everything else.
 *
 * Run: npm run screenshots
 */

import { writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { TEMPLATES, PROMO_SMALL } from './screenshot-templates.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(HERE, '..', 'assets', 'store');
const TMP_DIR = join(HERE, '..', '.screenshot-tmp');

/** Chrome Web Store accepts 1280x800 or 640x400 screenshots. */
const WIDTH = 1280;
const HEIGHT = 800;

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  process.env.LOCALAPPDATA
    ? join(process.env.LOCALAPPDATA, 'Google\\Chrome\\Application\\chrome.exe')
    : null,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);

function findChrome() {
  for (const candidate of CHROME_CANDIDATES) {
    if (existsSync(candidate)) return candidate;
  }
  throw new Error(
    'Chrome not found. Set CHROME_PATH to your Chrome executable and re-run.'
  );
}

function shoot(chrome, htmlPath, outPath, width, height) {
  execFileSync(
    chrome,
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      '--default-background-color=00000000',
      `--window-size=${width},${height}`,
      `--screenshot=${outPath}`,
      pathToFileURL(htmlPath).href,
    ],
    { stdio: 'pipe', timeout: 60000 }
  );
}

const chrome = findChrome();
console.log(`Using Chrome: ${chrome}\n`);

mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(TMP_DIR, { recursive: true });

const jobs = [
  ...TEMPLATES.map((t) => ({ ...t, width: WIDTH, height: HEIGHT })),
  { ...PROMO_SMALL },
];

for (const job of jobs) {
  const htmlPath = resolve(TMP_DIR, `${job.name}.html`);
  const outPath = resolve(OUT_DIR, `${job.name}.png`);
  writeFileSync(htmlPath, job.build(), 'utf8');
  shoot(chrome, htmlPath, outPath, job.width ?? WIDTH, job.height ?? HEIGHT);
  console.log(`  ${job.name}.png  ${job.width ?? WIDTH}x${job.height ?? HEIGHT}`);
}

rmSync(TMP_DIR, { recursive: true, force: true });
console.log(`\nWrote ${jobs.length} store images to assets/store/`);
