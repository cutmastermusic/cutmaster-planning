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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-3 sm:items-center sm:p-5">
      <div className="max-h-[min(92vh,880px)] w-full max-w-md overflow-y-auto overscroll-contain rounded-3xl border border-white/10 bg-white/98 p-5 shadow-2xl shadow-stone-900/12 cm-section-enter sm:max-h-[88vh] sm:max-w-2xl">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-stone-950">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-900 shadow-sm hover:bg-stone-100"
          >
            Close
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}