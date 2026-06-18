import { normalizeDefaultTimelineMomentKey } from "@/lib/restoreDefaultTimelineMoments";
import { findParentDanceParticipants, isParentDanceTimelineItem } from "@/lib/formalDanceDetail";
import { isGrandEntranceTimelineItem } from "@/lib/grandEntranceDetail";
import { isToastTimelineItem } from "@/lib/speechesToasts";
import { getWeddingPartyLineupPreviewContent } from "@/lib/weddingPartyLineup";
import type { EventMusicHubPlanSnapshot } from "@/lib/musicHubPlan";
import { musicTasteProfileHasSelections, emptyMusicTasteProfile } from "@/data/musicTasteProfileCatalog";
import {
  resolveTimelineMomentType,
  type TimelineMomentType,
} from "@/lib/timelineMomentType";
import type { CeremonyPlan, CeremonyTimelineItem } from "@/types/planning";

/** Reference implementations — expand to more moment types over time. */
export type CoupleTimelineMomentWorkspaceId =
  | "dance_first"
  | "dance_parent"
  | "cake_cutting"
  | "open_dancing"
  | "speech_toasts"
  | "ceremony"
  | "grand_entrance";

export function isFirstDanceTimelineItem(title: string): boolean {
  const key = normalizeDefaultTimelineMomentKey(title);
  return key === "first dance";
}

export function isCeremonyMainTimelineMoment(title: string): boolean {
  const key = normalizeDefaultTimelineMomentKey(title);
  return key === "ceremony" || key === "pre-ceremony";
}

export function isCakeCuttingTimelineItem(title: string): boolean {
  const key = normalizeDefaultTimelineMomentKey(title);
  return key === "cake cutting";
}

export function isOpenDancingTimelineItem(title: string): boolean {
  const key = normalizeDefaultTimelineMomentKey(title);
  return key === "open dancing" || key === "open dancing kickoff";
}

export function resolveCoupleTimelineMomentWorkspaceId(item: {
  title: string;
  momentType?: TimelineMomentType | string | null;
}): CoupleTimelineMomentWorkspaceId | null {
  const momentType = resolveTimelineMomentType(item);

  if (momentType === "dance" && isFirstDanceTimelineItem(item.title)) {
    return "dance_first";
  }
  if (momentType === "dance" && isParentDanceTimelineItem(item.title)) {
    return "dance_parent";
  }
  if (momentType === "speech" && isToastTimelineItem(item.title)) {
    return "speech_toasts";
  }
  if (momentType === "ceremony" && isCeremonyMainTimelineMoment(item.title)) {
    return "ceremony";
  }
  if (momentType === "tradition" && isCakeCuttingTimelineItem(item.title)) {
    return "cake_cutting";
  }
  if (momentType === "open_dance" && isOpenDancingTimelineItem(item.title)) {
    return "open_dancing";
  }
  if (momentType === "introduction" && isGrandEntranceTimelineItem(item.title)) {
    return "grand_entrance";
  }

  return null;
}

export function coupleTimelineMomentUsesWorkspace(item: {
  title: string;
  momentType?: TimelineMomentType | string | null;
}): boolean {
  return resolveCoupleTimelineMomentWorkspaceId(item) != null;
}

export type MusicHubMomentWorkspaceRef = {
  playlistLinkCount: number;
  playlistPreview: string[];
  hasMusicProfile: boolean;
  hasVibeNotes: boolean;
};

export function buildMusicHubMomentWorkspaceRef(
  plan: EventMusicHubPlanSnapshot | null | undefined,
): MusicHubMomentWorkspaceRef {
  const links = plan?.musicPlaylistLinks ?? [];
  const labels = links
    .map((link) => link.label?.trim() || link.url.trim())
    .filter(Boolean)
    .slice(0, 3);
  const vibe = plan?.musicVibeDetail;
  return {
    playlistLinkCount: links.length,
    playlistPreview: labels,
    hasMusicProfile: musicTasteProfileHasSelections(plan?.musicTasteProfile ?? emptyMusicTasteProfile()),
    hasVibeNotes: Boolean(
      vibe?.genres?.trim() ||
        vibe?.energy?.trim() ||
        vibe?.crowdNotes?.trim() ||
        vibe?.cleanMusicPrefs?.trim(),
    ),
  };
}

