import { NextResponse } from "next/server";

import { requireShowFlowUser, ShowFlowAuthRequiredError } from "@/lib/auth/requireShowFlowUser";
import { fetchUserSpotifyPlaylistPreview } from "@/lib/spotify/fetchUserPlaylistPreview";
import {
  createSpotifyPlaylistPreviewDebugInfo,
  recordSpotifyPreviewCaughtError,
  type SpotifyPlaylistPreviewDebugInfo,
} from "@/lib/spotify/playlistPreviewDebug";
import { getConnectedSpotifyAccessToken } from "@/lib/spotify/userConnection";
import type { SpotifyFetchErrorCode, SpotifyPlaylistPreview } from "@/lib/spotify/types";

export const dynamic = "force-dynamic";

type SpotifyConnectedPlaylistPreviewErrorCode =
  | SpotifyFetchErrorCode
  | "auth_required"
  | "connect_spotify_required"
  | "spotify_reconnect_required";

type SpotifyConnectedPlaylistPreviewResponse =
  | ({ ok: true } & SpotifyPlaylistPreview)
  | {
      ok: false;
      code: SpotifyConnectedPlaylistPreviewErrorCode;
      message: string;
      debug?: SpotifyPlaylistPreviewDebugInfo;
    };

function errorResponse(
  code: SpotifyConnectedPlaylistPreviewErrorCode,
  message: string,
  status = 200,
  debug?: SpotifyPlaylistPreviewDebugInfo,
): NextResponse<SpotifyConnectedPlaylistPreviewResponse> {
  if (debug) {
    debug.finalErrorCode = code;
  }
  return NextResponse.json(
    {
      ok: false,
      code,
      message,
      ...(debug ? { debug } : {}),
    },
    { status },
  );
}

export async function GET(request: Request): Promise<NextResponse<SpotifyConnectedPlaylistPreviewResponse>> {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url") ?? "";
  const debug = searchParams.get("debug") === "1"
    ? createSpotifyPlaylistPreviewDebugInfo()
    : undefined;

  try {
    const { dbUser } = await requireShowFlowUser();
    if (debug) {
      debug.hasSupabaseUser = true;
      debug.showFlowUserId = dbUser.id;
    }

    const tokenResult = await getConnectedSpotifyAccessToken(dbUser.id, debug);
    if (!tokenResult.ok) {
      if (tokenResult.code === "spotify_not_connected") {
        return errorResponse(
          "connect_spotify_required",
          "Connect Spotify to analyze playlists.",
          200,
          debug,
        );
      }
      if (tokenResult.code === "refresh_failed") {
        return errorResponse(
          "spotify_reconnect_required",
          "Spotify connection expired. Reconnect Spotify and try again.",
          200,
          debug,
        );
      }
      return errorResponse("missing_credentials", tokenResult.message, 200, debug);
    }

    const previewResult = await fetchUserSpotifyPlaylistPreview({
      inputUrl: url,
      accessToken: tokenResult.accessToken,
      debug,
    });

    if (!previewResult.ok) {
      return errorResponse(
        previewResult.code,
        previewResult.message,
        previewResult.code === "invalid_url" ? 400 : 200,
        debug,
      );
    }

    return NextResponse.json({
      ok: true,
      ...previewResult.data,
      ...(debug ? { debug } : {}),
    });
  } catch (error) {
    recordSpotifyPreviewCaughtError(debug, error);
    if (error instanceof ShowFlowAuthRequiredError) {
      return errorResponse("auth_required", "Sign in to ShowFlow before connecting Spotify.", 401, debug);
    }

    console.error("[spotify-playlists-preview] failed", error);
    return errorResponse(
      "api_error",
      "ShowFlow could not preview this playlist. Try again in a moment.",
      500,
      debug,
    );
  }
}
