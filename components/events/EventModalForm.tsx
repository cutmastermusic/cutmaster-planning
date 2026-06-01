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
      className="flex min-h-0 flex-1 flex-col"
    >
      {children}
    </form>
  );
}
