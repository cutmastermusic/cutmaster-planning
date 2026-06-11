"use client";

import {
  CoupleMobileActionButton,
  useCoupleMobileActionHandlers,
} from "@/components/couple-mobile-action-button";
import {
  lightUiCyanPrimaryButtonClass,
  lightUiSecondaryButtonClass,
} from "@/components/planning-ui";

export type CoupleDashboardCompletionCardProps = {
  onStartTimeline: () => void;
  onOpenMusicHub: () => void;
  onPreviewEventPlan: () => void;
};

function PreviewEventPlanLink({ onAction }: { onAction: () => void }) {
  const { onPointerDown, onClick } = useCoupleMobileActionHandlers(onAction);

  return (
    <button
      type="button"
      className="min-h-12 touch-manipulation self-start rounded-lg px-3 py-3 text-left text-sm font-semibold text-stone-700 underline-offset-2 transition hover:text-stone-950 hover:underline active:bg-stone-100/80 active:text-stone-950 active:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00D4FF]/60"
      onPointerDown={onPointerDown}
      onClick={onClick}
    >
      Preview Your Event Plan
    </button>
  );
}

export function CoupleDashboardCompletionCard({
  onStartTimeline,
  onOpenMusicHub,
  onPreviewEventPlan,
}: CoupleDashboardCompletionCardProps) {
  return (
    <div className="rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/80 via-white to-[#00D4FF]/[0.05] px-5 py-5 shadow-sm sm:px-6 sm:py-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
        Planning complete
      </p>
      <h3 className="mt-2 text-lg font-semibold leading-snug text-stone-950 sm:text-xl">
        🎉 Your Planning Story Is Complete
      </h3>
      <p className="mt-2 text-sm font-medium leading-relaxed text-stone-800">
        We&apos;ve got the vision. Now we need the details.
      </p>
      <p className="mt-2 text-sm leading-relaxed text-stone-700">
        Before your final planning meeting, please complete your timeline, music selections, and any
        remaining event details. This helps us prepare your Event Plan and ensures we&apos;re ready for a
        productive final review together.
      </p>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <CoupleMobileActionButton
          onAction={onStartTimeline}
          className={`w-full sm:w-auto sm:min-w-[14rem] ${lightUiCyanPrimaryButtonClass}`}
        >
          Start Your Timeline
        </CoupleMobileActionButton>
        <CoupleMobileActionButton
          onAction={onOpenMusicHub}
          className={`w-full sm:w-auto sm:min-w-[12rem] ${lightUiSecondaryButtonClass}`}
        >
          Open Music Hub
        </CoupleMobileActionButton>
      </div>
      <div className="mt-3">
        <PreviewEventPlanLink onAction={onPreviewEventPlan} />
      </div>
    </div>
  );
}
