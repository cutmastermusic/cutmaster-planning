"use client";

type EventTypeSectionProps = {
  children: React.ReactNode;
};

export function EventTypeSection({
  children,
}: EventTypeSectionProps) {
  return (
    <div className="space-y-2 rounded-2xl border border-stone-200 bg-stone-50/90 px-3 py-3">
      {children}
    </div>
  );
}