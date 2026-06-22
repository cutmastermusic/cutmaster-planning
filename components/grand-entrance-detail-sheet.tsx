"use client";

import { useCallback, useEffect } from "react";
import { PrimaryButton, SectionTitle } from "@/components/planning-ui";
import {
  grandEntranceDetailDraftsEqual,
  type GrandEntranceDetailFields,
} from "@/lib/grandEntranceDetail";
import { formatWeddingPartyLineupForDisplay } from "@/lib/weddingPartyLineup";

export type GrandEntranceDetailDraft = GrandEntranceDetailFields & {
  sideNote: string;
};

type GrandEntranceDetailSheetProps = {
  open: boolean;
  title: string;
  subline?: string;
  songLabel?: string;
  savedDraft: GrandEntranceDetailDraft;
  draft: GrandEntranceDetailDraft;
  onChange: (patch: Partial<GrandEntranceDetailDraft>) => void;
  onDone: () => void;
  onCancel: () => void;
  canEditOperationalDetail: boolean;
  canEditSideNote: boolean;
  /** DJ/Admin — opens the shared Wedding Party Lineup editor without leaving this sheet. */
  canEditLineup?: boolean;
  onEditLineup?: () => void;
};

function fieldLabel(className = "") {
  return `text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400 ${className}`.trim();
}

const scriptTextareaClass =
  "block min-h-[min(18rem,42dvh)] max-h-[min(55dvh,40rem)] w-full resize-none touch-manipulation overflow-y-auto overscroll-y-contain rounded-2xl border border-stone-200/90 bg-stone-50/50 px-4 py-3.5 text-base leading-relaxed text-stone-900 placeholder:text-stone-400 focus:border-stone-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-200/80 disabled:opacity-60 md:text-lg";

const lineupTextareaClass =
  "block min-h-[12rem] max-h-[min(40dvh,28rem)] w-full resize-none touch-manipulation overflow-y-auto overscroll-y-contain rounded-2xl border border-stone-200/90 bg-stone-50/60 px-4 py-4 text-xl font-semibold leading-snug tracking-tight text-stone-950 placeholder:text-stone-400 placeholder:font-normal placeholder:text-base focus:border-stone-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-200/80 disabled:opacity-60 sm:text-2xl sm:leading-snug md:text-[1.65rem] md:leading-snug";

const sideNoteTextareaClass =
  "block min-h-[5rem] max-h-[min(20dvh,12rem)] w-full resize-none touch-manipulation overflow-y-auto overscroll-y-contain rounded-2xl border border-stone-200/90 bg-stone-50/50 px-4 py-3.5 text-base leading-relaxed text-stone-900 placeholder:text-stone-400 focus:border-stone-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-200/80 disabled:opacity-60";

