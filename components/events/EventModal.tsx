"use client";

type EventModalProps = {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
};

export function EventModal({
  title,
  onClose,
  children,
}: EventModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-modal-title"
    >
      <div className="pointer-events-none absolute inset-0 bg-[#1E1E1E]/55" aria-hidden />
      <div className="pointer-events-auto relative flex max-h-[min(92dvh,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-1.5rem))] w-full max-w-md min-h-0 flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/98 shadow-2xl shadow-stone-900/12 cm-section-enter sm:max-h-[88vh] sm:max-w-2xl">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-stone-200/70 px-5 py-4">
          <h2 id="event-modal-title" className="text-lg font-semibold text-stone-950">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="min-h-11 touch-manipulation rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-900 shadow-sm hover:bg-stone-100"
          >
            Close
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}
