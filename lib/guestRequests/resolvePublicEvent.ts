import { parseMusicHubPlanJson } from "@/lib/musicHubPlan";
import { prisma } from "@/lib/prisma";

type PublicGuestRequestEvent = {
  id: string;
  title: string;
  musicHubPlan: unknown;
  guestRequests: Array<{ id: string; order: number }>;
};

function normalizeToken(token: string): string {
  return decodeURIComponent(token ?? "").trim();
}

function guestRequestPublicTokenMatches(musicHubPlan: unknown, token: string): boolean {
  return parseMusicHubPlanJson(musicHubPlan)?.guestRequestSettings.publicToken === token;
}

export async function resolvePublicGuestRequestEvent(
  rawToken: string,
): Promise<PublicGuestRequestEvent | null> {
  const token = normalizeToken(rawToken);
  if (!token) return null;

  const candidates = await prisma.event.findMany({
    where: {
      OR: [
        { id: token },
        {
          musicHubPlan: {
            path: ["guestRequestSettings", "publicToken"],
            equals: token,
          },
        },
      ],
    },
    select: {
      id: true,
      title: true,
      musicHubPlan: true,
      guestRequests: {
        select: {
          id: true,
          order: true,
        },
      },
    },
    take: 5,
  });

  return (
    candidates.find((event) => guestRequestPublicTokenMatches(event.musicHubPlan, token)) ??
    candidates.find((event) => event.id === token) ??
    null
  );
}
