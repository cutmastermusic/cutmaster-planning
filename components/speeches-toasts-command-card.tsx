"use client";

import type { ReactNode } from "react";
import { parseSpeechesToasts, sortSpeechesToastEntries } from "@/lib/speechesToasts";

type SpeechesToastsCommandCardProps = {
  toastsRaw: string;
  done?: boolean;
  cardKey: string;
  checkedKeys: Set<string>;
  onToggleSpeaker: (lineIndex: number) => void;
};

function sectionLabelClass(done: boolean) {
  return `text-[10px] font-semibold uppercase tracking-[0.14em] ${
    done ? "text-stone-400" : "text-stone-500"
  }`;
}

function sectionDividerClass() {
  return "border-t border-stone-200/80 pt-4 mt-4 first:border-t-0 first:pt-0 first:mt-0";
}

function emptyTextClass(done: boolean) {
  return `text-sm leading-snug ${done ? "text-stone-500" : "text-stone-600"}`;
}

function CommandCardSection({
  label,
  done,
  children,
}: {
  label: string;
  done: boolean;
  children: ReactNode;
}) {
  return (
    <section className={sectionDividerClass()}>
      <p className={sectionLabelClass(done)}>{label}</p>
      <div className="mt-2">{children}</div>
    </section>
  );
}

/** Read-only Speeches / Toasts operational reference for Run Of Show — speaker order with checkoffs. */
export function SpeechesToastsCommandCard({
  toastsRaw,
  done = false,
  cardKey,
  checkedKeys,
  onToggleSpeaker,
}: SpeechesToastsCommandCardProps) {
  const entries = sortSpeechesToastEntries(parseSpeechesToasts(toastsRaw));
  const roleClass = done ? "text-stone-500" : "text-stone-600";
  const nameClass = done ? "text-stone-600" : "text-stone-950";
  const orderClass = done ? "text-stone-400" : "text-stone-500";
  const speakerTextSize = "text-base leading-snug sm:text-[17px] sm:leading-snug";

  return (
    <div
      className={`mt-6 rounded-2xl border border-stone-200/90 bg-stone-50/80 px-4 py-5 text-left sm:px-5 sm:py-6 ${
        done ? "opacity-90" : ""
      }`}
      aria-label="Speeches and toasts command reference"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-600">
        Speeches / Toasts
      </p>

      <CommandCardSection label="Speaker order" done={done}>
        {entries.length === 0 ? (
          <p className={emptyTextClass(done)}>No speakers added yet</p>
        ) : (
          <ol className="list-none space-y-3 pl-0 sm:space-y-4">
            {entries.map((entry, index) => {
              const speakerKey = `${cardKey}::st:${index}`;
              const checked = checkedKeys.has(speakerKey);
              const role = entry.role.trim();
              const name = entry.name.trim();
              const labelParts = [role, name].filter(Boolean);
              const ariaLabel =
                labelParts.length > 0 ? labelParts.join(" — ") : `Speaker ${index + 1}`;

              return (
                <li key={entry.id || `st-${index}`}>
                  <button
                    type="button"
                    onClick={() => onToggleSpeaker(index)}
                    aria-pressed={checked}
                    aria-label={
                      checked ? `Uncheck "${ariaLabel}"` : `Check off "${ariaLabel}"`
                    }
                    className={`flex w-full touch-manipulation items-start gap-2.5 text-left transition active:scale-[0.99] ${
                      checked ? "opacity-50" : ""
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[11px] font-bold leading-none transition md:mt-1.5 ${
                        checked
                          ? "border-stone-400 bg-stone-300/70 text-stone-700"
                          : "border-stone-400 bg-white text-transparent"
                      }`}
                    >
                      ✓
                    </span>
                    <span className="min-w-0 flex-1">
                      <div className="flex items-start gap-x-2">
                        <span
                          className={`shrink-0 font-mono text-sm tabular-nums ${orderClass} ${
                            checked ? "line-through decoration-stone-400" : ""
                          }`}
                        >
                          {index + 1}.
                        </span>
                        <span className="min-w-0 flex-1">
                          {role ? (
                            <span
                              className={`block ${speakerTextSize} font-medium ${roleClass} ${
                                checked ? "line-through decoration-stone-400" : ""
                              } [overflow-wrap:anywhere]`}
                            >
                              {role}
                            </span>
                          ) : null}
                          {name ? (
                            <span
                              className={`${role ? "mt-0.5" : ""} block ${speakerTextSize} font-bold ${nameClass} ${
                                checked ? "line-through decoration-stone-400" : ""
                              } [overflow-wrap:anywhere]`}
                            >
                              {name}
                            </span>
                          ) : !role ? (
                            <span
                              className={`block ${speakerTextSize} font-bold ${nameClass} ${
                                checked ? "line-through decoration-stone-400" : ""
                              }`}
                            >
                              Untitled speaker
                            </span>
                          ) : null}
                        </span>
                      </div>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        )}
      </CommandCardSection>
    </div>
  );
}
