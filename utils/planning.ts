import type {
  CeremonySongPlan,
  ChecklistStatus,
  DisplayTimelineItem,
  EventRecord,
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
        "Pick a last dance song in your reception timeline so the closing moment feels intentional.",
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

/** Tailwind classes — keep literals static so the JIT compiler retains them. */
export function eventCoverFallbackClasses(layoutProfile: string): string {
  switch (layoutProfile) {
    case "Wedding":
    case "Gender-Neutral Wedding":
      return "bg-gradient-to-br from-[#4a3424] via-[#1e1c26] to-[#09090d]";
    case "Corporate":
      return "bg-gradient-to-br from-[#1a2738] via-[#12161f] to-[#09090d]";
    case "Holiday Party":
      return "bg-gradient-to-br from-[#3b1f28] via-[#1a151c] to-[#09090d]";
    case "Graduation Celebration":
      return "bg-gradient-to-br from-[#1f3d36] via-[#141a18] to-[#09090d]";
    case "Birthday Party":
      return "bg-gradient-to-br from-[#4a2f52] via-[#1c151f] to-[#09090d]";
    case "Bar/Club Event":
      return "bg-gradient-to-br from-[#2b1f4a] via-[#15131f] to-[#09090d]";
    case "School Dance":
      return "bg-gradient-to-br from-[#1f3550] via-[#141820] to-[#09090d]";
    case "Private Party":
      return "bg-gradient-to-br from-[#342f48] via-[#17161e] to-[#09090d]";
    default:
      return "bg-gradient-to-br from-[#2f2838] via-[#16151c] to-[#09090d]";
  }
}

/**
 * Mirrors Dashboard checklist completion for any persisted event (used on All Events cards).
 */
export function approximatePlanningProgressPercent(evt: EventRecord): number {
  const s = evt.settings;
  const formalities = evt.formalities ?? [];
  const timelineItems = evt.timelineItems ?? [];

  const hasEventDetailsComplete = Boolean(
    (s?.eventName ?? "").trim() &&
      (s?.coupleNames ?? "").trim() &&
      (s?.venue ?? "").trim() &&
      (s?.weddingDate ?? "").trim(),
  );

  const wp = evt.weddingPartyProcessional?.title?.trim();
  const bp = evt.brideGroomProcessional?.title?.trim();
  const rs = evt.recessionalSong?.title?.trim();
  const hasKeyCeremonySongs = Boolean(wp && bp && rs);

  const hasKeyFormalDanceSongs = Boolean(
    formalities.find((f) => /first dance/i.test(f.momentName) && f.songTitle.trim()) &&
      formalities.find((f) => /father\/daughter/i.test(f.momentName) && f.songTitle.trim()) &&
      formalities.find((f) => /mother\/son/i.test(f.momentName) && f.songTitle.trim()),
  );

  const combinedTimelineTitles = [
    ...timelineItems.map((item) => item.title.toLowerCase()),
    ...formalities.filter((item) => item.includeInTimeline).map((item) => item.momentName.toLowerCase()),
  ];
  const hasKeyTimelineMoments = ["cocktail", "dinner", "toast", "open danc", "last"].every((needle) =>
    combinedTimelineTitles.some((title) => title.includes(needle)),
  );

  const guestRequests = evt.guestRequests ?? [];
  const noPendingGuestRequests = guestRequests.every((request) => request.status !== "Pending");

  const hasFinalDjNotes = Boolean((evt.generalDjNotes ?? "").trim().length >= 16);

  const tasks: { id: string; autoStatus: ChecklistStatus }[] = [
    {
      id: "complete-event-details",
      autoStatus: hasEventDetailsComplete ? ("Complete" as ChecklistStatus) : ("Not Started" as ChecklistStatus),
    },
    {
      id: "choose-ceremony-songs",
      autoStatus: hasKeyCeremonySongs ? ("Complete" as ChecklistStatus) : ("Not Started" as ChecklistStatus),
    },
    {
      id: "add-formal-dance-songs",
      autoStatus: hasKeyFormalDanceSongs ? ("Complete" as ChecklistStatus) : ("Not Started" as ChecklistStatus),
    },
    {
      id: "build-must-play-list",
      autoStatus: (evt.mustPlaySongs?.length ?? 0) > 0 ? ("Complete" as ChecklistStatus) : ("Not Started" as ChecklistStatus),
    },
    {
      id: "add-do-not-play-songs",
      autoStatus: (evt.doNotPlaySongs?.length ?? 0) > 0 ? ("Complete" as ChecklistStatus) : ("Not Started" as ChecklistStatus),
    },
    {
      id: "review-timeline",
      autoStatus: hasKeyTimelineMoments ? ("Complete" as ChecklistStatus) : ("Not Started" as ChecklistStatus),
    },
    {
      id: "approve-guest-requests",
      autoStatus:
        guestRequests.length > 0 && noPendingGuestRequests ? ("Complete" as ChecklistStatus) : ("Not Started" as ChecklistStatus),
    },
    {
      id: "add-final-dj-notes",
      autoStatus: hasFinalDjNotes ? ("Complete" as ChecklistStatus) : ("Not Started" as ChecklistStatus),
    },
  ];

  const manual = s?.checklistManualStatuses ?? {};
  let complete = 0;
  for (const t of tasks) {
    const status = manual[t.id] ?? t.autoStatus;
    if (status === "Complete") complete++;
  }
  return tasks.length === 0 ? 0 : Math.round((complete / tasks.length) * 100);
}

export function readImageFileAsDataUrl(file: File, maxBytes: number): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Please choose an image file."));
      return;
    }
    if (file.size > maxBytes) {
      reject(new Error(`Choose an image under ${Math.round(maxBytes / (1024 * 1024))} MB.`));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.readAsDataURL(file);
  });
}
