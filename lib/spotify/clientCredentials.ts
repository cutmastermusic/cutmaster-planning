/**
 * Server-only Spotify client-credentials token helper.
 * Import only from server actions or other server-side code.
 */

type CachedToken = {
  accessToken: string;
  expiresAtMs: number;
};

const SPOTIFY_TOKEN_DEBUG_BODY_LIMIT = 800;
let cachedToken: CachedToken | null = null;

function spotifyDebugErrorBody(errorBody: string | undefined): string | undefined {
  if (!errorBody) return undefined;
  return errorBody.length > SPOTIFY_TOKEN_DEBUG_BODY_LIMIT
    ? `${errorBody.slice(0, SPOTIFY_TOKEN_DEBUG_BODY_LIMIT)}…`
    : errorBody;
}

function readSpotifyCredentials(): { clientId: string; clientSecret: string } | null {
  const clientId = process.env.SPOTIFY_CLIENT_ID?.trim();
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export function spotifyCredentialsConfigured(): boolean {
  return readSpotifyCredentials() !== null;
}

type SpotifyTokenErrorCode = "missing_credentials" | "api_error";

/** Returns a valid access token, refreshing via client credentials when needed. */
export async function getSpotifyAccessToken(): Promise<
  { ok: true; token: string } | { ok: false; code: SpotifyTokenErrorCode; message: string }
> {
  const creds = readSpotifyCredentials();
  if (!creds) {
    return {
      ok: false,
      code: "missing_credentials",
      message:
        "Spotify credentials are not configured. Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET on the server.",
    };
  }

  const now = Date.now();
  if (cachedToken && cachedToken.expiresAtMs > now + 60_000) {
    return { ok: true, token: cachedToken.accessToken };
  }

  const basic = Buffer.from(`${creds.clientId}:${creds.clientSecret}`).toString("base64");
  let response: Response;
  try {
    response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
      cache: "no-store",
    });
  } catch {
    return {
      ok: false,
      code: "api_error",
      message: "Could not reach Spotify to obtain an access token.",
    };
  }

  if (!response.ok) {
    let errorBody: string | undefined;
    try {
      errorBody = await response.text();
    } catch {
      errorBody = undefined;
    }
    console.error("[spotify-token] token request failed", {
      status: response.status,
      errorBody: spotifyDebugErrorBody(errorBody),
    });
    return {
      ok: false,
      code: response.status === 401 || response.status === 403 ? "missing_credentials" : "api_error",
      message:
        response.status === 401 || response.status === 403
          ? "Spotify rejected the configured client credentials."
          : "Spotify could not issue an access token. Try again in a moment.",
    };
  }

  const body = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
  };

  if (!body.access_token || typeof body.expires_in !== "number") {
    return {
      ok: false,
      code: "api_error",
      message: "Spotify returned an unexpected token response.",
    };
  }

  cachedToken = {
    accessToken: body.access_token,
    expiresAtMs: now + body.expires_in * 1000,
  };

  return { ok: true, token: cachedToken.accessToken };
}

export async function spotifyApiGet<T>(
  pathOrUrl: string,
  accessToken: string,
): Promise<
  | { ok: true; data: T; status: number; bodyPreview?: string }
  | { ok: false; status: number; errorBody?: string; bodyPreview?: string }
> {
  const url = pathOrUrl.startsWith("https://")
    ? pathOrUrl
    : `https://api.spotify.com/v1${pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`}`;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
  } catch {
    return { ok: false, status: 0 };
  }

  let responseText: string | undefined;
  try {
    responseText = await response.text();
  } catch {
    responseText = undefined;
  }
  const bodyPreview = spotifyDebugErrorBody(responseText);

  if (!response.ok) {
    return { ok: false, status: response.status, errorBody: responseText, bodyPreview };
  }

  try {
    return { ok: true, data: JSON.parse(responseText ?? "null") as T, status: response.status, bodyPreview };
  } catch {
    return { ok: false, status: response.status, errorBody: responseText, bodyPreview };
  }
}
