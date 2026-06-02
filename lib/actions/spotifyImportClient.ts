/**
 * Client-side guarded wrapper for `previewSpotifyPlaylistImport`.
 * Callers in client components should import from this file.
 */

import { previewSpotifyPlaylistImport } from "@/lib/actions/spotifyImport";
import { assertPayloadFitsServerAction } from "@/lib/payloadSize";

export type {
  FetchPublicSpotifyPlaylistResult,
  SpotifyFetchErrorCode,
  SpotifyPlaylistPreview,
  SpotifyPlaylistTrackPreview,
} from "@/lib/spotify/types";

export async function previewSpotifyPlaylistImportGuarded(url: string) {
  assertPayloadFitsServerAction("previewSpotifyPlaylistImport", { url });
  return previewSpotifyPlaylistImport(url);
}
