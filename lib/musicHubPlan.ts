import {
  emptyMusicTasteProfile,
  musicTasteProfileHasSelections,
  normalizeMusicTasteProfile,
} from "@/data/musicTasteProfileCatalog";
import type {
  EventRecord,
  MusicTasteProfile,
  MusicVibeDetail,
  SharedPlaylistLink,
} from "@/types/planning";
import { cloneJson } from "@/utils/planning";

export type EventMusicHubPlanSnapshot = {
  musicGenreEraSelections: string[];
  musicTasteProfile: MusicTasteProfile;
  musicVibeDetail: MusicVibeDetail;
  musicPlaylistLinks: SharedPlaylistLink[];
};

function hasMusicVibeDetailSelections(detail: MusicVibeDetail | undefined): boolean {
  if (!detail) return false;
  return Boolean(
    detail.genres?.trim() ||
      detail.energy?.trim() ||
      detail.crowdNotes?.trim() ||
      detail.cleanMusicPrefs?.trim(),
  );
}

function parseSharedPlaylistLinks(raw: unknown): SharedPlaylistLink[] {
  if (!Array.isArray(raw)) return [];
  const links: SharedPlaylistLink[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    const row = entry as Record<string, unknown>;
    const url = typeof row.url === "string" ? row.url.trim() : "";
    if (!url) continue;
    const id =
      typeof row.id === "string" && row.id.trim()
        ? row.id.trim()
        : `pl-${links.length + 1}`;
    links.push({
      id,
      url,
      label: typeof row.label === "string" && row.label.trim() ? row.label.trim() : undefined,
      notes: typeof row.notes === "string" && row.notes.trim() ? row.notes.trim() : undefined,
    });
  }
  return links;
}

export function emptyMusicHubPlanSnapshot(): EventMusicHubPlanSnapshot {
  return {
    musicGenreEraSelections: [],
    musicTasteProfile: emptyMusicTasteProfile(),
    musicVibeDetail: {},
    musicPlaylistLinks: [],
  };
}

function parseMusicVibeDetail(raw: unknown): MusicVibeDetail {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const entry = raw as Record<string, unknown>;
  const read = (key: keyof MusicVibeDetail) =>
    typeof entry[key] === "string" ? (entry[key] as string) : undefined;
  return {
    genres: read("genres"),
    energy: read("energy"),
    crowdNotes: read("crowdNotes"),
    cleanMusicPrefs: read("cleanMusicPrefs"),
  };
}

export function parseMusicHubPlanJson(value: unknown): EventMusicHubPlanSnapshot | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  const genreEra = Array.isArray(raw.musicGenreEraSelections)
    ? raw.musicGenreEraSelections.filter((x): x is string => typeof x === "string")
    : [];
  return {
    musicGenreEraSelections: genreEra,
    musicTasteProfile: normalizeMusicTasteProfile(raw.musicTasteProfile as MusicTasteProfile | undefined),
    musicVibeDetail: parseMusicVibeDetail(raw.musicVibeDetail),
    musicPlaylistLinks: parseSharedPlaylistLinks(raw.musicPlaylistLinks),
  };
}

export function isMusicHubPlanSnapshotEmpty(
  plan: EventMusicHubPlanSnapshot | null | undefined,
): boolean {
  if (!plan) return true;
  return (
    plan.musicGenreEraSelections.length === 0 &&
    !musicTasteProfileHasSelections(plan.musicTasteProfile) &&
    !hasMusicVibeDetailSelections(plan.musicVibeDetail) &&
    plan.musicPlaylistLinks.length === 0
  );
}

export function buildMusicHubPlanSnapshot(input: {
  musicGenreEraSelections: string[];
  musicTasteProfile: MusicTasteProfile;
  musicVibeDetail: MusicVibeDetail;
  musicPlaylistLinks?: SharedPlaylistLink[];
}): EventMusicHubPlanSnapshot {
  const vibe = input.musicVibeDetail ?? {};
  return {
    musicGenreEraSelections: [...input.musicGenreEraSelections],
    musicTasteProfile: normalizeMusicTasteProfile(input.musicTasteProfile),
    musicVibeDetail: {
      genres: vibe.genres?.trim() || undefined,
      energy: vibe.energy?.trim() || undefined,
      crowdNotes: vibe.crowdNotes?.trim() || undefined,
      cleanMusicPrefs: vibe.cleanMusicPrefs?.trim() || undefined,
    },
    musicPlaylistLinks: parseSharedPlaylistLinks(input.musicPlaylistLinks ?? []),
  };
}

