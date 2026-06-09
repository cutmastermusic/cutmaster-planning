"use client";

import { useCallback, useEffect } from "react";
import { PrimaryButton } from "@/components/planning-ui";
import {
  RunOfShowReferenceQuickContactsBlock,
  RunOfShowReferenceSongListBlock,
} from "@/components/run-of-show-live-reference";
import type { RunOfShowQuickContactRow } from "@/lib/runOfShowLiveReference";
import type { SongEntry } from "@/types/planning";

type RunOfShowReferenceDrawerProps = {
  open: boolean;
  onClose: () => void;
  eventHeadline: string;
  eventDate?: string;
  venue?: string;
  receptionLocation?: string;
  quickContacts: RunOfShowQuickContactRow[];
  mustPlaySongs: SongEntry[];
  doNotPlaySongs: SongEntry[];
  showMustPlay: boolean;
  showDoNotPlay: boolean;
};

function sectionLabelClass() {
  return "text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500 md:text-xs";
}

function EventAtAGlanceBlock({
  headline,
  eventDate,
  venue,
  receptionLocation,
}: {
  headline: string;
  eventDate?: string;
  venue?: string;
  receptionLocation?: string;
}) {
  const dateLabel = eventDate?.trim() ?? "";
  const venueLabel = venue?.trim() ?? "";
  const receptionLabel = receptionLocation?.trim() ?? "";
  const hasDetails = Boolean(dateLabel || venueLabel || receptionLabel);

  return (
    <details className="group rounded-xl border border-stone-200/90 bg-stone-50/50 open:bg-stone-50/80" open>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3.5 py-3 touch-manipulation sm:px-4 sm:py-3.5 [&::-webkit-details-marker]:hidden">
        <span className={sectionLabelClass()}>Event at a glance</span>
        <span className="text-[11px] font-medium text-stone-400 transition group-open:rotate-180" aria-hidden>
          ▾
        </span>
      </summary>
      <div className="border-t border-stone-200/80 px-3.5 pb-3.5 pt-2.5 sm:px-4 sm:pb-4">
        <p className="text-base font-semibold leading-snug text-stone-950 md:text-lg">
          {headline.trim() || "Event"}
        </p>
        {hasDetails ? (
          <dl className="mt-3 space-y-2 text-sm leading-snug text-stone-700 md:text-[15px]">
            {dateLabel ? (
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500">
                  Date
                </dt>
                <dd className="mt-0.5 font-medium text-stone-800">{dateLabel}</dd>
              </div>
            ) : null}
            {venueLabel ? (
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500">
                  Venue
                </dt>
                <dd className="mt-0.5 [overflow-wrap:anywhere]">{venueLabel}</dd>
              </div>
            ) : null}
            {receptionLabel ? (
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500">
                  Reception location
                </dt>
                <dd className="mt-0.5 [overflow-wrap:anywhere]">{receptionLabel}</dd>
              </div>
            ) : null}
          </dl>
        ) : (
          <p className="mt-2 text-sm leading-snug text-stone-500">No additional event details listed</p>
        )}
      </div>
    </details>
  );
}

/** Read-only quick reference drawer for Run Of Show — contacts, song guardrails, event context. */
export function RunOfShowReferenceDrawer({
  open,
  onClose,
  eventHeadline,
  eventDate,
  venue,
  receptionLocation,
  quickContacts,
  mustPlaySongs,
  doNotPlaySongs,
  showMustPlay,
  showDoNotPlay,
}: RunOfShowReferenceDrawerProps) {
  const requestClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        requestClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, requestClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[210] flex items-end justify-center pointer-events-none md:items-stretch md:justify-end md:p-4 md:pb-[max(1rem,env(safe-area-inset-bottom))] md:pt-[max(1rem,env(safe-area-inset-top))]"
      role="dialog"
      aria-modal="true"
      aria-label="Run Of Show quick reference"
    >
      <button
        type="button"
        className="pointer-events-auto absolute inset-0 bg-black/50 md:bg-black/45"
        aria-label="Close quick reference"
        onClick={requestClose}
      />
      <div className="pointer-events-auto relative flex h-[min(88dvh,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-1rem))] max-h-[min(88dvh,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-1rem))] w-full min-h-0 flex-col overflow-hidden rounded-t-3xl border border-stone-200 bg-white shadow-2xl shadow-stone-900/15 md:h-full md:max-h-none md:max-w-md md:rounded-3xl lg:max-w-lg">
        <header className="relative z-10 shrink-0 border-b border-stone-200 bg-white px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5 sm:py-4 md:pt-4">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400">
                Quick reference
              </p>
              <p className="mt-1 text-lg font-semibold leading-snug text-stone-950 sm:text-xl">
                Live event info
              </p>
              <p className="mt-1 text-xs leading-snug text-stone-500 sm:text-sm">
                Read-only contacts and guardrails — stay in Run Of Show.
              </p>
            </div>
            <PrimaryButton
              type="button"
              onClick={requestClose}
              className="min-h-11 shrink-0 touch-manipulation rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-stone-900 shadow-sm hover:bg-stone-50"
            >
              Close
            </PrimaryButton>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 sm:py-5">
          <div className="space-y-3">
            <RunOfShowReferenceQuickContactsBlock contacts={quickContacts} />
            {showMustPlay ? (
              <RunOfShowReferenceSongListBlock
                title="Must play"
                songs={mustPlaySongs}
                emptyLabel="No must-play songs listed"
              />
            ) : null}
            {showDoNotPlay ? (
              <RunOfShowReferenceSongListBlock
                title="Do not play"
                songs={doNotPlaySongs}
                emptyLabel="No blocked songs listed"
                tone="blocked"
              />
            ) : null}
            <EventAtAGlanceBlock
              headline={eventHeadline}
              eventDate={eventDate}
              venue={venue}
              receptionLocation={receptionLocation}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
