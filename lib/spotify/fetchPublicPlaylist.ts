/**
 * Server-only: fetch public Spotify playlist track previews.
 * Import only from server actions or other server-side code.
 */

import { getSpotifyAccessToken, spotifyApiGet } from "@/lib/spotify/clientCredentials";
import { parseSpotifyPlaylistId } from "@/lib/spotify/parsePlaylistUrl";
import type {
  FetchPublicSpotifyPlaylistResult,
  SpotifyFetchErrorCode,
  SpotifyPlaylistPreview,
  SpotifyPlaylistPreviewDebug,
  SpotifyPlaylistTrackPreview,
} from "@/lib/spotify/types";

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

type SpotifyPlaylistTracksWrappedPage = {
  tracks?: SpotifyPlaylistTracksPage;
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

function objectKeys(value: unknown): string[] {
  return value && typeof value === "object" ? Object.keys(value).slice(0, 12) : [];
}

function extractTracksPage(data: SpotifyPlaylistTracksPage | SpotifyPlaylistTracksWrappedPage): SpotifyPlaylistTracksPage | null {
  if (Array.isArray((data as SpotifyPlaylistTracksPage).items)) {
    return data as SpotifyPlaylistTracksPage;
  }

  const wrappedTracks = (data as SpotifyPlaylistTracksWrappedPage).tracks;
  if (wrappedTracks && Array.isArray(wrappedTracks.items)) {
    return wrappedTracks;
  }

  return null;
}

function createPlaylistPreviewDebug(): SpotifyPlaylistPreviewDebug {
  return {
    playlistId: null,
    metadataStatus: null,
    tracksStatus: null,
    metadataBodyPreview: null,
    tracksBodyPreview: null,
    parserDecisionPath: [],
    finalErrorCode: null,
    normalizedTrackCount: null,
  };
}

function withDebugFailure(
  code: SpotifyFetchErrorCode,
  message: string,
  debug: SpotifyPlaylistPreviewDebug | undefined,
): FetchPublicSpotifyPlaylistResult {
  if (debug) {
    debug.finalErrorCode = code;
    debug.normalizedTrackCount = null;
  }
  return {
    ok: false,
    code,
    message,
    ...(debug ? { debug } : {}),
  };
}

function withDebugSuccess(
  data: SpotifyPlaylistPreview,
  debug: SpotifyPlaylistPreviewDebug | undefined,
): FetchPublicSpotifyPlaylistResult {
  if (debug) {
    debug.finalErrorCode = null;
    debug.normalizedTrackCount = data.tracks.length;
  }
  return {
    ok: true,
    data,
    ...(debug ? { debug } : {}),
  };
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
  options?: { debug?: boolean },
): Promise<FetchPublicSpotifyPlaylistResult> {
  const debug = options?.debug ? createPlaylistPreviewDebug() : undefined;
  const recordDecision = (decision: string) => {
    debug?.parserDecisionPath.push(decision);
  };
  const trimmed = inputUrl.trim();
  recordDecision(trimmed ? "received_url" : "missing_url");
  const playlistId = parseSpotifyPlaylistId(trimmed);
  if (debug) debug.playlistId = playlistId;
  console.info("[spotify-playlist-preview] parsed playlist id", {
    playlistId,
    inputLength: trimmed.length,
  });
  if (!playlistId) {
    recordDecision("invalid_playlist_url");
    return withDebugFailure("invalid_url", "Please paste a valid Spotify playlist link.", debug);
  }
  recordDecision("parsed_playlist_id");

  const tokenResult = await getSpotifyAccessToken();
  console.info("[spotify-playlist-preview] Spotify token result", {
    ok: tokenResult.ok,
    code: tokenResult.ok ? undefined : tokenResult.code,
  });
  if (!tokenResult.ok) {
    const code = tokenResult.code === "missing_credentials" ? "missing_credentials" : "api_error";
    recordDecision(`token_failed:${tokenResult.code}`);
    return withDebugFailure(
      code,
      tokenResult.code === "missing_credentials"
        ? "Spotify credentials are not configured correctly."
        : tokenResult.message,
      debug,
    );
  }
  recordDecision("token_ok");

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
  if (debug) {
    debug.metadataStatus = metaResult.status;
    debug.metadataBodyPreview = metaResult.ok
      ? (metaResult.bodyPreview ?? null)
      : (metaResult.bodyPreview ?? spotifyDebugErrorBody(metaResult.errorBody) ?? null);
  }

  if (!metaResult.ok) {
    console.error("[spotify-playlist-preview] playlist metadata fetch error body", {
      playlistId,
      status: metaResult.status,
      errorBody: spotifyDebugErrorBody(metaResult.errorBody),
    });
    if (metaResult.status === 401) {
      recordDecision("metadata_401_credentials");
      return withDebugFailure(
        "missing_credentials",
        "Spotify credentials are not configured correctly.",
        debug,
      );
    }
    if (metaResult.status === 404 || metaResult.status === 403) {
      recordDecision(`metadata_unavailable:${metaResult.status}`);
      return withDebugFailure(
        "playlist_unavailable",
        "Playlist may be private or unavailable.",
        debug,
      );
    }
    if (metaResult.status === 200) {
      recordDecision("metadata_malformed_json");
      return withDebugFailure(
        "parser_error",
        "Spotify returned an unexpected playlist metadata response.",
        debug,
      );
    }
    recordDecision(`metadata_api_error:${metaResult.status}`);
    return withDebugFailure(
      "api_error",
      "Spotify could not load this playlist. Try again in a moment.",
      debug,
    );
  }
  recordDecision("metadata_ok");

  if (!metaResult.data || typeof metaResult.data !== "object") {
    recordDecision("metadata_shape:unrecognized");
    return withDebugFailure(
      "parser_error",
      "Spotify returned an unexpected playlist metadata response.",
      debug,
    );
  }
  recordDecision("metadata_shape:object");

  console.info("[spotify-playlist-preview] playlist metadata success summary", {
    playlistId,
    playlistName: metaResult.data.name ?? null,
    totalTracks: metaResult.data.tracks?.total ?? null,
    responseKeys: objectKeys(metaResult.data),
    tracksKeys: objectKeys(metaResult.data.tracks),
  });

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
    const pageResult = await spotifyApiGet<SpotifyPlaylistTracksPage | SpotifyPlaylistTracksWrappedPage>(pagePath, accessToken);
    console.info("[spotify-playlist-preview] playlist tracks fetch response", {
      playlistId,
      status: pageResult.status,
      ok: pageResult.ok,
      inspectedCount,
    });
    if (debug && debug.tracksStatus === null) {
      debug.tracksStatus = pageResult.status;
      debug.tracksBodyPreview = pageResult.ok
        ? (pageResult.bodyPreview ?? null)
        : (pageResult.bodyPreview ?? spotifyDebugErrorBody(pageResult.errorBody) ?? null);
    }

    if (!pageResult.ok) {
      console.error("[spotify-playlist-preview] playlist tracks fetch error body", {
        playlistId,
        status: pageResult.status,
        errorBody: spotifyDebugErrorBody(pageResult.errorBody),
      });
      if (pageResult.status === 401) {
        recordDecision("tracks_401_credentials");
        return withDebugFailure(
          "missing_credentials",
          "Spotify credentials are not configured correctly.",
          debug,
        );
      }
      if (pageResult.status === 404 || pageResult.status === 403) {
        recordDecision(`tracks_unavailable:${pageResult.status}`);
        return withDebugFailure(
          "playlist_unavailable",
          "Playlist may be private or unavailable.",
          debug,
        );
      }
      if (pageResult.status === 200) {
        recordDecision("tracks_malformed_json");
        return withDebugFailure(
          "parser_error",
          "Spotify returned an unexpected playlist tracks response.",
          debug,
        );
      }
      recordDecision(`tracks_api_error:${pageResult.status}`);
      return withDebugFailure(
        "api_error",
        "Spotify could not load playlist tracks. Try again in a moment.",
        debug,
      );
    }

    const tracksPage = extractTracksPage(pageResult.data);
    if (Array.isArray((pageResult.data as SpotifyPlaylistTracksPage).items)) {
      recordDecision("tracks_shape:top_level_items");
    } else if (Array.isArray((pageResult.data as SpotifyPlaylistTracksWrappedPage).tracks?.items)) {
      recordDecision("tracks_shape:nested_tracks_items");
    } else {
      recordDecision("tracks_shape:unrecognized");
    }
    console.info("[spotify-playlist-preview] playlist tracks success summary", {
      playlistId,
      responseKeys: objectKeys(pageResult.data),
      wrapperTracksKeys: objectKeys((pageResult.data as SpotifyPlaylistTracksWrappedPage).tracks),
      itemsIsArray: Boolean(tracksPage),
      itemsLength: tracksPage?.items?.length ?? null,
      firstItemKeys: objectKeys(tracksPage?.items?.[0]),
      firstTrackKeys: objectKeys(tracksPage?.items?.[0]?.track),
      nextType: typeof tracksPage?.next,
      total: tracksPage?.total ?? null,
    });

    if (!tracksPage) {
      return withDebugFailure(
        "parser_error",
        "Spotify returned an unexpected playlist tracks response.",
        debug,
      );
    }

    if (totalTrackCount === 0 && typeof tracksPage.total === "number") {
      totalTrackCount = tracksPage.total;
    }

    const items = tracksPage.items ?? [];
    for (const item of items) {
      if (inspectedCount >= SPOTIFY_PLAYLIST_PREVIEW_LIMIT) break;
      inspectedCount += 1;
      const normalized = normalizeTrack(item);
      if (normalized) tracks.push(normalized);
    }

    nextUrl = tracksPage.next ?? null;
  }

  const effectiveTotal = totalTrackCount || inspectedCount;
  recordDecision(`normalized_tracks:${tracks.length}`);
  recordDecision("success");

  return withDebugSuccess(
    {
      playlistId,
      playlistName,
      sourceUrl,
      totalTrackCount: effectiveTotal,
      tracks,
      skippedCount: Math.max(0, effectiveTotal - tracks.length),
      previewLimit: SPOTIFY_PLAYLIST_PREVIEW_LIMIT,
    },
    debug,
  );
}
