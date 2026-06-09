"use client";

import { getSpeechesToastsPreviewContent } from "@/lib/speechesToasts";

type SpeechesToastsPreviewProps = {
  toastsRaw: string;
  onEdit: () => void;
  variant?: "timeline" | "runOfShow";
  /** Stable per-card key (`r:{id}`) — enables ROS speaker checkoffs when provided with `onToggleSpeaker`. */
  cardKey?: string;
  checkedKeys?: Set<string>;
  onToggleSpeaker?: (lineIndex: number) => void;
  done?: boolean;
};

export function SpeechesToastsPreview({
  toastsRaw,
  onEdit,
  variant = "timeline",
  cardKey,
  checkedKeys,
  onToggleSpeaker,
  done = false,
}: SpeechesToastsPreviewProps) {
  const isRunOfShow = variant === "runOfShow";
  const preview = getSpeechesToastsPreviewContent(toastsRaw, isRunOfShow ? undefined : 2);
  const interactive =
    isRunOfShow && Boolean(cardKey) && typeof onToggleSpeaker === "function";

  const shellClass = isRunOfShow
    ? "mt-6 rounded-2xl border border-stone-200/90 bg-stone-50/80 px-4 py-5 text-left sm:px-5 sm:py-6"
    : "mt-2 rounded-xl border border-stone-200/90 bg-stone-50/70 px-3 py-2.5 text-left md:mt-2.5 md:px-3.5 md:py-3";

  const labelClass = isRunOfShow
    ? "text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-600"
    : "text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500";

  const lineClass = isRunOfShow
    ? `text-xl font-semibold leading-snug sm:text-2xl md:text-[1.65rem] md:leading-snug ${
        done ? "text-stone-600" : "text-stone-950"
      }`
    : "text-[13px] font-semibold leading-snug text-stone-900 md:text-sm";

  const emptyClass = isRunOfShow
    ? `text-base leading-snug ${done ? "text-stone-500" : "text-stone-600"}`
    : "text-[12px] leading-snug text-stone-600 md:text-[13px]";

  const moreClass = isRunOfShow
    ? "mt-3 text-sm font-medium text-stone-500"
    : "mt-1.5 text-[11px] font-medium text-stone-500 md:text-xs";

  const allLines = getSpeechesToastsPreviewContent(toastsRaw).lines;
  const hiddenCount = isRunOfShow ? 0 : Math.max(0, allLines.length - preview.lines.length);

  const content = (
    <>
      <p className={labelClass}>Speeches / Toasts</p>
      {preview.isEmpty ? (
        <p className={`mt-1.5 ${emptyClass}`}>No speakers added yet</p>
      ) : isRunOfShow && interactive ? (
        <ol className="mt-4 list-none space-y-3 pl-0 sm:space-y-4">
          {preview.lines.map((line, index) => {
            const speakerKey = `${cardKey}::st:${index}`;
            const checked = checkedKeys?.has(speakerKey) ?? false;
            return (
              <li key={`st-${index}-${line.primary}`}>
                <button
                  type="button"
                  onClick={() => onToggleSpeaker?.(index)}
                  aria-pressed={checked}
                  aria-label={
                    checked ? `Uncheck "${line.primary}"` : `Check off "${line.primary}"`
                  }
                  className={`flex w-full touch-manipulation items-start gap-2.5 text-left transition active:scale-[0.99] ${
                    checked ? "opacity-50" : ""
                  }`}
                >
                  <span
                    aria-hidden
                    className={`mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[11px] font-bold leading-none transition md:mt-2 ${
                      checked
                        ? "border-stone-400 bg-stone-300/70 text-stone-700"
                        : "border-stone-400 bg-white text-transparent"
                    }`}
                  >
                    ✓
                  </span>
                  <span
                    className={`${lineClass} ${checked ? "line-through decoration-stone-400" : ""}`}
                  >
                    {line.primary}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
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
    </>
  );

  if (interactive) {
    return (
      <div
        className={`${shellClass} w-full ${done ? "opacity-90" : ""}`}
        aria-label="Speeches and toasts command reference"
      >
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onEdit}
      className={`${shellClass} w-full touch-manipulation transition hover:border-stone-300 hover:bg-stone-100/80 active:scale-[0.995]`}
      aria-label={
        preview.isEmpty ? "Add speeches and toasts" : "View or edit speeches and toasts"
      }
    >
      {content}
    </button>
  );
}
