"use client";

import {
  emailMailtoHref,
  getSongListPreviewContent,
  phoneTelHref,
  type RunOfShowQuickContactRow,
} from "@/lib/runOfShowLiveReference";
import type { SongEntry } from "@/types/planning";

type RunOfShowLiveReferenceProps = {
  doNotPlaySongs: SongEntry[];
  mustPlaySongs: SongEntry[];
  quickContacts: RunOfShowQuickContactRow[];
  showDoNotPlay: boolean;
  showMustPlay: boolean;
};

function sectionLabelClass() {
  return "text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500 md:text-xs";
}

function SongListBlock({
  title,
  songs,
  emptyLabel,
  tone = "neutral",
}: {
  title: string;
  songs: SongEntry[];
  emptyLabel: string;
  tone?: "neutral" | "blocked";
}) {
  const preview = getSongListPreviewContent(songs, 5);
  const rowClass =
    tone === "blocked"
      ? "text-sm leading-snug text-stone-800 md:text-[15px]"
      : "text-sm leading-snug text-stone-800 md:text-[15px]";

  return (
    <details className="group rounded-xl border border-stone-200/90 bg-stone-50/50 open:bg-stone-50/80" open>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3.5 py-3 touch-manipulation sm:px-4 sm:py-3.5 [&::-webkit-details-marker]:hidden">
        <span className={sectionLabelClass()}>{title}</span>
        <span className="text-[11px] font-medium text-stone-400 transition group-open:rotate-180" aria-hidden>
          ▾
        </span>
      </summary>
      <div className="border-t border-stone-200/80 px-3.5 pb-3.5 pt-2.5 sm:px-4 sm:pb-4">
        {preview.isEmpty ? (
          <p className="text-sm leading-snug text-stone-500">{emptyLabel}</p>
        ) : (
          <ul className="space-y-2">
            {preview.rows.map((row) => (
              <li key={row.id} className={rowClass}>
                <span className="[overflow-wrap:anywhere]">{row.primary}</span>
                {row.highPriority ? (
                  <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wide text-rose-700/90">
                    Priority
                  </span>
                ) : null}
              </li>
            ))}
            {preview.moreCount > 0 ? (
              <li className="text-xs font-medium text-stone-500">
                + {preview.moreCount} more
              </li>
            ) : null}
          </ul>
        )}
      </div>
    </details>
  );
}

function QuickContactsBlock({ contacts }: { contacts: RunOfShowQuickContactRow[] }) {
  return (
    <details className="group rounded-xl border border-stone-200/90 bg-stone-50/50 open:bg-stone-50/80" open>
      <summary className="flex cursor-pointer list-none items-start justify-between gap-3 px-3.5 py-3 touch-manipulation sm:px-4 sm:py-3.5 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0 flex-1">
          <span className={sectionLabelClass()}>Key live contacts</span>
          <p className="mt-1 text-[11px] leading-snug text-stone-500 md:text-xs">
            Essential event-day contacts
          </p>
        </div>
        <span
          className="mt-0.5 shrink-0 text-[11px] font-medium text-stone-400 transition group-open:rotate-180"
          aria-hidden
        >
          ▾
        </span>
      </summary>
      <div className="border-t border-stone-200/80 px-3.5 pb-3.5 pt-2.5 sm:px-4 sm:pb-4">
        {contacts.length === 0 ? (
          <p className="text-sm leading-snug text-stone-500">
            No key contacts yet — add planner, photographer, or venue on Event Team, or assign a DJ
            in Event Settings.
          </p>
        ) : (
          <>
            <p className="mb-3 text-[11px] leading-snug text-stone-500 md:text-xs">
              Selected for live execution — not the full Event Team roster.
            </p>
            <ul className="space-y-2.5">
              {contacts.map((contact) => {
                const tel = contact.phone ? phoneTelHref(contact.phone) : "";
                const mail = contact.email ? emailMailtoHref(contact.email) : "";
                return (
                  <li
                    key={contact.id}
                    className="rounded-xl border border-stone-200/90 bg-white px-3 py-3 sm:px-3.5 sm:py-3.5"
                  >
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-800 md:text-xs md:tracking-[0.16em]">
                      {contact.roleLabel}
                    </p>
                    <p className="mt-1.5 text-sm font-medium leading-snug text-stone-700 [overflow-wrap:anywhere] md:text-[15px]">
                      {contact.name}
                    </p>
                    {contact.company ? (
                      <p className="mt-0.5 text-xs leading-snug text-stone-500 [overflow-wrap:anywhere]">
                        {contact.company}
                      </p>
                    ) : null}
                    {tel || mail ? (
                      <div className="mt-2.5 flex flex-wrap gap-2">
                        {tel ? (
                          <a
                            href={tel}
                            className="inline-flex min-h-10 touch-manipulation items-center rounded-lg border border-stone-300 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-800 transition hover:border-stone-400 hover:bg-white"
                          >
                            Call
                          </a>
                        ) : null}
                        {mail ? (
                          <a
                            href={mail}
                            className="inline-flex min-h-10 touch-manipulation items-center rounded-lg border border-stone-300 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-800 transition hover:border-stone-400 hover:bg-white"
                          >
                            Email
                          </a>
                        ) : null}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </details>
  );
}

export function RunOfShowLiveReference({
  doNotPlaySongs,
  mustPlaySongs,
  quickContacts,
  showDoNotPlay,
  showMustPlay,
}: RunOfShowLiveReferenceProps) {
  return (
    <section className="mb-10 border-t border-stone-200 pt-12 sm:mb-12">
      <h3 className="border-b border-stone-200 pb-3 text-xs font-semibold uppercase tracking-[0.18em] text-stone-600 md:text-sm md:tracking-[0.16em]">
        Live reference
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-stone-600 md:text-[15px]">
        Quick read-only guardrails and contacts — no need to leave Run Of Show.
      </p>
      <div className="mt-6 space-y-3">
        {showDoNotPlay ? (
          <SongListBlock
            title="Do not play"
            songs={doNotPlaySongs}
            emptyLabel="No blocked songs listed"
            tone="blocked"
          />
        ) : null}
        {showMustPlay ? (
          <SongListBlock
            title="Must play"
            songs={mustPlaySongs}
            emptyLabel="No must-play songs listed"
          />
        ) : null}
        <QuickContactsBlock contacts={quickContacts} />
      </div>
    </section>
  );
}
