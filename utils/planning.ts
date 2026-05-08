import type {
  CeremonySongPlan,
  DisplayTimelineItem,
  FormalityItem,
  GuestRequestEntry,
  PlanningInsight,
  SongEntry,
} from "@/types/planning";

export function parseTimeToMinutesValue(rawTime: string): number {
  const value = rawTime.trim().toUpperCase();
  const match = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (!match) return Number.NaN;
  let hours = Number(match[1]) % 12;
  const minutes = Number(match[2]);
  if (match[3] === "PM") hours += 12;
  return hours * 60 + minutes;
}

export function buildPlanningInsights(
  mergedTimelineItems: DisplayTimelineItem[],
  formalities: FormalityItem[],
  mustPlaySongs: SongEntry[],
  doNotPlaySongs: SongEntry[],
  weddingPartyProcessional: CeremonySongPlan,
  brideGroomProcessional: CeremonySongPlan,
  microphoneNeeds: string,
  guestRequests: GuestRequestEntry[],
): PlanningInsight[] {
  const insights: PlanningInsight[] = [];

  const chronological = mergedTimelineItems
    .map((item) => ({
      item,
      minutes: parseTimeToMinutesValue(item.time),
    }))
    .filter((row) => Number.isFinite(row.minutes))
    .sort((a, b) => a.minutes - b.minutes);

  for (let i = 1; i < chronological.length; i++) {
    if (chronological[i].minutes === chronological[i - 1].minutes) {
      insights.push({
        id: `tl-overlap-${i}-${chronological[i].item.id}`,
        section: "timeline",
        variant: "warning",
        message: `${chronological[i - 1].item.title} and ${chronological[i].item.title} share the same start time — consider a quick stagger so transitions stay smooth.`,
      });
    }
  }

  const dinnerRow = chronological.find((row) =>
    row.item.title.toLowerCase().includes("dinner"),
  );
  if (dinnerRow) {
    const dinnerIndex = chronological.indexOf(dinnerRow);
    if (dinnerIndex !== -1 && dinnerIndex < chronological.length - 1) {
      const nextMinutes = chronological[dinnerIndex + 1].minutes - dinnerRow.minutes;
      if (nextMinutes >= 0 && nextMinutes < 45) {
        insights.push({
          id: "tl-dinner-short",
          section: "timeline",
          variant: "warning",
          message:
            "The dinner service window looks tight compared to what follows — consider adding minutes for plating and guest movement.",
        });
      }
    }
  }

  const speechRow = chronological.find((row) =>
    /speech|toast/i.test(row.item.title),
  );
  if (speechRow) {
    const speechIndex = chronological.indexOf(speechRow);
    if (speechIndex > 0) {
      const gap =
        speechRow.minutes - chronological[speechIndex - 1].minutes;
      if (gap >= 0 && gap < 15) {
        insights.push({
          id: "tl-speech-buffer",
          section: "timeline",
          variant: "warning",
          message:
            "Speeches start soon after the prior moment — add a short buffer for mic checks and guest seating.",
        });
      }
    }
  }

  const openDancingRow = chronological.find((row) =>
    /open danc/i.test(row.item.title),
  );
  if (openDancingRow && openDancingRow.minutes > 21 * 60 + 15) {
    insights.push({
      id: "tl-open-late",
      section: "timeline",
      variant: "warning",
      message:
        "Open dancing starts relatively late — guests may lose momentum earlier in the evening.",
    });
  }

  const formalitiesTimed = [...formalities]
    .filter((f) => Number.isFinite(parseTimeToMinutesValue(f.time)))
    .sort(
      (a, b) =>
        parseTimeToMinutesValue(a.time) - parseTimeToMinutesValue(b.time),
    );
  for (let i = 1; i < formalitiesTimed.length; i++) {
    const gap =
      parseTimeToMinutesValue(formalitiesTimed[i].time) -
      parseTimeToMinutesValue(formalitiesTimed[i - 1].time);
    if (gap >= 0 && gap < 12) {
      insights.push({
        id: `tl-formality-gap-${formalitiesTimed[i].id}`,
        section: "timeline",
        variant: "warning",
        message: `${formalitiesTimed[i - 1].momentName} and ${formalitiesTimed[i].momentName} are very close together — allow breathing room for cues and applause.`,
      });
    }
  }

  if (mustPlaySongs.length === 0) {
    insights.push({
      id: "music-no-must",
      section: "music",
      variant: "warning",
      message:
        "No must-play songs yet — add a short list so the DJ knows your non-negotiable tracks.",
    });
  }

  if (doNotPlaySongs.length > 8) {
    insights.push({
      id: "music-many-dnp",
      section: "music",
      variant: "warning",
      message:
        "Your do-not-play list is long — too many restrictions can limit energy and requests.",
    });
  }

  const lastDance = formalities.find((f) =>
    /last\s*dance/i.test(f.momentName),
  );
  if (lastDance && !lastDance.songTitle.trim()) {
    insights.push({
      id: "music-last-dance",
      section: "music",
      variant: "suggestion",
      message:
        "Pick a last dance song in Formal Dances so the closing moment feels intentional.",
    });
  }

  const kickoff = formalities.find((f) =>
    /open\s*dancing\s*kickoff/i.test(f.momentName),
  );
  if (kickoff && !kickoff.songTitle.trim()) {
    insights.push({
      id: "music-kickoff",
      section: "music",
      variant: "suggestion",
      message:
        "Set an open dancing kickoff track — it sets the tone when the floor opens.",
    });
  }

  if (
    !weddingPartyProcessional.title.trim() ||
    !brideGroomProcessional.title.trim()
  ) {
    insights.push({
      id: "ceremony-processional",
      section: "ceremony",
      variant: "warning",
      message:
        "Complete both processional song selections so aisle cues are crystal clear.",
    });
  }

  if (!microphoneNeeds.trim()) {
    insights.push({
      id: "ceremony-mic",
      section: "ceremony",
      variant: "warning",
      message:
        "Add microphone needs — officiant and readers sound better with a clear lav or handheld plan.",
    });
  }

  const pendingCount = guestRequests.filter((r) => r.status === "Pending").length;
  if (pendingCount > 5) {
    insights.push({
      id: "guest-pending",
      section: "guest",
      variant: "warning",
      message: `${pendingCount} guest requests are still pending — review soon so expectations stay clear.`,
    });
  }

  return insights;
}

export const cloneJson = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
