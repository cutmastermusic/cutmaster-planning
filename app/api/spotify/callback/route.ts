import { NextRequest, NextResponse } from "next/server";

import { resolveRequestSiteOrigin } from "@/lib/auth/authConfig";
import { requireShowFlowUser, ShowFlowAuthRequiredError } from "@/lib/auth/requireShowFlowUser";
import { prisma } from "@/lib/prisma";
import {
  exchangeSpotifyAuthorizationCode,
  fetchSpotifyProfile,
  resolveSpotifyRedirectUri,
} from "@/lib/spotify/oauth";
import { encryptSpotifyToken } from "@/lib/spotify/tokenEncryption";

export const dynamic = "force-dynamic";

const SPOTIFY_OAUTH_STATE_COOKIE = "sf_spotify_oauth_state";
const SPOTIFY_OAUTH_VERIFIER_COOKIE = "sf_spotify_pkce_verifier";
const SPOTIFY_OAUTH_NEXT_COOKIE = "sf_spotify_oauth_next";

type SpotifyCallbackFailureReason =
  | "missing_code"
  | "missing_state"
  | "state_cookie_missing"
  | "state_mismatch"
  | "pkce_verifier_cookie_missing"
  | "token_exchange_failed"
  | "profile_fetch_failed"
  | "showflow_user_missing"
  | "refresh_token_missing"
  | "prisma_upsert_failed"
  | "unexpected_error"
  | "spotify_denied";

function sanitizeNextPath(next: string | undefined): string {
  if (!next) return "/";
  const trimmed = next.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return "/";
  return trimmed;
}

function statusRedirect(origin: string, nextPath: string, status: string): NextResponse {
  const redirectUrl = new URL(sanitizeNextPath(nextPath), origin);
  redirectUrl.searchParams.set("spotify", status);
  return NextResponse.redirect(redirectUrl);
}

function failureRedirect(
  origin: string,
  nextPath: string,
  status: string,
  reason: SpotifyCallbackFailureReason,
): NextResponse {
  const redirectUrl = new URL(sanitizeNextPath(nextPath), origin);
  redirectUrl.searchParams.set("spotify", status);
  redirectUrl.searchParams.set("reason", reason);
  return NextResponse.redirect(redirectUrl);
}

