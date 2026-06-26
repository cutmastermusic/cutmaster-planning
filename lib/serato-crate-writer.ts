/**
 * Serato crate writer.
 *
 * SAFETY CONTRACT:
 *   - Reads: zero. This module never reads any Serato library file.
 *   - Writes: ONLY creates new .crate files in the Subcrates folder.
 *     It never overwrites existing files without explicit user confirmation,
 *     never modifies the Serato library database, and never touches any
 *     existing crate files.
 *   - The Subcrates folder handle is stored separately from the read-only
 *     library handle, with its own scoped readwrite permission.
 *
 * Crate format: same TLV binary format as database V2.
 *   vrsn  — version string (UTF-16 BE)
 *   otrk  — one per track, contains:
 *     pfil  — file path (UTF-16 BE)
 */

import type { SeratoTrack } from "@/lib/serato-parser";
import { openDb as openLibraryDb } from "@/lib/serato-library";

// ─── IndexedDB: Subcrates handle ─────────────────────────────────────────────

const SUBCRATES_HANDLE_KEY = "seratoSubcratesDir";

async function getDb(): Promise<IDBDatabase> {
  // Reuse the same "showflow-serato" database from serato-library.ts
  return openLibraryDb();
}

/** Store the Subcrates directory handle in IndexedDB. */
async function saveSubcratesHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("handles", "readwrite");
    const req = tx.objectStore("handles").put(handle, SUBCRATES_HANDLE_KEY);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/** Retrieve the stored Subcrates directory handle, if any. */
export async function getStoredSubcratesHandle(): Promise<FileSystemDirectoryHandle | undefined> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("handles", "readonly");
    const req = tx.objectStore("handles").get(SUBCRATES_HANDLE_KEY);
    req.onsuccess = () => resolve(req.result as FileSystemDirectoryHandle | undefined);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Ask the user to select their Serato Subcrates folder.
 * Requests READWRITE permission — scoped only to this subfolder,
 * not the whole Serato library.
 */
export async function connectSubcratesFolder(): Promise<FileSystemDirectoryHandle> {
  // @ts-expect-error — showDirectoryPicker is File System Access API (Chrome 86+)
  const handle: FileSystemDirectoryHandle = await window.showDirectoryPicker({
    id: "serato-subcrates",
    mode: "readwrite", // Write access — only for this folder, not the library
    startIn: "music",
  });
  await saveSubcratesHandle(handle);
  return handle;
}

/**
 * Ensure readwrite permission is active for the Subcrates handle.
 * Returns true if granted.
 */
export async function ensureWritePermission(handle: FileSystemDirectoryHandle): Promise<boolean> {
  // @ts-expect-error
  const status = await handle.queryPermission({ mode: "readwrite" });
  if (status === "granted") return true;
  // @ts-expect-error
  const requested = await handle.requestPermission({ mode: "readwrite" });
  return requested === "granted";
}

// ─── Binary encoding ──────────────────────────────────────────────────────────

/** Encode a string as UTF-16 big-endian with a null terminator. */
function encodeUtf16BE(str: string): Uint8Array {
  // Each char = 2 bytes; add one null char at end
  const bytes = new Uint8Array((str.length + 1) * 2);
  const view = new DataView(bytes.buffer);
  for (let i = 0; i < str.length; i++) {
    view.setUint16(i * 2, str.charCodeAt(i), false /* big-endian */);
  }
  view.setUint16(str.length * 2, 0, false); // null terminator
  return bytes;
}

/** Build a single TLV record: 4-byte tag + 4-byte BE length + data. */
function tlv(tag: string, data: Uint8Array): Uint8Array {
  const record = new Uint8Array(8 + data.byteLength);
  // Tag (4 ASCII bytes)
  for (let i = 0; i < 4; i++) record[i] = tag.charCodeAt(i);
  // Length (big-endian uint32)
  new DataView(record.buffer).setUint32(4, data.byteLength, false);
  // Data
  record.set(data, 8);
  return record;
}

/** Concatenate multiple Uint8Arrays into one. */
function concat(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.byteLength, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.byteLength;
  }
  return out;
}

// ─── Crate builder ────────────────────────────────────────────────────────────

const CRATE_VERSION = "1.0/Serato ScratchLive Crate\0\0";

/**
 * Build the binary content of a Serato .crate file.
 *
 * @param tracks - The tracks to include, in order.
 * @returns A Uint8Array containing the complete .crate file bytes.
 */
export function buildCrateBuffer(tracks: SeratoTrack[]): Uint8Array {
  // vrsn record
  const vrsn = tlv("vrsn", encodeUtf16BE(CRATE_VERSION));

  // otrk records (one per track — each wraps a pfil tag)
  const otrkRecords = tracks.map((track) => {
    const pfil = tlv("pfil", encodeUtf16BE(track.filePath));
    return tlv("otrk", pfil);
  });

  return concat(vrsn, ...otrkRecords);
}

// ─── File writing ─────────────────────────────────────────────────────────────

export type ExportResult =
  | { ok: true; fileName: string; trackCount: number }
  | { ok: false; error: string };

/**
 * Export a list of tracks as a Serato crate file.
 *
 * Writes a new .crate file to the user's Subcrates folder.
 * If a file with the same name already exists, appends a timestamp to avoid
 * overwriting it.
 *
 * @param crateName  - The crate name (used as the filename, without extension).
 * @param tracks     - Tracks to include in the crate.
 * @param subcratesDir - A readwrite FileSystemDirectoryHandle for Subcrates.
 */
export async function exportCrateFile(
  crateName: string,
  tracks: SeratoTrack[],
  subcratesDir: FileSystemDirectoryHandle,
): Promise<ExportResult> {
  if (tracks.length === 0) {
    return { ok: false, error: "No tracks to export." };
  }

  // Sanitize filename — remove characters that are invalid in filenames
  const safeName = crateName.trim().replace(/[/\\:*?"<>|]/g, "-") || "ShowFlow Crate";

  // Check if file already exists and append timestamp if so to avoid overwriting
  let fileName = `${safeName}.crate`;
  try {
    await subcratesDir.getFileHandle(fileName);
    // File exists — append timestamp
    const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    fileName = `${safeName} ${ts}.crate`;
  } catch {
    // File doesn't exist — great, use the original name
  }

  try {
    // Create the new file (never overwrites — we checked above)
    const fileHandle = await subcratesDir.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    const buffer = buildCrateBuffer(tracks);
    await writable.write(buffer.buffer as ArrayBuffer);
    await writable.close();

    return { ok: true, fileName, trackCount: tracks.length };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to write crate file.",
    };
  }
}

/**
 * Full export flow: get/connect Subcrates handle, ensure permission, write crate.
 * Prompts user to select Subcrates folder if not previously connected.
 */
export async function exportCrate(
  crateName: string,
  tracks: SeratoTrack[],
): Promise<ExportResult> {
  let handle = await getStoredSubcratesHandle();

  if (!handle) {
    try {
      handle = await connectSubcratesFolder();
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return { ok: false, error: "Cancelled — no folder selected." };
      }
      return { ok: false, error: "Could not connect to Subcrates folder." };
    }
  }

  const hasPermission = await ensureWritePermission(handle);
  if (!hasPermission) {
    // Permission denied — clear stored handle so next attempt re-prompts
    await saveSubcratesHandle(undefined as unknown as FileSystemDirectoryHandle);
    return { ok: false, error: "Permission denied. Please try again and approve folder access." };
  }

  return exportCrateFile(crateName, tracks, handle);
}
