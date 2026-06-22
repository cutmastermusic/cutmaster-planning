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
          ? "border border-[#7F8F7A]/55 bg-[#7F8F7A]/10 text-[#3f4d3d]"
          : "border border-rose-200 bg-rose-50 text-rose-950"
      }`}
    >
      {status.message}
    </p>
  );
}