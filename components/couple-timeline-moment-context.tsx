"use client";

import {
  coupleTimelineMomentReferenceHint,
  timelineMomentTypeLabel,
  type TimelineMomentType,
} from "@/lib/timelineMomentType";

type CoupleTimelineMomentContextProps = {
  momentType: TimelineMomentType;
  className?: string;
};

export function CoupleTimelineMomentContext({
  momentType,
  className = "",
}: CoupleTimelineMomentContextProps) {
  const hint = coupleTimelineMomentReferenceHint(momentType);

  return (
    <div className={`mt-2 space-y-1.5 ${className}`.trim()}>
      <span className="inline-flex rounded-md border border-stone-200 bg-stone-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-600">
        {timelineMomentTypeLabel(momentType)}
      </span>
      {hint ? (
        <p className="text-xs leading-relaxed text-stone-600">{hint}</p>
      ) : null}
    </div>
  );
}
