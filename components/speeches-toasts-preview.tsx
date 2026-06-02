"use client";

import { getSpeechesToastsPreviewContent } from "@/lib/speechesToasts";

type SpeechesToastsPreviewProps = {
  toastsRaw: string;
  onEdit: () => void;
  variant?: "timeline" | "runOfShow";
};

export function SpeechesToastsPreview({
  toastsRaw,
  onEdit,
  variant = "timeline",
}: SpeechesToastsPreviewProps) {
  const isRunOfShow = variant === "runOfShow";
  const preview = getSpeechesToastsPreviewContent(toastsRaw, isRunOfShow ? undefined : 2);

  const shellClass = isRunOfShow
    ? "mt-6 rounded-2xl border border-stone-200/90 bg-stone-50/80 px-4 py-5 text-left sm:px-5 sm:py-6"
    : "mt-2 rounded-xl border border-stone-200/90 bg-stone-50/70 px-3 py-2.5 text-left md:mt-2.5 md:px-3.5 md:py-3";

  const labelClass = isRunOfShow
    ? "text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-600"
    : "text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500";

  const lineClass = isRunOfShow
    ? "text-xl font-semibold leading-snug text-stone-950 sm:text-2xl md:text-[1.65rem] md:leading-snug"
    : "text-[13px] font-semibold leading-snug text-stone-900 md:text-sm";

  const emptyClass = isRunOfShow
    ? "text-base leading-snug text-stone-600"
    : "text-[12px] leading-snug text-stone-600 md:text-[13px]";

  const moreClass = isRunOfShow
    ? "mt-3 text-sm font-medium text-stone-500"
    : "mt-1.5 text-[11px] font-medium text-stone-500 md:text-xs";

  const allLines = getSpeechesToastsPreviewContent(toastsRaw).lines;
  const hiddenCount = isRunOfShow ? 0 : Math.max(0, allLines.length - preview.lines.length);

  return (
    <button
      type="button"
      onClick={onEdit}
      className={`${shellClass} w-full touch-manipulation transition hover:border-stone-300 hover:bg-stone-100/80 active:scale-[0.995]`}
      aria-label={
        preview.isEmpty ? "Add speeches and toasts" : "View or edit speeches and toasts"
      }
    >
      <p className={labelClass}>Speeches / Toasts</p>
      {preview.isEmpty ? (
        <p className={`mt-1.5 ${emptyClass}`}>No speakers added yet</p>
      ) : isRunOfShow ? (
        <ol className="mt-4 space-y-3 sm:space-y-4">
          {preview.lines.map((line) => (
            <li key={line.primary} className={lineClass}>
              {line.primary}
            </li>
          ))}
        </ol>
      ) : (
        <div className="mt-2 space-y-2">
          {preview.lines.map((line) => (
            <p key={line.primary} className={lineClass}>
              {line.primary}
            </p>
          ))}
          {hiddenCount > 0 ? (
            <p className={moreClass}>
              + {hiddenCount} more speaker{hiddenCount === 1 ? "" : "s"}
            </p>
          ) : null}
        </div>
      )}
    </button>
  );
}
