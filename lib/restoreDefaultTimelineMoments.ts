import { isGrandEntranceTimelineItem } from "@/lib/grandEntranceDetail";
import {
  createSpeechesToastsTimelineItem,
  isToastTimelineItem,
  SPEECHES_TOASTS_TIMELINE_TITLE,
} from "@/lib/speechesToasts";
import {
  categoryForWeddingMoment,
  NEW_WEDDING_MAIN_TIMELINE_MOMENTS,
} from "@/lib/weddingDefaultTimelineMoments";
import type {
  EventSettings,
  TimelineCategory,
  TimelineItem,
  TimelinePresetItem,
} from "@/types/planning";

export type DefaultTimelineMomentDef = {
  key: string;
  title: string;
  category: TimelineCategory;
};

type EventLayoutProfile = EventSettings["eventLayoutProfile"];

/** Stable key for comparing default moments to existing timeline rows. */
export function normalizeDefaultTimelineMomentKey(title: string): string {
  const normalized = title.trim().toLowerCase().replace(/\s+/g, " ");
  if (/^speeches?\s*\/\s*toasts?$|^toasts?$|^family\s+toasts?$/.test(normalized)) {
    return "speeches-toasts";
  }
  if (/grand entrance/.test(normalized)) return "grand-entrance";
  if (/father[-/ ]daughter/.test(normalized)) return "father-daughter-dance";
  if (/mother[-/ ]son/.test(normalized)) return "mother-son-dance";
  return normalized;
}

export function timelineItemMatchesDefaultMoment(
  item: TimelineItem,
  def: DefaultTimelineMomentDef,
): boolean {
  if (def.key === "speeches-toasts") return isToastTimelineItem(item.title);
  if (def.key === "grand-entrance") return isGrandEntranceTimelineItem(item.title);
  return normalizeDefaultTimelineMomentKey(item.title) === def.key;
}

/** Default main-timeline moments for the active event type (order matters). */
export function getDefaultMainTimelineMoments(
  layoutProfile: EventLayoutProfile,
  mainPresets: TimelinePresetItem[],
): DefaultTimelineMomentDef[] {
  if (layoutProfile === "Wedding" || layoutProfile === "Gender-Neutral Wedding") {
    return NEW_WEDDING_MAIN_TIMELINE_MOMENTS.map((title) => ({
      key: normalizeDefaultTimelineMomentKey(title),
      title,
      category: categoryForWeddingMoment(title),
    }));
  }

  return mainPresets
    .filter((preset) => preset.timelineType === "main" && preset.defaultIncluded)
    .map((preset) => ({
      key: normalizeDefaultTimelineMomentKey(preset.momentName),
      title: preset.momentName,
      category: preset.timelineCategory ?? "Reception",
    }));
}

export function findMissingDefaultMainTimelineMoments(
  items: TimelineItem[],
  defaults: DefaultTimelineMomentDef[],
): DefaultTimelineMomentDef[] {
  return defaults.filter(
    (def) => !items.some((item) => timelineItemMatchesDefaultMoment(item, def)),
  );
}

function createTimelineItemFromDefault(def: DefaultTimelineMomentDef): TimelineItem {
  if (def.key === "speeches-toasts") {
    return createSpeechesToastsTimelineItem();
  }
  return {
    id: `timeline-restore-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: def.title,
    time: "",
    category: def.category,
    notes: "",
    needsDjMcAttention: false,
  };
}

function findRestoreInsertIndex(
  items: TimelineItem[],
  restored: DefaultTimelineMomentDef,
  allDefaults: DefaultTimelineMomentDef[],
): number {
  const restoredIndex = allDefaults.findIndex((def) => def.key === restored.key);
  if (restoredIndex < 0) return items.length;

  for (let index = restoredIndex - 1; index >= 0; index -= 1) {
    const previousDefault = allDefaults[index];
    const previousItemIndex = items.findIndex((item) =>
      timelineItemMatchesDefaultMoment(item, previousDefault),
    );
    if (previousItemIndex >= 0) return previousItemIndex + 1;
  }

  for (let index = restoredIndex + 1; index < allDefaults.length; index += 1) {
    const nextDefault = allDefaults[index];
    const nextItemIndex = items.findIndex((item) =>
      timelineItemMatchesDefaultMoment(item, nextDefault),
    );
    if (nextItemIndex >= 0) return nextItemIndex;
  }

  return items.length;
}

/** Insert a restored default moment near its natural position without duplicating existing rows. */
export function insertRestoredDefaultTimelineMoment(
  items: TimelineItem[],
  restored: DefaultTimelineMomentDef,
  allDefaults: DefaultTimelineMomentDef[],
): TimelineItem[] {
  if (items.some((item) => timelineItemMatchesDefaultMoment(item, restored))) {
    return items;
  }
  const insertIndex = findRestoreInsertIndex(items, restored, allDefaults);
  const next = items.slice();
  next.splice(insertIndex, 0, createTimelineItemFromDefault(restored));
  return next;
}

export function isSpeechesToastsDefaultMoment(def: DefaultTimelineMomentDef): boolean {
  return (
    def.key === "speeches-toasts" ||
    normalizeDefaultTimelineMomentKey(def.title) ===
      normalizeDefaultTimelineMomentKey(SPEECHES_TOASTS_TIMELINE_TITLE)
  );
}
