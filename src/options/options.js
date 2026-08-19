/**
 * Tallshot — options.
 *
 * Settings persist on change. There is no Save button, because a settings
 * page with a Save button is a settings page that loses your changes.
 */

import { APP, MSG, THEME } from '../lib/constants.js';
import { getSettings, setSettings, resetSettings } from '../lib/settings.js';
import { renderFilename, TOKENS } from '../lib/filename.js';

const el = {};
let settings = null;

init();

async function init() {
  cacheElements();
  settings = await getSettings();

  el.version.textContent = APP.version;
  el.privacyLink.href = APP.privacyUrl;
  el.termsLink.href = APP.termsUrl;
  el.sourceLink.href = APP.homepage;

  if (new URLSearchParams(location.search).has('welcome')) {
    el.welcome.hidden = false;
  }

  applyTheme(settings.theme);
  hydrate();
  buildTokens();
  wire();
  updateFilenamePreview();
}

function cacheElements() {
  const ids = [
    'welcome', 'afterCapture', 'captureDelay', 'hideSticky', 'preloadLazy',
    'defaultFormat', 'quality', 'qualityValue', 'pdfLayout', 'filenameTemplate',
    'filenamePreview', 'tokens', 'theme', 'openShortcuts', 'resetAll', 'saved',
    'version', 'privacyLink', 'termsLink', 'sourceLink',
  ];
  for (const id of ids) el[id] = document.getElementById(id);
}

function hydrate() {
  el.afterCapture.value = settings.afterCapture;
  el.captureDelay.value = String(settings.captureDelay);
  el.hideSticky.checked = settings.hideSticky;
  el.preloadLazy.checked = settings.preloadLazy;
  el.defaultFormat.value = settings.defaultFormat;
  el.quality.value = settings.quality;
  el.qualityValue.textContent = `${settings.quality}%`;
  el.pdfLayout.value = settings.pdfLayout;
  el.filenameTemplate.value = settings.filenameTemplate;
  el.theme.value = settings.theme;
}

function buildTokens() {
  el.tokens.innerHTML = '';
  for (const { token, description } of TOKENS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'token';
    button.textContent = token;
    button.title = description;
    // Clicking a token inserts it at the caret — faster than typing braces.
    button.addEventListener('click', () => {
      const input = el.filenameTemplate;
      const start = input.selectionStart ?? input.value.length;
      const end = input.selectionEnd ?? input.value.length;
      input.value = input.value.slice(0, start) + token + input.value.slice(end);
      input.focus();
      input.setSelectionRange(start + token.length, start + token.length);
      save({ filenameTemplate: input.value });
      updateFilenamePreview();
    });
    el.tokens.appendChild(button);
  }
}

function wire() {
  el.afterCapture.addEventListener('change', () => save({ afterCapture: el.afterCapture.value }));
  el.captureDelay.addEventListener('change', () =>
    save({ captureDelay: Number(el.captureDelay.value) })
  );
  el.hideSticky.addEventListener('change', () => save({ hideSticky: el.hideSticky.checked }));
  el.preloadLazy.addEventListener('change', () => save({ preloadLazy: el.preloadLazy.checked }));
  el.defaultFormat.addEventListener('change', () => {
    save({ defaultFormat: el.defaultFormat.value });
    updateFilenamePreview();
  });
  el.pdfLayout.addEventListener('change', () => save({ pdfLayout: el.pdfLayout.value }));

  el.quality.addEventListener('input', () => {
    el.qualityValue.textContent = `${el.quality.value}%`;
  });
  el.quality.addEventListener('change', () => save({ quality: Number(el.quality.value) }));

  el.filenameTemplate.addEventListener('input', updateFilenamePreview);
  el.filenameTemplate.addEventListener('change', () =>
    save({ filenameTemplate: el.filenameTemplate.value })
  );

  el.theme.addEventListener('change', () => {
    applyTheme(el.theme.value);
    save({ theme: el.theme.value });
  });

  el.openShortcuts.addEventListener('click', () => {
    // chrome://extensions/shortcuts cannot be opened with tabs.create from a
    // content context, but an extension page may navigate to it via update.
    chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
  });

  el.resetAll.addEventListener('click', async () => {
    settings = await resetSettings();
    hydrate();
    updateFilenamePreview();
    applyTheme(settings.theme);
    notifyWorker();
    flashSaved('Settings reset');
  });
}

async function save(patch) {
  settings = await setSettings(patch);
  notifyWorker();
  flashSaved();
}

function notifyWorker() {
  chrome.runtime.sendMessage({ type: MSG.SETTINGS_CHANGED }).catch(() => {});
}

/**
 * Show the user what their template will actually produce.
 * A filename template with no preview is a guessing game.
 */
function updateFilenamePreview() {
  const name = renderFilename(
    el.filenameTemplate.value,
    {
      url: 'https://example.com/pricing',
      title: 'Example — Pricing',
      width: 1440,
      height: 8320,
      mode: 'full',
    },
    el.defaultFormat.value
  );
  el.filenamePreview.textContent = `Preview: ${name}`;
}

let savedTimer = null;

function flashSaved(text = 'Saved') {
  el.saved.textContent = text;
  el.saved.hidden = false;
  clearTimeout(savedTimer);
  savedTimer = setTimeout(() => {
    el.saved.hidden = true;
  }, 1500);
}

function applyTheme(theme) {
  const dark =
    theme === THEME.DARK ||
    (theme === THEME.SYSTEM && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
}
