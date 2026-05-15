"use client";

type EventInternalNotesFieldProps = {
  value: string;
  onChange: (value: string) => void;
  TextAreaComponent: React.ComponentType<{
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    rows?: number;
  }>;
};

export function EventInternalNotesField({
  value,
  onChange,
  TextAreaComponent,
}: EventInternalNotesFieldProps) {
  const TextArea = TextAreaComponent;

  return (
    <TextArea
      id="event-internal-notes"
      label="Internal Notes"
      value={value}
      onChange={onChange}
      rows={3}
    />
  );
}