export type GrandEntranceMomentWorkspaceRef = {
  lineupPreview: Array<{ primary: string; secondary?: string }>;
  moreLineupCount: number;
};

export function buildGrandEntranceMomentWorkspaceRef(
  lineupRaw: string | undefined | null,
): GrandEntranceMomentWorkspaceRef {
  const preview = getWeddingPartyLineupPreviewContent(lineupRaw, 4);
  return {
    lineupPreview: preview.previewLines,
    moreLineupCount: preview.moreCount,
  };
}

export type ParentDanceMomentWorkspaceRef = {
  participants: string;
};

export function buildParentDanceMomentWorkspaceRef(
  title: string,
  formalDancesRaw: string | undefined | null,
): ParentDanceMomentWorkspaceRef {
  return {
    participants: findParentDanceParticipants(title, formalDancesRaw),
  };
}

function readFirstAnswer(
  answers: Record<string, string | undefined>,
  keys: string[],
): string {
  for (const key of keys) {
    const value = answers[key]?.trim();
    if (value) return value;
  }
  return "";
}

function uniqueJoined(values: Array<string | undefined>, max = 4): string {
  const seen: string[] = [];
  for (const value of values) {
    for (const part of (value ?? "").split(/[,;\n]/)) {
      const trimmed = part.trim();
      if (trimmed && !seen.includes(trimmed)) seen.push(trimmed);
    }
  }
  if (seen.length <= max) return seen.join(", ");
  return `${seen.slice(0, max).join(", ")} + ${seen.length - max} more`;
}

export type OpenDancingMomentWorkspaceRef = {
  guestCount: string;
  ageGroup: string;
  partyRating: string;
  favoriteGenres: string;
  guestRequestPolicy: string;
  musicSummaries: string[];
};

export function buildOpenDancingMomentWorkspaceRef(input: {
  answers: Record<string, string | undefined>;
  musicHubPlan: EventMusicHubPlanSnapshot | null | undefined;
  guestRequestsEnabled: boolean;
}): OpenDancingMomentWorkspaceRef {
  const plan = input.musicHubPlan;
  const taste = plan?.musicTasteProfile ?? emptyMusicTasteProfile();
  const vibe = plan?.musicVibeDetail;
  const crowdPreferences = uniqueJoined(taste.crowdPreferences, 3);
  const musicBehavior = uniqueJoined(taste.musicBehavior, 3);
  const lineDances = uniqueJoined(taste.lineDancesAndGroupSongs ?? [], 3);

  return {
    guestCount: readFirstAnswer(input.answers, [
      "pq_guest_count",
      "pq_event_guest_count",
      "pq_about_guest_count",
      "guest_count",
      "guestCount",
      "expected_guest_count",
    ]),
    ageGroup: readFirstAnswer(input.answers, [
      "pq_guest_age_range",
      "pq_age_range",
      "pq_guest_age_group",
      "age_range",
      "ageRange",
      "age_group",
    ]),
    partyRating:
      readFirstAnswer(input.answers, [
        "pq_party_rating",
        "pq_crowd_energy",
        "pq_music_energy",
        "party_rating",
        "crowd_energy",
      ]) ||
      vibe?.energy?.trim() ||
      uniqueJoined(taste.danceFloorStyles, 3),
    favoriteGenres: uniqueJoined([
      ...(plan?.musicGenreEraSelections ?? []),
      vibe?.genres,
    ]),
    guestRequestPolicy:
      readFirstAnswer(input.answers, [
        "pq_guest_request_policy",
        "pq_music_guest_request_policy",
        "pq_school_requests",
        "guest_request_policy",
      ]) || (input.guestRequestsEnabled ? "Open" : ""),
    musicSummaries: [
      crowdPreferences ? `Crowd preferences: ${crowdPreferences}` : "",
      musicBehavior ? `Music behavior: ${musicBehavior}` : "",
      lineDances ? `Line dances: ${lineDances}` : "",
      taste.danceFloorVibeNotes?.trim()
        ? `Dance floor vibe: ${taste.danceFloorVibeNotes.trim()}`
        : "",
      vibe?.crowdNotes?.trim() ? `Crowd notes: ${vibe.crowdNotes.trim()}` : "",
    ].filter(Boolean),
  };
}