export function applyMusicHubPlanSnapshotToEventFields(
  evt: EventRecord,
  plan: EventMusicHubPlanSnapshot,
): void {
  evt.musicGenreEraSelections = cloneJson(plan.musicGenreEraSelections);
  evt.musicTasteProfile = cloneJson(plan.musicTasteProfile);
  evt.musicVibeDetail = cloneJson(plan.musicVibeDetail);
  evt.musicPlaylistLinks = cloneJson(plan.musicPlaylistLinks);
}

export function clearMusicHubTasteFieldsOnEvent(evt: EventRecord): void {
  const empty = emptyMusicHubPlanSnapshot();
  applyMusicHubPlanSnapshotToEventFields(evt, empty);
}

export type MusicTasteChipField =
  | "danceFloorStyles"
  | "crowdPreferences"
  | "musicBehavior"
  | "lineDancesAndGroupSongs";

export function toggleMusicTasteProfileChip(
  profile: MusicTasteProfile,
  field: MusicTasteChipField,
  label: string,
): MusicTasteProfile {
  const normalized = normalizeMusicTasteProfile(profile);
  const current = normalized[field] ?? [];
  const nextValues = current.includes(label)
    ? current.filter((value) => value !== label)
    : [...current, label];
  return {
    ...normalized,
    [field]: nextValues,
  };
}

export function toggleMusicGenreEraSelection(
  selections: string[],
  label: string,
  order: ReadonlyMap<string, number>,
): string[] {
  const next = selections.includes(label)
    ? selections.filter((value) => value !== label)
    : [...selections, label];
  return [...next].sort(
    (a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0),
  );
}

export function updateMusicVibeDetailField(
  detail: MusicVibeDetail,
  field: keyof MusicVibeDetail,
  value: string,
): MusicVibeDetail {
  return { ...detail, [field]: value };
}

export function updateMusicTasteProfileNotes(
  profile: MusicTasteProfile,
  notes: string,
): MusicTasteProfile {
  return { ...normalizeMusicTasteProfile(profile), danceFloorVibeNotes: notes };
}

function unionStringArrays(...groups: readonly (readonly string[])[]): string[] {
  const next: string[] = [];
  for (const group of groups) {
    for (const value of group) {
      if (!next.includes(value)) next.push(value);
    }
  }
  return next;
}

function unionPlaylistLinks(
  hydrated: readonly SharedPlaylistLink[],
  prior: readonly SharedPlaylistLink[],
): SharedPlaylistLink[] {
  const next: SharedPlaylistLink[] = cloneJson([...hydrated]);
  for (const link of prior) {
    if (!link.url.trim()) continue;
    const exists = next.some(
      (existing) =>
        existing.id === link.id ||
        existing.url.trim().toLowerCase() === link.url.trim().toLowerCase(),
    );
    if (!exists) next.push(cloneJson(link));
  }
  return next;
}

function preferNonEmptyText(local: string | undefined, db: string | undefined): string | undefined {
  const localTrimmed = local?.trim();
  if (localTrimmed) return local;
  const dbTrimmed = db?.trim();
  return dbTrimmed ? db : undefined;
}

export function eventRecordToMusicHubPlanSnapshot(evt: EventRecord): EventMusicHubPlanSnapshot {
  return buildMusicHubPlanSnapshot({
    musicGenreEraSelections: evt.musicGenreEraSelections ?? [],
    musicTasteProfile: normalizeMusicTasteProfile(evt.musicTasteProfile),
    musicVibeDetail: evt.musicVibeDetail ?? {},
    musicPlaylistLinks: evt.musicPlaylistLinks ?? [],
  });
}

function priorMusicHubTasteExtendsHydrated(
  hydrated: EventMusicHubPlanSnapshot,
  prior: EventMusicHubPlanSnapshot,
): boolean {
  if (isMusicHubPlanSnapshotEmpty(prior)) return false;

  for (const value of prior.musicGenreEraSelections) {
    if (!hydrated.musicGenreEraSelections.includes(value)) return true;
  }

  const hydratedTaste = normalizeMusicTasteProfile(hydrated.musicTasteProfile);
  const priorTaste = normalizeMusicTasteProfile(prior.musicTasteProfile);
  const tasteFields: MusicTasteChipField[] = [
    "danceFloorStyles",
    "crowdPreferences",
    "musicBehavior",
    "lineDancesAndGroupSongs",
  ];
  for (const field of tasteFields) {
    for (const value of priorTaste[field] ?? []) {
      if (!(hydratedTaste[field] ?? []).includes(value)) return true;
    }
  }

  if (
    priorTaste.danceFloorVibeNotes?.trim() &&
    priorTaste.danceFloorVibeNotes.trim() !== (hydratedTaste.danceFloorVibeNotes ?? "").trim()
  ) {
    return true;
  }

  const vibeFields: (keyof MusicVibeDetail)[] = ["genres", "energy", "crowdNotes", "cleanMusicPrefs"];
  for (const field of vibeFields) {
    const priorValue = prior.musicVibeDetail[field]?.trim();
    if (!priorValue) continue;
    if (priorValue !== (hydrated.musicVibeDetail[field] ?? "").trim()) return true;
  }

  for (const link of prior.musicPlaylistLinks) {
    if (!link.url.trim()) continue;
    const exists = hydrated.musicPlaylistLinks.some(
      (existing) =>
        existing.id === link.id ||
        existing.url.trim().toLowerCase() === link.url.trim().toLowerCase(),
    );
    if (!exists) return true;
  }

  return isMusicHubPlanSnapshotEmpty(hydrated);
}

