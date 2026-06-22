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

  return NextResponse.json({
    ok: true,
    ...result.data,
  });
}
