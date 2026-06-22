import { NextResponse } from "next/server";

import { fetchPublicSpotifyPlaylistPreview } from "@/lib/spotify/fetchPublicPlaylist";
import type {
  SpotifyFetchErrorCode,
  SpotifyPlaylistPreview,
} from "@/lib/spotify/types";

type SpotifyPlaylistPreviewApiResponse =
  | ({ ok: true } & SpotifyPlaylistPreview)
  | {
      ok: false;
      code: SpotifyFetchErrorCode;
      message: string;
    };

export async function GET(request: Request): Promise<NextResponse<SpotifyPlaylistPreviewApiResponse>> {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url") ?? "";
  console.info("[music-playlist-preview] request received", {
    hasUrl: Boolean(url.trim()),
    urlLength: url.length,
    urlPreview: url.slice(0, 160),
  });
  console.info("[music-playlist-preview] Spotify env availability", {
    hasSpotifyClientId: Boolean(process.env.SPOTIFY_CLIENT_ID?.trim()),
    hasSpotifyClientSecret: Boolean(process.env.SPOTIFY_CLIENT_SECRET?.trim()),
    vercelEnv: process.env.VERCEL_ENV ?? "local",
  });

  const result = await fetchPublicSpotifyPlaylistPreview(url);

  if (!result.ok) {
    console.error("[music-playlist-preview] Spotify playlist preview failed", {
      code: result.code,
      message: result.message,
    });

    return NextResponse.json(
      {
        ok: false,
        code: result.code,
        message: result.message,
      },
      { status: result.code === "invalid_url" ? 400 : 200 },
    );
  }

  console.info("[music-playlist-preview] Spotify playlist preview success", {
    playlistName: result.data.playlistName,
    totalTracks: result.data.totalTrackCount,
    validTracks: result.data.tracks.length,
    skippedCount: result.data.skippedCount,
  });

  return NextResponse.json({
    ok: true,
    ...result.data,
  });
}
