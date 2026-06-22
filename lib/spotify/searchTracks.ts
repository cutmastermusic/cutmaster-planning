/**
 * Server-only Spotify track search.
 * Uses Client Credentials Flow through the cached token helper; never import from client components.
 */

import { getSpotifyAccessToken, spotifyApiGet } from "@/lib/spotify/clientCredentials";
import type { SearchSpotifyTracksResult, SpotifyTrackSearchResult } from "@/lib/spotify/types";

type SpotifyImage = {
  url?: string;
  height?: number | null;
  width?: number | null;
};

type SpotifySearchTrackItem = {
  id?: string;
  name?: string;
  type?: string;
  artists?: Array<{ name?: string }>;
  album?: {
    name?: string;
    images?: SpotifyImage[];
  };
};

type SpotifyTrackSearchResponse = {
  tracks?: {
    items?: SpotifySearchTrackItem[];
  };
};

function normalizeSpotifyTrack(track: SpotifySearchTrackItem): SpotifyTrackSearchResult | null {
  if (track.type && track.type !== "track") return null;

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
  };
}

export async function searchSpotifyTracks(query: string): Promise<SearchSpotifyTracksResult> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return { ok: true, data: [] };

  const tokenResult = await getSpotifyAccessToken();
  if (!tokenResult.ok) {
    return {
      ok: false,
      code: tokenResult.code === "missing_credentials" ? "missing_credentials" : "api_error",
      message: tokenResult.message,
    };
  }

  const params = new URLSearchParams({
    q: trimmed,
    type: "track",
    limit: "5",
  });

  const searchResult = await spotifyApiGet<SpotifyTrackSearchResponse>(
    `/search?${params.toString()}`,
    tokenResult.token,
  );

  if (!searchResult.ok) {
    return {
      ok: false,
      code: searchResult.status === 401 || searchResult.status === 403 ? "missing_credentials" : "api_error",
      message: "Spotify search is temporarily unavailable.",
    };
  }

  return {
    ok: true,
    data: (searchResult.data.tracks?.items ?? [])
      .map(normalizeSpotifyTrack)
      .filter((track): track is SpotifyTrackSearchResult => Boolean(track)),
  };
}
