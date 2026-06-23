import { NextResponse } from "next/server";

type ResolveTracksResponse =
  | { ok: true; tracks: []; unresolvedUrls: [] }
  | { ok: false; code: "disabled"; message: string };

export async function POST(request: Request): Promise<NextResponse<ResolveTracksResponse>> {
  await request.text().catch(() => "");
  return NextResponse.json({
    ok: false,
    code: "disabled",
    message:
      "Spotify track URL resolving is disabled for now. Paste a text list with song titles and artists, or use Reference Playlist Links to share the playlist with your DJ.",
  });
}
