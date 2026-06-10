import type { EventSettings, PlanningQuestionDef } from "@/types/planning";

export type PlanningLayoutProfile = EventSettings["eventLayoutProfile"];

export type PlanningQuestionGroupDef = {
  id: string;
  label: string;
};

const WEDDING_STYLE_GROUPS: PlanningQuestionGroupDef[] = [
  { id: "about_you", label: "About You" },
  { id: "event_details", label: "Event Details" },
  { id: "ceremony", label: "Ceremony" },
  { id: "reception_timeline", label: "Reception / Timeline" },
  { id: "music_preferences", label: "Music Preferences" },
  { id: "vendors_coordination", label: "Event team / coordination" },
  { id: "special_moments", label: "Special Moments" },
  { id: "final_notes", label: "Final Notes" },
];

const CORPORATE_STYLE_GROUPS: PlanningQuestionGroupDef[] = [
  { id: "event_details", label: "Event Details" },
  { id: "run_of_show", label: "Run of Show" },
  { id: "announcements_scripts", label: "Announcements / Scripts" },
  { id: "music_direction", label: "Music Direction" },
  { id: "vendors_coordination", label: "Event team / coordination" },
  { id: "final_notes", label: "Final Notes" },
];

const SCHOOL_STYLE_GROUPS: PlanningQuestionGroupDef[] = [
  { id: "event_details", label: "Event Details" },
  { id: "music_clean_edits", label: "Music / Clean Edits" },
  { id: "requests", label: "Requests" },
  { id: "announcements", label: "Announcements" },
  { id: "timeline", label: "Timeline" },
  { id: "final_notes", label: "Final Notes" },
];

const PRIVATE_PARTY_STYLE_GROUPS: PlanningQuestionGroupDef[] = [
  { id: "event_details", label: "Event Details" },
  { id: "timeline", label: "Timeline" },
  { id: "music_direction", label: "Music Direction" },
  { id: "announcements", label: "Announcements" },
  { id: "special_moments", label: "Special Moments" },
  { id: "final_notes", label: "Final Notes" },
];

/** Ordered section headers per event type — questions map via `sectionGroup` on each `PlanningQuestionDef`. */
export const PLANNING_QUESTION_GROUPS_BY_PROFILE: Record<
  PlanningLayoutProfile,
  PlanningQuestionGroupDef[]
> = {
  Wedding: WEDDING_STYLE_GROUPS,
  "Gender-Neutral Wedding": WEDDING_STYLE_GROUPS,
  Corporate: CORPORATE_STYLE_GROUPS,
  "Holiday Party": CORPORATE_STYLE_GROUPS,
  "School Dance": SCHOOL_STYLE_GROUPS,
  "Graduation Celebration": SCHOOL_STYLE_GROUPS,
  "Private Party": PRIVATE_PARTY_STYLE_GROUPS,
  "Birthday Party": PRIVATE_PARTY_STYLE_GROUPS,
  "Bar/Club Event": PRIVATE_PARTY_STYLE_GROUPS,
};

function humanizeUnknownGroupId(id: string): string {
  return id
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export type GroupedPlanningQuestionsRow = {
  group: PlanningQuestionGroupDef;
  questions: PlanningQuestionDef[];
};

/** Buckets questions under ordered sections; drops empty sections. Unknown `sectionGroup` keys append at end. */
export function groupPlanningQuestionsBySection(
  questions: PlanningQuestionDef[],
  profile: PlanningLayoutProfile,
): GroupedPlanningQuestionsRow[] {
  const order = PLANNING_QUESTION_GROUPS_BY_PROFILE[profile];
  const labelById = new Map(order.map((g) => [g.id, g.label]));
  const bucket = new Map<string, PlanningQuestionDef[]>();

  for (const q of questions) {
    const key = (q.sectionGroup ?? "event_details").trim() || "event_details";
    if (!bucket.has(key)) bucket.set(key, []);
    bucket.get(key)!.push(q);
  }

  const rows: GroupedPlanningQuestionsRow[] = [];
  const used = new Set<string>();

  for (const g of order) {
    const qs = bucket.get(g.id);
    if (qs?.length) {
      rows.push({ group: g, questions: qs });
      used.add(g.id);
    }
  }

  for (const [id, qs] of bucket) {
    if (!used.has(id) && qs.length > 0) {
      rows.push({
        group: {
          id,
          label: labelById.get(id) ?? humanizeUnknownGroupId(id),
        },
        questions: qs,
      });
    }
  }

  return rows;
}

export function computePlanningQuestionGroupCompletion(
  questions: PlanningQuestionDef[],
  answers: Record<string, string> | undefined,
): number {
  const safe = answers ?? {};
  if (questions.length === 0) return 100;
  const answered = questions.filter((q) => (safe[q.id] ?? "").trim().length > 0).length;
  return Math.round((answered / questions.length) * 100);
}
