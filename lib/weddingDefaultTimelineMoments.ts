import type { CeremonyTimelineItem, TimelineCategory, TimelineItem } from "@/types/planning";

/** Suggested ceremony moment titles for brand-new Wedding events (order matters). */
export const NEW_WEDDING_CEREMONY_TIMELINE_MOMENTS = [
  "Pre-Ceremony Music",
  "Prelude",
  "Family Processional",
  "Wedding Party Processional",
  "Bride Processional",
  "During Ceremony",
  "Recessional",
] as const;

/** Suggested main-timeline moment titles for brand-new Wedding events (order matters). */
export const NEW_WEDDING_MAIN_TIMELINE_MOMENTS = [
  "Ceremony",
  "Cocktail Hour",
  "Grand Entrance",
  "First Dance",
  "Dinner",
  "Toasts",
  "Cake Cutting",
  "Father-Daughter Dance",
  "Mother-Son Dance",
  "Group Photo",
  "Open Dancing",
  "Last Dance",
] as const;

function categoryForWeddingMoment(title: (typeof NEW_WEDDING_MAIN_TIMELINE_MOMENTS)[number]): TimelineCategory {
  switch (title) {
    case "Cocktail Hour":
      return "Cocktail Hour";
    case "Grand Entrance":
    case "First Dance":
    case "Toasts":
    case "Cake Cutting":
    case "Father-Daughter Dance":
    case "Mother-Son Dance":
      return "Formalities";
    case "Open Dancing":
    case "Last Dance":
      return "Dancing";
    default:
      return "Reception";
  }
}

/**
 * Ceremony timeline rows for a newly created Wedding (or Gender-Neutral Wedding) event only.
 * Structure and order are fixed; times and songs stay blank.
 */
export function buildNewWeddingCeremonyTimelineItems(): CeremonyTimelineItem[] {
  const stamp = Date.now();
  return NEW_WEDDING_CEREMONY_TIMELINE_MOMENTS.map((moment, index) => ({
    id: `ceremony-timeline-wedding-${stamp}-${index}-${Math.random().toString(36).slice(2, 6)}`,
    timeOrOrder: "",
    moment,
    songTitle: "",
    artist: "",
    notes: "",
    needsDjMcAttention: false,
  }));
}

/**
 * Reception/main timeline rows for a newly created Wedding event only.
 * Structure and order are fixed; all times and songs stay blank.
 */
export function buildNewWeddingMainTimelineItems(): TimelineItem[] {
  const stamp = Date.now();
  return NEW_WEDDING_MAIN_TIMELINE_MOMENTS.map((title, index) => ({
    id: `timeline-wedding-${stamp}-${index}-${Math.random().toString(36).slice(2, 6)}`,
    title,
    time: "",
    category: categoryForWeddingMoment(title),
    notes: "",
    needsDjMcAttention: false,
  }));
}
