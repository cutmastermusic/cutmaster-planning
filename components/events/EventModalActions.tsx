"use client";

type EventModalActionsProps = {
  mode: "new" | "edit";
  onCancel: () => void;
};

export function EventModalActions({
  mode,
  onCancel,
}: EventModalActionsProps) {
  return (
    <div className="mt-5 grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={onCancel}
        className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-900 shadow-sm hover:bg-stone-100"
      >
        Cancel
      </button>
      <button
        type="submit"
        className="w-full rounded-xl bg-[#00D4FF] px-3 py-2 text-xs font-semibold text-black shadow-[0_8px_22px_rgba(143,107,47,0.35)] hover:brightness-110"
      >
        {mode === "new" ? "Create Event" : "Save Changes"}
      </button>
    </div>
  );
}