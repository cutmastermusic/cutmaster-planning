import { NextResponse } from "next/server";

type MusicPreviewResponse = {
  previewUrl: string | null;
};

type DeezerTrack = {
  preview?: unknown;
};

type DeezerSearchResponse = {
  data?: DeezerTrack[];
};

function isDeezerSearchResponse(value: unknown): value is DeezerSearchResponse {
  if (!value || typeof value !== "object") return false;
  const data = (value as { data?: unknown }).data;
  return data === undefined || Array.isArray(data);
}

function normalizePreviewUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export async function GET(request: Request): Promise<NextResponse<MusicPreviewResponse>> {
  const { searchParams } = new URL(request.url);
  const title = (searchParams.get("title") ?? "").trim();
  const artist = (searchParams.get("artist") ?? "").trim();

  if (!title || !artist) {
    return NextResponse.json({ previewUrl: null });
  }

  const params = new URLSearchParams({
    q: `track:"${title}" artist:"${artist}"`,
    limit: "1",
  });

  try {
    const response = await fetch(`https://api.deezer.com/search?${params.toString()}`, {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("[music-preview] Deezer search failed", { status: response.status });
      return NextResponse.json({ previewUrl: null });
    }

    const body: unknown = await response.json();
    if (!isDeezerSearchResponse(body)) {
      console.error("[music-preview] Unexpected Deezer response shape");
      return NextResponse.json({ previewUrl: null });
    }

    return NextResponse.json({
      previewUrl: normalizePreviewUrl(body.data?.[0]?.preview),
    });
  } catch (error) {
    console.error("[music-preview] Deezer preview lookup failed", error);
    return NextResponse.json({ previewUrl: null });
  }
}
