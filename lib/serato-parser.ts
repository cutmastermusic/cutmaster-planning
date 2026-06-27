/**
 * Serato database V2 binary parser — READ ONLY.
 *
 * This module only parses data from the Serato library. It never writes,
 * modifies, or deletes any files. The Serato library is treated as a
 * read-only data source at all times.
 *
 * Format: Tag-Length-Value (TLV) records
 *   - 4 bytes  : ASCII tag name
 *   - 4 bytes  : data byte length (big-endian uint32)
 *   - N bytes  : data payload
 *
 * String fields are UTF-16 big-endian encoded.
 * Track records use tag "otrk" and contain nested TLV records.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type SeratoTrack = {
  /** Unique ID — derived from file path, falls back to title. */
  id: string;
  /** Absolute file path on disk. */
  filePath: string;
  /** Song title as stored in Serato. */
  title: string;
  /** Artist name. */
  artist: string;
  album?: string;
  genre?: string;
  /** BPM as a string (e.g. "128.00"). */
  bpm?: string;
  /** Musical key (e.g. "Am", "7A"). */
  key?: string;
  /** Track duration in milliseconds. */
  durationMs?: number;
  /** Play count as stored in Serato's database (may be undefined if not analyzed). */
  playCount?: number;
  /** All unknown tag names found on this track — for diagnostics/reverse engineering. */
  _unknownTags?: string[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Read a 4-byte ASCII tag from the buffer at the given offset. */
function readTag(buffer: ArrayBuffer, offset: number): string {
  const b = new Uint8Array(buffer, offset, 4);
  return String.fromCharCode(b[0], b[1], b[2], b[3]);
}

/**
 * Decode a UTF-16 big-endian string from an ArrayBuffer slice.
 * Stops at the first null character (U+0000).
 */
function decodeUtf16BE(buffer: ArrayBuffer): string {
  const view = new DataView(buffer);
  const charCount = Math.floor(buffer.byteLength / 2);
  let result = "";
  for (let i = 0; i < charCount; i++) {
    const cp = view.getUint16(i * 2, false /* big-endian */);
    if (cp === 0) break;
    result += String.fromCharCode(cp);
  }
  return result;
}

// ─── Inner track parser ────────────────────────────────────────────────────────

function parseTrackRecord(buffer: ArrayBuffer, start: number, end: number): SeratoTrack | null {
  const view = new DataView(buffer);
  let pos = start;

  let filePath = "";
  let title = "";
  let artist = "";
  let album: string | undefined;
  let genre: string | undefined;
  let bpm: string | undefined;
  let key: string | undefined;
  let durationMs: number | undefined;
  let playCount: number | undefined;
  const unknownTags: string[] = [];

  while (pos + 8 <= end) {
    const tag = readTag(buffer, pos);
    const len = view.getUint32(pos + 4, false);
    pos += 8;

    if (pos + len > end) break;

    // Slice out this field's bytes for decoding
    const fieldBuffer = buffer.slice(pos, pos + len);

    switch (tag) {
      case "pfil":
        filePath = decodeUtf16BE(fieldBuffer);
        break;
      case "tsng":
        title = decodeUtf16BE(fieldBuffer);
        break;
      case "tart":
        artist = decodeUtf16BE(fieldBuffer);
        break;
      case "talb": {
        const v = decodeUtf16BE(fieldBuffer);
        if (v) album = v;
        break;
      }
      case "tgen": {
        const v = decodeUtf16BE(fieldBuffer);
        if (v) genre = v;
        break;
      }
      case "tbpm": {
        const v = decodeUtf16BE(fieldBuffer);
        if (v) bpm = v;
        break;
      }
      case "tkey": {
        const v = decodeUtf16BE(fieldBuffer);
        if (v) key = v;
        break;
      }
      case "tlen": {
        const ms = parseInt(decodeUtf16BE(fieldBuffer), 10);
        if (!isNaN(ms) && ms > 0) durationMs = ms;
        break;
      }
      // Play count — "bply" confirmed present in Serato database V2 via _unknownTags inspection.
      // "utpc" is the last-played unix timestamp (not a count, kept for future use).
      case "bply":
      case "plyc":
      case "nply": {
        const v = parseInt(decodeUtf16BE(fieldBuffer), 10);
        if (!isNaN(v) && v >= 0) playCount = v;
        break;
      }
      default:
        // Collect unknown tag names (first 20 per track) for diagnostics.
        if (unknownTags.length < 20) unknownTags.push(tag);
        break;
    }

    pos += len;
  }

  // Skip tracks with no usable data
  if (!filePath && !title) return null;

  return {
    id: filePath || title,
    filePath,
    title,
    artist,
    album,
    genre,
    bpm,
    key,
    durationMs,
    ...(playCount !== undefined && { playCount }),
    ...(unknownTags.length > 0 && { _unknownTags: unknownTags }),
  };
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Parse a Serato "database V2" file and return all tracks.
 *
 * @param buffer - The raw ArrayBuffer contents of the database V2 file.
 *                 This module never requests, writes, or modifies any file —
 *                 the caller is responsible for reading the file in read-only mode.
 */
export function parseSeratoDatabase(buffer: ArrayBuffer): SeratoTrack[] {
  const view = new DataView(buffer);
  const tracks: SeratoTrack[] = [];
  const total = buffer.byteLength;
  let offset = 0;

  while (offset + 8 <= total) {
    const tag = readTag(buffer, offset);
    const len = view.getUint32(offset + 4, false);
    offset += 8;

    if (offset + len > total) break;

    if (tag === "otrk") {
      const track = parseTrackRecord(buffer, offset, offset + len);
      if (track) tracks.push(track);
    }
    // "vrsn" and all other top-level tags are skipped — we only care about tracks.

    offset += len;
  }

  return tracks;
}

// ─── Session history parser ───────────────────────────────────────────────────

/**
 * Parse a Serato ".session" history file and return every played track's file path.
 *
 * Session files use the same TLV format as database V2. The outer tag for each
 * track record is "otrk" (same as the main database), and the file path is "pfil".
 * We only care about paths — all other fields are skipped.
 *
 * READ ONLY — this function never modifies any data.
 */
export function parseSessionFilePaths(buffer: ArrayBuffer): string[] {
  const view = new DataView(buffer);
  const paths: string[] = [];
  const total = buffer.byteLength;
  let offset = 0;

  while (offset + 8 <= total) {
    const tag = readTag(buffer, offset);
    const len = view.getUint32(offset + 4, false);
    offset += 8;

    if (offset + len > total) break;

    if (tag === "otrk") {
      // Walk nested TLV fields looking for pfil
      let pos = offset;
      const end = offset + len;
      while (pos + 8 <= end) {
        const innerTag = readTag(buffer, pos);
        const innerLen = view.getUint32(pos + 4, false);
        pos += 8;
        if (pos + innerLen > end) break;
        if (innerTag === "pfil") {
          const path = decodeUtf16BE(buffer.slice(pos, pos + innerLen));
          if (path) paths.push(path);
          break; // Only one pfil per track — stop scanning this otrk
        }
        pos += innerLen;
      }
    }
    // "vrsn" and all other top-level tags are skipped

    offset += len;
  }

  return paths;
}

// ─── Normalisation helpers (used by matching layer) ───────────────────────────

/**
 * Normalize a string for fuzzy matching:
 * lowercase, strip punctuation, collapse whitespace.
 */
export function normalizeForMatch(str: string): string {
  return str
    .toLowerCase()
    .replace(/[''"`]/g, "") // remove quotes/apostrophes
    .replace(/[^a-z0-9\s]/g, " ") // non-alphanumeric → space
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Score how well a track matches a query (title + optional artist).
 * Returns a number 0–3:
 *   3 = exact title + artist match
 *   2 = exact title match, OR track title starts with query title (remix/version prefix)
 *   1 = title contains query or query contains title (loose)
 *   0 = no meaningful match
 */
export function matchScore(
  track: SeratoTrack,
  queryTitle: string,
  queryArtist?: string,
): number {
  const normTitle = normalizeForMatch(track.title);
  const normArtist = normalizeForMatch(track.artist);
  const qTitle = normalizeForMatch(queryTitle);
  const qArtist = queryArtist ? normalizeForMatch(queryArtist) : "";

  // Score 3: exact title + artist
  if (normTitle === qTitle) {
    if (qArtist && normArtist === qArtist) return 3;
    return 2;
  }

  // Score 2: track title starts with the query title followed by a non-alphanumeric
  // character — catches remixes like "Mr. Brightside (Deville Edit)" or "[Intro] Clean".
  // The word-boundary check prevents "Loving You" from matching "Love".
  if (normTitle.startsWith(qTitle)) {
    const charAfter = normTitle[qTitle.length] ?? "";
    if (charAfter === "" || /[^a-z0-9]/.test(charAfter)) {
      if (qArtist && normArtist === qArtist) return 3;
      return 2;
    }
  }

  // Score 1: loose contains match (filtered out by default MIN_SCORE=2)
  if (normTitle.includes(qTitle) || qTitle.includes(normTitle)) return 1;
  return 0;
}
