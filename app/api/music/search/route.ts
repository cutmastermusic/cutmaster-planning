import { NextResponse } from "next/server";

import { searchSpotifyTracks } from "@/lib/spotify/searchTracks";
import type { SpotifyTrackSearchResult } from "@/lib/spotify/types";

type MusicSearchResponse = {
  results: SpotifyTrackSearchResult[];
};

export async function GET(request: Request): Promise<NextResponse<MusicSearchResponse>> {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";

  if (query.trim().length < 2) {
    return NextResponse.json({ results: [] });
  }

  const result = await searchSpotifyTracks(query);
  if (!result.ok) {
    console.error("[music-search] Spotify search failed", {
      code: result.code,
      message: result.message,
    });
    return NextResponse.json({ results: [] });
  }

  return NextResponse.json({ results: result.data });
}
