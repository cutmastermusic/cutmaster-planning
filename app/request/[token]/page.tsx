import { GuestRequestPublicPage } from "@/components/guest-request-public-page";
import { resolvePublicGuestRequestEvent } from "@/lib/guestRequests/resolvePublicEvent";
import { parseMusicHubPlanJson } from "@/lib/musicHubPlan";

export const dynamic = "force-dynamic";

type GuestRequestPageProps = {
  params: Promise<{ token: string }>;
};

export default async function GuestRequestPage({ params }: GuestRequestPageProps) {
  const { token } = await params;
  const requestToken = decodeURIComponent(token ?? "").trim();
  const event = requestToken ? await resolvePublicGuestRequestEvent(requestToken) : null;

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
      token={requestToken}
      enabled={Boolean(event && enabled)}
      limitReached={limitReached}
    />
  );
}
