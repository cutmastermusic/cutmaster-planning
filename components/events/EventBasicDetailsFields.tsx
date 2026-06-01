"use client";

type EventBasicDetailsFieldsProps = {
  eventName: string;
  coupleNames: string;
  weddingDate: string;
  venue: string;
  venueAddress: string;
  packageName: string;
  primaryPartyLabel: string;
  dateLabel: string;
  showEventName?: boolean;
  showPrimaryParty?: boolean;
  showPackage?: boolean;
  eventNameLabel?: string;
  eventNameOptional?: boolean;
  onEventNameChange: (value: string) => void;
  onCoupleNamesChange: (value: string) => void;
  onWeddingDateChange: (value: string) => void;
  onVenueChange: (value: string) => void;
  onVenueAddressChange: (value: string) => void;
  onPackageNameChange: (value: string) => void;
  TextInputComponent: React.ComponentType<{
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  }>;
};

export function EventBasicDetailsFields({
  eventName,
  coupleNames,
  weddingDate,
  venue,
  venueAddress,
  packageName,
  primaryPartyLabel,
  dateLabel,
  showEventName = true,
  showPrimaryParty = true,
  showPackage = true,
  eventNameLabel = "Event Name",
  eventNameOptional = false,
  onEventNameChange,
  onCoupleNamesChange,
  onWeddingDateChange,
  onVenueChange,
  onVenueAddressChange,
  onPackageNameChange,
  TextInputComponent,
}: EventBasicDetailsFieldsProps) {
  const TextInput = TextInputComponent;

  return (
    <>
      {showEventName ? (
        <TextInput
          id="event-name"
          label={
            eventNameOptional ? `${eventNameLabel} (optional)` : eventNameLabel
          }
          value={eventName}
          onChange={onEventNameChange}
          placeholder={
            showPrimaryParty
              ? "e.g. Smith–Lee Wedding"
              : "e.g. Lincoln High Homecoming Dance"
          }
        />
      ) : null}

      {showPrimaryParty ? (
        <TextInput
          id="event-couple-names"
          label={primaryPartyLabel}
          value={coupleNames}
          onChange={onCoupleNamesChange}
          placeholder="e.g. Alex & Jordan"
        />
      ) : null}

      <TextInput
        id="event-date"
        label={dateLabel}
        value={weddingDate}
        onChange={onWeddingDateChange}
        placeholder="e.g. Saturday, September 21, 2026"
      />

      <TextInput
        id="event-venue"
        label="Venue"
        value={venue}
        onChange={onVenueChange}
        placeholder="e.g. The Grand Willow Estate"
      />

      <div>
        <TextInput
          id="event-venue-address"
          label="Venue Address"
          value={venueAddress}
          onChange={onVenueAddressChange}
          placeholder="Street address, city, state, ZIP"
        />
        <p className="mt-1 text-xs leading-snug text-stone-500">
          Used for the Google Maps link on the Event Document.
        </p>
      </div>

      {showPackage ? (
        <TextInput
          id="event-package"
          label="Package"
          value={packageName}
          onChange={onPackageNameChange}
          placeholder="e.g. Signature Wedding Experience"
        />
      ) : null}
    </>
  );
}