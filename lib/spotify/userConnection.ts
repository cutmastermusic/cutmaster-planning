/**
 * Server-only Spotify Connect token access.
 * Tokens are decrypted only inside route handlers/server helpers and never sent to the browser.
 */
import { prisma } from "@/lib/prisma";
import type { SpotifyPlaylistPreviewDebugInfo } from "@/lib/spotify/playlistPreviewDebug";
import { decryptSpotifyToken, encryptSpotifyToken } from "@/lib/spotify/tokenEncryption";

const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const ACCESS_TOKEN_REFRESH_BUFFER_MS = 60_000;

export type SpotifyConnectionAccessTokenResult =
  | {
      ok: true;
      accessToken: string;
      spotifyUserId: string;
      spotifyDisplayName: string | null;
      scopes: string;
    }
  | {
      ok: false;
      code: "spotify_not_connected" | "missing_credentials" | "refresh_failed";
      message: string;
    };

type SpotifyRefreshTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
};

async function refreshSpotifyAccessToken(refreshToken: string): Promise<
  | {
      ok: true;
      accessToken: string;
      refreshToken: string | null;
      expiresIn: number;
      scopes: string | null;
    }
  | { ok: false; status?: number }
> {
  const clientId = process.env.SPOTIFY_CLIENT_ID?.trim();
  if (!clientId) return { ok: false };

  let response: Response;
  try {
    response = await fetch(SPOTIFY_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: clientId,
      }),
      cache: "no-store",
    });
  } catch {
    return { ok: false };
  }

  let body: SpotifyRefreshTokenResponse | null = null;
  try {
    body = (await response.json()) as SpotifyRefreshTokenResponse;
  } catch {
    body = null;
  }

  if (!response.ok || !body?.access_token || typeof body.expires_in !== "number") {
    return { ok: false, status: response.status };
  }

  return {
    ok: true,
    accessToken: body.access_token,
    refreshToken: body.refresh_token ?? null,
    expiresIn: body.expires_in,
    scopes: body.scope?.trim() || null,
  };
}

export async function getConnectedSpotifyAccessToken(
  userId: string,
  debug?: SpotifyPlaylistPreviewDebugInfo,
): Promise<SpotifyConnectionAccessTokenResult> {
  const connection = await prisma.spotifyConnection.findUnique({
    where: { userId },
    select: {
      id: true,
      spotifyUserId: true,
      spotifyDisplayName: true,
      scopes: true,
      accessTokenEnc: true,
      refreshTokenEnc: true,
      accessTokenExpiresAt: true,
      revokedAt: true,
    },
  });
  if (debug) {
    debug.hasSpotifyConnection = Boolean(connection && !connection.revokedAt);
    debug.spotifyUserId = connection?.spotifyUserId ?? null;
  }

  if (
    !connection ||
    connection.revokedAt ||
    !connection.accessTokenEnc ||
    !connection.refreshTokenEnc ||
    !connection.accessTokenExpiresAt
  ) {
    if (debug) {
      debug.finalErrorCode = "connect_spotify_required";
    }
    return {
      ok: false,
      code: "spotify_not_connected",
      message: "Connect Spotify to analyze playlists.",
    };
  }

  const tokenExpired = connection.accessTokenExpiresAt.getTime() <= Date.now() + ACCESS_TOKEN_REFRESH_BUFFER_MS;
  if (debug) {
    debug.tokenExpired = tokenExpired;
  }

  if (!tokenExpired) {
    return {
      ok: true,
      accessToken: decryptSpotifyToken(connection.accessTokenEnc),
      spotifyUserId: connection.spotifyUserId,
      spotifyDisplayName: connection.spotifyDisplayName,
      scopes: connection.scopes,
    };
  }

  if (debug) {
    debug.tokenRefreshAttempted = true;
  }
  const refreshResult = await refreshSpotifyAccessToken(decryptSpotifyToken(connection.refreshTokenEnc));
  if (!refreshResult.ok) {
    console.error("[spotify-connect] access token refresh failed", {
      userId,
      spotifyUserId: connection.spotifyUserId,
      status: refreshResult.status ?? null,
    });
    if (debug) {
      debug.finalErrorCode = "spotify_reconnect_required";
    }
    return {
      ok: false,
      code: "refresh_failed",
      message: "Spotify connection expired. Reconnect Spotify and try again.",
    };
  }
  if (debug) {
    debug.tokenRefreshSucceeded = true;
  }

  const encryptedRefreshToken = refreshResult.refreshToken
    ? encryptSpotifyToken(refreshResult.refreshToken)
    : connection.refreshTokenEnc;
  const scopes = refreshResult.scopes ?? connection.scopes;
  const accessTokenExpiresAt = new Date(Date.now() + refreshResult.expiresIn * 1000);

  await prisma.spotifyConnection.update({
    where: { id: connection.id },
    data: {
      accessTokenEnc: encryptSpotifyToken(refreshResult.accessToken),
      refreshTokenEnc: encryptedRefreshToken,
      accessTokenExpiresAt,
      scopes,
      revokedAt: null,
    },
  });

  return {
    ok: true,
    accessToken: refreshResult.accessToken,
    spotifyUserId: connection.spotifyUserId,
    spotifyDisplayName: connection.spotifyDisplayName,
    scopes,
  };
}
