/**
 * Serato library management — READ ONLY for all Serato files.
 *
 * SAFETY CONTRACT:
 *   - The Serato folder is always opened with mode: "read" — write access
 *     is never requested for the library directory or its files.
 *   - This module never calls .createWritable(), .remove(), or any write
 *     method on Serato library handles.
 *   - The only writes this module performs are to ShowFlow's own IndexedDB,
 *     which is completely separate from the Serato library on disk.
 *
 * Storage layout (IndexedDB — "showflow-serato" database):
 *   - "tracks"  store : SeratoTrack[]  (the full indexed library)
 *   - "meta"    store : { lastScanned: number; trackCount: number }
 *   - "handles" store : { id: "seratoDir"; handle: FileSystemDirectoryHandle }
 */

import { parseSeratoDatabase, type SeratoTrack } from "@/lib/serato-parser";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SeratoLibraryMeta = {
  lastScanned: number; // Unix timestamp ms
  trackCount: number;
};

export type ScanProgress = {
  phase: "reading" | "parsing" | "saving" | "done";
  tracksFound: number;
};

// ─── IndexedDB setup ──────────────────────────────────────────────────────────

const DB_NAME = "showflow-serato";
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("tracks")) {
        db.createObjectStore("tracks", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("meta")) {
        db.createObjectStore("meta");
      }
      if (!db.objectStoreNames.contains("handles")) {
        db.createObjectStore("handles");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function dbGet<T>(db: IDBDatabase, store: string, key: IDBValidKey): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

function dbPut(db: IDBDatabase, store: string, value: unknown, key?: IDBValidKey): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    const req = key !== undefined
      ? tx.objectStore(store).put(value, key)
      : tx.objectStore(store).put(value);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function dbGetAll<T>(db: IDBDatabase, store: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => reject(req.error);
  });
}

function dbClear(db: IDBDatabase, store: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    const req = tx.objectStore(store).clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/** Batch-insert an array of tracks into the "tracks" store. */
function dbPutAllTracks(db: IDBDatabase, tracks: SeratoTrack[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("tracks", "readwrite");
    const store = tx.objectStore("tracks");
    for (const track of tracks) {
      store.put(track);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ─── File System Access API — READ ONLY ───────────────────────────────────────

/**
 * Ask the user to select their Serato folder.
 * Requests READ-ONLY permission — ShowFlow cannot write to the library.
 * Stores the directory handle in IndexedDB so it can be reused next session.
 */
export async function connectSeratoFolder(): Promise<FileSystemDirectoryHandle> {
  // @ts-expect-error — showDirectoryPicker is a living standard, present in Chrome 86+
  const handle: FileSystemDirectoryHandle = await window.showDirectoryPicker({
    id: "serato-library",
    mode: "read", // READ ONLY — we will never write to the Serato library
    startIn: "music",
  });

  const db = await openDb();
  await dbPut(db, "handles", handle, "seratoDir");
  return handle;
}

/**
 * Retrieve the previously stored Serato directory handle, if any.
 * Returns undefined if the user has never connected, or the handle is gone.
 */
export async function getStoredSeratoHandle(): Promise<FileSystemDirectoryHandle | undefined> {
  const db = await openDb();
  return dbGet<FileSystemDirectoryHandle>(db, "handles", "seratoDir");
}

/**
 * Verify that read permission is still granted for a stored handle.
 * If not granted, prompts the user to re-approve (no folder picker shown).
 * Returns true if permission is active.
 */
export async function ensureReadPermission(handle: FileSystemDirectoryHandle): Promise<boolean> {
  // @ts-expect-error — queryPermission is part of File System Access API
  const status = await handle.queryPermission({ mode: "read" });
  if (status === "granted") return true;
  // @ts-expect-error
  const requested = await handle.requestPermission({ mode: "read" });
  return requested === "granted";
}

// ─── Serato database file location ────────────────────────────────────────────

/** The filename Serato uses for its track database. */
const SERATO_DB_FILENAME = "database V2";

/**
 * Read the raw bytes of the Serato database V2 file — READ ONLY.
 * Never writes to or modifies any file in the Serato folder.
 */
async function readSeratoDatabaseFile(seratoDir: FileSystemDirectoryHandle): Promise<ArrayBuffer> {
  let fileHandle: FileSystemFileHandle;
  try {
    fileHandle = await seratoDir.getFileHandle(SERATO_DB_FILENAME);
  } catch {
    throw new Error(
      `Could not find "${SERATO_DB_FILENAME}" in the selected folder. ` +
      `Make sure you selected the "Serato" folder (usually ~/Music/Serato).`
    );
  }

  // getFile() returns a File object — purely a read operation.
  const file = await fileHandle.getFile();
  return file.arrayBuffer();
}

// ─── Scanning ─────────────────────────────────────────────────────────────────

/**
 * Scan the Serato library and index all tracks into IndexedDB.
 *
 * SAFETY: Only reads from the Serato folder. All writes go to ShowFlow's own
 * IndexedDB — completely separate from anything on the Serato library path.
 *
 * @param seratoDir - A read-only FileSystemDirectoryHandle for the Serato folder.
 * @param onProgress - Optional callback for scan progress updates.
 */
export async function scanSeratoLibrary(
  seratoDir: FileSystemDirectoryHandle,
  onProgress?: (progress: ScanProgress) => void,
): Promise<SeratoLibraryMeta> {
  onProgress?.({ phase: "reading", tracksFound: 0 });

  // Step 1: Read the database file (read-only)
  const buffer = await readSeratoDatabaseFile(seratoDir);

  onProgress?.({ phase: "parsing", tracksFound: 0 });

  // Step 2: Parse the binary format
  const tracks = parseSeratoDatabase(buffer);

  onProgress?.({ phase: "saving", tracksFound: tracks.length });

  // Step 3: Store in IndexedDB (ShowFlow's own storage — not the Serato library)
  const db = await openDb();
  await dbClear(db, "tracks");
  await dbPutAllTracks(db, tracks);

  const meta: SeratoLibraryMeta = {
    lastScanned: Date.now(),
    trackCount: tracks.length,
  };
  await dbPut(db, "meta", meta, "info");

  onProgress?.({ phase: "done", tracksFound: tracks.length });
  return meta;
}

// ─── Read from index ──────────────────────────────────────────────────────────

/** Load all indexed tracks from IndexedDB. */
export async function getIndexedTracks(): Promise<SeratoTrack[]> {
  const db = await openDb();
  return dbGetAll<SeratoTrack>(db, "tracks");
}

/** Load scan metadata (last scanned date, track count). */
export async function getLibraryMeta(): Promise<SeratoLibraryMeta | undefined> {
  const db = await openDb();
  return dbGet<SeratoLibraryMeta>(db, "meta", "info");
}

/** Returns true if the File System Access API is available in this browser. */
export function isFileSystemAccessSupported(): boolean {
  return typeof window !== "undefined" && "showDirectoryPicker" in window;
}
