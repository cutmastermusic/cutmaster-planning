"use server";

import { fetchPublicSpotifyPlaylistPreview } from "@/lib/spotify/fetchPublicPlaylist";
import type { FetchPublicSpotifyPlaylistResult } from "@/lib/spotify/types";

/** Preview tracks from a public Spotify playlist URL (server-only; no DB writes). */
export async function previewSpotifyPlaylistImport(
  url: string,
): Promise<FetchPublicSpotifyPlaylistResult> {
  return fetchPublicSpotifyPlaylistPreview(url);
}
