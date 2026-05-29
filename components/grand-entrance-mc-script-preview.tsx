"use client";

import { getGrandEntranceMcScriptPreviewContent } from "@/lib/grandEntranceDetail";

type GrandEntranceMcScriptPreviewProps = {
  script: string;
  onEdit: () => void;
  variant?: "timeline" | "runOfShow";
};

export function GrandEntranceMcScriptPreview({
  script,
  onEdit,
  variant = "timeline",
}: GrandEntranceMcScriptPreviewProps) {
  const preview = getGrandEntranceMcScriptPreviewContent(script, 2);
  const isRunOfShow = variant === "runOfShow";

  const shellClass = isRunOfShow
    ? "mt-4 rounded-xl border border-stone-200/90 bg-stone-50/80 px-3.5 py-3 text-left sm:px-4 sm:py-3.5"
    : "mt-2 rounded-xl border border-stone-200/90 bg-stone-50/70 px-3 py-2.5 text-left md:mt-2.5 md:px-3.5 md:py-3";

  const labelClass = isRunOfShow
    ? "text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500"
    : "text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500";

  const lineClass = isRunOfShow
    ? "text-sm leading-snug text-stone-800 sm:text-[15px]"
    : "text-[12px] leading-snug text-stone-800 md:text-[13px]";

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
      aria-label={preview.isEmpty ? "Add Grand Entrance MC script" : "View or edit MC script"}
    >
      <p className={labelClass}>MC script</p>
      {preview.isEmpty ? (
        <p className={`mt-1.5 ${emptyClass}`}>No MC script yet</p>
      ) : (
        <div className="mt-2 space-y-1.5">
          {preview.previewLines.map((line, index) => (
            <p key={`${index}-${line.slice(0, 24)}`} className={`${lineClass} line-clamp-2`}>
              {line}
            </p>
          ))}
          {preview.moreLineCount > 0 ? (
            <p className={moreClass}>
              + {preview.moreLineCount} more line{preview.moreLineCount === 1 ? "" : "s"}
            </p>
          ) : null}
        </div>
      )}
    </button>
  );
}
