"use client";

import type { ReactNode } from "react";

import { PrimaryButton, lightUiSecondaryButtonClass } from "@/components/planning-ui";

type CoupleTimelineMomentHomeRefPanelProps = {
  summary: ReactNode;
  emptyMessage?: string;
  isEmpty?: boolean;
  actionLabel: string;
  onAction: () => void;
};

export function CoupleTimelineMomentHomeRefPanel({
  summary,
  emptyMessage = "Nothing added here yet.",
  isEmpty = false,
  actionLabel,
  onAction,
}: CoupleTimelineMomentHomeRefPanelProps) {
  return (
    <div className="space-y-4">
      {isEmpty ? (
        <p className="text-sm leading-relaxed text-stone-500">{emptyMessage}</p>
      ) : (
        <div className="space-y-2 text-sm leading-relaxed text-stone-800">{summary}</div>
      )}
      <PrimaryButton
        type="button"
        onClick={onAction}
        className={`w-full sm:w-auto ${lightUiSecondaryButtonClass}`}
      >
        {actionLabel}
      </PrimaryButton>
    </div>
  );
}

export function CoupleTimelineMomentRefFact({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  if (!value.trim()) return null;
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400">{label}</p>
      <p className="mt-0.5 font-medium text-stone-900">{value}</p>
    </div>
  );
}
