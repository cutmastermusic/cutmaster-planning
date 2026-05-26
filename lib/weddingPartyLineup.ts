import { parseGrandEntranceLineup } from "@/lib/grandEntranceDetail";

export const WEDDING_PARTY_LINEUP_STORAGE_PREFIX = "wpl:v1:";

export type WeddingPartyLineupEntry = {
  id: string;
  introDisplayName: string;
  role: string;
  pronunciationNotes: string;
  entranceNotes: string;
  order: number;
};

export const WEDDING_PARTY_LINEUP_HELPER_COPY =
  "Add each entrance exactly how you want it introduced. Some wedding parties enter as couples, some enter individually, and some enter as groups. Use the wording you'd like your DJ/MC to say, and add pronunciation notes if needed.";

function normalizeEntry(
  value: unknown,
  fallbackOrder: number,
): WeddingPartyLineupEntry | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Partial<WeddingPartyLineupEntry>;
  const introDisplayName =
    typeof row.introDisplayName === "string" ? row.introDisplayName.trim() : "";
  if (!introDisplayName) return null;
  return {
    id: typeof row.id === "string" && row.id.trim() ? row.id.trim() : `wpl-${fallbackOrder}`,
    introDisplayName,
    role: typeof row.role === "string" ? row.role.trim() : "",
    pronunciationNotes:
      typeof row.pronunciationNotes === "string" ? row.pronunciationNotes.trim() : "",
    entranceNotes:
      typeof row.entranceNotes === "string" ? row.entranceNotes.trim() : "",
    order: typeof row.order === "number" && Number.isFinite(row.order) ? row.order : fallbackOrder,
  };
}

export function sortWeddingPartyLineupEntries(
  entries: WeddingPartyLineupEntry[],
): WeddingPartyLineupEntry[] {
  return entries
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((entry, index) => ({ ...entry, order: index }));
}

export function parseWeddingPartyLineup(raw: string | undefined | null): WeddingPartyLineupEntry[] {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed) return [];

  if (trimmed.startsWith(WEDDING_PARTY_LINEUP_STORAGE_PREFIX)) {
    try {
      const parsed: unknown = JSON.parse(
        trimmed.slice(WEDDING_PARTY_LINEUP_STORAGE_PREFIX.length),
      );
      if (!Array.isArray(parsed)) return [];
      const entries = parsed
        .map((row, index) => normalizeEntry(row, index))
        .filter((row): row is WeddingPartyLineupEntry => row != null);
      return sortWeddingPartyLineupEntries(entries);
    } catch {
      return [];
    }
  }

  return sortWeddingPartyLineupEntries(
    parseGrandEntranceLineup(trimmed).map((line, index) => ({
      id: `legacy-${index}`,
      introDisplayName: line,
      role: "",
      pronunciationNotes: "",
      entranceNotes: "",
      order: index,
    })),
  );
}

export function serializeWeddingPartyLineup(entries: WeddingPartyLineupEntry[]): string {
  const normalized = sortWeddingPartyLineupEntries(
    entries.filter((entry) => entry.introDisplayName.trim()),
  );
  if (normalized.length === 0) return "";
  return WEDDING_PARTY_LINEUP_STORAGE_PREFIX + JSON.stringify(normalized);
}

export function weddingPartyLineupHasEntries(raw: string | undefined | null): boolean {
  return parseWeddingPartyLineup(raw).some((entry) => entry.introDisplayName.trim());
}

export function formatWeddingPartyLineupForDisplay(raw: string | undefined | null): string {
  const entries = parseWeddingPartyLineup(raw);
  if (entries.length === 0) return "";

  return entries
    .map((entry, index) => {
      const lines = [`${index + 1}. ${entry.introDisplayName}`];
      if (entry.role.trim()) lines.push(`Role: ${entry.role.trim()}`);
      if (entry.pronunciationNotes.trim()) {
        lines.push(`Pronunciation: ${entry.pronunciationNotes.trim()}`);
      }
      if (entry.entranceNotes.trim()) lines.push(`Notes: ${entry.entranceNotes.trim()}`);
      return lines.join("\n   ");
    })
    .join("\n");
}

export function createEmptyWeddingPartyLineupEntry(order: number): WeddingPartyLineupEntry {
  return {
    id: `wpl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    introDisplayName: "",
    role: "",
    pronunciationNotes: "",
    entranceNotes: "",
    order,
  };
}

export function weddingPartyLineupEntriesEqual(
  a: WeddingPartyLineupEntry[],
  b: WeddingPartyLineupEntry[],
): boolean {
  const left = sortWeddingPartyLineupEntries(a);
  const right = sortWeddingPartyLineupEntries(b);
  if (left.length !== right.length) return false;
  return left.every((entry, index) => {
    const other = right[index];
    return (
      entry.id === other.id &&
      entry.introDisplayName.trim() === other.introDisplayName.trim() &&
      entry.role.trim() === other.role.trim() &&
      entry.pronunciationNotes.trim() === other.pronunciationNotes.trim() &&
      entry.entranceNotes.trim() === other.entranceNotes.trim() &&
      entry.order === other.order
    );
  });
}
