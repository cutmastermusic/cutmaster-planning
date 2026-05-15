"use client";

type EventAssignedDjFieldProps = {
  value: string;
  onChange: (value: string) => void;
  teamMembers: Array<{
    id: string;
    name: string;
  }>;
  labelClassName: string;
  selectClassName: string;
};

export function EventAssignedDjField({
  value,
  onChange,
  teamMembers,
  labelClassName,
  selectClassName,
}: EventAssignedDjFieldProps) {
  return (
    <div>
      <label htmlFor="event-assigned-dj" className={labelClassName}>
        Assigned DJ
      </label>
      <select
        id="event-assigned-dj"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={selectClassName}
      >
        <option value="" className="bg-white text-stone-900">
          Select a DJ
        </option>
        {teamMembers.map((member) => (
          <option
            key={`event-modal-dj-${member.id}`}
            value={member.id}
            className="bg-white text-stone-900"
          >
            {member.name}
          </option>
        ))}
      </select>
    </div>
  );
}