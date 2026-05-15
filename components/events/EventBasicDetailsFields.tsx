"use client";

type EventBasicDetailsFieldsProps = {
  eventName: string;
  coupleNames: string;
  weddingDate: string;
  venue: string;
  packageName: string;
  primaryPartyLabel: string;
  dateLabel: string;
  onEventNameChange: (value: string) => void;
  onCoupleNamesChange: (value: string) => void;
  onWeddingDateChange: (value: string) => void;
  onVenueChange: (value: string) => void;
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
  packageName,
  primaryPartyLabel,
  dateLabel,
  onEventNameChange,
  onCoupleNamesChange,
  onWeddingDateChange,
  onVenueChange,
  onPackageNameChange,
  TextInputComponent,
}: EventBasicDetailsFieldsProps) {
  const TextInput = TextInputComponent;

  return (
    <>
      <TextInput
        id="event-name"
        label="Event Name"
        value={eventName}
        onChange={onEventNameChange}
        placeholder="e.g. Jordan Graduation Celebration"
      />

      <TextInput
        id="event-couple-names"
        label={primaryPartyLabel}
        value={coupleNames}
        onChange={onCoupleNamesChange}
        placeholder="e.g. Jordan Vega"
      />

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

      <TextInput
        id="event-package"
        label="Package"
        value={packageName}
        onChange={onPackageNameChange}
        placeholder="e.g. Signature Wedding Experience"
      />
    </>
  );
}