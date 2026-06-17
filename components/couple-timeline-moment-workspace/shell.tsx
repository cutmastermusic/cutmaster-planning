"use client";

import type { ReactNode } from "react";

import {
  couplePlanningEyebrowClass,
  couplePlanningTitleClass,
} from "@/components/couple-planning-ui";
import { PrimaryButton, lightUiCouplePrimaryButtonClass } from "@/components/planning-ui";
import { timelineMomentTypeLabel, type TimelineMomentType } from "@/lib/timelineMomentType";

type CoupleTimelineMomentWorkspaceShellProps = {
  title: string;
  timeLabel: string;
  momentType: TimelineMomentType;
  onDone: () => void;
  showMomentTypeLabel?: boolean;
  showEmptyTimeLabel?: boolean;
  headerActions?: ReactNode;
  children: ReactNode;
};

export function CoupleTimelineMomentWorkspaceShell({
  title,
  timeLabel,
  momentType,
  onDone,
  showMomentTypeLabel = true,
  showEmptyTimeLabel = true,
  headerActions,
  children,
}: CoupleTimelineMomentWorkspaceShellProps) {
  const hasTimeLabel = Boolean(timeLabel.trim());
  const showMetadata = hasTimeLabel || showEmptyTimeLabel || showMomentTypeLabel;

  return (
    <div className="md:mx-auto md:w-full md:max-w-[44rem] lg:max-w-[52rem]">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3 border-b border-stone-200/90 pb-5 md:mb-8 md:pb-6">
        <div className="min-w-0 flex-1 space-y-2">
          <p className={couplePlanningEyebrowClass}>Timeline moment</p>
          <h3 className={`${couplePlanningTitleClass} !mt-1`}>{title}</h3>
          {showMetadata ? (
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              {hasTimeLabel ? (
                <span className="rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-sm font-medium text-stone-800">
                  {timeLabel.trim()}
                </span>
              ) : showEmptyTimeLabel ? (
                <span className="text-sm text-stone-500">Time not set yet</span>
              ) : null}
              {showMomentTypeLabel ? (
                <span className="inline-flex rounded-md border border-stone-200 bg-stone-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-600">
                  {timelineMomentTypeLabel(momentType)}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
        {headerActions ? <div className="flex shrink-0 flex-wrap gap-2">{headerActions}</div> : null}
      </div>

      <div className="space-y-8 pb-2 md:space-y-10">{children}</div>

      <div className="mt-8 border-t border-stone-200/90 pt-5 md:mt-10 md:pt-6">
        <PrimaryButton
          type="button"
          onClick={onDone}
          className={`w-full sm:w-auto sm:min-w-[12rem] ${lightUiCouplePrimaryButtonClass}`}
        >
          Done
        </PrimaryButton>
      </div>
    </div>
  );
}

type CoupleTimelineMomentWorkspaceSectionProps = {
  title: string;
  description?: string;
  homeLabel?: string;
  children: ReactNode;
};

export function CoupleTimelineMomentWorkspaceSection({
  title,
  description,
  homeLabel,
  children,
}: CoupleTimelineMomentWorkspaceSectionProps) {
  return (
    <section className="rounded-2xl border border-stone-200/55 bg-white/70 px-5 py-6 sm:px-7 sm:py-7">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="text-sm font-semibold tracking-tight text-stone-950 sm:text-[15px]">{title}</h4>
          {description ? (
            <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-stone-600">{description}</p>
          ) : null}
        </div>
        {homeLabel ? (
          <span className="shrink-0 rounded-md border border-stone-200 bg-stone-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500">
            Home · {homeLabel}
          </span>
        ) : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}
