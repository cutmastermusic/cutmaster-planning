"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useCoupleMobileActionHandlers } from "@/components/couple-mobile-action-button";
import { CoupleFinalPlanningPrepDashboard } from "@/components/couple-final-planning-prep-dashboard";
import { hasCustomEventCover } from "@/lib/eventCover";
import {
  coverPhotoTransformToImageStyle,
  normalizeCoverPhotoTransform,
  resolveCoverPhotoTransformForDisplay,
} from "@/lib/coverPhotoTransform";
import type { CoverPhotoTransform } from "@/types/planning";
import type {
  CoupleFinalPlanningHint,
  CoupleFinalPlanningQuickLink,
} from "@/lib/coupleFinalPlanningPrep";
import type {
  CoupleWeddingChapterCardModel,
  CoupleWeddingChapterId,
} from "@/lib/coupleWeddingJourney";
import type { Screen } from "@/types/planning";

// ─── Display helpers ─────────────────────────────────────────────────────────

function getTimeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const JOURNEY_DISPLAY_NAMES: Record<CoupleWeddingChapterId, string> = {
  about_you: "Your Story",
  ceremony: "Ceremony",
  reception_moments: "Reception Moments",
  music_vibe: "Music Profile",
  your_team: "Wedding Team",
  final_review: "Final Review",
};

function journeyDisplayName(chapterId: CoupleWeddingChapterId): string {
  return JOURNEY_DISPLAY_NAMES[chapterId];
}

function chapterTimeLabel(chapterId: CoupleWeddingChapterId | null): string {
  if (!chapterId) return "A few minutes";
  if (chapterId === "about_you") return "About 5 minutes";
  if (chapterId === "final_review") return "About 3 minutes";
  if (chapterId === "your_team") return "About 10 minutes";
  if (chapterId === "reception_moments") return "About 5 minutes";
  return "About 5 minutes";
}

function warmChapterDescription(
  chapter: CoupleWeddingChapterCardModel | undefined,
  chapterId: CoupleWeddingChapterId | null,
): string {
  if (!chapter || !chapterId) {
    return "We'll guide you through a few short chapters—one at a time, at your pace.";
  }
  if (chapter.status === "Complete") {
    return "Everything you shared is saved. Tap to revisit anytime.";
  }
  if (chapter.status === "In Progress") {
    if (chapterId === "reception_moments") {
      return "You're halfway through planning your reception.";
    }
    return `Pick up ${journeyDisplayName(chapterId)} where you left off.`;
  }
  if (chapterId === "about_you") {
    return "Tell us about yourselves—the story behind your celebration.";
  }
  return chapter.description;
}

function countdownText(
  daysUntil: number | null,
  isWedding: boolean,
): string {
  if (daysUntil === null) return "Add your date when you're ready";
  if (daysUntil === 0) return isWedding ? "Today's the day" : "Today's your event";
  if (isWedding) {
    return `${daysUntil} day${daysUntil === 1 ? "" : "s"} to go`;
  }
  return `${daysUntil} day${daysUntil === 1 ? "" : "s"} to go`;
}

function heroMetaLine(
  eventDateDisplay: string,
  daysUntilWedding: number | null,
  isWeddingLayout: boolean,
): string {
  const parts: string[] = [];
  if (eventDateDisplay && eventDateDisplay !== "TBD") {
    parts.push(eventDateDisplay);
  }
  const countdown = countdownText(daysUntilWedding, isWeddingLayout);
  if (countdown) parts.push(countdown);
  return parts.join(" · ");
}

type TodayContent = {
  chapterName: string;
  description: string;
  timeEstimate: string;
  ctaLabel: string;
  handleContinue: () => void;
};

