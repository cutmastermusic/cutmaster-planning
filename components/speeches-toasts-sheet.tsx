"use client";

import { useCallback, useEffect } from "react";
import { PrimaryButton, SectionTitle } from "@/components/planning-ui";
import {
  createEmptySpeechesToastEntry,
  sortSpeechesToastEntries,
  speechesToastEntriesEqual,
  SPEECHES_TOASTS_HELPER_COPY,
  type SpeechesToastEntry,
} from "@/lib/speechesToasts";

type SpeechesToastsSheetProps = {
  open: boolean;
  savedEntries: SpeechesToastEntry[];
  entries: SpeechesToastEntry[];
  onChange: (entries: SpeechesToastEntry[]) => void;
  onDone: () => void;
  onCancel: () => void;
  canEdit: boolean;
};

function fieldLabel(className = "") {
  return `text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400 ${className}`.trim();
}

const inputClass =
  "block min-h-11 w-full touch-manipulation rounded-xl border border-stone-200/90 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80 disabled:cursor-default disabled:bg-stone-100/80 disabled:text-stone-700";

export function SpeechesToastsSheet({
  open,
  savedEntries,
  entries,
  onChange,
  onDone,
  onCancel,
  canEdit,
}: SpeechesToastsSheetProps) {
  const isDirty = !speechesToastEntriesEqual(entries, savedEntries);
  const sortedEntries = sortSpeechesToastEntries(entries);

  const requestCancel = useCallback(() => {
    if (isDirty && !window.confirm("Discard unsaved speeches / toasts changes?")) return;
    onCancel();
  }, [isDirty, onCancel]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        requestCancel();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, requestCancel]);

  const patchEntry = (id: string, patch: Partial<SpeechesToastEntry>) => {
    onChange(entries.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));
  };

  const addEntry = () => {
    onChange([...entries, createEmptySpeechesToastEntry(entries.length)]);
  };

  const removeEntry = (id: string) => {
    onChange(sortSpeechesToastEntries(entries.filter((entry) => entry.id !== id)));
  };

  const moveEntry = (id: string, direction: -1 | 1) => {
    const ordered = sortSpeechesToastEntries(entries);
    const index = ordered.findIndex((entry) => entry.id === id);
    if (index < 0) return;
    const target = index + direction;
    if (target < 0 || target >= ordered.length) return;
    const next = ordered.slice();
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    onChange(sortSpeechesToastEntries(next));
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[215] flex items-end justify-center pointer-events-none md:items-stretch md:justify-end md:p-4 md:pb-[max(1rem,env(safe-area-inset-bottom))] md:pt-[max(1rem,env(safe-area-inset-top))]"
      role="dialog"
      aria-modal="true"
      aria-label="Speeches / Toasts"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-black/50 md:bg-black/45"
        aria-hidden
      />
      <div className="pointer-events-auto relative flex h-[min(92dvh,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-1rem))] max-h-[min(92dvh,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-1rem))] w-full min-h-0 flex-col overflow-hidden rounded-t-3xl border border-stone-200 bg-white shadow-2xl shadow-stone-900/15 md:h-full md:max-h-none md:max-w-2xl md:rounded-3xl lg:max-w-3xl">
        <header className="relative z-10 shrink-0 border-b border-stone-200 bg-white px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5 sm:py-4 md:pt-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className={fieldLabel()}>Reception planning</p>
                <SectionTitle className="mt-1 text-stone-950">Speeches / Toasts</SectionTitle>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">
                  {SPEECHES_TOASTS_HELPER_COPY}
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                <PrimaryButton
                  type="button"
                  onClick={requestCancel}
                  className="min-h-11 min-w-[5.5rem] touch-manipulation rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-stone-900 shadow-sm hover:bg-stone-50"
                >
                  Cancel
                </PrimaryButton>
                <PrimaryButton
                  type="button"
                  onClick={onDone}
                  disabled={!canEdit}
                  className="min-h-11 min-w-[5.5rem] touch-manipulation rounded-xl border border-stone-800 bg-stone-900 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-stone-800 disabled:opacity-60"
                >
                  Done
                </PrimaryButton>
              </div>
            </div>
            {isDirty ? (
              <p className="text-[11px] font-medium text-amber-800/90" role="status">
                Unsaved changes — tap Done to save
              </p>
            ) : null}
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-5 sm:py-5">
          <div className="space-y-4">
            {sortedEntries.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/70 px-4 py-8 text-center">
                <p className="text-sm font-medium text-stone-800">No speakers added yet</p>
                <p className="mt-2 text-xs leading-relaxed text-stone-600">
                  Add each toast in the order you want them to happen.
                </p>
              </div>
            ) : (
              sortedEntries.map((entry, index) => (
                <section
                  key={entry.id}
                  className="rounded-2xl border border-stone-200 bg-stone-50/40 p-4 sm:p-5"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <p className={fieldLabel()}>Speaker {index + 1}</p>
                    {canEdit ? (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <PrimaryButton
                          type="button"
                          onClick={() => moveEntry(entry.id, -1)}
                          disabled={index === 0}
                          className="rounded-lg border border-stone-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-stone-800 disabled:opacity-40"
                        >
                          Up
                        </PrimaryButton>
                        <PrimaryButton
                          type="button"
                          onClick={() => moveEntry(entry.id, 1)}
                          disabled={index === sortedEntries.length - 1}
                          className="rounded-lg border border-stone-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-stone-800 disabled:opacity-40"
                        >
                          Down
                        </PrimaryButton>
                        <PrimaryButton
                          type="button"
                          onClick={() => removeEntry(entry.id)}
                          className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-800"
                        >
                          Remove Speaker
                        </PrimaryButton>
                      </div>
                    ) : null}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor={`st-role-${entry.id}`} className={fieldLabel()}>
                        Role
                      </label>
                      <input
                        id={`st-role-${entry.id}`}
                        type="text"
                        value={entry.role}
                        onChange={(e) => patchEntry(entry.id, { role: e.target.value })}
                        disabled={!canEdit}
                        placeholder="Best Man, Maid of Honor, Father of the Bride…"
                        className={`${inputClass} mt-1.5`}
                      />
                    </div>
                    <div>
                      <label htmlFor={`st-name-${entry.id}`} className={fieldLabel()}>
                        Name
                      </label>
                      <input
                        id={`st-name-${entry.id}`}
                        type="text"
                        value={entry.name}
                        onChange={(e) => patchEntry(entry.id, { name: e.target.value })}
                        disabled={!canEdit}
                        placeholder="Danny Brown"
                        className={`${inputClass} mt-1.5`}
                      />
                    </div>
                  </div>
                </section>
              ))
            )}

            {canEdit ? (
              <PrimaryButton
                type="button"
                onClick={addEntry}
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm font-semibold text-stone-900 shadow-sm hover:bg-stone-50"
              >
                + Add Speaker
              </PrimaryButton>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
