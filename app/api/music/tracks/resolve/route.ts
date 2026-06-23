import { NextResponse } from "next/server";

import { getSpotifyAccessToken } from "@/lib/spotify/clientCredentials";
import type { SpotifyTrackSearchResult } from "@/lib/spotify/types";

const SPOTIFY_TRACK_ID_PATTERN = /^[0-9A-Za-z]{22}$/;
const SPOTIFY_TRACK_BATCH_SIZE = 50;
const SPOTIFY_DEBUG_BODY_LIMIT = 800;

type ResolveTracksRequest = {
  urls?: unknown;
};

type SpotifyImage = {
  url?: string;
  height?: number | null;
  width?: number | null;
};

type SpotifyTrackItem = {
  id?: string;
  name?: string;
  type?: string;
  artists?: Array<{ name?: string }>;
  album?: {
    name?: string;
    images?: SpotifyImage[];
  };
};

type SpotifyTracksResponse = {
  tracks?: Array<SpotifyTrackItem | null>;
};

type ResolvedSpotifyTrack = SpotifyTrackSearchResult & {
  source: "spotify-search";
};

type ResolveTracksResponse =
  | {
      ok: true;
      tracks: ResolvedSpotifyTrack[];
      unresolvedUrls: string[];
      debug: ResolveTracksDebug;
    }
  | {
      ok: false;
      code: "invalid_request" | "missing_credentials" | "api_error";
      message: string;
      debug: ResolveTracksDebug;
    };

type ResolveTracksDebug = {
  urlsReceived: number;
  extractedTrackIds: string[];
  spotifyAccessTokenSuccess: boolean;
  spotifyRequestUrls: string[];
  spotifyResponseStatuses: number[];
  spotifyErrorBodies: Array<string | null>;
  normalizedTrackCount: number;
  failingStage: string | null;
  caughtErrorName: string | null;
  caughtErrorMessage: string | null;
};

function parseSpotifyTrackId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const uriMatch = trimmed.match(/^spotify:track:([0-9A-Za-z]{22})(?:\?.*)?$/i);
  if (uriMatch && SPOTIFY_TRACK_ID_PATTERN.test(uriMatch[1])) return uriMatch[1];

  try {
    const url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    if (host !== "open.spotify.com") return null;
    const pathMatch = url.pathname.match(/^\/track\/([0-9A-Za-z]{22})\/?$/i);
    if (pathMatch && SPOTIFY_TRACK_ID_PATTERN.test(pathMatch[1])) return pathMatch[1];
  } catch {
    return null;
  }

  return null;
}

