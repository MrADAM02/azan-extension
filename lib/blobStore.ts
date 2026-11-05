/** Tiny IndexedDB key/value store for user-uploaded files (azan audio, background image). */
export type BlobKey = 'azan' | 'azan-fajr' | 'background';

const DB = 'azan-tab';
const STORE = 'blobs';

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise<T>((resolve, reject) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }).finally(() => db.close());
}

export const getBlob = (k: BlobKey) => tx<Blob | undefined>('readonly', (s) => s.get(k));
export const putBlob = (k: BlobKey, b: Blob) => tx('readwrite', (s) => s.put(b, k)).then(() => undefined);
export const deleteBlob = (k: BlobKey) => tx('readwrite', (s) => s.delete(k)).then(() => undefined);
