import { NextResponse } from "next/server";

import { getSpotifyRecommendations } from "@/lib/spotify/getRecommendations";
import type { SpotifyRecommendation } from "@/lib/spotify/getRecommendations";

type RecommendationsRequest = {
  seeds: Array<{ title: string; artist: string }>;
  listType: string;
  limit?: number;
};

type RecommendationsResponse =
  | { ok: true; data: SpotifyRecommendation[]; source: "spotify-recommendations"; message?: string }
  | { ok: false; message: string; code?: string; debug?: Record<string, unknown> };

export async function POST(request: Request): Promise<NextResponse<RecommendationsResponse>> {
  let body: RecommendationsRequest;
  try {
    body = (await request.json()) as RecommendationsRequest;
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid request body." }, { status: 400 });
  }

  const { seeds, listType, limit } = body;
  console.info("[music/recommendations] POST", {
    seedCount: Array.isArray(seeds) ? seeds.length : 0,
    listType,
    limit,
    seeds: Array.isArray(seeds) ? seeds.map((seed) => ({ title: seed.title, artist: seed.artist })) : [],
  });

  if (!Array.isArray(seeds) || seeds.length === 0) {
    return NextResponse.json(
      { ok: false, message: "At least one seed song is required." },
      { status: 400 },
    );
  }

  const result = await getSpotifyRecommendations(seeds, listType, limit ?? 20);
  console.info("[music/recommendations] result", {
    ok: result.ok,
    source: result.ok ? result.source : undefined,
    count: result.ok ? result.data.length : 0,
    code: result.ok ? undefined : result.code,
    message: result.message,
    debug: result.ok ? undefined : result.debug,
  });
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, message: result.message, code: result.code, debug: result.debug },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, data: result.data, source: result.source, message: result.message });
}
