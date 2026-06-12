"use client";

import { useCoupleMobileActionHandlers } from "@/components/couple-mobile-action-button";
import { PremiumCard } from "@/components/planning-ui";
import type {
  CoupleFinalPlanningHint,
  CoupleFinalPlanningQuickLink,
} from "@/lib/coupleFinalPlanningPrep";
import type { Screen } from "@/types/planning";

export type CoupleFinalPlanningPrepDashboardProps = {
  hints: CoupleFinalPlanningHint[];
  quickLinks: CoupleFinalPlanningQuickLink[];
  assignedDjName?: string | null;
  plannerName?: string | null;
  onNavigate: (screen: Screen) => void;
  onPreviewEventPlan?: () => void;
};

function QuickLinkTile({
  link,
  onNavigate,
}: {
  link: CoupleFinalPlanningQuickLink;
  onNavigate: (screen: Screen) => void;
}) {
  const { onPointerDown, onClick } = useCoupleMobileActionHandlers(() => onNavigate(link.screen));

  return (
    <button
      type="button"
      onPointerDown={onPointerDown}
      onClick={onClick}
      className="group flex min-h-[7.5rem] flex-col rounded-2xl border border-stone-300 bg-white px-4 py-4 text-left ring-1 ring-stone-200 transition hover:border-[#00D4FF]/55 hover:ring-[#00D4FF]/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00D4FF]/60 sm:min-h-0"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-stone-950">{link.label}</p>
        {link.badge ? (
          <span className="shrink-0 rounded-full border border-[#7E52A0]/35 bg-[#7E52A0]/10 px-2 py-0.5 text-[10px] font-semibold text-[#5a3d72]">
            {link.badge}
          </span>
        ) : null}
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-stone-600">{link.description}</p>
      {link.statLine ? (
        <p className="mt-2 text-xs font-medium text-stone-800">{link.statLine}</p>
      ) : null}
      <span className="mt-auto pt-3 text-xs font-semibold text-stone-700 transition group-hover:text-stone-950">
        Open →
      </span>
    </button>
  );
}

function HintRow({
  hint,
  onNavigate,
}: {
  hint: CoupleFinalPlanningHint;
  onNavigate: (screen: Screen) => void;
}) {
  const { onPointerDown, onClick } = useCoupleMobileActionHandlers(() => onNavigate(hint.targetScreen));

  return (
    <li>
      <button
        type="button"
        onPointerDown={onPointerDown}
        onClick={onClick}
        className="group flex w-full min-h-11 items-start justify-between gap-3 rounded-xl border border-stone-200/90 bg-stone-50/60 px-3.5 py-3 text-left transition hover:border-[#00D4FF]/45 hover:bg-[#00D4FF]/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00D4FF]/60"
      >
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500">
            {hint.areaLabel}
          </p>
          <p className="mt-1 text-sm leading-snug text-stone-800">{hint.message}</p>
        </div>
        <span className="shrink-0 pt-0.5 text-xs font-semibold text-stone-600 transition group-hover:text-stone-900">
          Open →
        </span>
      </button>
    </li>
  );
}

function PreviewEventPlanLink({ onAction }: { onAction: () => void }) {
  const { onPointerDown, onClick } = useCoupleMobileActionHandlers(onAction);

  return (
    <button
      type="button"
      className="min-h-12 touch-manipulation self-start rounded-lg px-1 py-2 text-left text-sm font-semibold text-stone-700 underline-offset-2 transition hover:text-stone-950 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00D4FF]/60"
      onPointerDown={onPointerDown}
      onClick={onClick}
    >
      Preview Your Event Plan
    </button>
  );
}

export function CoupleFinalPlanningPrepDashboard({
  hints,
  quickLinks,
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
      <div className="rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/80 via-white to-[#00D4FF]/[0.05] px-5 py-5 shadow-sm sm:px-6 sm:py-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
          Wedding journey complete
        </p>
        <h3 className="mt-2 text-lg font-semibold leading-snug text-stone-950 sm:text-xl">
          🎉 Your planning story is complete
        </h3>
        <p className="mt-2 text-sm font-medium leading-relaxed text-stone-800">
          We&apos;ve got the vision. Now we&apos;ll shape the day-of details together.
        </p>

        <div className="mt-5 rounded-xl border border-stone-200/90 bg-white/80 px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
            Your final planning meeting
          </p>
          <p className="mt-2 text-sm leading-relaxed text-stone-700">
            This is a working session with your Cutmaster team—not a test or submission. We&apos;ll walk
            through your timeline, music, ceremony cues, and anything else on your mind.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-stone-700">
            Bring questions, rough timing, and song ideas. Details you add here help us prepare your Event
            Plan so the conversation stays focused on your day.
          </p>
          {teamParts.length > 0 ? (
            <p className="mt-3 text-xs leading-relaxed text-stone-600">
              <span className="font-medium text-stone-800">Your team:</span> {teamParts.join(" · ")}
            </p>
          ) : null}
        </div>

        {onPreviewEventPlan ? (
          <div className="mt-4">
            <PreviewEventPlanLink onAction={onPreviewEventPlan} />
          </div>
        ) : null}
      </div>

      {quickLinks.length > 0 ? (
        <PremiumCard className="border-stone-200 bg-white shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
            Quick access
          </p>
          <p className="mt-2 text-sm leading-relaxed text-stone-700">
            Jump to the areas we&apos;ll most likely talk through together.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {quickLinks.map((link) => (
              <QuickLinkTile key={link.id} link={link} onNavigate={onNavigate} />
            ))}
          </div>
        </PremiumCard>
      ) : null}

      <PremiumCard className="border-stone-200 bg-white shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
          Helpful details
        </p>
        {hints.length > 0 ? (
          <>
            <p className="mt-2 text-sm leading-relaxed text-stone-700">
              A few things you might still add—optional, and helpful to revisit before your meeting.
            </p>
            <ul className="mt-4 space-y-2">
              {hints.map((hint) => (
                <HintRow key={hint.id} hint={hint} onNavigate={onNavigate} />
              ))}
            </ul>
          </>
        ) : (
          <p className="mt-2 text-sm leading-relaxed text-stone-700">
            Your timeline, music, and story look well filled in. You can still refine anything before your
            meeting—we&apos;ll walk through it together.
          </p>
        )}
      </PremiumCard>
    </div>
  );
}
