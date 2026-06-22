export type SpotifyPlaylistTrackPreview = {
  spotifyId: string;
  title: string;
  artist: string;
  album: string;
  albumArt: string | null;
  albumArtSmall: string | null;
  source: "spotify-playlist";
};

export type SpotifyPlaylistPreview = {
  playlistId: string;
  playlistName: string;
  sourceUrl: string;
  totalTrackCount: number;
  tracks: SpotifyPlaylistTrackPreview[];
  skippedCount: number;
  previewLimit: number;
};

export type SpotifyFetchErrorCode =
  | "missing_credentials"
  | "invalid_url"
  | "playlist_unavailable"
  | "empty_playlist"
  | "api_error";

export type FetchPublicSpotifyPlaylistResult =
  | { ok: true; data: SpotifyPlaylistPreview }
  | { ok: false; code: SpotifyFetchErrorCode; message: string };

export type SpotifyTrackSearchResult = {
  spotifyId: string;
  title: string;
  artist: string;
  album: string;
  albumArt: string | null;
  albumArtSmall: string | null;
};

export type SpotifyTrackSearchErrorCode = "missing_credentials" | "api_error";

export type SearchSpotifyTracksResult =
  | { ok: true; data: SpotifyTrackSearchResult[] }
  | { ok: false; code: SpotifyTrackSearchErrorCode; message: string };
