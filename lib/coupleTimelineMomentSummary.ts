import { parseWeddingPartyLineup } from "@/lib/weddingPartyLineup";
import { parseSpeechesToasts } from "@/lib/speechesToasts";
import { findParentDanceParticipants, isParentDanceTimelineItem } from "@/lib/formalDanceDetail";
import { isGrandEntranceTimelineItem } from "@/lib/grandEntranceDetail";
import { isCakeCuttingTimelineItem } from "@/lib/timelineMomentWorkspace";
import { resolveTimelineMomentType, type TimelineMomentType } from "@/lib/timelineMomentType";
import type { SharedPlaylistLink } from "@/types/planning";

const MAX_SUMMARY_LINES = 3;
const MAX_GRAND_ENTRANCE_SUMMARY_LINES = 4;
const MAX_GRAND_ENTRANCE_GROUPS = 3;
const MAX_NAMES_PER_INTRO_GROUP = 3;

export type CoupleTimelineMomentSummaryContext = {
  speechesToastsRaw: string;
  weddingPartyLineupRaw: string;
  formalDancesRaw: string;
  officiantName: string;
  ceremonyProcessionalSong: string;
  ceremonyPartnerProcessionalSong: string;
  ceremonyRecessionalSong: string;
  ceremonyNotes: string;
  unityCeremonyNotes: string;
  openDancingGuestCount: string;
  openDancingAgeGroup: string;
  openDancingPartyRating: string;
  openDancingFavoriteGenres: string;
  openDancingGuestRequestPolicy: string;
  musicPlaylistLinks: SharedPlaylistLink[];
  mustPlayCount: number;
};

function formatSongSummary(songTitle?: string, artist?: string): string | null {
  const song = songTitle?.trim() ?? "";
  const performer = artist?.trim() ?? "";
  if (song && performer) return `${song} — ${performer}`;
  return song || performer || null;
}

function firstPlaylistSummary(links: SharedPlaylistLink[]): string | null {
  const link = links[0];
  if (!link) return null;
  const label = link.label?.trim();
  if (label) return label;
  const url = link.url.trim().toLowerCase();
  if (url.includes("spotify")) return "Spotify Playlist";
  if (url.includes("apple")) return "Apple Music Playlist";
  if (url.includes("youtube")) return "YouTube Playlist";
  return "Shared Playlist";
}

function firstMeaningfulLine(...candidates: Array<string | undefined>): string | null {
  for (const candidate of candidates) {
    const line = candidate?.trim().split(/\r?\n/).map((part) => part.trim()).find(Boolean);
    if (line) return line;
  }
  return null;
}

function truncateLine(text: string, max = 72): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

function isUsefulCakeCuttingNote(note: string, song: string | null): boolean {
  const normalized = note.trim().toLowerCase();
  if (!normalized) return false;
  if (/^(tbd|none|n\/a|na|no notes?)\.?$/.test(normalized)) return false;
  if (song && normalized === song.trim().toLowerCase()) return false;
  return true;
}

function isMeaningfulTimelineNote(note: string): boolean {
  const normalized = note.trim().toLowerCase();
  if (!normalized) return false;
  return !/^(tbd|none|n\/a|na|no notes?)\.?$/.test(normalized);
}

function normalizeGroupKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function formatGrandEntranceLineupSummary(lineupRaw: string): string[] {
  const groups: Array<{ label: string; names: string[] }> = [];
  const groupIndex = new Map<string, number>();

  for (const entry of parseWeddingPartyLineup(lineupRaw)) {
    const role = entry.role.trim();
    const introName = entry.introDisplayName.trim();
    const label = role || introName;
    if (!label) continue;

    const key = normalizeGroupKey(role || `intro:${introName}`);
    let index = groupIndex.get(key);
    if (index == null) {
      index = groups.length;
      groupIndex.set(key, index);
      groups.push({ label, names: [] });
    }

    if (introName && normalizeGroupKey(introName) !== normalizeGroupKey(role)) {
      groups[index]?.names.push(introName);
    }
  }

  return groups.slice(0, MAX_GRAND_ENTRANCE_GROUPS).map((group) => {
    if (group.names.length === 0) return group.label;

    const visibleNames = group.names.slice(0, MAX_NAMES_PER_INTRO_GROUP);
    const moreCount = group.names.length - visibleNames.length;
    const value =
      moreCount > 0
        ? `${visibleNames.join(", ")} + ${moreCount} more`
        : visibleNames.join(", ");

    return `${group.label}: ${value}`;
  });
}

