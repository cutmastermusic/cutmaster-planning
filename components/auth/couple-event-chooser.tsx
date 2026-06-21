import { PremiumCard, PrimaryButton, SectionTitle } from "@/components/planning-ui";
import type { EventRecord } from "@/types/planning";

type CoupleEventChooserProps = {
  events: EventRecord[];
  onSelect: (eventId: string) => void;
};

export function CoupleEventChooser({ events, onSelect }: CoupleEventChooserProps) {
  return (
    <section className="mx-auto w-full max-w-lg px-5 py-16 sm:px-6">
      <div className="mx-auto mb-5 w-full max-w-[180px]" aria-label="ShowFlow">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/branding/showflow-logo.svg"
          alt="ShowFlow"
          width={2000}
          height={500}
          className="h-auto w-full object-contain"
        />
      </div>
      <PremiumCard variant="accent">
        <SectionTitle>Choose your celebration</SectionTitle>
        <p className="mt-2 text-xs text-stone-600">
          You have access to more than one event. Pick the one you want to plan today.
        </p>
        <div className="mt-4 space-y-2">
          {events.map((evt) => (
            <PrimaryButton
              key={evt.id}
              type="button"
              onClick={() => onSelect(evt.id)}
              className="w-full rounded-xl border border-stone-300 bg-white px-3 py-3 text-left text-xs font-semibold text-stone-900 shadow-none hover:border-stone-900 hover:bg-stone-50"
            >
              <span className="block text-sm text-stone-950">
                {evt.settings?.eventName || evt.meta.couple || "Your event"}
              </span>
              <span className="mt-1 block font-normal text-stone-600">
                {[evt.settings?.weddingDate || evt.meta.date, evt.settings?.venue || evt.meta.venue]
                  .filter(Boolean)
                  .join(" · ") || "Details coming soon"}
              </span>
            </PrimaryButton>
          ))}
        </div>
      </PremiumCard>
    </section>
  );
}