function formatCeremonySong(plan: Pick<CeremonyPlan, "title" | "artist"> | undefined): string {
  if (!plan) return "";
  const title = plan.title?.trim() ?? "";
  const artist = plan.artist?.trim() ?? "";
  if (title && artist) return `${title} · ${artist}`;
  return title || artist;
}

function findCeremonyMomentSong(
  items: CeremonyTimelineItem[],
  pattern: RegExp,
): string {
  const row = items.find((item) => pattern.test(item.moment.trim()));
  return formatCeremonySong(
    row
      ? {
          title: row.songTitle,
          artist: row.artist,
        }
      : undefined,
  );
}

export type CeremonyMomentWorkspaceRef = {
  ceremonyAudioStatus: string;
  ceremonyAudioNotProvided: boolean;
  ceremonyStartTime: string;
  guestArrivalTime: string;
  officiantName: string;
  locationSummary: string;
  grandparentsProcessionalSong: string;
  parentsProcessionalSong: string;
  processionalSong: string;
  partnerProcessionalSong: string;
  unityCeremonySong: string;
  recessionalSong: string;
  ceremonyNotes: string;
  ceremonyMomentsPreview: Array<{ moment: string; timeOrOrder: string; song: string }>;
};

export function buildCeremonyMomentWorkspaceRef(input: {
  ceremonyAudioStatus?: string;
  ceremonyAudioNotProvided?: boolean;
  ceremonyStartTime: string;
  ceremonyGuestArrivalTime: string;
  officiantName: string;
  ceremonyNotes: string;
  weddingPartyProcessional: CeremonyPlan;
  brideGroomProcessional: CeremonyPlan;
  unityCeremonySong: CeremonyPlan;
  recessionalSong: CeremonyPlan;
  ceremonyLocationAnswer?: string;
  ceremonyLocationDetail?: string;
  ceremonyLocationSetting?: string;
  ceremonyTimelineItems: CeremonyTimelineItem[];
}): CeremonyMomentWorkspaceRef {
  const preview = input.ceremonyTimelineItems
    .filter((row) => row.moment.trim())
    .slice(0, 5)
    .map((row) => ({
      moment: row.moment.trim(),
      timeOrOrder: row.timeOrOrder?.trim() ?? "",
      song: formatCeremonySong({ title: row.songTitle, artist: row.artist }),
    }));

  return {
    ceremonyAudioStatus: input.ceremonyAudioStatus?.trim() || "Not answered",
    ceremonyAudioNotProvided: Boolean(input.ceremonyAudioNotProvided),
    ceremonyStartTime: input.ceremonyStartTime.trim(),
    guestArrivalTime: input.ceremonyGuestArrivalTime.trim(),
    officiantName: input.officiantName.trim(),
    locationSummary:
      input.ceremonyLocationSetting?.trim() ||
      input.ceremonyLocationDetail?.trim() ||
      input.ceremonyLocationAnswer?.trim() ||
      "",
    grandparentsProcessionalSong: findCeremonyMomentSong(input.ceremonyTimelineItems, /grandparent/i),
    parentsProcessionalSong: findCeremonyMomentSong(input.ceremonyTimelineItems, /\bparents?\b/i),
    processionalSong: formatCeremonySong(input.weddingPartyProcessional),
    partnerProcessionalSong: formatCeremonySong(input.brideGroomProcessional),
    unityCeremonySong: formatCeremonySong(input.unityCeremonySong),
    recessionalSong: formatCeremonySong(input.recessionalSong),
    ceremonyNotes: input.ceremonyNotes.trim(),
    ceremonyMomentsPreview: preview,
  };
}

export function coupleTimelineMomentWorkspaceTitle(id: CoupleTimelineMomentWorkspaceId): string {
  switch (id) {
    case "dance_first":
      return "First Dance";
    case "dance_parent":
      return "Parent Dance";
    case "cake_cutting":
      return "Cake Cutting";
    case "open_dancing":
      return "Open Dancing";
    case "speech_toasts":
      return "Toasts";
    case "ceremony":
      return "Ceremony";
    case "grand_entrance":
      return "Grand Entrance";
  }
}
