"use client";

import { useCallback, useEffect } from "react";
import { PrimaryButton, SectionTitle } from "@/components/planning-ui";
import {
  createEmptyWeddingPartyLineupEntry,
  sortWeddingPartyLineupEntries,
  weddingPartyLineupEntriesEqual,
  WEDDING_PARTY_LINEUP_HELPER_COPY,
  type WeddingPartyLineupEntry,
} from "@/lib/weddingPartyLineup";

type WeddingPartyLineupSheetProps = {
  open: boolean;
  savedEntries: WeddingPartyLineupEntry[];
  entries: WeddingPartyLineupEntry[];
  onChange: (entries: WeddingPartyLineupEntry[]) => void;
  onDone: () => void;
  onCancel: () => void;
  canEdit: boolean;
};

function fieldLabel(className = "") {
  return `text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400 ${className}`.trim();
}

const inputClass =
  "block min-h-11 w-full touch-manipulation rounded-xl border border-stone-200/90 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80 disabled:cursor-default disabled:bg-stone-100/80 disabled:text-stone-700";

const textareaClass =
  "block min-h-[4.5rem] w-full resize-y touch-manipulation rounded-xl border border-stone-200/90 bg-white px-3.5 py-2.5 text-sm leading-relaxed text-stone-900 placeholder:text-stone-400 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80 disabled:cursor-default disabled:bg-stone-100/80 disabled:text-stone-700";

export function WeddingPartyLineupSheet({
  open,
  savedEntries,
  entries,
  onChange,
  onDone,
  onCancel,
  canEdit,
}: WeddingPartyLineupSheetProps) {
  const isDirty = !weddingPartyLineupEntriesEqual(entries, savedEntries);
  const sortedEntries = sortWeddingPartyLineupEntries(entries);

  const requestCancel = useCallback(() => {
    if (isDirty && !window.confirm("Discard unsaved wedding party lineup changes?")) return;
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

  const patchEntry = (id: string, patch: Partial<WeddingPartyLineupEntry>) => {
    onChange(
      entries.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)),
    );
  };

  const addEntry = () => {
    onChange([...entries, createEmptyWeddingPartyLineupEntry(entries.length)]);
  };

  const removeEntry = (id: string) => {
    onChange(sortWeddingPartyLineupEntries(entries.filter((entry) => entry.id !== id)));
  };

  const moveEntry = (id: string, direction: -1 | 1) => {
    const ordered = sortWeddingPartyLineupEntries(entries);
    const index = ordered.findIndex((entry) => entry.id === id);
    if (index < 0) return;
    const target = index + direction;
    if (target < 0 || target >= ordered.length) return;
    const next = ordered.slice();
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    onChange(sortWeddingPartyLineupEntries(next));
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[215] flex items-end justify-center pointer-events-none md:items-stretch md:justify-end md:p-4 md:pb-[max(1rem,env(safe-area-inset-bottom))] md:pt-[max(1rem,env(safe-area-inset-top))]"
      role="dialog"
      aria-modal="true"
      aria-label="Wedding Party Lineup"
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
                <p className={fieldLabel()}>Client planning</p>
                <SectionTitle className="mt-1 text-stone-950">Wedding Party Lineup</SectionTitle>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">
                  {WEDDING_PARTY_LINEUP_HELPER_COPY}
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
                <p className="text-sm font-medium text-stone-800">No entrances added yet</p>
                <p className="mt-2 text-xs leading-relaxed text-stone-600">
                  Add each entrance in the order you want introductions to happen.
                </p>
              </div>
            ) : (
              sortedEntries.map((entry, index) => (
                <section
                  key={entry.id}
                  className="rounded-2xl border border-stone-200 bg-stone-50/40 p-4 sm:p-5"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <p className={fieldLabel()}>Entrance {index + 1}</p>
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
                          Remove
                        </PrimaryButton>
                      </div>
                    ) : null}
                  </div>

                  <div className="grid gap-4">
                    <div>
                      <label htmlFor={`wpl-intro-${entry.id}`} className={fieldLabel()}>
                        Intro / display name
                      </label>
                      <p className="mt-1 text-[11px] leading-snug text-stone-500">
                        Exact words you want the DJ/MC to say for this entrance.
                      </p>
                      <input
                        id={`wpl-intro-${entry.id}`}
                        type="text"
                        value={entry.introDisplayName}
                        onChange={(e) =>
                          patchEntry(entry.id, { introDisplayName: e.target.value })
                        }
                        disabled={!canEdit}
                        placeholder='Bridesmaid Sarah with Groomsman David'
                        className={`${inputClass} mt-1.5`}
                      />
                    </div>

                    <div>
                      <label htmlFor={`wpl-role-${entry.id}`} className={fieldLabel()}>
                        Role / relationship (optional)
                      </label>
                      <input
                        id={`wpl-role-${entry.id}`}
                        type="text"
                        value={entry.role}
                        onChange={(e) => patchEntry(entry.id, { role: e.target.value })}
                        disabled={!canEdit}
                        placeholder="Maid of Honor, Best Man, Parents…"
                        className={`${inputClass} mt-1.5`}
                      />
                    </div>

                    <div>
                      <label htmlFor={`wpl-pronunciation-${entry.id}`} className={fieldLabel()}>
                        Pronunciation notes (optional)
                      </label>
                      <p className="mt-1 text-[11px] leading-snug text-stone-500">
                        Phonetic help only — not the full introduction line.
                      </p>
                      <textarea
                        id={`wpl-pronunciation-${entry.id}`}
                        value={entry.pronunciationNotes}
                        onChange={(e) =>
                          patchEntry(entry.id, { pronunciationNotes: e.target.value })
                        }
                        disabled={!canEdit}
                        placeholder="SAIR-uh · Dr. Martinez (mar-TEEN-ez)"
                        rows={2}
                        className={`${textareaClass} mt-1.5`}
                      />
                    </div>

                    <div>
                      <label htmlFor={`wpl-entrance-${entry.id}`} className={fieldLabel()}>
                        Entrance notes (optional)
                      </label>
                      <p className="mt-1 text-[11px] leading-snug text-stone-500">
                        Staging or how they enter — not the full intro wording.
                      </p>
                      <textarea
                        id={`wpl-entrance-${entry.id}`}
                        value={entry.entranceNotes}
                        onChange={(e) =>
                          patchEntry(entry.id, { entranceNotes: e.target.value })
                        }
                        disabled={!canEdit}
                        placeholder="Entering together · Coming in solo · Wait for coordinator cue"
                        rows={2}
                        className={`${textareaClass} mt-1.5`}
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
                + Add entrance
              </PrimaryButton>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