function normalizeSpotifyTrack(track: SpotifyTrackItem | null): ResolvedSpotifyTrack | null {
  if (!track || (track.type && track.type !== "track")) return null;

  const spotifyId = track.id?.trim();
  const title = track.name?.trim();
  if (!spotifyId || !title) return null;

  const artistNames = (track.artists ?? [])
    .map((artist) => artist.name?.trim())
    .filter((name): name is string => Boolean(name));
  const images = track.album?.images ?? [];

  return {
    spotifyId,
    title,
    artist: artistNames.length > 0 ? artistNames.join(", ") : "Unknown Artist",
    album: track.album?.name?.trim() ?? "",
    albumArt: images[0]?.url ?? null,
    albumArtSmall: images[images.length - 1]?.url ?? null,
    source: "spotify-search",
  };
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function createResolveTracksDebug(): ResolveTracksDebug {
  return {
    urlsReceived: 0,
    extractedTrackIds: [],
    spotifyAccessTokenSuccess: false,
    spotifyRequestUrls: [],
    spotifyResponseStatuses: [],
    spotifyErrorBodies: [],
    normalizedTrackCount: 0,
    failingStage: null,
    caughtErrorName: null,
    caughtErrorMessage: null,
  };
}

function sanitizeSpotifyBody(body: string | undefined): string | null {
  if (!body) return null;
  return body.length > SPOTIFY_DEBUG_BODY_LIMIT
    ? `${body.slice(0, SPOTIFY_DEBUG_BODY_LIMIT)}...`
    : body;
}

function logResolveStage(stage: string, details: Record<string, unknown>): void {
  console.info(`[music-tracks-resolve] ${stage}`, details);
}

export async function POST(request: Request): Promise<NextResponse<ResolveTracksResponse>> {
  const debug = createResolveTracksDebug();

  let body: ResolveTracksRequest;
  try {
    body = (await request.json()) as ResolveTracksRequest;
  } catch (error) {
    debug.failingStage = "request_json_parse";
    debug.caughtErrorName = error instanceof Error ? error.name : typeof error;
    debug.caughtErrorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { ok: false, code: "invalid_request", message: debug.caughtErrorMessage, debug },
      { status: 400 },
    );
  }

  if (!Array.isArray(body.urls)) {
    debug.failingStage = "request_validation";
    return NextResponse.json(
      { ok: false, code: "invalid_request", message: "Expected urls to be an array.", debug },
      { status: 400 },
    );
  }

  const urls = body.urls.filter((url): url is string => typeof url === "string");
  debug.urlsReceived = urls.length;
  logResolveStage("urls received", { count: urls.length });

  const seenIds = new Set<string>();
  const ids: string[] = [];
  const unresolvedUrls: string[] = [];

  for (const url of urls) {
    const spotifyId = parseSpotifyTrackId(url);
    if (!spotifyId) {
      unresolvedUrls.push(url);
      continue;
    }
    if (seenIds.has(spotifyId)) continue;
    seenIds.add(spotifyId);
    ids.push(spotifyId);
  }
  debug.extractedTrackIds = ids;
  logResolveStage("extracted track ids", { ids });

  if (ids.length === 0) {
    logResolveStage("normalized track count", { count: 0 });
    return NextResponse.json({ ok: true, tracks: [], unresolvedUrls, debug });
  }

  const tokenResult = await getSpotifyAccessToken();
  debug.spotifyAccessTokenSuccess = tokenResult.ok;
  logResolveStage("spotify access token result", {
    ok: tokenResult.ok,
    code: tokenResult.ok ? null : tokenResult.code,
  });
  if (!tokenResult.ok) {
    debug.failingStage = "spotify_access_token";
    return NextResponse.json({
      ok: false,
      code: tokenResult.code === "missing_credentials" ? "missing_credentials" : "api_error",
      message: tokenResult.message,
      debug,
    });
  }

  const tracks: ResolvedSpotifyTrack[] = [];
  try {
    for (const batch of chunk(ids, SPOTIFY_TRACK_BATCH_SIZE)) {
      const params = new URLSearchParams({ ids: batch.join(",") });
      const spotifyRequestUrl = `https://api.spotify.com/v1/tracks?${params.toString()}`;
      debug.spotifyRequestUrls.push(spotifyRequestUrl);
      logResolveStage("spotify request url", { url: spotifyRequestUrl });

      const response = await fetch(spotifyRequestUrl, {
        headers: { Authorization: `Bearer ${tokenResult.token}` },
        cache: "no-store",
      });
      debug.spotifyResponseStatuses.push(response.status);

      const responseText = await response.text();
      const bodyPreview = sanitizeSpotifyBody(responseText);
      logResolveStage("spotify response", {
        status: response.status,
        ok: response.ok,
        errorBody: response.ok ? null : bodyPreview,
      });

      if (!response.ok) {
        debug.failingStage = "spotify_tracks_response";
        debug.spotifyErrorBodies.push(bodyPreview);
        return NextResponse.json({
          ok: false,
          code: response.status === 401 || response.status === 403 ? "missing_credentials" : "api_error",
          message: `Spotify /v1/tracks failed with status ${response.status}: ${bodyPreview ?? "No response body"}`,
          debug,
        });
      }

      let data: SpotifyTracksResponse;
      try {
        data = JSON.parse(responseText) as SpotifyTracksResponse;
      } catch (error) {
        debug.failingStage = "spotify_tracks_json_parse";
        debug.caughtErrorName = error instanceof Error ? error.name : typeof error;
        debug.caughtErrorMessage = error instanceof Error ? error.message : String(error);
        return NextResponse.json({
          ok: false,
          code: "api_error",
          message: debug.caughtErrorMessage,
          debug,
        });
      }

      for (const track of data.tracks ?? []) {
        const normalized = normalizeSpotifyTrack(track);
        if (normalized) tracks.push(normalized);
      }
      debug.normalizedTrackCount = tracks.length;
      logResolveStage("normalized track count", { count: tracks.length });
    }
  } catch (error) {
    debug.failingStage = "spotify_tracks_fetch_exception";
    debug.caughtErrorName = error instanceof Error ? error.name : typeof error;
    debug.caughtErrorMessage = error instanceof Error ? error.message : String(error);
    console.error("[music-tracks-resolve] uncaught resolver exception", {
      errorName: debug.caughtErrorName,
      errorMessage: debug.caughtErrorMessage,
      failingStage: debug.failingStage,
    });
    return NextResponse.json({
      ok: false,
      code: "api_error",
      message: debug.caughtErrorMessage ?? "Unknown Spotify track resolver error.",
      debug,
    });
  }

  const resolvedIds = new Set(tracks.map((track) => track.spotifyId));
  for (const id of ids) {
    if (!resolvedIds.has(id)) {
      unresolvedUrls.push(`spotify:track:${id}`);
    }
  }

  debug.normalizedTrackCount = tracks.length;
  logResolveStage("final normalized track count", { count: tracks.length });

  return NextResponse.json({ ok: true, tracks, unresolvedUrls, debug });
}
