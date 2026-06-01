type RunOfShowCardNoteProps = {
  value: string;
  onOpenEditor: () => void;
  done?: boolean;
};

/** Read-only preview beside a Run Of Show card — opens the full editor on tap. */
export function RunOfShowCardNote({
  value,
  onOpenEditor,
  done = false,
}: RunOfShowCardNoteProps) {
  const hasNote = Boolean(value.trim());

  return (
    <div className="flex min-h-0 flex-col gap-1.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={onOpenEditor}
            className="text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400 transition hover:text-stone-600"
          >
            Day-of scratch pad
          </button>
          <p className="mt-0.5 text-[10px] leading-snug text-stone-400">
            Quick notes for this device only.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenEditor}
          className="shrink-0 touch-manipulation rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-stone-500 transition hover:bg-stone-100 hover:text-stone-800"
          aria-label="Open day-of scratch pad in larger editor"
        >
          Expand
        </button>
      </div>
      <button
        type="button"
        onClick={onOpenEditor}
        className={`min-h-[3.25rem] w-full touch-manipulation rounded-lg border border-stone-200/90 bg-white/90 px-2.5 py-2 text-left text-sm leading-snug transition hover:border-stone-300 hover:bg-white focus:border-stone-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-200 md:min-h-[4.5rem] md:text-[13px] md:leading-relaxed ${done ? "opacity-75" : ""}`}
        aria-label={
          hasNote
            ? "Open day-of scratch pad to view or edit saved note"
            : "Open day-of scratch pad to add a note"
        }
      >
        {hasNote ? (
          <span className="line-clamp-4 whitespace-pre-wrap text-stone-800">{value.trim()}</span>
        ) : (
          <span className="text-stone-400">Tap to add note</span>
        )}
      </button>
    </div>
  );
}
