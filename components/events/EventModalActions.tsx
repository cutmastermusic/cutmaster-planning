"use client";

type EventModalActionsProps = {
  mode: "new" | "edit";
  onCancel: () => void;
};

const actionButtonClass =
  "min-h-11 w-full touch-manipulation rounded-xl px-3 py-2.5 text-xs font-semibold";

export function EventModalActions({
  mode,
  onCancel,
}: EventModalActionsProps) {
  return (
    <div className="grid grid-cols-2 gap-2 border-t border-stone-200/80 bg-white/98 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <button
        type="button"
        onClick={onCancel}
        className={`${actionButtonClass} border border-stone-300 bg-stone-50 text-stone-900 shadow-sm hover:bg-stone-100`}
      >
        Cancel
      </button>
      <button
        type="submit"
        className={`${actionButtonClass} bg-[#1f2724] text-white shadow-[0_8px_22px_rgba(31,39,36,0.18)] hover:bg-[#2b3531] active:bg-[#171d1b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b08a45]/45 focus-visible:ring-offset-2`}
      >
        {mode === "new" ? "Create Event" : "Save Changes"}
      </button>
    </div>
  );
}
