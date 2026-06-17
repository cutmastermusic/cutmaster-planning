import { parseWeddingPartyLineup } from "@/lib/weddingPartyLineup";
import { parseSpeechesToasts } from "@/lib/speechesToasts";
import { isGrandEntranceTimelineItem } from "@/lib/grandEntranceDetail";
import { resolveTimelineMomentType, type TimelineMomentType } from "@/lib/timelineMomentType";
import type { SharedPlaylistLink } from "@/types/planning";

const MAX_SUMMARY_LINES = 3;
const MAX_GRAND_ENTRANCE_SUMMARY_LINES = 4;

export type CoupleTimelineMomentSummaryContext = {
  speechesToastsRaw: string;
  weddingPartyLineupRaw: string;
  officiantName: string;
  ceremonyNotes: string;
  unityCeremonyNotes: string;
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
      const maxLineupLines =
        isGrandEntrance ? MAX_GRAND_ENTRANCE_SUMMARY_LINES - (song ? 1 : 0) : MAX_SUMMARY_LINES;
      for (const entry of parseWeddingPartyLineup(context.weddingPartyLineupRaw).slice(0, maxLineupLines)) {
        const role = entry.role.trim();
        const intro = entry.introDisplayName.trim();
        const line = role || intro;
        if (line) lines.push(line);
      }
      if (isGrandEntrance && song) lines.push(song);
      if (isGrandEntrance) return lines.slice(0, MAX_GRAND_ENTRANCE_SUMMARY_LINES);
      break;
    }
    case "dance": {
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
      if (context.mustPlayCount > 0) {
        lines.push("Must Play Playlist");
        lines.push(
          `${context.mustPlayCount} song${context.mustPlayCount === 1 ? "" : "s"}`,
        );
      } else {
        const playlist = firstPlaylistSummary(context.musicPlaylistLinks);
        if (playlist) lines.push(playlist);
        else {
          const song = formatSongSummary(item.songTitle, item.artist);
          if (song) lines.push(song);
        }
      }
      break;
    }
    case "ceremony": {
      const officiant = context.officiantName.trim();
      if (officiant) lines.push(officiant);
      const detail = firstMeaningfulLine(
        context.unityCeremonyNotes,
        context.ceremonyNotes,
        item.notes,
      );
      if (detail && lines.length < MAX_SUMMARY_LINES) lines.push(detail);
      break;
    }
    case "tradition":
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
