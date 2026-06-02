"use client";

import type { DefaultTimelineMomentDef } from "@/lib/restoreDefaultTimelineMoments";

type RestoreDefaultTimelineMomentsProps = {
  missingMoments: DefaultTimelineMomentDef[];
  onRestore: (momentKey: string) => void;
  disabled?: boolean;
};

export function RestoreDefaultTimelineMoments({
  missingMoments,
  onRestore,
  disabled = false,
}: RestoreDefaultTimelineMomentsProps) {
  if (missingMoments.length === 0) return null;

  return (
    <div className="rounded-xl border border-stone-200/90 bg-stone-50/70 px-4 py-3 sm:px-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
        Restore default moments
      </p>
      <p className="mt-1.5 text-xs leading-relaxed text-stone-600">
        Add back a suggested moment you removed. Your custom timeline items stay unchanged.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {missingMoments.map((moment) => (
          <button
            key={moment.key}
            type="button"
            disabled={disabled}
            onClick={() => onRestore(moment.key)}
            className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-[12px] font-semibold text-stone-800 shadow-sm transition hover:border-stone-400 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            + Restore {moment.title}
          </button>
        ))}
      </div>
    </div>
  );
}