function resolveTodayContent(
  props: Pick<
    CoupleDashboardV2Props,
    | "isCoupleWeddingPlanningView"
    | "sectionPlanningQuestionsEnabled"
    | "isCoupleWeddingJourneyComplete"
    | "coupleWeddingStoryChapterStarted"
    | "showCoupleAboutYourDayWelcomeCard"
    | "coupleWeddingWelcomeAction"
    | "firstIncompleteCoupleChapter"
    | "coupleWeddingChapterCards"
    | "coupleNextStep"
    | "onOpenChapter"
    | "onNavigate"
  >,
): TodayContent {
  const {
    isCoupleWeddingPlanningView,
    sectionPlanningQuestionsEnabled,
    isCoupleWeddingJourneyComplete,
    coupleWeddingStoryChapterStarted,
    showCoupleAboutYourDayWelcomeCard,
    coupleWeddingWelcomeAction,
    firstIncompleteCoupleChapter,
    coupleWeddingChapterCards,
    coupleNextStep,
    onOpenChapter,
    onNavigate,
  } = props;

  const showPreJourneyWelcome =
    isCoupleWeddingPlanningView &&
    sectionPlanningQuestionsEnabled &&
    !isCoupleWeddingJourneyComplete &&
    !coupleWeddingStoryChapterStarted;

  const handleContinue = () => {
    if (showPreJourneyWelcome && coupleWeddingWelcomeAction) {
      onOpenChapter(coupleWeddingWelcomeAction.chapterId);
      return;
    }
    if (
      isCoupleWeddingPlanningView &&
      sectionPlanningQuestionsEnabled &&
      !isCoupleWeddingJourneyComplete &&
      firstIncompleteCoupleChapter
    ) {
      onOpenChapter(firstIncompleteCoupleChapter);
      return;
    }
    if (coupleNextStep.targetChapterId) {
      onOpenChapter(coupleNextStep.targetChapterId);
      return;
    }
    onNavigate(coupleNextStep.targetScreen);
  };

  if (showPreJourneyWelcome) {
    return {
      chapterName: "Your Story",
      description:
        "We'll guide you through a few short chapters about your ceremony, reception, music, and the moments that matter most.",
      timeEstimate: chapterTimeLabel("about_you"),
      ctaLabel: coupleWeddingWelcomeAction?.ctaLabel
        ? coupleWeddingWelcomeAction.ctaLabel.replace(/^(Start|Continue|Open)\s+/, "")
        : "Continue",
      handleContinue,
    };
  }

  if (
    isCoupleWeddingPlanningView &&
    sectionPlanningQuestionsEnabled &&
    isCoupleWeddingJourneyComplete
  ) {
    return {
      chapterName: "You're in a beautiful place",
      description:
        "Your story is saved. Shape the day-of details together whenever you're ready.",
      timeEstimate: "",
      ctaLabel:
        coupleNextStep.ctaLabel === "Continue planning"
          ? "Continue"
          : coupleNextStep.ctaLabel,
      handleContinue,
    };
  }

  if (
    isCoupleWeddingPlanningView &&
    sectionPlanningQuestionsEnabled &&
    firstIncompleteCoupleChapter
  ) {
    const chapter = coupleWeddingChapterCards.find((c) => c.id === firstIncompleteCoupleChapter);
    return {
      chapterName: journeyDisplayName(firstIncompleteCoupleChapter),
      description: warmChapterDescription(chapter, firstIncompleteCoupleChapter),
      timeEstimate: chapterTimeLabel(firstIncompleteCoupleChapter),
      ctaLabel: "Continue",
      handleContinue,
    };
  }

  if (showCoupleAboutYourDayWelcomeCard) {
    return {
      chapterName: "Your Story",
      description:
        "Tell us a little about your ceremony, reception, and the moments that matter most.",
      timeEstimate: chapterTimeLabel("about_you"),
      ctaLabel: "Continue",
      handleContinue,
    };
  }

  return {
    chapterName: coupleNextStep.title ?? "Where you left off",
    description: coupleNextStep.body,
    timeEstimate: "",
    ctaLabel:
      coupleNextStep.ctaLabel === "Continue planning"
        ? "Continue"
        : coupleNextStep.ctaLabel,
    handleContinue,
  };
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type CoupleNextStepModel = {
  body: string;
  ctaLabel: string;
  targetScreen: Screen;
  targetChapterId?: CoupleWeddingChapterId;
  title?: string;
};

export type CoupleHomeToolSection = {
  id: string;
  title: string;
  screen: Screen;
  pendingBadge?: string;
};

type CoupleDashboardV2Props = {
  coupleDisplayName: string;
  eventDateDisplay: string;
  daysUntilWedding: number | null;
  isWeddingLayout: boolean;
  coverPhotoDataUrl?: string;
  coverPhotoStoragePath?: string;
  coverPhotoTransform?: CoverPhotoTransform;
  /** False while event cover photo state is still hydrating from storage/DB. */
  coverPhotoHydrationReady?: boolean;

  isCoupleWeddingPlanningView: boolean;
  sectionPlanningQuestionsEnabled: boolean;
  isCoupleWeddingJourneyComplete: boolean;
  coupleWeddingStoryChapterStarted: boolean;

  coupleNextStep: CoupleNextStepModel;
  showCoupleAboutYourDayWelcomeCard: boolean;
  coupleWeddingWelcomeAction: { chapterId: CoupleWeddingChapterId; ctaLabel: string } | null;
  firstIncompleteCoupleChapter: CoupleWeddingChapterId | null;
  coupleWeddingChapterCards: CoupleWeddingChapterCardModel[];

  coupleHomePlanningSections: CoupleHomeToolSection[];
  showPlanningAssistant: boolean;

  coupleFinalPlanningHints: CoupleFinalPlanningHint[];
  coupleFinalPlanningQuickLinks: CoupleFinalPlanningQuickLink[];
  assignedDjName: string | null;
  plannerName: string | null;
  showEventPlanPreview: boolean;

  onOpenChapter: (chapterId: CoupleWeddingChapterId) => void;
  onNavigate: (screen: Screen) => void;
  onRequestCoverPhoto?: () => void;
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function TodayCardEmbed({ content }: { content: TodayContent }) {
  const { onPointerDown, onClick } = useCoupleMobileActionHandlers(content.handleContinue);

  return (
    <div className="cm-dashboard-v3-today-embed">
      <p className="cm-dashboard-v3-eyebrow">Today</p>
      <h2 className="cm-dashboard-v3-today-title">{content.chapterName}</h2>
      {content.description ? (
        <p className="cm-dashboard-v3-today-body">{content.description}</p>
      ) : null}
      <div className="cm-dashboard-v3-today-footer">
        {content.timeEstimate ? (
          <p className="cm-dashboard-v3-today-time">
            <ClockIcon />
            <span>{content.timeEstimate}</span>
          </p>
        ) : null}
        <button
          type="button"
          onPointerDown={onPointerDown}
          onClick={onClick}
          className="cm-dashboard-v3-cta"
        >
          {content.ctaLabel}
          <span aria-hidden>→</span>
        </button>
      </div>
    </div>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <circle cx="12" cy="12" r="8.5" />
      <path strokeLinecap="round" d="M12 8v4.5l2.75 2" />
    </svg>
  );
}

function CoupleHeroPhoto({
  coverPhotoDataUrl,
  coverPhotoStoragePath,
  coverPhotoTransform,
  coverPhotoHydrationReady = true,
  onRequestCoverPhoto,
}: {
  coverPhotoDataUrl?: string;
  coverPhotoStoragePath?: string;
  coverPhotoTransform?: CoverPhotoTransform;
  coverPhotoHydrationReady?: boolean;
  onRequestCoverPhoto?: () => void;
}) {
  const hasPhoto = hasCustomEventCover(coverPhotoDataUrl);
  const openPicker = onRequestCoverPhoto ?? (() => undefined);
  const { onPointerDown, onClick } = useCoupleMobileActionHandlers(openPicker);
  const normalizedTransform = normalizeCoverPhotoTransform(coverPhotoTransform);
  const stageRef = useRef<HTMLDivElement>(null);
  const [displayTransform, setDisplayTransform] = useState<CoverPhotoTransform | undefined>(
    normalizedTransform,
  );
  const imageStyle = displayTransform
    ? coverPhotoTransformToImageStyle(displayTransform)
    : undefined;

  const [decodedUrl, setDecodedUrl] = useState<string | undefined>(undefined);
  const [photoVisible, setPhotoVisible] = useState(false);
  const displayedIdentityRef = useRef<string | undefined>(undefined);
  const imageMetricsRef = useRef<{ width: number; height: number } | null>(null);
  const preloadTokenRef = useRef(0);
  const normalizedTransformRef = useRef(normalizedTransform);

  useEffect(() => {
    normalizedTransformRef.current = normalizedTransform;
  }, [normalizedTransform]);

  const resolveDisplayTransformForMetrics = useCallback((imageWidth: number, imageHeight: number) => {
    const stage = stageRef.current;
    if (!stage || imageWidth <= 0 || imageHeight <= 0) return;
    const rect = stage.getBoundingClientRect();
    if (rect.width < 8 || rect.height < 8) return;
    setDisplayTransform(
      resolveCoverPhotoTransformForDisplay(
        normalizedTransformRef.current,
        imageWidth,
        imageHeight,
        rect.width,
        rect.height,
      ),
    );
  }, []);

  useEffect(() => {
    if (imageMetricsRef.current) {
      resolveDisplayTransformForMetrics(
        imageMetricsRef.current.width,
        imageMetricsRef.current.height,
      );
    } else {
      setDisplayTransform(normalizedTransform);
    }
  }, [normalizedTransform, resolveDisplayTransformForMetrics]);

  const photoIdentity = `${coverPhotoStoragePath?.trim() ?? ""}|${coverPhotoDataUrl?.trim() ?? ""}`;

  const awaitingPhoto =
    coverPhotoHydrationReady && hasCustomEventCover(coverPhotoDataUrl);
  const showSkeleton =
    !coverPhotoHydrationReady ||
    (awaitingPhoto && displayedIdentityRef.current !== photoIdentity);

  useEffect(() => {
    const nextUrl = coverPhotoDataUrl?.trim();
    if (!nextUrl) {
      displayedIdentityRef.current = undefined;
      imageMetricsRef.current = null;
      const frame = requestAnimationFrame(() => {
        setDecodedUrl(undefined);
        setPhotoVisible(false);
      });
      return () => cancelAnimationFrame(frame);
    }

    const nextIdentity = photoIdentity;
    if (displayedIdentityRef.current === nextIdentity) return;

    const token = ++preloadTokenRef.current;
    const shouldAnimate = Boolean(displayedIdentityRef.current);
    let cancelled = false;

    const img = new Image();
    img.onload = () => {
      if (cancelled || token !== preloadTokenRef.current) return;
      imageMetricsRef.current = {
        width: img.naturalWidth,
        height: img.naturalHeight,
      };
      resolveDisplayTransformForMetrics(img.naturalWidth, img.naturalHeight);
      displayedIdentityRef.current = nextIdentity;
      setDecodedUrl(nextUrl);
      if (shouldAnimate) {
        setPhotoVisible(false);
        requestAnimationFrame(() => {
          if (!cancelled && token === preloadTokenRef.current) {
            setPhotoVisible(true);
          }
        });
      } else {
        setPhotoVisible(true);
      }
    };
    img.onerror = () => {
      if (cancelled || token !== preloadTokenRef.current) return;
      displayedIdentityRef.current = nextIdentity;
      setDecodedUrl(nextUrl);
      setPhotoVisible(true);
    };
    img.src = nextUrl;

    return () => {
      cancelled = true;
    };
  }, [coverPhotoDataUrl, coverPhotoStoragePath, photoIdentity, resolveDisplayTransformForMetrics]);

  if (showSkeleton) {
    return (
      <div
        className="cm-dashboard-v3-hero-photo cm-dashboard-v3-hero-photo--loading"
        aria-busy="true"
        aria-label={hasPhoto ? "Loading welcome photo" : "Checking welcome photo"}
      >
        <div className="cm-dashboard-v3-hero-photo-skeleton" />
      </div>
    );
  }

  if (hasPhoto && decodedUrl) {
    return (
      <button
        type="button"
        className="cm-dashboard-v3-hero-photo cm-dashboard-v3-hero-photo--custom"
        onPointerDown={onPointerDown}
        onClick={onClick}
        aria-label="Change your cover photo"
      >
        <div ref={stageRef} className="cm-dashboard-v3-hero-photo-stage">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={decodedUrl}
            alt=""
            className={`cm-dashboard-v3-hero-photo-img cm-blanc-hero-photo-treatment ${
              normalizedTransform ? "cm-dashboard-v3-hero-photo-img--positioned" : ""
            } ${photoVisible ? "cm-dashboard-v3-hero-photo-img--visible" : ""}`}
            style={imageStyle}
          />
        </div>
      </button>
    );
  }

  return (
    <div className="cm-dashboard-v3-hero-photo cm-dashboard-v3-hero-photo--empty">
      <button
        type="button"
        className="cm-dashboard-v3-hero-add-photo"
        onPointerDown={onPointerDown}
        onClick={onClick}
        disabled={!onRequestCoverPhoto}
      >
        <span className="cm-dashboard-v3-hero-add-photo-label">Add a favorite photo</span>
        <span className="cm-dashboard-v3-hero-add-photo-hint">A moment you love—engagement, venue, or the two of you.</span>
      </button>
    </div>
  );
}

function HeroWithToday(props: CoupleDashboardV2Props) {
  const today = resolveTodayContent(props);
  const meta = heroMetaLine(
    props.eventDateDisplay,
    props.daysUntilWedding,
    props.isWeddingLayout,
  );
  const greetingName = props.coupleDisplayName || "Your celebration";
  const hasPhoto =
    props.coverPhotoHydrationReady && hasCustomEventCover(props.coverPhotoDataUrl);
  const heroPhotoZoneClass = !props.coverPhotoHydrationReady
    ? "cm-dashboard-v3-hero-zone--loading-photo"
    : hasPhoto
      ? "cm-dashboard-v3-hero-zone--has-photo"
      : "cm-dashboard-v3-hero-zone--empty-photo";

  return (
    <section
      className={`cm-dashboard-v3-hero-zone cm-dashboard-v3-animate-hero ${heroPhotoZoneClass}`}
    >
      <div className="cm-dashboard-v3-hero-zone-grid">
        <div className="cm-dashboard-v3-hero-copy">
          <h1 className="cm-dashboard-v3-hero-headline">
            {getTimeOfDayGreeting()}, {greetingName}
          </h1>
          {meta ? <p className="cm-dashboard-v3-hero-meta">{meta}</p> : null}
          <p className="cm-dashboard-v3-hero-tagline">
            Everything is coming together beautifully.
          </p>
          <div className="cm-dashboard-v3-today-desktop">
            <TodayCardEmbed content={today} />
          </div>
        </div>
        <div className="cm-dashboard-v3-hero-photo-wrap">
          <CoupleHeroPhoto
            coverPhotoDataUrl={props.coverPhotoDataUrl}
            coverPhotoStoragePath={props.coverPhotoStoragePath}
            coverPhotoTransform={props.coverPhotoTransform}
            coverPhotoHydrationReady={props.coverPhotoHydrationReady}
            onRequestCoverPhoto={props.onRequestCoverPhoto}
          />
        </div>
      </div>
      <div className="cm-dashboard-v3-today-mobile">
        <TodayCardEmbed content={today} />
      </div>
    </section>
  );
}

function JourneyRow({
  chapter,
  isActive,
  isLast,
  onOpen,
}: {
  chapter: CoupleWeddingChapterCardModel;
  isActive: boolean;
  isLast: boolean;
  onOpen: () => void;
}) {
  const { onPointerDown, onClick } = useCoupleMobileActionHandlers(onOpen);
  const isComplete = chapter.status === "Complete";
  const displayName = journeyDisplayName(chapter.id);

  let indicator: ReactNode;
  if (isComplete) {
    indicator = <span className="cm-dashboard-v3-journey-dot cm-dashboard-v3-journey-dot--done" aria-hidden>✓</span>;
  } else if (isActive) {
    indicator = <span className="cm-dashboard-v3-journey-dot cm-dashboard-v3-journey-dot--active" aria-hidden />;
  } else {
    indicator = <span className="cm-dashboard-v3-journey-dot" aria-hidden />;
  }

  return (
    <li className={`cm-dashboard-v3-journey-item ${isLast ? "cm-dashboard-v3-journey-item--last" : ""}`}>
      <button
        type="button"
        onPointerDown={onPointerDown}
        onClick={onClick}
        className={`cm-dashboard-v3-journey-row ${isActive ? "cm-dashboard-v3-journey-row--active" : ""} ${isComplete ? "cm-dashboard-v3-journey-row--complete" : ""}`}
      >
        <span className="cm-dashboard-v3-journey-rail">{indicator}</span>
        <span className="cm-dashboard-v3-journey-text">
          <span className="cm-dashboard-v3-journey-label">{displayName}</span>
          <span className="cm-dashboard-v3-journey-sub">{chapter.description}</span>
        </span>
        {isActive ? (
          <span className="cm-dashboard-v3-journey-continue-pill">Continue</span>
        ) : (
          <span className="cm-dashboard-v3-journey-chevron" aria-hidden>›</span>
        )}
      </button>
    </li>
  );
}

function YourJourney({
  chapters,
  firstIncompleteCoupleChapter,
  onOpenChapter,
}: {
  chapters: CoupleWeddingChapterCardModel[];
  firstIncompleteCoupleChapter: CoupleWeddingChapterId | null;
  onOpenChapter: (id: CoupleWeddingChapterId) => void;
}) {
  return (
    <section className="cm-dashboard-v3-journey cm-dashboard-v3-animate-rise cm-dashboard-v3-animate-rise--delay-1">
      <h2 className="cm-dashboard-v3-eyebrow">Your Journey</h2>
      <ul className="cm-dashboard-v3-journey-list">
        {chapters.map((chapter, index) => (
          <JourneyRow
            key={chapter.id}
            chapter={chapter}
            isActive={chapter.id === firstIncompleteCoupleChapter}
            isLast={index === chapters.length - 1}
            onOpen={() => onOpenChapter(chapter.id)}
          />
        ))}
      </ul>
    </section>
  );
}

const TOOL_ICONS: Record<string, ReactNode> = {
  reception: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.35" aria-hidden>
      <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h10" />
    </svg>
  ),
  music: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.35" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 18V5l12-2v13M9 9l12-2" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  ),
  "guest-requests": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.35" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  "event-prep": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.35" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  "planning-assistant": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.35" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
};

