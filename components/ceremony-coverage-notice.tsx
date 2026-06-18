type CeremonyCoverageNoticeProps = {
  className?: string;
};

export function CeremonyCoverageNotice({ className = "" }: CeremonyCoverageNoticeProps) {
  return (
    <div
      className={`rounded-xl border border-amber-200/90 bg-amber-50/95 px-4 py-3 text-sm leading-relaxed text-stone-800 ${className}`}
      role="note"
    >
      <p className="font-semibold text-stone-900">
        Cutmaster Music is not providing ceremony audio.
      </p>
      <p className="mt-1 text-stone-700">Ceremony details are shown for context only.</p>
    </div>
  );
}
