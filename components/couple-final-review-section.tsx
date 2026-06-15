"use client";

import { useMemo } from "react";

import {
  CoupleMobileActionButton,
  CoupleMobileActionFooter,
  coupleMobileActionContentSpacerClass,
  useCoupleMobileActionHandlers,
} from "@/components/couple-mobile-action-button";
import {
  PremiumCard,
  lightUiCouplePrimaryButtonClass,
  lightUiSecondaryButtonClass,
  premiumFormSectionCardClass,
} from "@/components/planning-ui";
import {
  buildCoupleFinalReviewWeddingSummary,
  buildCoupleOperationalReadinessRows,
  coupleReadinessStatusPillClass,
  type CoupleFinalReviewSummaryInput,
  type CoupleFinalReviewWeddingSummary,
  type CoupleOperationalReadinessInput,
  type CoupleOperationalReadinessRow,
} from "@/lib/coupleFinalReviewPlanning";
import type { CoupleWeddingChapterId, CoupleWeddingChapterStatus } from "@/lib/coupleWeddingJourney";

export type CoupleFinalReviewChapterRow = {
  id: CoupleWeddingChapterId;
  title: string;
  status: CoupleWeddingChapterStatus;
};

export type CoupleFinalReviewSectionProps = {
  storyChapterRows: CoupleFinalReviewChapterRow[];
  operationalReadinessInput: CoupleOperationalReadinessInput;
  finalReviewSummaryInput: CoupleFinalReviewSummaryInput;
  isChapterComplete: boolean;
  onOpenStoryChapter: (chapterId: CoupleWeddingChapterId) => void;
  onOpenTimeline: () => void;
  onOpenMusicHub: () => void;
  onOpenEventTeam: () => void;
  onOpenEventDocument: () => void;
  onReturnToDashboard: () => void;
};

function readinessRowActionLabel(status: CoupleWeddingChapterStatus): string {
  if (status === "Complete") return "Review";
  if (status === "In Progress") return "Continue";
  return "Open";
}

const finalReviewIncompleteSpacerClass =
  "pb-[calc(env(safe-area-inset-bottom,0px)+6rem)] md:pb-0";

