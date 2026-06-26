import { isGrandEntranceTimelineItem } from "@/lib/grandEntranceDetail";
import { normalizeDefaultTimelineMomentKey } from "@/lib/restoreDefaultTimelineMoments";
import { isToastTimelineItem } from "@/lib/speechesToasts";

export const TIMELINE_MOMENT_TYPES = [
  "ceremony",
  "playlist",
  "introduction",
  "speech",
  "meal",
  "dance",
  "tradition",
  "photo",
  "open_dance",
  "exit",
  "custom",
] as const;

export type TimelineMomentType = (typeof TIMELINE_MOMENT_TYPES)[number];

export function isTimelineMomentType(value: string | null | undefined): value is TimelineMomentType {
  return TIMELINE_MOMENT_TYPES.includes(value as TimelineMomentType);
}

export function normalizeTimelineMomentType(
  value: string | null | undefined,
): TimelineMomentType | undefined {
  if (!value?.trim()) return undefined;
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return isTimelineMomentType(normalized) ? normalized : undefined;
}

export function inferTimelineMomentType(title: string): TimelineMomentType {
  if (isToastTimelineItem(title)) return "speech";
  if (isGrandEntranceTimelineItem(title)) return "introduction";

  const key = normalizeDefaultTimelineMomentKey(title);

  if (
    key === "pre-ceremony" ||
    key === "ceremony" ||
    /\bceremony\b/.test(key) ||
    /processional|recessional|unity|vows|readings|signing/.test(key)
  ) {
    return "ceremony";
  }

  if (/grand entrance|introduction|wedding party entrance/.test(key)) return "introduction";
  if (/speech|toast|welcome|blessing|remarks/.test(key)) return "speech";
  if (/cocktail hour|dinner|lunch|brunch|meal|bar service|dessert|salads|entree|seated/.test(key)) {
    return "meal";
  }
  if (/first dance|father[-/ ]daughter|mother[-/ ]son|parent dance|formal dance|last dance/.test(key)) {
    return "dance";
  }
  if (/open danc|dance floor open|dancing begins|open dancing/.test(key)) return "open_dance";
  if (
    /cake cutting|bouquet|garter|tradition|horah|money dance|sword|lantern|shoe game|anniversary dance/.test(
      key,
    )
  ) {
    return "tradition";
  }
  if (/photo|picture|portrait|formals/.test(key)) return "photo";
  if (/exit|send.?off|getaway|farewell|departure|sparkler send/.test(key)) return "exit";
  if (/playlist|background music|ambient music|cocktail hour music/.test(key)) return "playlist";

  return "custom";
}

export function resolveTimelineMomentType(item: {
  title: string;
  momentType?: TimelineMomentType | string | null;
}): TimelineMomentType {
  const stored = normalizeTimelineMomentType(item.momentType ?? undefined);
  if (stored) return stored;
  return inferTimelineMomentType(item.title);
}

export function timelineMomentTypeLabel(type: TimelineMomentType): string {
  switch (type) {
    case "ceremony":
      return "Ceremony";
    case "playlist":
      return "Playlist";
    case "introduction":
      return "Introduction";
    case "speech":
      return "Toast / Speech";
    case "meal":
      return "Meal";
    case "dance":
      return "Dance";
    case "tradition":
      return "Tradition";
    case "photo":
      return "Photo";
    case "open_dance":
      return "Open dance";
    case "exit":
      return "Exit";
    case "custom":
      return "Custom";
  }
}

