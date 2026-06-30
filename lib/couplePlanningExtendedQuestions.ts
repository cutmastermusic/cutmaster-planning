/** Extended couple planning question IDs — stored in event planningQuestionAnswers JSON. */

export const EVENT_DETAILS_QUESTION_IDS = {
  expectedGuestCount: "pq_event_expected_guest_count",
} as const;

export const YOUR_TEAM_EVENT_DETAILS_QUESTION_IDS = {
  dressCode: "pq_team_dress_code",
  dressCodeOther: "pq_team_dress_code_other",
  socialInstagram: "pq_team_social_instagram",
  socialTiktok: "pq_team_social_tiktok",
  socialFacebook: "pq_team_social_facebook",
  socialMediaCapture: "pq_team_social_media_capture",
} as const;

export const RECEPTION_ATMOSPHERE_QUESTION_IDS = {
  cocktailHourVibe: "pq_music_cocktail_hour_vibe",
  cocktailHourVibeCustom: "pq_music_cocktail_hour_vibe_custom",
  dinnerVibe: "pq_music_dinner_vibe",
  dinnerVibeCustom: "pq_music_dinner_vibe_custom",
} as const;

export const RECEPTION_DINNER_QUESTION_IDS = {
  dinnerServiceStyle: "pq_reception_dinner_service_style",
  buffetTableRelease: "pq_reception_buffet_table_release",
} as const;

export const DRESS_CODE_OPTIONS = [
  "Black Tie",
  "Formal",
  "Semi-Formal",
  "Business Casual",
  "Cocktail Attire",
  "Casual",
  "Theme Attire",
  "Other",
] as const;

export const SOCIAL_MEDIA_CAPTURE_OPTIONS = [
  "Absolutely!",
  "Please ask first.",
  "We'd rather not.",
] as const;

export const DINNER_SERVICE_STYLE_OPTIONS = [
  "Plated",
  "Buffet",
  "Family Style",
  "Stations",
] as const;

export const BUFFET_TABLE_RELEASE_OPTIONS = [
  "Planner",
  "Venue Staff (recommended)",
  "DJ",
] as const;

export const COCKTAIL_HOUR_VIBE_OPTIONS = [
  "Acoustic",
  "Jazz",
  "Rat Pack",
  "Indie",
  "Country",
  "Tropical",
  "R&B",
  "Classical",
  "Instrumental",
  "Mix It Up",
  "Custom",
] as const;

export const DINNER_VIBE_OPTIONS = [
  "Motown/ Oldies",
  "Modern",
  "Jazz",
  "Singer-Songwriter",
  "Classic Hits",
  "Country",
  "Instrumental",
  "Chill",
  "Love Songs",
  "Mix It Up",
  "Custom",
] as const;

export const RECEPTION_VIBE_CUSTOM_CHIP = "Custom";

function trimValue(raw: string | undefined): string {
  return (raw ?? "").trim();
}