function clearSpotifyOAuthCookies(response: NextResponse): void {
  for (const name of [
    SPOTIFY_OAUTH_STATE_COOKIE,
    SPOTIFY_OAUTH_VERIFIER_COOKIE,
    SPOTIFY_OAUTH_NEXT_COOKIE,
  ]) {
    response.cookies.set(name, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
  }
}

function redirectAndClear(origin: string, nextPath: string, status: string): NextResponse {
  const response = statusRedirect(origin, nextPath, status);
  clearSpotifyOAuthCookies(response);
  return response;
}

function failAndClear(
  origin: string,
  nextPath: string,
  status: string,
  reason: SpotifyCallbackFailureReason,
): NextResponse {
  const response = failureRedirect(origin, nextPath, status, reason);
  clearSpotifyOAuthCookies(response);
  return response;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const origin = resolveRequestSiteOrigin(request);
  const requestUrl = new URL(request.url);
  const fallbackNext = sanitizeNextPath(request.cookies.get(SPOTIFY_OAUTH_NEXT_COOKIE)?.value);
  const code = requestUrl.searchParams.get("code");
  const returnedState = requestUrl.searchParams.get("state");
  const spotifyError = requestUrl.searchParams.get("error");
  const expectedState = request.cookies.get(SPOTIFY_OAUTH_STATE_COOKIE)?.value;
  const codeVerifier = request.cookies.get(SPOTIFY_OAUTH_VERIFIER_COOKIE)?.value;

  if (spotifyError) {
    console.warn("[spotify-callback] Spotify authorization denied", { error: spotifyError });
    return failAndClear(origin, fallbackNext, "connect_denied", "spotify_denied");
  }

  if (!code) {
    console.error("[spotify-callback] missing OAuth code");
    return failAndClear(origin, fallbackNext, "connect_failed", "missing_code");
  }

  if (!returnedState) {
    console.error("[spotify-callback] missing returned OAuth state");
    return failAndClear(origin, fallbackNext, "connect_failed", "missing_state");
  }

  if (!expectedState) {
    console.error("[spotify-callback] OAuth state cookie missing");
    return failAndClear(origin, fallbackNext, "connect_failed", "state_cookie_missing");
  }

  if (returnedState !== expectedState) {
    console.error("[spotify-callback] OAuth state mismatch", {
      hasReturnedState: true,
      hasExpectedState: true,
    });
    return failAndClear(origin, fallbackNext, "connect_failed", "state_mismatch");
  }

  if (!codeVerifier) {
    console.error("[spotify-callback] PKCE verifier cookie missing");
    return failAndClear(origin, fallbackNext, "connect_failed", "pkce_verifier_cookie_missing");
  }

  try {
    const { dbUser } = await requireShowFlowUser();
    const redirectUri = resolveSpotifyRedirectUri(request);
    const tokenResult = await exchangeSpotifyAuthorizationCode({
      code,
      codeVerifier,
      redirectUri,
    });

    if (!tokenResult.ok) {
      console.error("[spotify-callback] token exchange failed", {
        status: tokenResult.status ?? null,
        message: tokenResult.message,
      });
      return failAndClear(origin, fallbackNext, "connect_failed", "token_exchange_failed");
    }

    const profileResult = await fetchSpotifyProfile(tokenResult.accessToken);
    if (!profileResult.ok) {
      console.error("[spotify-callback] profile fetch failed", {
        status: profileResult.status ?? null,
        message: profileResult.message,
      });
      return failAndClear(origin, fallbackNext, "connect_failed", "profile_fetch_failed");
    }

    const existingConnection = await prisma.spotifyConnection.findUnique({
      where: { userId: dbUser.id },
      select: { refreshTokenEnc: true },
    });
    const encryptedRefreshToken = tokenResult.refreshToken
      ? encryptSpotifyToken(tokenResult.refreshToken)
      : (existingConnection?.refreshTokenEnc ?? null);

    if (!encryptedRefreshToken) {
      console.error("[spotify-callback] token response did not include a refresh token");
      return failAndClear(origin, fallbackNext, "connect_failed", "refresh_token_missing");
    }

    const connectedAt = new Date();
    const accessTokenExpiresAt = new Date(Date.now() + tokenResult.expiresIn * 1000);
    try {
      await prisma.spotifyConnection.upsert({
        where: { userId: dbUser.id },
        create: {
          userId: dbUser.id,
          spotifyUserId: profileResult.id,
          spotifyDisplayName: profileResult.displayName,
          scopes: tokenResult.scopes,
          accessTokenEnc: encryptSpotifyToken(tokenResult.accessToken),
          refreshTokenEnc: encryptedRefreshToken,
          accessTokenExpiresAt,
          connectedAt,
          revokedAt: null,
        },
        update: {
          spotifyUserId: profileResult.id,
          spotifyDisplayName: profileResult.displayName,
          scopes: tokenResult.scopes,
          accessTokenEnc: encryptSpotifyToken(tokenResult.accessToken),
          refreshTokenEnc: encryptedRefreshToken,
          accessTokenExpiresAt,
          connectedAt,
          revokedAt: null,
        },
      });
    } catch (error) {
      console.error("[spotify-callback] Prisma upsert failed", {
        errorName: error instanceof Error ? error.name : typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      return failAndClear(origin, fallbackNext, "connect_failed", "prisma_upsert_failed");
    }

    return redirectAndClear(origin, fallbackNext, "connected");
  } catch (error) {
    if (error instanceof ShowFlowAuthRequiredError) {
      console.error("[spotify-callback] ShowFlow user missing during callback");
      return failAndClear(origin, fallbackNext, "connect_failed", "showflow_user_missing");
    }

    console.error("[spotify-callback] failed to complete Spotify connection", {
      errorName: error instanceof Error ? error.name : typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return failAndClear(origin, fallbackNext, "connect_failed", "unexpected_error");
  }
}
