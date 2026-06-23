/**
 * Server-only Spotify OAuth helpers for user-authorized playlist import/export.
 */
import { createHash, randomBytes } from "node:crypto";

import { resolveRequestSiteOrigin } from "@/lib/auth/authConfig";

const SPOTIFY_AUTHORIZE_URL = "https://accounts.spotify.com/authorize";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_PROFILE_URL = "https://api.spotify.com/v1/me";

export const SPOTIFY_CONNECT_SCOPES = [
  "playlist-read-private",
  "playlist-read-collaborative",
  "playlist-modify-public",
  "playlist-modify-private",
] as const;

export type SpotifyTokenExchangeResult =
  | {
      ok: true;
      accessToken: string;
      refreshToken: string | null;
      expiresIn: number;
      scopes: string;
    }
  | { ok: false; message: string; status?: number };

export type SpotifyProfileResult =
  | {
      ok: true;
      id: string;
      displayName: string | null;
    }
  | { ok: false; message: string; status?: number };

type SpotifyTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
};

type SpotifyProfileResponse = {
  id?: string;
  display_name?: string | null;
};

export function generateSpotifyOAuthState(): string {
  return randomBytes(32).toString("base64url");
}

export function generateSpotifyCodeVerifier(): string {
  return randomBytes(64).toString("base64url");
}

export function createSpotifyCodeChallenge(codeVerifier: string): string {
  return createHash("sha256").update(codeVerifier).digest("base64url");
}

export function resolveSpotifyRedirectUri(request: Request): string {
  return `${resolveRequestSiteOrigin(request)}/api/spotify/callback`;
}

export function buildSpotifyAuthorizeUrl(params: {
  state: string;
  codeChallenge: string;
  redirectUri: string;
}): string {
  const clientId = process.env.SPOTIFY_CLIENT_ID?.trim();
  if (!clientId) {
    throw new Error("SPOTIFY_CLIENT_ID is required for Spotify Connect.");
  }

  const authorizationUrl = new URL(SPOTIFY_AUTHORIZE_URL);
  authorizationUrl.search = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: SPOTIFY_CONNECT_SCOPES.join(" "),
    redirect_uri: params.redirectUri,
    state: params.state,
    code_challenge_method: "S256",
    code_challenge: params.codeChallenge,
  }).toString();

  return authorizationUrl.toString();
}

async function readSpotifyJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function exchangeSpotifyAuthorizationCode(params: {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}): Promise<SpotifyTokenExchangeResult> {
  const clientId = process.env.SPOTIFY_CLIENT_ID?.trim();
  if (!clientId) {
    return { ok: false, message: "Spotify Client ID is not configured." };
  }

  let response: Response;
  try {
    response = await fetch(SPOTIFY_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: params.code,
        redirect_uri: params.redirectUri,
        client_id: clientId,
        code_verifier: params.codeVerifier,
      }),
      cache: "no-store",
    });
  } catch {
    return { ok: false, message: "Spotify token exchange failed." };
  }

  const body = await readSpotifyJson<SpotifyTokenResponse>(response);
  if (!response.ok) {
    return {
      ok: false,
      message: "Spotify token exchange was rejected.",
      status: response.status,
    };
  }

  if (!body?.access_token || typeof body.expires_in !== "number") {
    return {
      ok: false,
      message: "Spotify returned an unexpected token response.",
      status: response.status,
    };
  }

  return {
    ok: true,
    accessToken: body.access_token,
    refreshToken: body.refresh_token ?? null,
    expiresIn: body.expires_in,
    scopes: body.scope?.trim() || SPOTIFY_CONNECT_SCOPES.join(" "),
  };
}

export async function fetchSpotifyProfile(accessToken: string): Promise<SpotifyProfileResult> {
  let response: Response;
  try {
    response = await fetch(SPOTIFY_PROFILE_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
  } catch {
    return { ok: false, message: "Spotify profile request failed." };
  }

  const body = await readSpotifyJson<SpotifyProfileResponse>(response);
  if (!response.ok) {
    return {
      ok: false,
      message: "Spotify profile request was rejected.",
      status: response.status,
    };
  }

  const id = body?.id?.trim();
  if (!id) {
    return {
      ok: false,
      message: "Spotify returned an unexpected profile response.",
      status: response.status,
    };
  }

  return {
    ok: true,
    id,
    displayName: body?.display_name?.trim() || null,
  };
}
