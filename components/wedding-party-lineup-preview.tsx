"use client";

import { getWeddingPartyLineupPreviewContent } from "@/lib/weddingPartyLineup";

type WeddingPartyLineupPreviewProps = {
  lineupRaw: string;
  onEdit: () => void;
  variant?: "timeline" | "runOfShow";
};

export function WeddingPartyLineupPreview({
  lineupRaw,
  onEdit,
  variant = "timeline",
}: WeddingPartyLineupPreviewProps) {
  const preview = getWeddingPartyLineupPreviewContent(lineupRaw, 2);
  const isRunOfShow = variant === "runOfShow";

  const shellClass = isRunOfShow
    ? "mt-4 rounded-xl border border-stone-200/90 bg-stone-50/80 px-3.5 py-3 text-left sm:px-4 sm:py-3.5"
    : "mt-2 rounded-xl border border-stone-200/90 bg-stone-50/70 px-3 py-2.5 text-left md:mt-2.5 md:px-3.5 md:py-3";

  const labelClass = isRunOfShow
    ? "text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500"
    : "text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500";

  const primaryClass = isRunOfShow
    ? "text-sm font-semibold leading-snug text-stone-900 sm:text-[15px]"
    : "text-[13px] font-semibold leading-snug text-stone-900 md:text-sm";

  const secondaryClass = isRunOfShow
    ? "mt-0.5 text-xs leading-snug text-stone-600"
    : "mt-0.5 text-[11px] leading-snug text-stone-600 md:text-xs";

  const emptyClass = isRunOfShow
    ? "text-sm leading-snug text-stone-600"
    : "text-[12px] leading-snug text-stone-600 md:text-[13px]";

  const moreClass = isRunOfShow
    ? "mt-2 text-xs font-medium text-stone-500"
    : "mt-1.5 text-[11px] font-medium text-stone-500 md:text-xs";

  return (
    <button
      type="button"
      onClick={onEdit}
      className={`${shellClass} w-full touch-manipulation transition hover:border-stone-300 hover:bg-stone-100/80 active:scale-[0.995]`}
      aria-label={
        preview.isEmpty
          ? "Add wedding party lineup"
          : "View or edit wedding party lineup"
      }
    >
      <p className={labelClass}>Wedding party lineup</p>
      {preview.isEmpty ? (
        <p className={`mt-1.5 ${emptyClass}`}>No wedding party lineup yet</p>
      ) : (
        <div className="mt-2 space-y-2">
          {preview.previewLines.map((line) => (
            <div key={line.primary}>
              <p className={primaryClass}>{line.primary}</p>
              {line.secondary ? <p className={secondaryClass}>{line.secondary}</p> : null}
            </div>
          ))}
          {preview.moreCount > 0 ? (
            <p className={moreClass}>
              + {preview.moreCount} more entrance{preview.moreCount === 1 ? "" : "s"}
            </p>
          ) : null}
        </div>
      )}
    </button>
  );
}
