"use client";

type CoupleTimelineMomentCardSummaryProps = {
  lines: string[];
  className?: string;
};

export function CoupleTimelineMomentCardSummary({
  lines,
  className = "",
}: CoupleTimelineMomentCardSummaryProps) {
  if (lines.length === 0) return null;

  return (
    <div className={`mt-2.5 space-y-1 ${className}`.trim()}>
      {lines.map((line, index) => (
        <p
          key={`${line}-${index}`}
          className="text-[15px] leading-snug text-stone-600 md:text-sm md:leading-relaxed"
        >
          {line}
        </p>
      ))}
    </div>
  );
}
