/**
 * ID3v2 parser for DJ music libraries.
 *
 * Reads track metadata (title, artist, BPM, key, duration) and Serato's
 * proprietary play count tag (TXXX:SERATO_PLAYCOUNT) from audio files.
 *
 * READ ONLY — never modifies any data.
 * Supports: ID3v2.3, ID3v2.4 (most common in DJ libraries)
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type TrackInfo = {
  title: string;
  artist: string;
  album?: string;
  bpm?: string;
  key?: string;
  durationMs?: number;
  playCount?: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Decode a synchsafe integer (ID3v2.4 frame sizes). */
function decodeSynchsafe(b0: number, b1: number, b2: number, b3: number): number {
  return ((b0 & 0x7f) << 21) | ((b1 & 0x7f) << 14) | ((b2 & 0x7f) << 7) | (b3 & 0x7f);
}

/** Decode Latin-1 or UTF-8 bytes to a string, stopping at the first null byte. */
function decodeString(bytes: Uint8Array, start: number, end: number): string {
  let actual = end;
  for (let i = start; i < end; i++) {
    if (bytes[i] === 0) { actual = i; break; }
  }
  return new TextDecoder("utf-8").decode(bytes.slice(start, actual));
}

// ─── Core ID3v2 frame walker ───────────────────────────────────────────────────

/**
 * Walk all ID3v2 frames in a buffer, calling `onFrame` for each one found.
 * Returns false immediately if the buffer has no valid ID3 header.
 */
function walkId3Frames(
  buffer: ArrayBuffer,
  onFrame: (frameId: string, frameData: ArrayBuffer) => boolean /* return true to stop early */,
): boolean {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);

  if (bytes.length < 10) return false;
  if (bytes[0] !== 0x49 || bytes[1] !== 0x44 || bytes[2] !== 0x33) return false; // "ID3"

  const majorVersion = bytes[3];
  const tagSize = decodeSynchsafe(bytes[6], bytes[7], bytes[8], bytes[9]);
  const tagEnd = Math.min(10 + tagSize, bytes.length);

  let pos = 10;
  // Skip extended header (flag bit 6)
  if (bytes[5] & 0x40) {
    const extSize = majorVersion >= 4
      ? decodeSynchsafe(bytes[10], bytes[11], bytes[12], bytes[13])
      : view.getUint32(10, false);
    pos += extSize;
  }

  while (pos + 10 <= tagEnd) {
    const frameId = String.fromCharCode(bytes[pos], bytes[pos + 1], bytes[pos + 2], bytes[pos + 3]);
    if (frameId === "\0\0\0\0") break;

    const frameSize = majorVersion >= 4
      ? decodeSynchsafe(bytes[pos + 4], bytes[pos + 5], bytes[pos + 6], bytes[pos + 7])
      : view.getUint32(pos + 4, false);

    pos += 10;
    if (frameSize <= 0 || pos + frameSize > tagEnd) break;

    const frameData = buffer.slice(pos, pos + frameSize);
    if (onFrame(frameId, frameData)) return true;

    pos += frameSize;
  }
  return true;
}

// ─── Frame decoders ────────────────────────────────────────────────────────────

/** Decode a standard text frame (T*** frames): encoding byte + string content. */
function decodeTextFrame(frameData: ArrayBuffer): string {
  const bytes = new Uint8Array(frameData);
  if (bytes.length < 2) return "";
  const encoding = bytes[0];
  const data = frameData.slice(1);
  try {
    if (encoding === 1 || encoding === 2) {
      return new TextDecoder("utf-16le").decode(data).replace(/\0/g, "").trim();
    }
    return new TextDecoder("utf-8").decode(data).replace(/\0/g, "").trim();
  } catch {
    return "";
  }
}

/** Decode a TXXX frame; returns { description, value } or null. */
function decodeTxxxFrame(frameData: ArrayBuffer): { description: string; value: string } | null {
  const bytes = new Uint8Array(frameData);
  if (bytes.length < 3) return null;
  const encoding = bytes[0];

  if (encoding === 0 || encoding === 3) {
    // Latin-1 / UTF-8 — single-byte null
    let descEnd = 1;
    while (descEnd < bytes.length && bytes[descEnd] !== 0) descEnd++;
    const desc = new TextDecoder("utf-8").decode(bytes.slice(1, descEnd)).trim();
    const val = new TextDecoder("utf-8").decode(bytes.slice(descEnd + 1)).replace(/\0/g, "").trim();
    return { description: desc, value: val };
  } else {
    // UTF-16 — two-byte null
    const hasBom = bytes[1] === 0xff && bytes[2] === 0xfe;
    let descEnd = hasBom ? 3 : 1;
    while (descEnd + 1 < bytes.length && !(bytes[descEnd] === 0 && bytes[descEnd + 1] === 0)) {
      descEnd += 2;
    }
    try {
      const descBuf = frameData.slice(hasBom ? 3 : 1, descEnd);
      const desc = new TextDecoder("utf-16le").decode(descBuf).replace(/\0/g, "").trim();
      const valBuf = frameData.slice(descEnd + 2);
      const val = new TextDecoder("utf-16le").decode(valBuf).replace(/\0/g, "").trim();
      return { description: desc, value: val };
    } catch {
      return null;
    }
  }
}

// ─── Main exports ──────────────────────────────────────────────────────────────

/**
 * Parse an ArrayBuffer (first ~128 KB of an audio file) and return full
 * track metadata including Serato's play count.
 *
 * Returns an empty object if no ID3 header is found (e.g. AIFF without ID3).
 */
export function parseTrackInfo(buffer: ArrayBuffer): TrackInfo {
  const info: TrackInfo = { title: "", artist: "" };

  walkId3Frames(buffer, (frameId, frameData) => {
    switch (frameId) {
      case "TIT2": info.title  = decodeTextFrame(frameData); break;
      case "TPE1": info.artist = decodeTextFrame(frameData); break;
      case "TALB": { const v = decodeTextFrame(frameData); if (v) info.album = v; break; }
      case "TBPM": { const v = decodeTextFrame(frameData); if (v) info.bpm = v; break; }
      case "TKEY": { const v = decodeTextFrame(frameData); if (v) info.key = v; break; }
      case "TLEN": {
        const ms = parseInt(decodeTextFrame(frameData), 10);
        if (!isNaN(ms) && ms > 0) info.durationMs = ms;
        break;
      }
      case "TXXX": {
        const txxx = decodeTxxxFrame(frameData);
        if (txxx?.description === "SERATO_PLAYCOUNT") {
          const n = parseInt(txxx.value, 10);
          if (!isNaN(n) && n >= 0) info.playCount = n;
        }
        break;
      }
    }
    return false; // keep walking all frames
  });

  return info;
}

/**
 * Convenience wrapper — returns only the Serato play count from a buffer.
 * Kept for backward compatibility with any existing callers.
 */
export function parseSeratoPlayCount(buffer: ArrayBuffer): number | undefined {
  return parseTrackInfo(buffer).playCount;
}
