"use client";

import { useCoupleMobileActionHandlers } from "@/components/couple-mobile-action-button";
import type {
  CoupleFinalPlanningHint,
  CoupleFinalPlanningQuickLink,
} from "@/lib/coupleFinalPlanningPrep";
import type { Screen } from "@/types/planning";

export type CoupleFinalPlanningPrepDashboardProps = {
  hints: CoupleFinalPlanningHint[];
  quickLinks?: CoupleFinalPlanningQuickLink[];
  assignedDjName?: string | null;
  plannerName?: string | null;
  onNavigate: (screen: Screen) => void;
  onPreviewEventPlan?: () => void;
};

function HintRow({
  hint,
  onNavigate,
}: {
  hint: CoupleFinalPlanningHint;
  onNavigate: (screen: Screen) => void;
}) {
  const mobileActionHandlers = useCoupleMobileActionHandlers(() => onNavigate(hint.targetScreen));

  return (
    <li>
      <button
        type="button"
        {...mobileActionHandlers}
        className="group flex w-full min-h-11 items-center justify-between gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f4a3e]/35"
      >
        <p className="text-[14px] font-medium leading-snug text-stone-700 group-hover:text-stone-900">
          {hint.message}
        </p>
        <span className="shrink-0 text-[13px] text-stone-400 transition group-hover:text-stone-600">
          →
        </span>
      </button>
    </li>
  );
}

function PreviewEventPlanLink({ onAction }: { onAction: () => void }) {
  const mobileActionHandlers = useCoupleMobileActionHandlers(onAction);

  return (
    <button
      type="button"
      className="min-h-11 touch-manipulation text-left text-[14px] font-medium text-[#2f4a3e] underline-offset-2 transition hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f4a3e]/35"
      {...mobileActionHandlers}
    >
      Preview your Event Plan
    </button>
  );
}

export function CoupleFinalPlanningPrepDashboard({
  hints,
  assignedDjName,
  plannerName,
  onNavigate,
  onPreviewEventPlan,
}: CoupleFinalPlanningPrepDashboardProps) {
  const teamParts: string[] = [];
  if (assignedDjName?.trim()) teamParts.push(`DJ ${assignedDjName.trim()}`);
  if (plannerName?.trim()) teamParts.push(`Planner ${plannerName.trim()}`);

  return (
    <div className="space-y-5">
      <div className="cm-dashboard-v3-card px-6 py-7 sm:px-8 sm:py-8">
        <p className="text-[15px] leading-relaxed text-stone-700">
          We&apos;ve got the vision. Your final planning meeting is a relaxed working session—we&apos;ll
          walk through your timeline, music, and anything else on your mind.
        </p>
        {teamParts.length > 0 ? (
          <p className="mt-4 text-[13px] text-stone-500">
            Your team: {teamParts.join(" · ")}
          </p>
        ) : null}
        {onPreviewEventPlan ? (
          <div className="mt-5">
            <PreviewEventPlanLink onAction={onPreviewEventPlan} />
          </div>
        ) : null}
      </div>

      {hints.length > 0 ? (
        <div>
          <h3 className="cm-dashboard-v3-eyebrow">
            Nice touches, if you have a moment
          </h3>
          <ul className="mt-3 divide-y divide-black/[0.04]">
            {hints.map((hint) => (
              <HintRow key={hint.id} hint={hint} onNavigate={onNavigate} />
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
