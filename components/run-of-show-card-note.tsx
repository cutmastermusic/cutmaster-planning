type RunOfShowCardNoteProps = {
  value: string;
  onChange: (value: string) => void;
  onExpandEditor?: () => void;
  done?: boolean;
};

/** Lightweight operational note beside a Run Of Show card (local DJ scratch pad). */
export function RunOfShowCardNote({
  value,
  onChange,
  onExpandEditor,
  done = false,
}: RunOfShowCardNoteProps) {
  return (
    <div className="flex min-h-0 flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        {onExpandEditor ? (
          <button
            type="button"
            onClick={onExpandEditor}
            className="text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400 transition hover:text-stone-600"
          >
            Device scratch pad
          </button>
        ) : (
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400">
            Device scratch pad
          </span>
        )}
        {onExpandEditor ? (
          <button
            type="button"
            onClick={onExpandEditor}
            className="shrink-0 touch-manipulation rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-stone-500 transition hover:bg-stone-100 hover:text-stone-800"
            aria-label="Open device scratch pad in larger editor"
          >
            Expand
          </button>
        ) : null}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="This iPad only — quick reminder…"
        rows={2}
        className={`min-h-[3.25rem] w-full resize-y touch-manipulation rounded-lg border border-stone-200/90 bg-white/90 px-2.5 py-2 text-sm leading-snug text-stone-800 placeholder:text-stone-400 focus:border-stone-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-200 md:min-h-[4.5rem] md:text-[13px] md:leading-relaxed ${done ? "opacity-75" : ""}`}
      />
      {value.trim() ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="self-start touch-manipulation text-[11px] font-medium text-stone-400 transition hover:text-stone-600"
        >
          Clear note
        </button>
      ) : null}
    </div>
  );
}
