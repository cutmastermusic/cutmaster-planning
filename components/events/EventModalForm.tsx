"use client";

type EventModalFormProps = {
  children: React.ReactNode;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

export function EventModalForm({
  children,
  onSubmit,
}: EventModalFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="mt-4 space-y-4"
    >
      {children}
    </form>
  );
}