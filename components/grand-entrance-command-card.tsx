"use client";

import type { ReactNode } from "react";
import type { GrandEntranceDetailFields } from "@/lib/grandEntranceDetail";
import { getWeddingPartyLineupPreviewContent } from "@/lib/weddingPartyLineup";

type GrandEntranceCommandCardProps = {
  detail: GrandEntranceDetailFields;
  lineupRaw: string;
  songLabel?: string;
  done?: boolean;
  showOperationalSections: boolean;
  onOpenScriptModal?: () => void;
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

/** Read-only Grand Entrance operational reference for Run Of Show — full lineup and scripts. */
export function GrandEntranceCommandCard({
  detail,
  lineupRaw,
  songLabel,
  done = false,
  showOperationalSections,
  onOpenScriptModal,
}: GrandEntranceCommandCardProps) {
  const lineup = getWeddingPartyLineupPreviewContent(lineupRaw, undefined);
  const mcScript = detail.script.trim();
  const coupleScript = detail.coupleEntranceScript.trim();
  const coupleAnnouncement = detail.coupleEntrance.trim();

  const bodyMuted = done ? "text-stone-500" : "text-stone-800";
  const bodyStrong = done ? "text-stone-600" : "text-stone-950";

  return (
    <div
      className={`mt-6 rounded-2xl border border-stone-200/90 bg-stone-50/80 px-4 py-5 text-left sm:px-5 sm:py-6 ${
        done ? "opacity-90" : ""
      }`}
      aria-label="Grand Entrance command reference"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-600">
        Grand Entrance
      </p>

      {songLabel?.trim() ? (
        <CommandCardSection label="Song" done={done}>
          <p className={`text-lg font-semibold leading-snug sm:text-xl ${bodyStrong}`}>
            {songLabel.trim()}
          </p>
        </CommandCardSection>
      ) : null}

      {showOperationalSections ? (
        <CommandCardSection label="MC script" done={done}>
          {mcScript ? (
            <button
              type="button"
              onClick={onOpenScriptModal}
              className="block w-full touch-manipulation rounded-xl border border-stone-200/80 bg-white px-3 py-3 text-left transition hover:border-stone-300 hover:bg-stone-50 active:scale-[0.995]"
            >
              <span className={`block whitespace-pre-wrap text-sm leading-relaxed sm:text-[15px] ${bodyMuted}`}>
                {mcScript}
              </span>
              {onOpenScriptModal ? (
                <span className="mt-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-500">
                  Tap to view full script
                </span>
              ) : null}
            </button>
          ) : (
            <p className={emptyTextClass(done)}>No MC script yet</p>
          )}
        </CommandCardSection>
      ) : null}

      <CommandCardSection label="Wedding party lineup" done={done}>
        {lineup.isEmpty ? (
          <p className={emptyTextClass(done)}>No wedding party lineup yet</p>
        ) : (
          <ol className="list-none space-y-3 pl-0">
            {lineup.previewLines.map((line) => (
              <li key={line.primary}>
                <p className={`text-sm font-semibold leading-snug sm:text-[15px] ${bodyStrong}`}>
                  {line.primary}
                </p>
                {line.secondary ? (
                  <p className={`mt-0.5 text-xs leading-snug ${bodyMuted}`}>{line.secondary}</p>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </CommandCardSection>

      {showOperationalSections ? (
        <CommandCardSection label="Couple entrance script" done={done}>
          {coupleScript ? (
            <button
              type="button"
              onClick={onOpenScriptModal}
              className="block w-full touch-manipulation rounded-xl border border-stone-200/80 bg-white px-3 py-3 text-left transition hover:border-stone-300 hover:bg-stone-50 active:scale-[0.995]"
            >
              <span className={`block whitespace-pre-wrap text-sm leading-relaxed sm:text-[15px] ${bodyMuted}`}>
                {coupleScript}
              </span>
              {onOpenScriptModal ? (
                <span className="mt-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-500">
                  Tap to view full script
                </span>
              ) : null}
            </button>
          ) : (
            <p className={emptyTextClass(done)}>No couple entrance script yet</p>
          )}
        </CommandCardSection>
      ) : null}

      <CommandCardSection label="Couple entrance" done={done}>
        {coupleAnnouncement ? (
          <p className={`text-xl font-semibold leading-snug sm:text-2xl md:text-[1.65rem] md:leading-snug ${bodyStrong}`}>
            {coupleAnnouncement}
          </p>
        ) : (
          <p className={emptyTextClass(done)}>No couple announcement yet</p>
        )}
        <p className={`mt-1.5 text-xs leading-snug ${done ? "text-stone-400" : "text-stone-500"}`}>
          Announcement reference from event details.
        </p>
      </CommandCardSection>
    </div>
  );
}
