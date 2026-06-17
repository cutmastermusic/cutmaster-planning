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

function formatCeremonySong(plan: CeremonyPlan | undefined): string {
  if (!plan) return "";
  const title = plan.title?.trim() ?? "";
  const artist = plan.artist?.trim() ?? "";
  if (title && artist) return `${title} · ${artist}`;
  return title || artist;
}

export type CeremonyMomentWorkspaceRef = {
  ceremonyStartTime: string;
  guestArrivalTime: string;
  officiantName: string;
  locationSummary: string;
  processionalSong: string;
  recessionalSong: string;
  ceremonyNotes: string;
  ceremonyMomentsPreview: Array<{ moment: string; timeOrOrder: string }>;
};

export function buildCeremonyMomentWorkspaceRef(input: {
  ceremonyStartTime: string;
  ceremonyGuestArrivalTime: string;
  officiantName: string;
  ceremonyNotes: string;
  weddingPartyProcessional: CeremonyPlan;
  recessionalSong: CeremonyPlan;
  ceremonyLocationAnswer?: string;
  ceremonyTimelineItems: CeremonyTimelineItem[];
}): CeremonyMomentWorkspaceRef {
  const preview = input.ceremonyTimelineItems
    .filter((row) => row.moment.trim())
    .slice(0, 5)
    .map((row) => ({
      moment: row.moment.trim(),
      timeOrOrder: row.timeOrOrder?.trim() ?? "",
    }));

  return {
    ceremonyStartTime: input.ceremonyStartTime.trim(),
    guestArrivalTime: input.ceremonyGuestArrivalTime.trim(),
    officiantName: input.officiantName.trim(),
    locationSummary: input.ceremonyLocationAnswer?.trim() ?? "",
    processionalSong: formatCeremonySong(input.weddingPartyProcessional),
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
    case "speech_toasts":
      return "Toasts";
    case "ceremony":
      return "Ceremony";
    case "grand_entrance":
      return "Grand Entrance";
  }
}
