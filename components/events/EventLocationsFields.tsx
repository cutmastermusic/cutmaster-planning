"use client";

type EventLocationsFieldsProps = {
  ceremonyLocation: string;
  receptionLocation: string;
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

export function EventLocationsFields({
  ceremonyLocation,
  receptionLocation,
  onCeremonyLocationChange,
  onReceptionLocationChange,
  TextInputComponent,
}: EventLocationsFieldsProps) {
  const TextInput = TextInputComponent;

  return (
    <div className="grid grid-cols-2 gap-2">
      <TextInput
        id="event-ceremony-location"
        label="Ceremony Location"
        value={ceremonyLocation}
        onChange={onCeremonyLocationChange}
        placeholder="e.g. Garden Lawn"
      />

      <TextInput
        id="event-reception-location"
        label="Reception Location"
        value={receptionLocation}
        onChange={onReceptionLocationChange}
        placeholder="e.g. Main Ballroom"
      />
    </div>
  );
}