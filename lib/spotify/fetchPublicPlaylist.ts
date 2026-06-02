/**
 * Server-only: fetch public Spotify playlist track previews.
 * Import only from server actions or other server-side code.
 */

import { getSpotifyAccessToken, spotifyApiGet } from "@/lib/spotify/clientCredentials";
import { parseSpotifyPlaylistId } from "@/lib/spotify/parsePlaylistUrl";
import type { FetchPublicSpotifyPlaylistResult, SpotifyPlaylistTrackPreview } from "@/lib/spotify/types";

type SpotifyPlaylistMeta = {
  name?: string;
};

type SpotifyPlaylistTrackItem = {
  track: {
    id?: string;
    name?: string;
    type?: string;
    artists?: Array<{ name?: string }>;
  } | null;
};

type SpotifyPlaylistTracksPage = {
  items?: SpotifyPlaylistTrackItem[];
  next?: string | null;
};

function canonicalPlaylistUrl(playlistId: string): string {
  return `https://open.spotify.com/playlist/${playlistId}`;
}

function normalizeTrack(item: SpotifyPlaylistTrackItem): SpotifyPlaylistTrackPreview | null {
  const track = item.track;
  if (!track || track.type === "episode") return null;

  const spotifyTrackId = track.id?.trim();
  const title = track.name?.trim();
  if (!spotifyTrackId || !title) return null;

  const artistNames = (track.artists ?? [])
    .map((a) => a.name?.trim())
    .filter((name): name is string => Boolean(name));
  const artist = artistNames.length > 0 ? artistNames.join(", ") : "Unknown Artist";

  return { spotifyTrackId, title, artist };
}

/**
 * Fetch track previews for a public Spotify playlist URL or URI.
 * Uses Spotify client credentials (server env vars only).
 */
export async function fetchPublicSpotifyPlaylistPreview(
  inputUrl: string,
): Promise<FetchPublicSpotifyPlaylistResult> {
  const trimmed = inputUrl.trim();
  const playlistId = parseSpotifyPlaylistId(trimmed);
  if (!playlistId) {
    return {
      ok: false,
      code: "invalid_url",
      message: "Enter a valid Spotify playlist URL (open.spotify.com/playlist/… or spotify:playlist:…).",
    };
  }

  const tokenResult = await getSpotifyAccessToken();
  if (!tokenResult.ok) {
    return {
      ok: false,
      code: tokenResult.code === "missing_credentials" ? "missing_credentials" : "api_error",
      message: tokenResult.message,
    };
  }

  const accessToken = tokenResult.token;
  const sourceUrl = trimmed.startsWith("spotify:")
    ? canonicalPlaylistUrl(playlistId)
    : trimmed.startsWith("http")
      ? trimmed.split("?")[0] ?? canonicalPlaylistUrl(playlistId)
      : canonicalPlaylistUrl(playlistId);

  const metaResult = await spotifyApiGet<SpotifyPlaylistMeta>(
    `/playlists/${playlistId}?fields=name`,
    accessToken,
  );

  if (!metaResult.ok) {
    if (metaResult.status === 404 || metaResult.status === 403) {
      return {
        ok: false,
        code: "playlist_unavailable",
        message:
          "This playlist is private, unavailable, or could not be found. Public playlists only for now.",
      };
    }
    return {
      ok: false,
      code: "api_error",
      message: "Spotify could not load this playlist. Try again in a moment.",
    };
  }

  const playlistName = metaResult.data.name?.trim() || "Spotify playlist";
  const tracks: SpotifyPlaylistTrackPreview[] = [];
  let nextUrl: string | null = `/playlists/${playlistId}/tracks?limit=100`;

  while (nextUrl) {
    const pagePath: string = nextUrl;
    const pageResult = await spotifyApiGet<SpotifyPlaylistTracksPage>(pagePath, accessToken);

    if (!pageResult.ok) {
      if (pageResult.status === 404 || pageResult.status === 403) {
        return {
          ok: false,
          code: "playlist_unavailable",
          message:
            "This playlist is private, unavailable, or could not be found. Public playlists only for now.",
        };
      }
      return {
        ok: false,
        code: "api_error",
        message: "Spotify could not load playlist tracks. Try again in a moment.",
      };
    }

    for (const item of pageResult.data.items ?? []) {
      const normalized = normalizeTrack(item);
      if (normalized) tracks.push(normalized);
    }

    nextUrl = pageResult.data.next ?? null;
  }

  if (tracks.length === 0) {
    return {
      ok: false,
      code: "empty_playlist",
      message: "This playlist has no importable tracks.",
    };
  }

  return {
    ok: true,
    data: {
      playlistId,
      playlistName,
      sourceUrl,
      tracks,
      totalFetched: tracks.length,
    },
  };
}
