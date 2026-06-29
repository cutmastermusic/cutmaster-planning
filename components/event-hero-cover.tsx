import { DEFAULT_EVENT_HERO_SRC, resolveEventHeroImageDisplay } from "@/lib/eventCover";

type EventHeroCoverProps = {
  coverPhotoDataUrl?: string;
  coverPhotoStoragePath?: string;
  defaultWelcomePhotoDataUrl?: string;
  /** On compact cards, omit onboarding copy to keep the grid calm. */
  showPersonalizeGuidance?: boolean;
  /** Opens Event Settings cover section (no server upload in this build). */
  onRequestCoverPhoto?: () => void;
  personalizeDisabled?: boolean;
};

/**
 * Hero/cover background: custom upload when present, otherwise default event image.
 */
export function EventHeroCover({
  coverPhotoDataUrl,
  coverPhotoStoragePath,
  defaultWelcomePhotoDataUrl,
  showPersonalizeGuidance = true,
  onRequestCoverPhoto,
  personalizeDisabled = false,
}: EventHeroCoverProps) {
  const heroImage = resolveEventHeroImageDisplay({
    coverPhotoDataUrl,
    coverPhotoStoragePath,
    defaultWelcomePhotoDataUrl,
  });

  const displayUrl = heroImage.displayUrl || DEFAULT_EVENT_HERO_SRC;

  if (heroImage.isEventSpecific) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={displayUrl}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
    );
  }

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={displayUrl}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      {showPersonalizeGuidance ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center px-5 pb-20 pt-8 sm:px-8 sm:pb-24">
          <button
            type="button"
            disabled={personalizeDisabled || !onRequestCoverPhoto}
            onClick={() => onRequestCoverPhoto?.()}
            aria-label="Open cover and details"
            className="max-w-sm cursor-pointer rounded-2xl border border-white/12 bg-[#1E1E1E]/20 px-4 py-3.5 text-center shadow-[0_8px_32px_-8px_rgba(0,0,0,0.45)] backdrop-blur-[3px] transition hover:border-white/28 hover:bg-[#1E1E1E]/32 hover:shadow-[0_12px_40px_-10px_rgba(0,0,0,0.55)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C79A5A]/80 disabled:cursor-not-allowed disabled:opacity-60 sm:max-w-md sm:px-5 sm:py-4"
          >
            <p className="text-[15px] font-semibold tracking-tight text-white sm:text-base">
              Personalize Your Event Space
            </p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-white/75 sm:text-xs">
              Add a photo of you, your event, or your company logo. Preview only until cloud upload is enabled.
            </p>
            {onRequestCoverPhoto && !personalizeDisabled ? (
              <p className="mt-2.5 text-[10px] font-medium uppercase tracking-[0.14em] text-white/55">
                Open cover &amp; details
              </p>
            ) : null}
          </button>
        </div>
      ) : null}
    </>
  );
}
