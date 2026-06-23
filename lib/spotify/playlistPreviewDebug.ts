import type { SpotifyFetchErrorCode } from "@/lib/spotify/types";

export type SpotifyPlaylistPreviewDebugInfo = {
  hasSupabaseUser: boolean;
  showFlowUserId: string | null;
  hasSpotifyConnection: boolean;
  spotifyUserId: string | null;
  tokenExpired: boolean | null;
  tokenRefreshAttempted: boolean;
  tokenRefreshSucceeded: boolean;
  parsedPlaylistId: string | null;
  metadataStatus: number | null;
  tracksStatus: number | null;
  metadataBodyPreview: string | null;
  tracksBodyPreview: string | null;
  parserDecisionPath: string[];
  finalErrorCode: SpotifyFetchErrorCode | "auth_required" | "connect_spotify_required" | "spotify_reconnect_required" | null;
  normalizedTrackCount: number | null;
  caughtErrorName: string | null;
  caughtErrorMessage: string | null;
};

export function createSpotifyPlaylistPreviewDebugInfo(): SpotifyPlaylistPreviewDebugInfo {
  return {
    hasSupabaseUser: false,
    showFlowUserId: null,
    hasSpotifyConnection: false,
    spotifyUserId: null,
    tokenExpired: null,
    tokenRefreshAttempted: false,
    tokenRefreshSucceeded: false,
    parsedPlaylistId: null,
    metadataStatus: null,
    tracksStatus: null,
    metadataBodyPreview: null,
    tracksBodyPreview: null,
    parserDecisionPath: [],
    finalErrorCode: null,
    normalizedTrackCount: null,
    caughtErrorName: null,
    caughtErrorMessage: null,
  };
}

export function recordSpotifyPreviewDecision(
  debug: SpotifyPlaylistPreviewDebugInfo | undefined,
  decision: string,
): void {
  debug?.parserDecisionPath.push(decision);
}

export function recordSpotifyPreviewCaughtError(
  debug: SpotifyPlaylistPreviewDebugInfo | undefined,
  error: unknown,
): void {
  if (!debug) return;
  debug.caughtErrorName = error instanceof Error ? error.name : typeof error;
  debug.caughtErrorMessage = error instanceof Error ? error.message : String(error);
}
