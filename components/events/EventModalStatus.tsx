"use client";

type EventModalStatusProps = {
  status: {
    kind: "success" | "error";
    message: string;
  } | null;
};

export function EventModalStatus({ status }: EventModalStatusProps) {
  if (!status) return null;

  return (
    <p
      className={`rounded-xl px-3 py-2 text-xs ${
        status.kind === "success"
          ? "border border-emerald-200 bg-emerald-50 text-emerald-950"
          : "border border-rose-200 bg-rose-50 text-rose-950"
      }`}
    >
      {status.message}
    </p>
  );
}