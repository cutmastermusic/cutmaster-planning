/**
 * Spotify recommendations — server-side only.
 *
 * Takes a list of seed songs (title + artist) and a playlist context,
 * resolves their Spotify IDs via search, then calls /recommendations
 * with appropriate audio feature targets for the list type.
 */

import { getSpotifyAccessToken, spotifyApiGet } from "@/lib/spotify/clientCredentials";

// ─── Types ────────────────────────────────────────────────────────────────────

export type RecommendationSeed = {
  title: string;
  artist: string;
};

export type SpotifyRecommendation = {
  spotifyId: string;
  title: string;
  artist: string;
  album: string;
  albumArt: string | null;
  albumArtSmall: string | null;
  bpm: number | null;
  energy: number | null;   // 0.0–1.0
  valence: number | null;  // 0.0–1.0 (happiness)
};

export type GetRecommendationsResult =
  | { ok: true; data: SpotifyRecommendation[]; source: "spotify-recommendations"; message?: string }
  | { ok: false; message: string; code?: string; debug?: Record<string, unknown> };

// ─── Audio feature targets by list type ───────────────────────────────────────

const LIST_TARGETS: Record<string, {
  target_energy?: number;
  target_valence?: number;
  target_tempo?: number;
  min_tempo?: number;
  max_tempo?: number;
}> = {
  dinner: {
    target_energy: 0.3,
    target_valence: 0.6,
    target_tempo: 90,
    min_tempo: 60,
    max_tempo: 120,
  },
  cocktailHour: {
    target_energy: 0.45,
    target_valence: 0.65,
    target_tempo: 105,
    min_tempo: 80,
    max_tempo: 130,
  },
  mustPlay: {
    target_energy: 0.75,
    target_valence: 0.75,
    target_tempo: 120,
    min_tempo: 100,
  },
  playIfPossible: {
    target_energy: 0.7,
    target_valence: 0.7,
    target_tempo: 118,
  },
  doNotPlay: {}, // shouldn't be used for recommendations
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Search Spotify for a song and return its track ID (or null). */
async function resolveTrackId(
  title: string,
  artist: string,
  token: string,
): Promise<string | null> {
  const trimmedTitle = title.trim();
  const trimmedArtist = artist.trim();
  if (!trimmedTitle) return null;
  const queries = [
    trimmedArtist ? `track:${trimmedTitle} artist:${trimmedArtist}` : `track:${trimmedTitle}`,
    [trimmedTitle, trimmedArtist].filter(Boolean).join(" "),
  ];

  for (const query of queries) {
    const q = encodeURIComponent(query);
    const result = await spotifyApiGet<{
      tracks: { items: Array<{ id: string }> };
    }>(`/search?q=${q}&type=track&limit=1`, token);

    if (!result.ok) {
      console.warn("[spotify-recommendations] seed search failed", {
        title: trimmedTitle,
        artist: trimmedArtist,
        status: result.status,
        bodyPreview: result.bodyPreview,
      });
      continue;
    }
    const id = result.data.tracks?.items?.[0]?.id ?? null;
    if (id) return id;
  }

  return null;
}

type SpotifyRecommendationsResponse = {
  tracks: Array<{
    id: string;
    name: string;
    artists: Array<{ name: string }>;
    album: {
      name: string;
      images: Array<{ url: string; width: number; height: number }>;
    };
  }>;
};

type SpotifyAudioFeaturesResponse = {
  audio_features: Array<{
    id: string;
    tempo: number;
    energy: number;
    valence: number;
  } | null>;
};

function spotifyTrackToRecommendation(
  track: SpotifyRecommendationsResponse["tracks"][number],
  featMap = new Map<string, { tempo: number; energy: number; valence: number }>(),
): SpotifyRecommendation {
  const images = track.album.images ?? [];
  const large = images.find((i) => i.width >= 300)?.url ?? images[0]?.url ?? null;
  const small = images.find((i) => i.width <= 100)?.url ?? images[images.length - 1]?.url ?? null;
  const feat = featMap.get(track.id);
  return {
    spotifyId: track.id,
    title: track.name,
    artist: track.artists.map((a) => a.name).join(", "),
    album: track.album.name,
    albumArt: large,
    albumArtSmall: small,
    bpm: feat ? Math.round(feat.tempo) : null,
    energy: feat?.energy ?? null,
    valence: feat?.valence ?? null,
  };
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function getSpotifyRecommendations(
  seeds: RecommendationSeed[],
  listType: string,
  limit = 20,
): Promise<GetRecommendationsResult> {
  console.info("[spotify-recommendations] helper called", {
    seedCount: seeds.length,
    listType,
    limit,
    seeds: seeds.map((seed) => ({ title: seed.title, artist: seed.artist })),
  });
  const tokenResult = await getSpotifyAccessToken();
  if (!tokenResult.ok) {
    console.warn("[spotify-recommendations] token unavailable", tokenResult);
    return { ok: false, code: tokenResult.code, message: tokenResult.message };
  }
  const token = tokenResult.token;

  // Resolve up to 5 seed track IDs in parallel
  const seedsToUse = seeds.slice(0, 5);
  const ids = await Promise.all(
    seedsToUse.map((s) => resolveTrackId(s.title, s.artist, token))
  );
  const validIds = ids.filter((id): id is string => id !== null);
  console.info("[spotify-recommendations] seed resolution", {
    requestedSeeds: seedsToUse.length,
    resolvedSeeds: validIds.length,
  });

  if (validIds.length === 0) {
    return {
      ok: false,
      code: "seed_resolution_failed",
      message: "Couldn’t find these songs on Spotify. Try adding artist names or using Spotify Search results.",
      debug: { seeds: seedsToUse },
    };
  }

  // Build recommendations query
  const targets = LIST_TARGETS[listType] ?? {};
  const params = new URLSearchParams({
    seed_tracks: validIds.join(","),
    limit: String(limit),
  });
  for (const [k, v] of Object.entries(targets)) {
    params.set(k, String(v));
  }

  const recResult = await spotifyApiGet<SpotifyRecommendationsResponse>(
    `/recommendations?${params.toString()}`,
    token,
  );
  if (!recResult.ok) {
    console.warn("[spotify-recommendations] recommendations endpoint failed", {
      status: recResult.status,
      bodyPreview: recResult.bodyPreview,
    });
    if (recResult.status === 404 || recResult.status === 403) {
      return {
        ok: false,
        code: "spotify_recommendations_unavailable",
        message: "Spotify Recommendations is currently unavailable for this app.",
        debug: { status: recResult.status, bodyPreview: recResult.bodyPreview },
      };
    }
    return {
      ok: false,
      code: "spotify_recommendations_failed",
      message: `Spotify recommendations request failed (${recResult.status || "network error"}).${
        recResult.bodyPreview ? ` ${recResult.bodyPreview}` : ""
      }`,
      debug: { status: recResult.status, bodyPreview: recResult.bodyPreview },
    };
  }

  const tracks = recResult.data.tracks ?? [];
  if (tracks.length === 0) {
    console.info("[spotify-recommendations] endpoint returned no tracks");
    return { ok: false, code: "empty_recommendations", message: "Spotify returned no recommendations for these songs." };
  }

  // Fetch audio features for BPM / energy / valence
  const trackIds = tracks.map((t) => t.id).join(",");
  const featResult = await spotifyApiGet<SpotifyAudioFeaturesResponse>(
    `/audio-features?ids=${trackIds}`,
    token,
  );
  const featMap = new Map<string, { tempo: number; energy: number; valence: number }>();
  if (featResult.ok) {
    for (const f of featResult.data.audio_features ?? []) {
      if (f) featMap.set(f.id, { tempo: f.tempo, energy: f.energy, valence: f.valence });
    }
  } else {
    console.warn("[spotify-recommendations] audio features unavailable", {
      status: featResult.status,
      bodyPreview: featResult.bodyPreview,
    });
  }

  const recommendations: SpotifyRecommendation[] = tracks.map((t) => spotifyTrackToRecommendation(t, featMap));

  console.info("[spotify-recommendations] returning recommendations", {
    count: recommendations.length,
    source: "spotify-recommendations",
  });
  return { ok: true, data: recommendations, source: "spotify-recommendations" };
}
