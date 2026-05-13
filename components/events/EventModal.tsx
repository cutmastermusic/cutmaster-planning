"use client";

type EventModalProps = {
  children: React.ReactNode;
};

export function EventModal({ children }: EventModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-3 sm:items-center sm:p-5">
      <div className="max-h-[min(92vh,880px)] w-full max-w-md overflow-y-auto overscroll-contain rounded-3xl border border-white/10 bg-white/98 p-5 shadow-2xl shadow-stone-900/12 cm-section-enter sm:max-h-[88vh] sm:max-w-2xl">
        {children}
      </div>
    </div>
  );
}