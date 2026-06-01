import { buildGoogleMapsSearchUrl } from "@/utils/venueLinks";

type EventDocumentLocationLinkProps = {
  value: string;
  fallback?: string;
  className?: string;
};

/** Renders non-empty location text as a Google Maps search link on Event Document. */
export function EventDocumentLocationLink({
  value,
  fallback = "TBD",
  className = "doc-venue-address-link",
}: EventDocumentLocationLinkProps) {
  const trimmed = value.trim();
  if (!trimmed) {
    return fallback ? <>{fallback}</> : null;
  }
  return (
    <a
      href={buildGoogleMapsSearchUrl(trimmed)}
      target="_blank"
      rel="noreferrer"
      className={className}
    >
      {trimmed}
    </a>
  );
}

type EventDocumentVenueOverviewProps = {
  venueName: string;
  venueAddress: string;
};

/** Venue name (plain) plus optional venue-address maps link — not reception fallback. */
export function EventDocumentVenueOverview({
  venueName,
  venueAddress,
}: EventDocumentVenueOverviewProps) {
  const name = venueName.trim() || "TBD";
  const address = venueAddress.trim();
  return (
    <>
      {name}
      {address ? (
        <>
          <br />
          <EventDocumentLocationLink value={address} fallback="" />
        </>
      ) : null}
    </>
  );
}
