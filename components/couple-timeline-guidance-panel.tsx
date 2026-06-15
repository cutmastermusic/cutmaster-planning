"use client";

import { PremiumCard } from "@/components/planning-ui";

export type CoupleTimelineGuidancePanelProps = {
  gapLabels: string[];
};

export function CoupleTimelineGuidancePanel({ gapLabels }: CoupleTimelineGuidancePanelProps) {
  const hasGaps = gapLabels.length > 0;

  return (
    <PremiumCard className="no-print border-stone-200/90 bg-gradient-to-br from-stone-50/80 via-white to-[#2f4a3e]/[0.03]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
        Before we meet
      </p>
      <h3 className="mt-2 text-lg font-semibold leading-snug text-stone-950">
        Your timeline, at your pace
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-stone-700">
        Use this timeline to add or adjust times, songs, and notes for your wedding day. We&apos;ll walk
        through it together at your final planning meeting—it&apos;s okay if a few details are still
        TBD.
      </p>
      <p className="mt-2 text-sm leading-relaxed text-stone-600">
        Move through your day from ceremony to reception—add details anywhere they feel clear.
      </p>

      {hasGaps ? (
        <details className="group mt-4 rounded-xl border border-stone-200/90 bg-white/80 shadow-sm">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3.5 py-2.5 text-sm font-medium text-stone-900 [&::-webkit-details-marker]:hidden">
            <span>A few timeline ideas ({gapLabels.length})</span>
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
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2f4a3e]" aria-hidden />
                <span>{label}</span>
              </li>
            ))}
          </ul>
        </details>
      ) : (
        <p className="mt-3 rounded-lg border border-stone-200/90 bg-white/70 px-3 py-2 text-xs leading-relaxed text-stone-600">
          Your timeline has good coverage—worth a quick look before we meet.
        </p>
      )}
    </PremiumCard>
  );
}
