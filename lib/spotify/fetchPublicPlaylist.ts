/**
 * Server-only: fetch public Spotify playlist track previews.
 * Import only from server actions or other server-side code.
 */

import { getSpotifyAccessToken, spotifyApiGet } from "@/lib/spotify/clientCredentials";
import { parseSpotifyPlaylistId } from "@/lib/spotify/parsePlaylistUrl";
import type { FetchPublicSpotifyPlaylistResult, SpotifyPlaylistTrackPreview } from "@/lib/spotify/types";

export { SPOTIFY_IMPORT_SIGN_IN_MESSAGE } from "@/lib/spotify/constants";

const SPOTIFY_PLAYLIST_PREVIEW_LIMIT = 100;
const SPOTIFY_DEBUG_BODY_LIMIT = 800;

type SpotifyImage = {
  url?: string;
  height?: number | null;
  width?: number | null;
};

type SpotifyPlaylistMeta = {
  id?: string;
  name?: string;
  tracks?: {
    total?: number;
  };
};

type SpotifyPlaylistTrackItem = {
  track: {
    id?: string;
    name?: string;
    type?: string;
    is_local?: boolean;
    artists?: Array<{ name?: string }>;
    album?: {
      name?: string;
      images?: SpotifyImage[];
    };
  } | null;
};

type SpotifyPlaylistTracksPage = {
  items?: SpotifyPlaylistTrackItem[];
  next?: string | null;
  total?: number;
};

function canonicalPlaylistUrl(playlistId: string): string {
  return `https://open.spotify.com/playlist/${playlistId}`;
}

function spotifyDebugErrorBody(errorBody: string | undefined): string | undefined {
  if (!errorBody) return undefined;
  return errorBody.length > SPOTIFY_DEBUG_BODY_LIMIT
    ? `${errorBody.slice(0, SPOTIFY_DEBUG_BODY_LIMIT)}…`
    : errorBody;
}

