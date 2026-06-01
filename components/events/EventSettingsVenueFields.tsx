"use client";

type EventSettingsVenueFieldsProps = {
  dateLabel: string;
  weddingDate: string;
  venue: string;
  venueAddress: string;
  ceremonyLocation: string;
  receptionLocation: string;
  onWeddingDateChange: (value: string) => void;
  onVenueChange: (value: string) => void;
  onVenueAddressChange: (value: string) => void;
  onCeremonyLocationChange: (value: string) => void;
  onReceptionLocationChange: (value: string) => void;
  TextInputComponent: React.ComponentType<{
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  }>;
};

export function EventSettingsVenueFields({
  dateLabel,
  weddingDate,
  venue,
  venueAddress,
  ceremonyLocation,
  receptionLocation,
  onWeddingDateChange,
  onVenueChange,
  onVenueAddressChange,
  onCeremonyLocationChange,
  onReceptionLocationChange,
  TextInputComponent,
}: EventSettingsVenueFieldsProps) {
  const TextInput = TextInputComponent;

  return (
    <>
      <TextInput
        id="event-settings-date"
        label={dateLabel}
        value={weddingDate}
        onChange={onWeddingDateChange}
      />
      <TextInput
        id="event-settings-venue"
        label="Venue"
        value={venue}
        onChange={onVenueChange}
        placeholder="e.g. The Grand Willow Estate"
      />
      <div>
        <TextInput
          id="event-settings-venue-address"
          label="Venue Address"
          value={venueAddress}
          onChange={onVenueAddressChange}
          placeholder="Street address, city, state, ZIP"
        />
        <p className="mt-1 text-xs leading-snug text-stone-500">
          Used for the Google Maps link on the Event Document.
        </p>
      </div>
      <TextInput
        id="event-settings-ceremony-location"
        label="Ceremony Location"
        value={ceremonyLocation}
        onChange={onCeremonyLocationChange}
        placeholder="e.g. Garden Lawn"
      />
      <TextInput
        id="event-settings-reception-location"
        label="Reception Location"
        value={receptionLocation}
        onChange={onReceptionLocationChange}
        placeholder="e.g. Main Ballroom"
      />
    </>
  );
}
