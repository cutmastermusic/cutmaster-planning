"use client";

import { useCallback, useEffect, useRef } from "react";
import { PrimaryButton, SectionTitle } from "@/components/planning-ui";

type RunOfShowCardNoteEditorProps = {
  open: boolean;
  cardLabel: string;
  cardSubline?: string;
  /** Value when the editor opened — used to detect unsaved edits. */
  savedValue: string;
  value: string;
  onChange: (value: string) => void;
  onDone: () => void;
  onCancel: () => void;
  onClear: () => void;
};

function noteDraftsEqual(a: string, b: string): boolean {
  return a.trim() === b.trim();
}

/** Focused Run Of Show side note editor — keyboard + Apple Pencil Scribble in a native textarea. */
export function RunOfShowCardNoteEditor({
  open,
  cardLabel,
  cardSubline,
  savedValue,
  value,
  onChange,
  onDone,
  onCancel,
  onClear,
}: RunOfShowCardNoteEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const isDirty = !noteDraftsEqual(value, savedValue);

  const requestCancel = useCallback(() => {
    if (isDirty && !window.confirm("Discard unsaved changes to this side note?")) return;
    onCancel();
  }, [isDirty, onCancel]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => textareaRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        requestCancel();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, requestCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[210] flex items-end justify-center bg-black/50 md:items-stretch md:justify-end md:bg-black/45 md:p-4 md:pb-[max(1rem,env(safe-area-inset-bottom))] md:pt-[max(1rem,env(safe-area-inset-top))]"
      role="dialog"
      aria-modal="true"
      aria-label={`Device scratch pad for ${cardLabel}`}
    >
      <div
        className="flex max-h-[min(84dvh,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-1rem))] w-full min-h-0 flex-col overflow-hidden rounded-t-3xl border border-stone-200 bg-white shadow-2xl shadow-stone-900/15 md:h-full md:max-h-none md:max-w-xl md:rounded-3xl lg:max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 flex-col gap-3 border-b border-stone-200 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5 sm:py-4 md:pt-4">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400">
                Device scratch pad
              </p>
              <p className="mt-0.5 text-[11px] leading-snug text-stone-500">This iPad only</p>
              <SectionTitle className="mt-1 text-stone-950">{cardLabel}</SectionTitle>
              {cardSubline?.trim() ? (
                <p className="mt-1 text-sm font-medium leading-snug text-stone-500">{cardSubline.trim()}</p>
              ) : null}
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
              <PrimaryButton
                type="button"
                onClick={requestCancel}
                className="min-h-11 min-w-[5.5rem] touch-manipulation rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-stone-900 shadow-sm hover:bg-stone-50"
              >
                Cancel
              </PrimaryButton>
              <PrimaryButton
                type="button"
                onClick={onDone}
                className="min-h-11 min-w-[5.5rem] touch-manipulation rounded-xl border border-stone-800 bg-stone-900 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-stone-800"
              >
                Done
              </PrimaryButton>
            </div>
          </div>
          {isDirty ? (
            <p className="text-[11px] font-medium text-amber-800/90" role="status">
              Unsaved changes — tap Done to save
            </p>
          ) : null}
          {value.trim() ? (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClear}
                className="touch-manipulation rounded-lg px-2.5 py-1.5 text-xs font-semibold text-stone-500 transition hover:bg-stone-100 hover:text-stone-800"
              >
                Clear draft
              </button>
            </div>
          ) : null}
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-4 py-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-5 sm:py-4">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="This iPad only — last-minute reminder…"
            className="min-h-[min(14rem,36vh)] w-full flex-1 resize-none touch-manipulation rounded-2xl border border-stone-200/90 bg-stone-50/50 px-4 py-4 text-base leading-relaxed text-stone-900 placeholder:text-stone-400 focus:border-stone-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-200/80 md:min-h-[16rem] md:text-lg md:leading-relaxed"
          />
          <p className="mt-3 text-[11px] font-medium leading-snug text-stone-400 md:text-xs">
            Type or use Apple Pencil Scribble. Saved on this device only — use Timeline shared
            team cues for notes the whole team should see.
          </p>
        </div>
      </div>
    </div>
  );
}