function summaryForMomentType(
  momentType: TimelineMomentType,
  item: {
    title: string;
    songTitle?: string;
    artist?: string;
    notes?: string;
  },
  context: CoupleTimelineMomentSummaryContext,
): string[] {
  const lines: string[] = [];

  switch (momentType) {
    case "speech": {
      for (const entry of parseSpeechesToasts(context.speechesToastsRaw).slice(0, MAX_SUMMARY_LINES)) {
        const role = entry.role.trim();
        const name = entry.name.trim();
        const line = role || name;
        if (line) lines.push(line);
      }
      break;
    }
    case "introduction": {
      const song = formatSongSummary(item.songTitle, item.artist);
      const isGrandEntrance = isGrandEntranceTimelineItem(item.title);
      if (isGrandEntrance) {
        lines.push(...formatGrandEntranceLineupSummary(context.weddingPartyLineupRaw));
        if (song) lines.push(song);
        return lines.slice(0, MAX_GRAND_ENTRANCE_SUMMARY_LINES);
      }
      for (const entry of parseWeddingPartyLineup(context.weddingPartyLineupRaw).slice(0, MAX_SUMMARY_LINES)) {
        const role = entry.role.trim();
        const intro = entry.introDisplayName.trim();
        const line = role || intro;
        if (line) lines.push(line);
      }
      break;
    }
    case "dance": {
      const participants = isParentDanceTimelineItem(item.title)
        ? findParentDanceParticipants(item.title, context.formalDancesRaw)
        : "";
      if (participants) lines.push(participants);
      const song = formatSongSummary(item.songTitle, item.artist);
      if (song) lines.push(song);
      break;
    }
    case "playlist":
    case "meal": {
      const playlist = firstPlaylistSummary(context.musicPlaylistLinks);
      if (playlist) {
        lines.push(playlist);
      } else {
        const song = formatSongSummary(item.songTitle, item.artist);
        if (song) lines.push(song);
      }
      break;
    }
    case "open_dance": {
      if (context.openDancingGuestCount.trim()) {
        lines.push(`Guest Count: ${context.openDancingGuestCount.trim()}`);
      }
      if (context.openDancingAgeGroup.trim()) {
        lines.push(`Age Group: ${context.openDancingAgeGroup.trim()}`);
      }
      if (context.openDancingPartyRating.trim()) {
        lines.push(`Party Rating: ${context.openDancingPartyRating.trim()}`);
      }
      if (context.openDancingFavoriteGenres.trim()) {
        lines.push(`Favorite Genres: ${context.openDancingFavoriteGenres.trim()}`);
      }
      if (context.openDancingGuestRequestPolicy.trim()) {
        lines.push(`Guest Request Policy: ${context.openDancingGuestRequestPolicy.trim()}`);
      }
      const note = firstMeaningfulLine(item.notes);
      if (note && isMeaningfulTimelineNote(note) && lines.length < 5) {
        lines.push(truncateLine(note));
      }
      return lines.slice(0, 5);
    }
    case "ceremony": {
      const officiant = context.officiantName.trim();
      if (officiant) lines.push(officiant);
      if (context.ceremonyProcessionalSong.trim()) {
        lines.push(context.ceremonyProcessionalSong.trim());
      }
      if (context.ceremonyPartnerProcessionalSong.trim()) {
        lines.push(context.ceremonyPartnerProcessionalSong.trim());
      }
      if (context.ceremonyRecessionalSong.trim()) {
        lines.push(context.ceremonyRecessionalSong.trim());
      }
      return lines.slice(0, 4);
    }
    case "tradition":
      if (isCakeCuttingTimelineItem(item.title)) {
        const song = formatSongSummary(item.songTitle, item.artist);
        if (song) lines.push(song);
        const note = firstMeaningfulLine(item.notes);
        if (note && isUsefulCakeCuttingNote(note, song)) lines.push(truncateLine(note));
        break;
      }
      {
        const song = formatSongSummary(item.songTitle, item.artist);
        if (song) {
          lines.push(song);
        } else {
          const note = firstMeaningfulLine(item.notes);
          if (note) lines.push(truncateLine(note));
        }
        break;
      }
    case "photo":
    case "exit":
    case "custom":
    default: {
      const song = formatSongSummary(item.songTitle, item.artist);
      if (song) {
        lines.push(song);
      } else {
        const note = firstMeaningfulLine(item.notes);
        if (note) lines.push(truncateLine(note));
      }
      break;
    }
  }

  return lines.slice(0, MAX_SUMMARY_LINES);
}

export function buildCoupleTimelineMomentSummaryLines(
  item: {
    title: string;
    momentType?: TimelineMomentType | string | null;
    songTitle?: string;
    artist?: string;
    notes?: string;
  },
  context: CoupleTimelineMomentSummaryContext,
): string[] {
  const momentType = resolveTimelineMomentType(item);
  return summaryForMomentType(momentType, item, context);
}
