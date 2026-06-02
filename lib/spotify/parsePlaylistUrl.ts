/** Spotify playlist IDs are 22-character base62 strings. */
const PLAYLIST_ID_PATTERN = /^[0-9A-Za-z]{22}$/;

function isValidPlaylistId(id: string): boolean {
  return PLAYLIST_ID_PATTERN.test(id);
}

/**
 * Extract a Spotify playlist ID from a URL or URI.
 *
 * Supported:
 * - https://open.spotify.com/playlist/{id}
 * - https://open.spotify.com/playlist/{id}?si=...
 * - spotify:playlist:{id}
 */
export function parseSpotifyPlaylistId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const uriMatch = trimmed.match(/^spotify:playlist:([0-9A-Za-z]{22})(?:\?.*)?$/i);
  if (uriMatch && isValidPlaylistId(uriMatch[1])) {
    return uriMatch[1];
  }

  try {
    const url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    if (host !== "open.spotify.com") return null;

    const pathMatch = url.pathname.match(/^\/playlist\/([0-9A-Za-z]{22})\/?$/i);
    if (pathMatch && isValidPlaylistId(pathMatch[1])) {
      return pathMatch[1];
    }
  } catch {
    return null;
  }

  return null;
}