export function mergePriorMusicHubTasteIntoHydratedEvent(
  hydrated: EventRecord,
  prior: EventRecord,
): { event: EventRecord; mergedLocalTaste: boolean } {
  const hydratedPlan = eventRecordToMusicHubPlanSnapshot(hydrated);
  const priorPlan = eventRecordToMusicHubPlanSnapshot(prior);
  const shouldMerge = priorMusicHubTasteExtendsHydrated(hydratedPlan, priorPlan);
  if (!shouldMerge) {
    return { event: hydrated, mergedLocalTaste: false };
  }

  const hydratedTaste = normalizeMusicTasteProfile(hydratedPlan.musicTasteProfile);
  const priorTaste = normalizeMusicTasteProfile(priorPlan.musicTasteProfile);
  const mergedPlan: EventMusicHubPlanSnapshot = {
    musicGenreEraSelections: unionStringArrays(
      hydratedPlan.musicGenreEraSelections,
      priorPlan.musicGenreEraSelections,
    ),
    musicPlaylistLinks: unionPlaylistLinks(
      hydratedPlan.musicPlaylistLinks,
      priorPlan.musicPlaylistLinks,
    ),
    musicTasteProfile: normalizeMusicTasteProfile({
      danceFloorStyles: unionStringArrays(
        hydratedTaste.danceFloorStyles,
        priorTaste.danceFloorStyles,
      ),
      crowdPreferences: unionStringArrays(
        hydratedTaste.crowdPreferences,
        priorTaste.crowdPreferences,
      ),
      musicBehavior: unionStringArrays(hydratedTaste.musicBehavior, priorTaste.musicBehavior),
      lineDancesAndGroupSongs: unionStringArrays(
        hydratedTaste.lineDancesAndGroupSongs ?? [],
        priorTaste.lineDancesAndGroupSongs ?? [],
      ),
      danceFloorVibeNotes:
        preferNonEmptyText(
          priorTaste.danceFloorVibeNotes,
          hydratedTaste.danceFloorVibeNotes,
        ) ?? "",
    }),
    musicVibeDetail: {
      genres: preferNonEmptyText(priorPlan.musicVibeDetail.genres, hydratedPlan.musicVibeDetail.genres),
      energy: preferNonEmptyText(priorPlan.musicVibeDetail.energy, hydratedPlan.musicVibeDetail.energy),
      crowdNotes: preferNonEmptyText(
        priorPlan.musicVibeDetail.crowdNotes,
        hydratedPlan.musicVibeDetail.crowdNotes,
      ),
      cleanMusicPrefs: preferNonEmptyText(
        priorPlan.musicVibeDetail.cleanMusicPrefs,
        hydratedPlan.musicVibeDetail.cleanMusicPrefs,
      ),
    },
  };

  const merged: EventRecord = { ...hydrated };
  applyMusicHubPlanSnapshotToEventFields(merged, mergedPlan);
  return { event: merged, mergedLocalTaste: true };
}

export function mergeHydratedEventsPreservingLocalMusicHubTaste(
  priorEvents: EventRecord[],
  hydratedEvents: EventRecord[],
): { events: EventRecord[]; anyMerged: boolean } {
  const priorMap = new Map(priorEvents.map((evt) => [evt.id, evt]));
  let anyMerged = false;
  const events = hydratedEvents.map((hydrated) => {
    const prior = priorMap.get(hydrated.id);
    if (!prior) return hydrated;
    const { event, mergedLocalTaste } = mergePriorMusicHubTasteIntoHydratedEvent(hydrated, prior);
    if (mergedLocalTaste) anyMerged = true;
    return event;
  });
  return { events, anyMerged };
}