/** Warm, couple-facing guidance for each moment — explains what the moment is for couples who've never planned a wedding. */
export function coupleTimelineMomentGuidance(type: TimelineMomentType, title: string): string {
  const key = title.trim().toLowerCase();
  switch (type) {
    case "introduction":
      if (/grand entrance|first look/.test(key))
        return "Your big reveal — the first time guests see you as a married couple.";
      return "Your DJ introduces the wedding party to the room.";
    case "dance":
      if (/first dance/.test(key))
        return "Your first dance as a married couple. Choose a song that means something to you both.";
      if (/father.{0,10}daughter|daughter.{0,10}father/.test(key))
        return "A special dance honoring the bride and her father.";
      if (/mother.{0,10}son|son.{0,10}mother/.test(key))
        return "A special dance honoring the groom and his mother.";
      if (/parent/.test(key))
        return "A moment to celebrate the parents on the dance floor.";
      if (/last dance/.test(key))
        return "One final song to close out the night on the dance floor.";
      return "A dedicated dance moment for you and your loved ones.";
    case "speech":
      return "Time for the people who love you most to say a few words — best man, maid of honor, parents.";
    case "tradition":
      if (/cake/.test(key))
        return "A sweet tradition. Pick a fun song for the moment you cut the cake.";
      if (/bouquet/.test(key))
        return "The classic toss — a fun moment for your single guests.";
      if (/garter/.test(key))
        return "A lighthearted tradition. Pick a playful song.";
      if (/horah/.test(key))
        return "A joyful celebration where guests lift you on chairs — pure energy.";
      return "A special tradition that makes your wedding uniquely yours.";
    case "meal":
      return "Guests enjoy dinner while your DJ sets a relaxed, conversational mood.";
    case "open_dance":
      return "The party begins. Your DJ will read the room and keep the energy going all night.";
    case "photo":
      return "A dedicated moment for portraits — your photographer will direct you.";
    case "exit":
      return "Your sendoff — the perfect moment to close out the night in style.";
    case "ceremony":
      if (/processional/.test(key))
        return "Guests are seated; the wedding party walks in. Sets the emotional tone before you arrive.";
      if (/recessional/.test(key))
        return "You walk back up the aisle as a married couple — usually upbeat and celebratory.";
      if (/unity/.test(key))
        return "A symbolic ceremony ritual — candle, sand, or whatever feels right for you.";
      if (/vow/.test(key))
        return "The heart of your ceremony — your promises to each other.";
      return "A ceremony moment your DJ will cue the music for.";
    case "playlist":
      return "Background music to set the mood during this part of the evening.";
    case "custom":
    default:
      return "A special moment you've added to make your day uniquely yours.";
  }
}

/** Song CTA label for couple timeline cards — what to show when no song is chosen. */
export function coupleTimelineSongCta(type: TimelineMomentType, title: string): string | null {
  const key = title.trim().toLowerCase();
  switch (type) {
    case "open_dance":
    case "meal":
    case "speech":
      return null;
    case "introduction":
      if (/grand entrance/.test(key)) return "Pick your entrance song";
      return "Pick a song";
    case "dance":
      if (/first dance/.test(key)) return "Pick your first dance song";
      return "Pick a song for this dance";
    case "ceremony":
      if (/processional/.test(key)) return "Pick a processional song";
      if (/recessional/.test(key)) return "Pick a recessional song";
      return "Pick a song";
    case "tradition":
      if (/cake/.test(key)) return "Pick a song for the cake cutting";
      return "Pick a song";
    case "exit":
      return "Pick your sendoff song";
    default:
      return "Pick a song";
  }
}

/** Light contextual copy for couple timeline cards — references planning homes, never duplicates data. */
export function coupleTimelineMomentReferenceHint(type: TimelineMomentType): string | null {
  switch (type) {
    case "ceremony":
      return "Ceremony details live in Ceremony planning — this moment holds timing and flow.";
    case "playlist":
    case "dance":
    case "open_dance":
      return "Song and playlist details live in Music Hub — referenced here for timing.";
    case "introduction":
      return "Lineup and introductions reference People & Vendors and reception planning.";
    case "speech":
      return "Speaker details reference reception planning — not duplicated on the timeline.";
    case "meal":
      return "Meal timing lives here; menu and service stay with your venue team.";
    case "tradition":
      return "Tradition timing here; specific details may live in reception planning.";
    case "photo":
      return "Photo timing here; shot lists stay with your photographer.";
    case "exit":
      return "Send-off timing here; logistics stay with your planner and vendors.";
    case "custom":
      return null;
  }
}
