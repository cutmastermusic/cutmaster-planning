"use client";

type EventPlannerFieldsProps = {
  plannerName: string;
  plannerEmail: string;
  onPlannerNameChange: (value: string) => void;
  onPlannerEmailChange: (value: string) => void;
  TextInputComponent: React.ComponentType<{
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
  }>;
};

export function EventPlannerFields({
  plannerName,
  plannerEmail,
  onPlannerNameChange,
  onPlannerEmailChange,
  TextInputComponent,
}: EventPlannerFieldsProps) {
  const TextInput = TextInputComponent;

  return (
    <div className="grid grid-cols-2 gap-2">
      <TextInput
        id="event-planner-name"
        label="Planner Name"
        value={plannerName}
        onChange={onPlannerNameChange}
      />
      <TextInput
        id="event-planner-email"
        label="Planner Email"
        value={plannerEmail}
        onChange={onPlannerEmailChange}
      />
    </div>
  );
}