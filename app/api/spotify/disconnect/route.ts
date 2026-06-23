import { NextResponse } from "next/server";

import { requireShowFlowUser, ShowFlowAuthRequiredError } from "@/lib/auth/requireShowFlowUser";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type SpotifyDisconnectResponse =
  | { ok: true; disconnected: true }
  | { ok: false; message: string };

export async function POST(): Promise<NextResponse<SpotifyDisconnectResponse>> {
  try {
    const { dbUser } = await requireShowFlowUser();
    await prisma.spotifyConnection.updateMany({
      where: { userId: dbUser.id },
      data: {
        accessTokenEnc: null,
        refreshTokenEnc: null,
        accessTokenExpiresAt: null,
        revokedAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true, disconnected: true });
  } catch (error) {
    if (error instanceof ShowFlowAuthRequiredError) {
      return NextResponse.json({ ok: false, message: "Sign in required." }, { status: 401 });
    }

    console.error("[spotify-disconnect] failed to disconnect Spotify", error);
    return NextResponse.json(
      { ok: false, message: "Could not disconnect Spotify." },
      { status: 500 },
    );
  }
}
