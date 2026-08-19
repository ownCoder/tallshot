/**
 * Tallshot — capture blob store (IndexedDB).
 *
 * Why IndexedDB and not chrome.storage.local:
 *   - A stitched full-page capture is routinely 5-50MB. storage.local caps at
 *     ~10MB without the unlimitedStorage permission, which we refuse to ask
 *     for.
 *   - storage.local stores JSON, so an image would have to be base64'd —
 *     ~33% larger and slow to serialise. IndexedDB stores a Blob natively.
 *   - The MV3 service worker is killed when idle. A blob held in a worker
 *     variable disappears with it; a blob written to IndexedDB survives, which
 *     is what makes the editor open reliably every time.
 *
 * Records are transient by design: the editor deletes the one it loaded, and
 * anything older than the TTL is swept at worker startup. Nothing accumulates.
 */

import { LIMITS } from './constants.js';

const DB_NAME = 'tallshot';
const DB_VERSION = 1;
const STORE = 'captures';

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const os = db.createObjectStore(STORE, { keyPath: 'id' });
        os.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx(db, mode) {
  return db.transaction(STORE, mode).objectStore(STORE);
}

function wrap(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Generate a collision-proof id without pulling in a dependency. */
export function newCaptureId() {
  return `cap_${crypto.randomUUID()}`;
}

/**
 * Persist a capture.
 * @param {{id: string, blob: Blob, meta: object}} record
 */
export async function putCapture({ id, blob, meta }) {
  const db = await openDB();
  await wrap(
    tx(db, 'readwrite').put({
      id,
      blob,
      meta,
      createdAt: Date.now(),
    })
  );
  return id;
}

/** Read a capture by id, or null when it has expired or never existed. */
export async function getCapture(id) {
  if (!id) return null;
  const db = await openDB();
  const record = await wrap(tx(db, 'readonly').get(id));
  return record ?? null;
}

/** Delete a capture. Called by the editor once it has the pixels in hand. */
export async function deleteCapture(id) {
  if (!id) return;
  const db = await openDB();
  await wrap(tx(db, 'readwrite').delete(id));
}

/**
 * Remove records older than the TTL.
 *
 * Runs at service-worker startup. Guards against the one way records could
 * otherwise leak: a capture is written, then the user closes the editor tab
 * before it loads, so nothing ever deletes it.
 */
export async function sweepExpired(now = Date.now()) {
  const db = await openDB();
  const cutoff = now - LIMITS.CAPTURE_TTL_MS;
  const store = tx(db, 'readwrite');
  const index = store.index('createdAt');
  const range = IDBKeyRange.upperBound(cutoff);

  return new Promise((resolve, reject) => {
    let removed = 0;
    const req = index.openCursor(range);
    req.onsuccess = () => {
      const cursor = req.result;
      if (!cursor) {
        resolve(removed);
        return;
      }
      cursor.delete();
      removed += 1;
      cursor.continue();
    };
    req.onerror = () => reject(req.error);
  });
}
