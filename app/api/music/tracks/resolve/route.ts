import { NextResponse } from "next/server";

import { getSpotifyAccessToken, spotifyApiGet } from "@/lib/spotify/clientCredentials";
import type { SpotifyTrackSearchResult } from "@/lib/spotify/types";

const SPOTIFY_TRACK_ID_PATTERN = /^[0-9A-Za-z]{22}$/;
const SPOTIFY_TRACK_BATCH_SIZE = 50;

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
    }
  | {
      ok: false;
      code: "invalid_request" | "missing_credentials" | "api_error";
      message: string;
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

export async function POST(request: Request): Promise<NextResponse<ResolveTracksResponse>> {
  let body: ResolveTracksRequest;
  try {
    body = (await request.json()) as ResolveTracksRequest;
  } catch {
    return NextResponse.json(
      { ok: false, code: "invalid_request", message: "Expected JSON body with urls." },
      { status: 400 },
    );
  }

  if (!Array.isArray(body.urls)) {
    return NextResponse.json(
      { ok: false, code: "invalid_request", message: "Expected urls to be an array." },
      { status: 400 },
    );
  }

  const urls = body.urls.filter((url): url is string => typeof url === "string");
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

  if (ids.length === 0) {
    return NextResponse.json({ ok: true, tracks: [], unresolvedUrls });
  }

  const tokenResult = await getSpotifyAccessToken();
  if (!tokenResult.ok) {
    return NextResponse.json({
      ok: false,
      code: tokenResult.code === "missing_credentials" ? "missing_credentials" : "api_error",
      message: tokenResult.message,
    });
  }

  const tracks: ResolvedSpotifyTrack[] = [];
  for (const batch of chunk(ids, SPOTIFY_TRACK_BATCH_SIZE)) {
    const params = new URLSearchParams({ ids: batch.join(",") });
    const result = await spotifyApiGet<SpotifyTracksResponse>(`/tracks?${params.toString()}`, tokenResult.token);
    if (!result.ok) {
      console.error("[music-tracks-resolve] Spotify tracks lookup failed", {
        status: result.status,
      });
      return NextResponse.json({
        ok: false,
        code: result.status === 401 || result.status === 403 ? "missing_credentials" : "api_error",
        message: "Spotify track lookup is temporarily unavailable.",
      });
    }

    for (const track of result.data.tracks ?? []) {
      const normalized = normalizeSpotifyTrack(track);
      if (normalized) tracks.push(normalized);
    }
  }

  const resolvedIds = new Set(tracks.map((track) => track.spotifyId));
  for (const id of ids) {
    if (!resolvedIds.has(id)) {
      unresolvedUrls.push(`spotify:track:${id}`);
    }
  }

  return NextResponse.json({ ok: true, tracks, unresolvedUrls });
}