function normalizeTrack(item: SpotifyPlaylistTrackItem): SpotifyPlaylistTrackPreview | null {
  const track = item.track;
  if (!track || track.is_local || (track.type && track.type !== "track")) return null;

  const spotifyId = track.id?.trim();
  const title = track.name?.trim();
  if (!spotifyId || !title) return null;

  const artistNames = (track.artists ?? [])
    .map((a) => a.name?.trim())
    .filter((name): name is string => Boolean(name));
  const artist = artistNames.length > 0 ? artistNames.join(", ") : "Unknown Artist";
  const images = track.album?.images ?? [];

  return {
    spotifyId,
    title,
    artist,
    album: track.album?.name?.trim() ?? "",
    albumArt: images[0]?.url ?? null,
    albumArtSmall: images[images.length - 1]?.url ?? null,
    source: "spotify-playlist",
  };
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
  console.info("[spotify-playlist-preview] parsed playlist id", {
    playlistId,
    inputLength: trimmed.length,
  });
  if (!playlistId) {
    return {
      ok: false,
      code: "invalid_url",
      message: "Please paste a valid Spotify playlist link.",
    };
  }

  const tokenResult = await getSpotifyAccessToken();
  console.info("[spotify-playlist-preview] Spotify token result", {
    ok: tokenResult.ok,
    code: tokenResult.ok ? undefined : tokenResult.code,
  });
  if (!tokenResult.ok) {
    return {
      ok: false,
      code: tokenResult.code === "missing_credentials" ? "missing_credentials" : "api_error",
      message:
        tokenResult.code === "missing_credentials"
          ? "Spotify credentials are not configured correctly."
          : tokenResult.message,
    };
  }

  const accessToken = tokenResult.token;
  const sourceUrl = trimmed.startsWith("spotify:")
    ? canonicalPlaylistUrl(playlistId)
    : trimmed.startsWith("http")
      ? trimmed.split("?")[0] ?? canonicalPlaylistUrl(playlistId)
      : canonicalPlaylistUrl(playlistId);

  const metaResult = await spotifyApiGet<SpotifyPlaylistMeta>(
    `/playlists/${playlistId}?fields=id,name,tracks(total)`,
    accessToken,
  );
  console.info("[spotify-playlist-preview] playlist metadata fetch response", {
    playlistId,
    status: metaResult.status,
    ok: metaResult.ok,
  });

  if (!metaResult.ok) {
    console.error("[spotify-playlist-preview] playlist metadata fetch error body", {
      playlistId,
      status: metaResult.status,
      errorBody: spotifyDebugErrorBody(metaResult.errorBody),
    });
    if (metaResult.status === 401) {
      return {
        ok: false,
        code: "missing_credentials",
        message: "Spotify credentials are not configured correctly.",
      };
    }
    if (metaResult.status === 404 || metaResult.status === 403) {
      return {
        ok: false,
        code: "playlist_unavailable",
        message: "Playlist may be private or unavailable.",
      };
    }
    return {
      ok: false,
      code: "api_error",
      message: "Spotify could not load this playlist. Try again in a moment.",
    };
  }

  const playlistName = metaResult.data.name?.trim() || "Spotify playlist";
  let totalTrackCount = metaResult.data.tracks?.total ?? 0;
  const tracks: SpotifyPlaylistTrackPreview[] = [];
  let inspectedCount = 0;
  const pageParams = new URLSearchParams({
    limit: String(Math.min(SPOTIFY_PLAYLIST_PREVIEW_LIMIT, 100)),
    fields:
      "items(track(id,name,type,is_local,artists(name),album(name,images(url,height,width)))),next,total",
  });
  let nextUrl: string | null = `/playlists/${playlistId}/tracks?${pageParams.toString()}`;

  while (nextUrl && inspectedCount < SPOTIFY_PLAYLIST_PREVIEW_LIMIT) {
    const pagePath: string = nextUrl;
    const pageResult = await spotifyApiGet<SpotifyPlaylistTracksPage>(pagePath, accessToken);
    console.info("[spotify-playlist-preview] playlist tracks fetch response", {
      playlistId,
      status: pageResult.status,
      ok: pageResult.ok,
      inspectedCount,
    });

    if (!pageResult.ok) {
      console.error("[spotify-playlist-preview] playlist tracks fetch error body", {
        playlistId,
        status: pageResult.status,
        errorBody: spotifyDebugErrorBody(pageResult.errorBody),
      });
      if (pageResult.status === 401) {
        return {
          ok: false,
          code: "missing_credentials",
          message: "Spotify credentials are not configured correctly.",
        };
      }
      if (pageResult.status === 404 || pageResult.status === 403) {
        return {
          ok: false,
          code: "playlist_unavailable",
          message: "Playlist may be private or unavailable.",
        };
      }
      return {
        ok: false,
        code: "api_error",
        message: "Spotify could not load playlist tracks. Try again in a moment.",
      };
    }

    if (totalTrackCount === 0 && typeof pageResult.data.total === "number") {
      totalTrackCount = pageResult.data.total;
    }

    const items = pageResult.data.items ?? [];
    for (const item of items) {
      if (inspectedCount >= SPOTIFY_PLAYLIST_PREVIEW_LIMIT) break;
      inspectedCount += 1;
      const normalized = normalizeTrack(item);
      if (normalized) tracks.push(normalized);
    }

    nextUrl = pageResult.data.next ?? null;
  }

  const effectiveTotal = totalTrackCount || inspectedCount;

  return {
    ok: true,
    data: {
      playlistId,
      playlistName,
      sourceUrl,
      totalTrackCount: effectiveTotal,
      tracks,
      skippedCount: Math.max(0, effectiveTotal - tracks.length),
      previewLimit: SPOTIFY_PLAYLIST_PREVIEW_LIMIT,
    },
  };
}