function ToolTile({
  id,
  label,
  pendingBadge,
  onNavigate,
}: {
  id: string;
  label: string;
  pendingBadge?: string;
  onNavigate: () => void;
}) {
  const { onPointerDown, onClick } = useCoupleMobileActionHandlers(onNavigate);

  return (
    <button
      type="button"
      onPointerDown={onPointerDown}
      onClick={onClick}
      className="cm-dashboard-v3-tool-tile"
    >
      <span className="cm-dashboard-v3-tool-tile-icon">{TOOL_ICONS[id] ?? TOOL_ICONS["event-prep"]}</span>
      <span className="cm-dashboard-v3-tool-tile-label">{label}</span>
      {pendingBadge ? (
        <span className="cm-dashboard-v3-tool-tile-badge">{pendingBadge}</span>
      ) : null}
    </button>
  );
}

function WeddingTools({
  sections,
  showPlanningAssistant,
  onNavigate,
}: {
  sections: CoupleHomeToolSection[];
  showPlanningAssistant: boolean;
  onNavigate: (screen: Screen) => void;
}) {
  const toolIds = ["reception", "music", "guest-requests", "planning-assistant", "event-prep"] as const;

  const tools: Array<{ id: string; label: string; screen: Screen; pendingBadge?: string }> = [];

  for (const toolId of toolIds) {
    if (toolId === "planning-assistant") {
      if (showPlanningAssistant) {
        tools.push({ id: toolId, label: "Planning Assistant", screen: "Planning Assistant" });
      }
      continue;
    }
    const section = sections.find((s) => s.id === toolId);
    if (section) {
      tools.push({
        id: section.id,
        label:
          section.id === "reception"
            ? "Timeline"
            : section.id === "event-prep"
              ? "Event Plan"
              : section.title,
        screen: section.screen,
        pendingBadge: section.pendingBadge,
      });
    }
  }

  if (tools.length === 0) return null;

  return (
    <section className="cm-dashboard-v3-tools cm-dashboard-v3-animate-rise cm-dashboard-v3-animate-rise--delay-2">
      <h2 className="cm-dashboard-v3-eyebrow">Wedding Tools</h2>
      <div className="cm-dashboard-v3-tools-grid">
        {tools.map((tool) => (
          <ToolTile
            key={tool.id}
            id={tool.id}
            label={tool.label}
            pendingBadge={tool.pendingBadge}
            onNavigate={() => onNavigate(tool.screen)}
          />
        ))}
      </div>
    </section>
  );
}