/** DJ/Admin operational Grand Entrance sheet — MC script and run-of-show notes; lineup preview with optional edit. */
export function GrandEntranceDetailSheet({
  open,
  title,
  subline,
  songLabel,
  savedDraft,
  draft,
  onChange,
  onDone,
  onCancel,
  canEditOperationalDetail,
  canEditSideNote,
  canEditLineup = false,
  onEditLineup,
}: GrandEntranceDetailSheetProps) {
  const isDirty = !grandEntranceDetailDraftsEqual(draft, savedDraft);

  const requestCancel = useCallback(() => {
    if (isDirty && !window.confirm("Discard unsaved Grand Entrance changes?")) return;
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

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[220] flex items-end justify-center pointer-events-none md:items-stretch md:justify-end md:p-4 md:pb-[max(1rem,env(safe-area-inset-bottom))] md:pt-[max(1rem,env(safe-area-inset-top))]"
      role="dialog"
      aria-modal="true"
      aria-label={`Grand Entrance details for ${title}`}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[#1E1E1E]/50 md:bg-[#1E1E1E]/45"
        aria-hidden
      />
      <div className="pointer-events-auto relative flex h-[min(92dvh,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-1rem))] max-h-[min(92dvh,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-1rem))] w-full min-h-0 flex-col overflow-hidden rounded-t-3xl border border-stone-200 bg-white shadow-2xl shadow-stone-900/15 md:h-full md:max-h-none md:max-w-2xl md:rounded-3xl lg:max-w-3xl">
        <header className="relative z-10 shrink-0 border-b border-stone-200 bg-white px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5 sm:py-4 md:pt-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className={fieldLabel()}>Grand Entrance</p>
                <SectionTitle className="mt-1 text-stone-950">{title}</SectionTitle>
                {subline?.trim() ? (
                  <p className="mt-1 text-sm font-medium leading-snug text-stone-500">{subline.trim()}</p>
                ) : null}
                {songLabel?.trim() ? (
                  <p className="mt-1 text-sm leading-snug text-stone-600">{songLabel.trim()}</p>
                ) : null}
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
                  className="min-h-11 min-w-[5.5rem] touch-manipulation rounded-xl border border-stone-800 bg-stone-900 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-stone-800"
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
          <div className="flex flex-col gap-7 md:gap-8">
            <section className="rounded-2xl border border-stone-100 bg-stone-50/30 p-4 sm:p-5">
              <div className="space-y-2">
                <label htmlFor="ge-detail-script" className={fieldLabel()}>
                  MC script
                </label>
                <textarea
                  id="ge-detail-script"
                  value={draft.script}
                  onChange={(e) => onChange({ script: e.target.value })}
                  disabled={!canEditOperationalDetail}
                  placeholder="Intro wording, staging cues, energy notes…"
                  rows={14}
                  className={scriptTextareaClass}
                />
                <p className="text-[11px] leading-snug text-stone-400 md:text-xs">
                  Operational MC script for show day — not visible to clients for editing.
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-stone-100 bg-white p-4 sm:p-5">
              <div className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <label htmlFor="ge-detail-lineup" className={fieldLabel()}>
                      Wedding party lineup
                    </label>
                    <p className="mt-1 text-xs leading-snug text-stone-500">
                      {canEditLineup
                        ? "Introduction order from client planning. Tap Edit lineup to reorder, remove, or adjust names for show day."
                        : "From client planning — introduction order. Couples edit this in Planning Questions."}
                    </p>
                  </div>
                  {canEditLineup && onEditLineup ? (
                    <PrimaryButton
                      type="button"
                      onClick={onEditLineup}
                      className="shrink-0 rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-900 shadow-sm hover:bg-stone-50"
                    >
                      Edit lineup
                    </PrimaryButton>
                  ) : null}
                </div>
                <textarea
                  id="ge-detail-lineup"
                  value={formatWeddingPartyLineupForDisplay(draft.lineup) || draft.lineup}
                  readOnly
                  placeholder={"Best man — Alex\nMaid of honor — Jordan\nBridesmaids…"}
                  rows={8}
                  spellCheck={false}
                  className={`${lineupTextareaClass} cursor-default bg-stone-100/80 text-stone-800`}
                />
              </div>
            </section>

            <section className="rounded-2xl border border-stone-100 bg-stone-50/30 p-4 sm:p-5">
              <div className="space-y-2">
                <label htmlFor="ge-detail-couple-script" className={fieldLabel()}>
                  Couple entrance script
                </label>
                <textarea
                  id="ge-detail-couple-script"
                  value={draft.coupleEntranceScript}
                  onChange={(e) => onChange({ coupleEntranceScript: e.target.value })}
                  disabled={!canEditOperationalDetail}
                  placeholder="And now I need everyone to get up out of those chairs… get as loud as you can for the brand new Mr. and Mrs. Romero!"
                  rows={6}
                  className={scriptTextareaClass}
                />
                <p className="text-[11px] leading-snug text-stone-400 md:text-xs">
                  Hype line right before you announce the couple — operational only.
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-stone-100 bg-white p-4 sm:p-5">
              <div className="space-y-2">
                <label htmlFor="ge-detail-couple" className={fieldLabel()}>
                  Couple entrance
                </label>
                <p className="text-xs leading-snug text-stone-500">
                  Announcement line from event details — reference only.
                </p>
                <input
                  id="ge-detail-couple"
                  type="text"
                  value={draft.coupleEntrance}
                  readOnly
                  placeholder="Alex & Jordan"
                  className="block min-h-12 w-full cursor-default rounded-2xl border border-stone-200/90 bg-stone-100/80 px-4 py-3 text-xl font-semibold leading-snug text-stone-800 sm:text-2xl md:min-h-14 md:text-[1.75rem]"
                />
              </div>
            </section>

            <section className="rounded-2xl border border-stone-100 bg-stone-50/30 p-4 sm:p-5">
              <div className="space-y-2">
                <label htmlFor="ge-detail-side-note" className={fieldLabel()}>
                  Day-of scratch pad
                </label>
                <p className="text-xs leading-snug text-stone-500">
                  Temporary notes saved only on this device. Use Timeline shared team cues for
                  notes the whole team should see.
                </p>
                <textarea
                  id="ge-detail-side-note"
                  value={draft.sideNote}
                  onChange={(e) => onChange({ sideNote: e.target.value })}
                  disabled={!canEditSideNote}
                  placeholder="Last-minute lineup change, staging reminder…"
                  rows={3}
                  className={sideNoteTextareaClass}
                />
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
