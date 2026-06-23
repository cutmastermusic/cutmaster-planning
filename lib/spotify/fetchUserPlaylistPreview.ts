/**
 * Server-only: fetch Spotify playlist previews with a connected user's access token.
 */
import { spotifyApiGet } from "@/lib/spotify/clientCredentials";
import { parseSpotifyPlaylistId } from "@/lib/spotify/parsePlaylistUrl";
import {
  recordSpotifyPreviewDecision,
  type SpotifyPlaylistPreviewDebugInfo,
} from "@/lib/spotify/playlistPreviewDebug";
import type {
  FetchPublicSpotifyPlaylistResult,
  SpotifyPlaylistPreview,
  SpotifyPlaylistTrackPreview,
} from "@/lib/spotify/types";

const SPOTIFY_PLAYLIST_PREVIEW_LIMIT = 100;

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

function normalizeTrack(item: SpotifyPlaylistTrackItem): SpotifyPlaylistTrackPreview | null {
  const track = item.track;
  if (!track || track.is_local || (track.type && track.type !== "track")) return null;

  const spotifyId = track.id?.trim();
  const title = track.name?.trim();
  if (!spotifyId || !title) return null;

  const artistNames = (track.artists ?? [])
    .map((artist) => artist.name?.trim())
    .filter((artist): artist is string => Boolean(artist));
  const images = track.album?.images ?? [];

  return {
    spotifyId,
    title,
    artist: artistNames.length > 0 ? artistNames.join(", ") : "Unknown Artist",
    album: track.album?.name?.trim() ?? "",
    albumArt: images[0]?.url ?? null,
    albumArtSmall: images[images.length - 1]?.url ?? null,
    source: "spotify-playlist",
  };
}

function success(data: SpotifyPlaylistPreview): FetchPublicSpotifyPlaylistResult {
  return { ok: true, data };
}

function failure(
  code: Exclude<FetchPublicSpotifyPlaylistResult, { ok: true }>["code"],
  message: string,
  debug?: SpotifyPlaylistPreviewDebugInfo,
): FetchPublicSpotifyPlaylistResult {
  if (debug) {
    debug.finalErrorCode = code;
    debug.normalizedTrackCount = null;
  }
  return { ok: false, code, message };
}

function failureFromStatus(params: {
  status: number;
  unavailableMessage: string;
  apiMessage: string;
  debug?: SpotifyPlaylistPreviewDebugInfo;
}): FetchPublicSpotifyPlaylistResult {
  if (params.status === 401) {
    return failure("missing_credentials", "Reconnect Spotify and try again.", params.debug);
  }
  if (params.status === 403 || params.status === 404) {
    return failure("playlist_unavailable", params.unavailableMessage, params.debug);
  }
  return failure("api_error", params.apiMessage, params.debug);
}

export async function fetchUserSpotifyPlaylistPreview(params: {
  inputUrl: string;
  accessToken: string;
  debug?: SpotifyPlaylistPreviewDebugInfo;
}): Promise<FetchPublicSpotifyPlaylistResult> {
  const { debug } = params;
  const trimmed = params.inputUrl.trim();
  recordSpotifyPreviewDecision(debug, trimmed ? "received_url" : "missing_url");
  const playlistId = parseSpotifyPlaylistId(trimmed);
  if (debug) {
    debug.parsedPlaylistId = playlistId;
  }
  if (!playlistId) {
    recordSpotifyPreviewDecision(debug, "invalid_playlist_url");
    return failure("invalid_url", "Please paste a valid Spotify playlist link.", debug);
  }
  recordSpotifyPreviewDecision(debug, "parsed_playlist_id");

  const sourceUrl = trimmed.startsWith("spotify:")
    ? canonicalPlaylistUrl(playlistId)
    : trimmed.startsWith("http")
      ? (trimmed.split("?")[0] ?? canonicalPlaylistUrl(playlistId))
      : canonicalPlaylistUrl(playlistId);

  const metaResult = await spotifyApiGet<SpotifyPlaylistMeta>(
    `/playlists/${playlistId}?fields=id,name,tracks(total)`,
    params.accessToken,
  );
  if (debug) {
    debug.metadataStatus = metaResult.status;
    debug.metadataBodyPreview = metaResult.bodyPreview ?? null;
  }
  if (!metaResult.ok) {
    recordSpotifyPreviewDecision(debug, `metadata_error:${metaResult.status}`);
    return failureFromStatus({
      status: metaResult.status,
      unavailableMessage: "Playlist may be private or unavailable to this Spotify account.",
      apiMessage: "Spotify could not load this playlist. Try again in a moment.",
      debug,
    });
  }
  recordSpotifyPreviewDecision(debug, "metadata_ok");

  if (!metaResult.data || typeof metaResult.data !== "object") {
    recordSpotifyPreviewDecision(debug, "metadata_shape:unrecognized");
    return failure("parser_error", "Spotify returned an unexpected playlist metadata response.", debug);
  }
  recordSpotifyPreviewDecision(debug, "metadata_shape:object");

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
    const pageResult = await spotifyApiGet<SpotifyPlaylistTracksPage>(pagePath, params.accessToken);
    if (debug && debug.tracksStatus === null) {
      debug.tracksStatus = pageResult.status;
      debug.tracksBodyPreview = pageResult.bodyPreview ?? null;
    }
    if (!pageResult.ok) {
      recordSpotifyPreviewDecision(debug, `tracks_error:${pageResult.status}`);
      return failureFromStatus({
        status: pageResult.status,
        unavailableMessage: "Playlist may be private or unavailable to this Spotify account.",
        apiMessage: "Spotify could not load playlist tracks. Try again in a moment.",
        debug,
      });
    }

    if (!pageResult.data || !Array.isArray(pageResult.data.items)) {
      recordSpotifyPreviewDecision(debug, "tracks_shape:unrecognized");
      return failure("parser_error", "Spotify returned an unexpected playlist tracks response.", debug);
    }
    recordSpotifyPreviewDecision(debug, "tracks_shape:top_level_items");

    if (totalTrackCount === 0 && typeof pageResult.data.total === "number") {
      totalTrackCount = pageResult.data.total;
    }

    for (const item of pageResult.data.items) {
      if (inspectedCount >= SPOTIFY_PLAYLIST_PREVIEW_LIMIT) break;
      inspectedCount += 1;
      const normalized = normalizeTrack(item);
      if (normalized) tracks.push(normalized);
    }

    nextUrl = pageResult.data.next ?? null;
  }

  const effectiveTotal = totalTrackCount || inspectedCount;
  recordSpotifyPreviewDecision(debug, `normalized_tracks:${tracks.length}`);
  recordSpotifyPreviewDecision(debug, "success");
  if (debug) {
    debug.finalErrorCode = null;
    debug.normalizedTrackCount = tracks.length;
  }
  return success({
    playlistId,
    playlistName,
    sourceUrl,
    totalTrackCount: effectiveTotal,
    tracks,
    skippedCount: Math.max(0, effectiveTotal - tracks.length),
    previewLimit: SPOTIFY_PLAYLIST_PREVIEW_LIMIT,
  });
}