function EncouragementFooter() {
  return (
    <footer className="cm-dashboard-v3-encouragement cm-dashboard-v3-animate-rise cm-dashboard-v3-animate-rise--delay-2">
      <span className="cm-dashboard-v3-encouragement-icon" aria-hidden>♥</span>
      <p className="cm-dashboard-v3-encouragement-serif">You&apos;re doing great.</p>
      <p className="cm-dashboard-v3-encouragement-sans">We&apos;ll guide you the rest of the way.</p>
    </footer>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function CoupleDashboardV2(props: CoupleDashboardV2Props) {
  const {
    isCoupleWeddingPlanningView,
    sectionPlanningQuestionsEnabled,
    isCoupleWeddingJourneyComplete,
    coupleWeddingStoryChapterStarted,
    coupleWeddingChapterCards,
    firstIncompleteCoupleChapter,
    coupleHomePlanningSections,
    showPlanningAssistant,
    coupleFinalPlanningHints,
    coupleFinalPlanningQuickLinks,
    assignedDjName,
    plannerName,
    showEventPlanPreview,
    onOpenChapter,
    onNavigate,
  } = props;

  const showJourney =
    isCoupleWeddingPlanningView && sectionPlanningQuestionsEnabled;

  const showTools =
    coupleHomePlanningSections.length > 0 &&
    (!isCoupleWeddingPlanningView || coupleWeddingStoryChapterStarted || isCoupleWeddingJourneyComplete);

  return (
    <div className="cm-dashboard-v3">
      <HeroWithToday {...props} />

      {showJourney ? (
        <YourJourney
          chapters={coupleWeddingChapterCards}
          firstIncompleteCoupleChapter={firstIncompleteCoupleChapter}
          onOpenChapter={onOpenChapter}
        />
      ) : null}

      {isCoupleWeddingPlanningView &&
      sectionPlanningQuestionsEnabled &&
      isCoupleWeddingJourneyComplete ? (
        <div className="cm-dashboard-v3-final-prep cm-dashboard-v3-animate-rise cm-dashboard-v3-animate-rise--delay-1">
          <CoupleFinalPlanningPrepDashboard
            hints={coupleFinalPlanningHints}
            quickLinks={coupleFinalPlanningQuickLinks}
            assignedDjName={assignedDjName}
            plannerName={plannerName}
            onNavigate={onNavigate}
            onPreviewEventPlan={
              showEventPlanPreview ? () => onNavigate("Event Prep") : undefined
            }
          />
        </div>
      ) : null}

      {showTools ? (
        <WeddingTools
          sections={coupleHomePlanningSections}
          showPlanningAssistant={showPlanningAssistant}
          onNavigate={onNavigate}
        />
      ) : null}

      <EncouragementFooter />

      <p className="cm-dashboard-v3-powered-by">Powered by Cutmaster Music</p>
    </div>
  );
}