function ReadinessStatusRow({
  label,
  status,
  detail,
  actionLabel,
  onAction,
}: {
  label: string;
  status?: CoupleWeddingChapterStatus;
  detail: string;
  actionLabel: string;
  onAction: () => void;
}) {
  const mobileActionHandlers = useCoupleMobileActionHandlers(onAction);

  return (
    <button
      type="button"
      {...mobileActionHandlers}
      className="group flex w-full min-h-12 touch-manipulation items-start justify-between gap-3 rounded-xl border border-stone-200/90 bg-stone-50/70 px-4 py-3.5 text-left transition hover:border-[#2f4a3e]/30 hover:bg-[#2f4a3e]/[0.03] active:scale-[0.99] active:border-[#2f4a3e]/40 active:bg-[#2f4a3e]/[0.05] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f4a3e]/40"
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold text-stone-950">{label}</p>
        <p className="mt-1 text-xs leading-relaxed text-stone-600">{detail}</p>
        <p className="mt-2 text-xs font-semibold text-stone-700 transition group-hover:text-stone-950">
          {actionLabel} →
        </p>
      </div>
      {status ? (
        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${coupleReadinessStatusPillClass(status)}`}
        >
          {status}
        </span>
      ) : null}
    </button>
  );
}

function operationalRowAction(
  row: CoupleOperationalReadinessRow,
  onOpenTimeline: () => void,
  onOpenMusicHub: () => void,
  onOpenEventTeam: () => void,
): () => void {
  switch (row.id) {
    case "timeline":
      return onOpenTimeline;
    case "music_hub":
      return onOpenMusicHub;
    case "event_team":
      return onOpenEventTeam;
  }
}

function GlanceFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-500">{label}</p>
      <p className="mt-1 text-sm font-medium leading-snug text-stone-950">{value}</p>
    </div>
  );
}

function ChapterSummaryBlock({
  title,
  lines,
}: {
  title: string;
  lines: CoupleFinalReviewWeddingSummary["chapters"][number]["lines"];
}) {
  return (
    <div className="rounded-xl border border-stone-200/90 bg-white/80 px-4 py-4">
      <p className="text-sm font-semibold text-stone-950">{title}</p>
      <dl className="mt-3 space-y-2.5">
        {lines.map((line) => (
          <div key={`${title}-${line.label}`}>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-stone-500">
              {line.label}
            </dt>
            <dd className="mt-0.5 text-sm leading-relaxed text-stone-800">{line.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function CoupleFinalReviewCompletionCelebration({
  summary,
  onOpenEventDocument,
  onReturnToDashboard,
}: {
  summary: CoupleFinalReviewWeddingSummary;
  onOpenEventDocument: () => void;
  onReturnToDashboard: () => void;
}) {
  const hasGlanceFacts = Boolean(summary.coupleNames || summary.weddingDate || summary.venue);

  return (
    <>
      <PremiumCard className={`${premiumFormSectionCardClass} ${coupleMobileActionContentSpacerClass}`}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">Final Review</p>

        <div className="mt-4 rounded-xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/95 via-white to-[#2f4a3e]/[0.04] px-5 py-6">
          <h3 className="text-xl font-semibold leading-snug text-emerald-950 sm:text-2xl">
            🎉 Final review complete
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-stone-800">
            You&apos;ve shared your story, your ceremony vision, your reception plans, your music
            preferences, and the team helping bring everything together.
          </p>
          <p className="mt-2 text-sm font-medium leading-relaxed text-emerald-950">
            We&apos;re ready to start building your wedding experience.
          </p>
        </div>

        {hasGlanceFacts || summary.chapters.length > 0 ? (
          <div className="mt-6 space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
              Your wedding at a glance
            </p>

            {hasGlanceFacts ? (
              <div className="rounded-xl border border-stone-200/90 bg-stone-50/70 px-4 py-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  {summary.coupleNames ? (
                    <GlanceFact label="Couple" value={summary.coupleNames} />
                  ) : null}
                  {summary.weddingDate ? (
                    <GlanceFact label="Wedding date" value={summary.weddingDate} />
                  ) : null}
                  {summary.venue ? <GlanceFact label="Venue" value={summary.venue} /> : null}
                </div>
              </div>
            ) : null}

            {summary.chapters.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {summary.chapters.map((chapter) => (
                  <ChapterSummaryBlock key={chapter.title} title={chapter.title} lines={chapter.lines} />
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-6 rounded-xl border border-stone-200/90 bg-stone-50/60 px-4 py-4">
          <p className="text-sm font-semibold text-stone-950">What happens next?</p>
          <p className="mt-2 text-sm leading-relaxed text-stone-700">
            Your planning foundation is complete.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-stone-700">
            You can continue refining songs, timelines, and details anytime, and your DJ team now has
            the information needed to begin preparing for your wedding day.
          </p>
        </div>

        <CoupleMobileActionFooter>
          <CoupleMobileActionButton
            onAction={onOpenEventDocument}
            className={`w-full sm:w-auto sm:min-w-[14rem] ${lightUiCouplePrimaryButtonClass}`}
          >
            Preview Your Event Plan
          </CoupleMobileActionButton>
          <CoupleMobileActionButton
            onAction={onReturnToDashboard}
            className={`w-full sm:w-auto sm:min-w-[12rem] ${lightUiSecondaryButtonClass}`}
          >
            Return to Dashboard
          </CoupleMobileActionButton>
        </CoupleMobileActionFooter>
      </PremiumCard>
    </>
  );
}

export function CoupleFinalReviewSection({
  storyChapterRows,
  operationalReadinessInput,
  finalReviewSummaryInput,
  isChapterComplete,
  onOpenStoryChapter,
  onOpenTimeline,
  onOpenMusicHub,
  onOpenEventTeam,
  onOpenEventDocument,
  onReturnToDashboard,
}: CoupleFinalReviewSectionProps) {
  const operationalRows = buildCoupleOperationalReadinessRows(operationalReadinessInput);
  const weddingSummary = useMemo(
    () => buildCoupleFinalReviewWeddingSummary(finalReviewSummaryInput),
    [finalReviewSummaryInput],
  );

  if (isChapterComplete) {
    return (
      <CoupleFinalReviewCompletionCelebration
        summary={weddingSummary}
        onOpenEventDocument={onOpenEventDocument}
        onReturnToDashboard={onReturnToDashboard}
      />
    );
  }

  return (
    <PremiumCard className={`${premiumFormSectionCardClass} ${finalReviewIncompleteSpacerClass}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">Final Review</p>
      <h3 className="mt-2 text-lg font-semibold leading-snug text-stone-950 sm:text-xl">
        Ready for a final pass?
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-stone-700">
        Review each part of your wedding plan. If something needs attention, tap it and we&apos;ll take you
        there.
      </p>
      <p className="mt-2 text-sm leading-relaxed text-stone-700">
        Finish any chapters below still marked incomplete.
      </p>

      <div className="mt-6 space-y-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
            Your wedding story
          </p>
          <div className="mt-3 space-y-2">
            {storyChapterRows.map((row) => (
              <ReadinessStatusRow
                key={row.id}
                label={row.title}
                status={row.status}
                detail={
                  row.status === "Complete"
                    ? "Chapter complete"
                    : row.status === "In Progress"
                      ? "Pick up where you left off"
                      : "Not started yet"
                }
                actionLabel={readinessRowActionLabel(row.status)}
                onAction={() => onOpenStoryChapter(row.id)}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
            Optional Next Steps
          </p>
          <div className="mt-3 space-y-2">
            {operationalRows.map((row) => (
              <ReadinessStatusRow
                key={row.id}
                label={row.label}
                status={row.status}
                detail={row.detail}
                actionLabel={readinessRowActionLabel(row.status)}
                onAction={operationalRowAction(row, onOpenTimeline, onOpenMusicHub, onOpenEventTeam)}
              />
            ))}
            <ReadinessStatusRow
              label="Event Plan"
              detail="Preview what your team will see."
              actionLabel="Open"
              onAction={onOpenEventDocument}
            />
          </div>
        </div>
      </div>
    </PremiumCard>
  );
}
