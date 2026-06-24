import { GuestRequestPublicPage } from "@/components/guest-request-public-page";
import { parseMusicHubPlanJson } from "@/lib/musicHubPlan";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type GuestRequestPageProps = {
  params: Promise<{ token: string }>;
};

export default async function GuestRequestPage({ params }: GuestRequestPageProps) {
  const { token } = await params;
  const eventId = decodeURIComponent(token ?? "").trim();
  const event = eventId
    ? await prisma.event.findUnique({
        where: { id: eventId },
        select: {
          id: true,
          title: true,
          musicHubPlan: true,
          guestRequests: {
            select: { id: true },
          },
        },
      })
    : null;

  const settings = parseMusicHubPlanJson(event?.musicHubPlan)?.guestRequestSettings;
  const enabled = settings?.enabled === true;
  const limitReached = Boolean(
    settings &&
      settings.maxRequests !== "unlimited" &&
      event &&
      event.guestRequests.length >= settings.maxRequests,
  );

  return (
    <GuestRequestPublicPage
      token={event?.id ?? eventId}
      enabled={Boolean(event && enabled)}
      limitReached={limitReached}
    />
  );
}
