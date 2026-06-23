import { NextRequest, NextResponse } from "next/server";

import { resolveRequestSiteOrigin } from "@/lib/auth/authConfig";
import { requireShowFlowUser, ShowFlowAuthRequiredError } from "@/lib/auth/requireShowFlowUser";
import {
  buildSpotifyAuthorizeUrl,
  createSpotifyCodeChallenge,
  generateSpotifyCodeVerifier,
  generateSpotifyOAuthState,
  resolveSpotifyRedirectUri,
} from "@/lib/spotify/oauth";

export const dynamic = "force-dynamic";

export const SPOTIFY_OAUTH_STATE_COOKIE = "sf_spotify_oauth_state";
export const SPOTIFY_OAUTH_VERIFIER_COOKIE = "sf_spotify_pkce_verifier";
export const SPOTIFY_OAUTH_NEXT_COOKIE = "sf_spotify_oauth_next";

const OAUTH_COOKIE_MAX_AGE_SECONDS = 10 * 60;

function sanitizeNextPath(next: string | null): string {
  if (!next) return "/";
  const trimmed = next.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return "/";
  return trimmed;
}

function spotifyStatusRedirect(origin: string, status: string): NextResponse {
  return NextResponse.redirect(`${origin}/?spotify=${encodeURIComponent(status)}`);
}

function setSpotifyOAuthCookie(response: NextResponse, name: string, value: string): void {
  response.cookies.set(name, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: OAUTH_COOKIE_MAX_AGE_SECONDS,
  });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const origin = resolveRequestSiteOrigin(request);

  try {
    await requireShowFlowUser();

    const state = generateSpotifyOAuthState();
    const codeVerifier = generateSpotifyCodeVerifier();
    const codeChallenge = createSpotifyCodeChallenge(codeVerifier);
    const redirectUri = resolveSpotifyRedirectUri(request);
    const authorizeUrl = buildSpotifyAuthorizeUrl({
      state,
      codeChallenge,
      redirectUri,
    });

    const response = NextResponse.redirect(authorizeUrl);
    setSpotifyOAuthCookie(response, SPOTIFY_OAUTH_STATE_COOKIE, state);
    setSpotifyOAuthCookie(response, SPOTIFY_OAUTH_VERIFIER_COOKIE, codeVerifier);
    setSpotifyOAuthCookie(
      response,
      SPOTIFY_OAUTH_NEXT_COOKIE,
      sanitizeNextPath(new URL(request.url).searchParams.get("next")),
    );

    return response;
  } catch (error) {
    if (error instanceof ShowFlowAuthRequiredError) {
      return spotifyStatusRedirect(origin, "auth_required");
    }

    console.error("[spotify-connect] failed to start OAuth", error);
    return spotifyStatusRedirect(origin, "connect_failed");
  }
}
