import { NextResponse } from "next/server";

import { requireShowFlowUser, ShowFlowAuthRequiredError } from "@/lib/auth/requireShowFlowUser";
import { fetchUserSpotifyPlaylistPreview } from "@/lib/spotify/fetchUserPlaylistPreview";
import { getConnectedSpotifyAccessToken } from "@/lib/spotify/userConnection";
import type { SpotifyFetchErrorCode, SpotifyPlaylistPreview } from "@/lib/spotify/types";

export const dynamic = "force-dynamic";

type SpotifyConnectedPlaylistPreviewErrorCode =
  | SpotifyFetchErrorCode
  | "auth_required"
  | "spotify_not_connected"
  | "refresh_failed";

type SpotifyConnectedPlaylistPreviewResponse =
  | ({ ok: true } & SpotifyPlaylistPreview)
  | {
      ok: false;
      code: SpotifyConnectedPlaylistPreviewErrorCode;
      message: string;
    };

function errorResponse(
  code: SpotifyConnectedPlaylistPreviewErrorCode,
  message: string,
  status = 200,
): NextResponse<SpotifyConnectedPlaylistPreviewResponse> {
  return NextResponse.json({ ok: false, code, message }, { status });
}

export async function GET(request: Request): Promise<NextResponse<SpotifyConnectedPlaylistPreviewResponse>> {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url") ?? "";

  try {
    const { dbUser } = await requireShowFlowUser();
    const tokenResult = await getConnectedSpotifyAccessToken(dbUser.id);
    if (!tokenResult.ok) {
      return errorResponse(tokenResult.code, tokenResult.message, 200);
    }

    const previewResult = await fetchUserSpotifyPlaylistPreview({
      inputUrl: url,
      accessToken: tokenResult.accessToken,
    });

    if (!previewResult.ok) {
      return errorResponse(
        previewResult.code,
        previewResult.message,
        previewResult.code === "invalid_url" ? 400 : 200,
      );
    }

    return NextResponse.json({
      ok: true,
      ...previewResult.data,
    });
  } catch (error) {
    if (error instanceof ShowFlowAuthRequiredError) {
      return errorResponse("auth_required", "Sign in to ShowFlow before connecting Spotify.", 401);
    }

    console.error("[spotify-playlists-preview] failed", error);
    return errorResponse("api_error", "ShowFlow could not preview this playlist. Try again in a moment.", 500);
  }
}
