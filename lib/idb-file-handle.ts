/**
 * IndexedDB helpers for persisting FileSystemFileHandle objects across sessions.
 *
 * FileSystemFileHandle instances cannot be stored in localStorage (they are not
 * JSON-serializable), but IndexedDB supports structured clone, which can store them.
 *
 * This module is CLIENT-SIDE ONLY. Do not import it in Server Components or
 * Server Actions.
 *
 * Usage:
 *   await saveFileHandle(profileId, handle)   // store after first picker
 *   const h = await loadFileHandle(profileId) // retrieve on subsequent visits
 *   await clearFileHandle(profileId)           // unlink
 */

const DB_NAME = 'nuzlocke-save-sync'
const STORE = 'file-handles'
const VERSION = 1

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION)
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function saveFileHandle(key: string, handle: FileSystemFileHandle): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(handle, key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function loadFileHandle(key: string): Promise<FileSystemFileHandle | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).get(key)
    req.onsuccess = () => resolve((req.result as FileSystemFileHandle) ?? null)
    req.onerror = () => reject(req.error)
  })
}

export async function clearFileHandle(key: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}
