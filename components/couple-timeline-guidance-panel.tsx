"use client";

import { PremiumCard } from "@/components/planning-ui";

export type CoupleTimelineGuidancePanelProps = {
  gapLabels: string[];
};

export function CoupleTimelineGuidancePanel({ gapLabels }: CoupleTimelineGuidancePanelProps) {
  const hasGaps = gapLabels.length > 0;

  return (
    <PremiumCard className="no-print border-[#00D4FF]/25 bg-gradient-to-br from-[#00D4FF]/[0.06] via-white to-stone-50/80">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
        Final planning meeting
      </p>
      <h3 className="mt-2 text-lg font-semibold leading-snug text-stone-950">
        Before Your Final Planning Meeting
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-stone-700">
        Use this timeline to add or review the key times, songs, and notes for your wedding day.
        We&apos;ll review this together during your final planning meeting, so don&apos;t worry if
        you&apos;re still waiting on a few details.
      </p>
      <p className="mt-2 text-sm leading-relaxed text-stone-600">
        Walk through your day from ceremony to reception—add details anywhere they feel clear.
      </p>

      {hasGaps ? (
        <details className="group mt-4 rounded-xl border border-stone-200/90 bg-white/80 shadow-sm">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3.5 py-2.5 text-sm font-medium text-stone-900 [&::-webkit-details-marker]:hidden">
            <span>Timeline items to revisit ({gapLabels.length})</span>
            <span
              className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500 transition-transform group-open:rotate-180"
              aria-hidden
            >
              ▼
            </span>
          </summary>
          <ul className="space-y-1.5 border-t border-stone-200/90 px-3.5 pb-3.5 pt-2">
            {gapLabels.map((label) => (
              <li
                key={label}
                className="flex items-start gap-2 text-[13px] leading-snug text-stone-800"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#00D4FF]" aria-hidden />
                <span>{label}</span>
              </li>
            ))}
          </ul>
        </details>
      ) : (
        <p className="mt-3 rounded-lg border border-stone-200/90 bg-white/70 px-3 py-2 text-xs leading-relaxed text-stone-600">
          Your timeline looks well filled in—helpful to revisit before your meeting.
        </p>
      )}
    </PremiumCard>
  );
}