function extractRawChipValues(raw: string | undefined): string[] {
  const trimmed = trimValue(raw);
  if (!trimmed) return [];
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((entry): entry is string => typeof entry === "string")
        .map((entry) => entry.trim())
        .filter(Boolean);
    } catch {
      return [];
    }
  }
  return trimmed
    .split(/[,;\n]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseChipAnswer(raw: string | undefined, allowed: readonly string[]): string[] {
  const allowedSet = new Set<string>(allowed);
  const next: string[] = [];
  for (const entry of extractRawChipValues(raw)) {
    if (!allowedSet.has(entry) || next.includes(entry)) continue;
    next.push(entry);
  }
  return next;
}

function serializeChipAnswer(values: readonly string[], allowed: readonly string[]): string {
  const allowedSet = new Set<string>(allowed);
  const unique = [...new Set(values.filter((value) => allowedSet.has(value)))];
  if (unique.length === 0) return "";
  return JSON.stringify(unique);
}

export function parseCocktailHourVibeAnswer(raw: string | undefined): string[] {
  return parseChipAnswer(raw, COCKTAIL_HOUR_VIBE_OPTIONS);
}

export function parseDinnerVibeAnswer(raw: string | undefined): string[] {
  return parseChipAnswer(raw, DINNER_VIBE_OPTIONS);
}

export function serializeCocktailHourVibeAnswer(values: readonly string[]): string {
  return serializeChipAnswer(values, COCKTAIL_HOUR_VIBE_OPTIONS);
}

export function serializeDinnerVibeAnswer(values: readonly string[]): string {
  return serializeChipAnswer(values, DINNER_VIBE_OPTIONS);
}

export function formatVibeChipAnswerForDisplay(
  raw: string | undefined,
  customRaw: string | undefined,
  parse: (raw: string | undefined) => string[],
): string {
  const custom = trimValue(customRaw);
  const labels = parse(raw).map((chip) =>
    chip === RECEPTION_VIBE_CUSTOM_CHIP && custom ? `Custom (${custom})` : chip,
  );
  return labels.join(", ");
}

export function formatDressCodeForDisplay(
  dressCode: string | undefined,
  dressCodeOther: string | undefined,
): string {
  const code = trimValue(dressCode);
  if (!code) return "";
  if (code === "Other") {
    const other = trimValue(dressCodeOther);
    return other ? `Other (${other})` : "Other";
  }
  return code;
}

export function formatSocialHandlesForDisplay(input: {
  instagram?: string;
  tiktok?: string;
  facebook?: string;
}): string {
  const parts: string[] = [];
  const instagram = trimValue(input.instagram);
  const tiktok = trimValue(input.tiktok);
  const facebook = trimValue(input.facebook);
  if (instagram) parts.push(`Instagram: ${instagram}`);
  if (tiktok) parts.push(`TikTok: ${tiktok}`);
  if (facebook) parts.push(`Facebook: ${facebook}`);
  return parts.join(" · ");
}

export function normalizeDinnerServiceStyle(raw: string | undefined): string {
  const trimmed = trimValue(raw);
  return (DINNER_SERVICE_STYLE_OPTIONS as readonly string[]).includes(trimmed) ? trimmed : "";
}

export function isBuffetDinnerService(raw: string | undefined): boolean {
  return normalizeDinnerServiceStyle(raw) === "Buffet";
}

export function buildExtendedPlanningEventDocumentLines(
  answers: Record<string, string | undefined>,
): string[] {
  const lines: string[] = [];
  const guestCount = trimValue(answers[EVENT_DETAILS_QUESTION_IDS.expectedGuestCount]);
  const dressCode = formatDressCodeForDisplay(
    answers[YOUR_TEAM_EVENT_DETAILS_QUESTION_IDS.dressCode],
    answers[YOUR_TEAM_EVENT_DETAILS_QUESTION_IDS.dressCodeOther],
  );
  const socialHandles = formatSocialHandlesForDisplay({
    instagram: answers[YOUR_TEAM_EVENT_DETAILS_QUESTION_IDS.socialInstagram],
    tiktok: answers[YOUR_TEAM_EVENT_DETAILS_QUESTION_IDS.socialTiktok],
    facebook: answers[YOUR_TEAM_EVENT_DETAILS_QUESTION_IDS.socialFacebook],
  });
  const socialCapture = trimValue(answers[YOUR_TEAM_EVENT_DETAILS_QUESTION_IDS.socialMediaCapture]);
  const cocktailVibe = formatVibeChipAnswerForDisplay(
    answers[RECEPTION_ATMOSPHERE_QUESTION_IDS.cocktailHourVibe],
    answers[RECEPTION_ATMOSPHERE_QUESTION_IDS.cocktailHourVibeCustom],
    parseCocktailHourVibeAnswer,
  );
  const dinnerVibe = formatVibeChipAnswerForDisplay(
    answers[RECEPTION_ATMOSPHERE_QUESTION_IDS.dinnerVibe],
    answers[RECEPTION_ATMOSPHERE_QUESTION_IDS.dinnerVibeCustom],
    parseDinnerVibeAnswer,
  );
  const dinnerService = normalizeDinnerServiceStyle(
    answers[RECEPTION_DINNER_QUESTION_IDS.dinnerServiceStyle],
  );
  const tableRelease = trimValue(answers[RECEPTION_DINNER_QUESTION_IDS.buffetTableRelease]);

  if (
    guestCount ||
    dressCode ||
    socialHandles ||
    socialCapture ||
    cocktailVibe ||
    dinnerVibe ||
    dinnerService
  ) {
    lines.push("GUEST & EVENT DETAILS");
    if (guestCount) lines.push(`Expected guest count: ${guestCount}`);
    if (dressCode) lines.push(`Dress code: ${dressCode}`);
    if (socialHandles) lines.push(`Social media handles: ${socialHandles}`);
    if (socialCapture) lines.push(`Social media photo/video: ${socialCapture}`);
    if (cocktailVibe) lines.push(`Cocktail hour music vibe: ${cocktailVibe}`);
    if (dinnerVibe) lines.push(`Dinner music vibe: ${dinnerVibe}`);
    if (dinnerService) lines.push(`Dinner service style: ${dinnerService}`);
    if (dinnerService === "Buffet" && tableRelease) {
      lines.push(`Buffet table release: ${tableRelease}`);
    }
    lines.push("");
  }

  return lines;
}
