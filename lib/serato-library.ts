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

import { parseSeratoDatabase, parseSessionFilePaths, type SeratoTrack } from "@/lib/serato-parser";
import { parseTrackInfo, parseSeratoPlayCount } from "@/lib/id3-parser";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SeratoLibraryMeta = {
  lastScanned: number; // Unix timestamp ms
  trackCount: number;
};

export type ScanProgress = {
  phase: "reading" | "parsing" | "saving" | "done";
  tracksFound: number;
};

export type MusicFolderScanProgress = {
  phase: "listing" | "reading" | "saving" | "done";
  filesTotal: number;
  filesDone: number;
  tracksFound: number;
};

export type HistoryScanProgress = {
  phase: "listing" | "reading" | "saving" | "done";
  sessionsTotal: number;
  sessionsDone: number;
  playsFound: number;
};

// ─── IndexedDB setup ──────────────────────────────────────────────────────────

const DB_NAME = "showflow-serato";
// v2: added "track-picks" store for ShowFlow pick history
// v3: added "serato-plays" store for Serato session history play counts
const DB_VERSION = 3;

export function openDb(): Promise<IDBDatabase> {
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
      // v2: ShowFlow pick history — keyed by track ID
      if (!db.objectStoreNames.contains("track-picks")) {
        db.createObjectStore("track-picks", { keyPath: "trackId" });
      }
      // v3: Serato session play history — keyed by file path
      if (!db.objectStoreNames.contains("serato-plays")) {
        db.createObjectStore("serato-plays", { keyPath: "filePath" });
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

// ─── Serato session history ────────────────────────────────────────────────────

/**
 * Recursively collect all .session file handles from a directory tree.
 * Serato organises History as: History/ → [flat or date-named subfolders] → *.session
 */
async function collectSessionFiles(
  dir: FileSystemDirectoryHandle,
): Promise<FileSystemFileHandle[]> {
  const files: FileSystemFileHandle[] = [];
  // @ts-expect-error — entries() is available in Chrome 86+ (same requirement as showDirectoryPicker)
  for await (const [name, handle] of dir.entries()) {
    if (handle.kind === "file" && (name as string).endsWith(".session")) {
      files.push(handle as FileSystemFileHandle);
    } else if (handle.kind === "directory") {
      const sub = await collectSessionFiles(handle as FileSystemDirectoryHandle);
      files.push(...sub);
    }
  }
  return files;
}

/**
 * Scan Serato's History folder and count how many times each track was played.
 *
 * SAFETY: Only reads session files. Never writes to any Serato file.
 * Results are stored in ShowFlow's own IndexedDB ("serato-plays" store).
 *
 * @param seratoDir  - Read-only handle for the Serato root folder.
 * @param onProgress - Optional progress callback.
 * @returns Map<filePath, playCount> for all tracks found in history.
 */
export async function scanSeratoPlayHistory(
  seratoDir: FileSystemDirectoryHandle,
  onProgress?: (progress: HistoryScanProgress) => void,
): Promise<Map<string, number>> {
  // Navigate to History subfolder
  let historyDir: FileSystemDirectoryHandle;
  try {
    historyDir = await seratoDir.getDirectoryHandle("History");
  } catch {
    throw new Error(
      'Could not find a "History" folder inside your Serato directory. ' +
      'Make sure you selected the root Serato folder (~/Music/Serato).',
    );
  }

  onProgress?.({ phase: "listing", sessionsTotal: 0, sessionsDone: 0, playsFound: 0 });

  const sessionFiles = await collectSessionFiles(historyDir);
  const total = sessionFiles.length;

  if (total === 0) {
    throw new Error("No .session files found in Serato/History. Play some sets in Serato first.");
  }

  onProgress?.({ phase: "reading", sessionsTotal: total, sessionsDone: 0, playsFound: 0 });

  // Count play occurrences per file path
  const counts = new Map<string, number>();

  for (let i = 0; i < sessionFiles.length; i++) {
    try {
      const file = await sessionFiles[i].getFile();
      const buffer = await file.arrayBuffer();
      const paths = parseSessionFilePaths(buffer);
      for (const path of paths) {
        counts.set(path, (counts.get(path) ?? 0) + 1);
      }
    } catch {
      // Skip unreadable / corrupt session files
    }

    if (i % 10 === 0 || i === sessionFiles.length - 1) {
      onProgress?.({
        phase: "reading",
        sessionsTotal: total,
        sessionsDone: i + 1,
        playsFound: counts.size,
      });
    }
  }

  onProgress?.({ phase: "saving", sessionsTotal: total, sessionsDone: total, playsFound: counts.size });

  // Persist to IndexedDB
  const db = await openDb();
  await dbClear(db, "serato-plays");
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("serato-plays", "readwrite");
    const store = tx.objectStore("serato-plays");
    for (const [filePath, playCount] of counts) {
      store.put({ filePath, playCount });
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  // Also persist the scan timestamp
  await dbPut(db, "meta", { lastScanned: Date.now(), trackCount: counts.size }, "history-info");

  onProgress?.({ phase: "done", sessionsTotal: total, sessionsDone: total, playsFound: counts.size });

  return counts;
}

/** Load Serato play counts from IndexedDB. Returns Map<filePath, playCount>. */
export async function getSeratoPlayCounts(): Promise<Map<string, number>> {
  const db = await openDb();
  const records = await dbGetAll<{ filePath: string; playCount: number }>(db, "serato-plays");
  return new Map(records.map((r) => [r.filePath, r.playCount]));
}

/** Get the metadata for the last Serato history scan (if any). */
export async function getHistoryMeta(): Promise<{ lastScanned: number; trackCount: number } | undefined> {
  const db = await openDb();
  return dbGet<{ lastScanned: number; trackCount: number }>(db, "meta", "history-info");
}

// ─── Music folder (for ID3 play count reading) ────────────────────────────────

/**
 * Detect the common path prefix across all track file paths.
 * e.g. ["/Users/chris/Music/a.mp3", "/Users/chris/Music/b/c.mp3"] → "/Users/chris/Music"
 */
export function inferMusicRootPath(trackPaths: string[]): string {
  const nonEmpty = trackPaths.filter(Boolean);
  if (nonEmpty.length === 0) return "/";
  const parts = nonEmpty[0].split("/").filter(Boolean);
  let common = parts;
  for (const p of nonEmpty.slice(1)) {
    const pp = p.split("/").filter(Boolean);
    let i = 0;
    while (i < common.length && i < pp.length && common[i] === pp[i]) i++;
    common = common.slice(0, i);
    if (common.length === 0) break;
  }
  return "/" + common.join("/");
}

/**
 * Ask the user to select their music root folder and store the handle.
 * @param detectedRootPath - Inferred path prefix shown as a hint in the UI.
 */
export async function connectMusicFolder(
  _detectedRootPath?: string,
): Promise<FileSystemDirectoryHandle> {
  // @ts-expect-error — showDirectoryPicker is Chrome 86+
  const handle: FileSystemDirectoryHandle = await window.showDirectoryPicker({
    id: "music-library",
    mode: "read",
    startIn: "music",
  });
  const db = await openDb();
  await dbPut(db, "handles", handle, "musicDir");
  return handle;
}

/** Retrieve the stored music folder handle (if any). */
export async function getStoredMusicHandle(): Promise<FileSystemDirectoryHandle | undefined> {
  const db = await openDb();
  return dbGet<FileSystemDirectoryHandle>(db, "handles", "musicDir");
}

/**
 * Resolve an absolute track file path to a FileSystemFileHandle by traversing
 * from the music root handle.
 *
 * @param absolutePath  - Full path as stored in Serato (e.g. "/Users/chris/Music/a.mp3")
 * @param rootHandle    - FileSystemDirectoryHandle for the music root folder
 * @param rootPath      - The absolute path that rootHandle corresponds to
 */
async function resolveTrackFile(
  absolutePath: string,
  rootHandle: FileSystemDirectoryHandle,
  rootPath: string,
): Promise<FileSystemFileHandle | null> {
  // Compute path relative to root
  const normalRoot = rootPath.endsWith("/") ? rootPath : rootPath + "/";
  const relative = absolutePath.startsWith(normalRoot)
    ? absolutePath.slice(normalRoot.length)
    : absolutePath.replace(/^\//, "");

  const parts = relative.split("/").filter(Boolean);
  if (parts.length === 0) return null;

  let dir = rootHandle;
  for (let i = 0; i < parts.length - 1; i++) {
    try {
      dir = await dir.getDirectoryHandle(parts[i]);
    } catch {
      return null;
    }
  }
  try {
    return await dir.getFileHandle(parts[parts.length - 1]);
  } catch {
    return null;
  }
}

/**
 * Read the SERATO_PLAYCOUNT tag from a track's audio file.
 *
 * @param filePath   - Absolute path as stored in Serato
 * @param rootHandle - Music folder handle
 * @param rootPath   - Absolute path the handle corresponds to
 * @returns play count, or undefined if not found / not accessible
 */
export async function readTrackPlayCount(
  filePath: string,
  rootHandle: FileSystemDirectoryHandle,
  rootPath: string,
): Promise<number | undefined> {
  const fileHandle = await resolveTrackFile(filePath, rootHandle, rootPath);
  if (!fileHandle) return undefined;
  try {
    const file = await fileHandle.getFile();
    // Read only the first 128 KB — ID3 tags always appear at the start
    const slice = file.slice(0, 131072);
    const buffer = await slice.arrayBuffer();
    return parseSeratoPlayCount(buffer);
  } catch {
    return undefined;
  }
}

// ─── Music folder full scan ────────────────────────────────────────────────────

const AUDIO_EXTENSIONS = new Set([".mp3", ".aiff", ".aif", ".flac", ".wav", ".m4a", ".ogg", ".aac"]);

/** Recursively collect all audio file handles from a directory tree. */
async function collectAudioFiles(
  dir: FileSystemDirectoryHandle,
  basePath: string,
): Promise<Array<{ handle: FileSystemFileHandle; path: string }>> {
  const files: Array<{ handle: FileSystemFileHandle; path: string }> = [];
  // @ts-expect-error — entries() is available in Chrome 86+
  for await (const [name, handle] of dir.entries()) {
    const fullPath = `${basePath}/${name}`;
    if (handle.kind === "file") {
      const ext = name.slice(name.lastIndexOf(".")).toLowerCase();
      if (AUDIO_EXTENSIONS.has(ext)) {
        files.push({ handle: handle as FileSystemFileHandle, path: fullPath });
      }
    } else if (handle.kind === "directory" && !name.startsWith(".")) {
      // Skip hidden directories (e.g. .Serato analysis folders)
      const sub = await collectAudioFiles(handle as FileSystemDirectoryHandle, fullPath);
      files.push(...sub);
    }
  }
  return files;
}

/**
 * Scan the music folder directly — reads ID3 tags from every audio file
 * to build the track index including real Serato play counts.
 *
 * This replaces the Serato database scan. Slower upfront but gives you
 * accurate play counts and works independently of Serato's database.
 *
 * @param musicDir   - Read-only handle for the music root folder.
 * @param rootPath   - The absolute path musicDir corresponds to (for ID storage).
 * @param onProgress - Optional progress callback.
 */
export async function scanMusicFolder(
  musicDir: FileSystemDirectoryHandle,
  rootPath: string,
  onProgress?: (progress: MusicFolderScanProgress) => void,
): Promise<SeratoLibraryMeta> {
  onProgress?.({ phase: "listing", filesTotal: 0, filesDone: 0, tracksFound: 0 });

  const allFiles = await collectAudioFiles(musicDir, rootPath.replace(/\/$/, ""));
  const total = allFiles.length;

  onProgress?.({ phase: "reading", filesTotal: total, filesDone: 0, tracksFound: 0 });

  const tracks: SeratoTrack[] = [];
  const CONCURRENCY = 20;

  for (let i = 0; i < allFiles.length; i += CONCURRENCY) {
    const batch = allFiles.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map(async ({ handle, path }) => {
        const file = await handle.getFile();
        const slice = file.slice(0, 131072); // first 128 KB covers all ID3 tags
        const buffer = await slice.arrayBuffer();
        const info = parseTrackInfo(buffer);

        // Fall back to filename if no title tag
        const title = info.title || file.name.replace(/\.[^.]+$/, "");

        return {
          id: path,
          filePath: path,
          title,
          artist: info.artist,
          album: info.album,
          genre: undefined,
          bpm: info.bpm,
          key: info.key,
          durationMs: info.durationMs,
          ...(info.playCount !== undefined && { playCount: info.playCount }),
        } satisfies SeratoTrack;
      }),
    );

    for (const r of results) {
      if (r.status === "fulfilled") tracks.push(r.value);
    }

    onProgress?.({ phase: "reading", filesTotal: total, filesDone: Math.min(i + CONCURRENCY, total), tracksFound: tracks.length });
  }

  onProgress?.({ phase: "saving", filesTotal: total, filesDone: total, tracksFound: tracks.length });

  const db = await openDb();
  await dbClear(db, "tracks");
  await dbPutAllTracks(db, tracks);

  const meta: SeratoLibraryMeta = { lastScanned: Date.now(), trackCount: tracks.length };
  await dbPut(db, "meta", meta, "info");
  await dbPut(db, "meta", rootPath, "musicRootPath");

  onProgress?.({ phase: "done", filesTotal: total, filesDone: total, tracksFound: tracks.length });
  return meta;
}

/** Store the detected music root path string in meta. */
export async function saveMusicRootPath(rootPath: string): Promise<void> {
  const db = await openDb();
  await dbPut(db, "meta", rootPath, "musicRootPath");
}

/** Retrieve the stored music root path string. */
export async function getMusicRootPath(): Promise<string | undefined> {
  const db = await openDb();
  return dbGet<string>(db, "meta", "musicRootPath");
}

// ─── ShowFlow pick history ─────────────────────────────────────────────────────

type TrackPickRecord = { trackId: string; count: number; lastUsed: number };

/**
 * Increment the pick count for a track ID.
 * Called every time the DJ selects a specific version in the song checker.
 */
export async function recordTrackPick(trackId: string): Promise<void> {
  const db = await openDb();
  const existing = await dbGet<TrackPickRecord>(db, "track-picks", trackId);
  const next: TrackPickRecord = {
    trackId,
    count: (existing?.count ?? 0) + 1,
    lastUsed: Date.now(),
  };
  await dbPut(db, "track-picks", next);
}

/**
 * Load all ShowFlow pick counts as a Map<trackId, count>.
 * Only includes tracks that have been picked at least once.
 */
export async function getTrackPickCounts(): Promise<Map<string, number>> {
  const db = await openDb();
  const records = await dbGetAll<TrackPickRecord>(db, "track-picks");
  const map = new Map<string, number>();
  for (const r of records) {
    map.set(r.trackId, r.count);
  }
  return map;
}
