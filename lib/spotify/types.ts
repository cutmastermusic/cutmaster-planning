export type SpotifyPlaylistTrackPreview = {
  spotifyTrackId: string;
  title: string;
  artist: string;
};

export type SpotifyPlaylistPreview = {
  playlistId: string;
  playlistName: string;
  sourceUrl: string;
  tracks: SpotifyPlaylistTrackPreview[];
  totalFetched: number;
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
