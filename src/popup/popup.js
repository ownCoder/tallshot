/**
 * Tallshot — popup.
 *
 * The popup exists to start a capture and then get out of the way. It holds
 * no state beyond one inline setting, and closes itself the moment a capture
 * begins so the user sees the page, not our UI.
 */

import { MODE, MSG, THEME, RESTRICTED_SCHEMES, RESTRICTED_HOSTS } from '../lib/constants.js';
import { getSettings, setSettings } from '../lib/settings.js';
import { isRestrictedUrl } from '../lib/errors.js';

const els = {
  full: document.getElementById('btnFull'),
  visible: document.getElementById('btnVisible'),
  region: document.getElementById('btnRegion'),
  options: document.getElementById('openOptions'),
  after: document.getElementById('afterCapture'),
  note: document.getElementById('note'),
};

init();

async function init() {
  const settings = await getSettings();
  applyTheme(settings.theme);
  els.after.value = settings.afterCapture;

  els.after.addEventListener('change', async () => {
    await setSettings({ afterCapture: els.after.value });
    chrome.runtime.sendMessage({ type: MSG.SETTINGS_CHANGED }).catch(() => {});
  });

  els.options.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
    window.close();
  });

  for (const [el, mode] of [
    [els.full, MODE.FULL],
    [els.visible, MODE.VISIBLE],
    [els.region, MODE.REGION],
  ]) {
    el.addEventListener('click', () => start(mode));
  }

  await guardRestrictedPage();
}

/**
 * Tell the user up front when Chrome forbids capture here.
 *
 * Checking before they click is the difference between an explanation and a
 * failure. The buttons are disabled rather than left to fail silently.
 */
async function guardRestrictedPage() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !isRestrictedUrl(tab.url, RESTRICTED_SCHEMES, RESTRICTED_HOSTS)) return;

  for (const el of [els.full, els.visible, els.region]) el.disabled = true;
  showNote(
    "Chrome doesn't allow extensions to capture this page. Open a normal " +
      'website and try again.',
    'error'
  );
}

function start(mode) {
  chrome.runtime.sendMessage({ type: MSG.CAPTURE_START, payload: { mode } }).catch(() => {});
  // Close immediately: the popup would otherwise sit on top of the page the
  // user is about to watch being captured.
  window.close();
}

function showNote(text, kind) {
  els.note.textContent = text;
  els.note.dataset.kind = kind || 'info';
  els.note.hidden = false;
}

function applyTheme(theme) {
  const dark =
    theme === THEME.DARK ||
    (theme === THEME.SYSTEM && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
}
