"use client";

import { useCallback, useRef, useState } from "react";

import { PrimaryButton } from "@/components/planning-ui";
import {
  createEmptySpeechesToastEntry,
  parseSpeechesToasts,
  sortSpeechesToastEntries,
  SPEECHES_TOASTS_HELPER_COPY,
  type SpeechesToastEntry,
} from "@/lib/speechesToasts";

const fieldLabel =
  "text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400";
const inputClass =
  "mt-1.5 block min-h-11 w-full rounded-xl border border-stone-200/90 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80 disabled:cursor-default disabled:bg-stone-100/80";

type CoupleSpeechesToastsInlineEditorProps = {
  toastsRaw: string;
  canEdit: boolean;
  onChange: (entries: SpeechesToastEntry[]) => void;
};

function cloneEntries(entries: SpeechesToastEntry[]): SpeechesToastEntry[] {
  return entries.map((entry) => ({ ...entry }));
}

export function CoupleSpeechesToastsInlineEditor({
  toastsRaw,
  canEdit,
  onChange,
}: CoupleSpeechesToastsInlineEditorProps) {
  const parsed = parseSpeechesToasts(toastsRaw);
  const [entries, setEntries] = useState<SpeechesToastEntry[]>(() =>
    parsed.length > 0 ? cloneEntries(parsed) : [],
  );
  const entriesRef = useRef(entries);

  const commit = useCallback(
    (next: SpeechesToastEntry[]) => {
      const sorted = sortSpeechesToastEntries(next);
      entriesRef.current = sorted;
      setEntries(sorted);
      onChange(sorted);
    },
    [onChange],
  );

  const patchEntry = useCallback(
    (id: string, patch: Partial<SpeechesToastEntry>) => {
      commit(entriesRef.current.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));
    },
    [commit],
  );

  const addEntry = useCallback(() => {
    commit([...entriesRef.current, createEmptySpeechesToastEntry(entriesRef.current.length)]);
  }, [commit]);

  const removeEntry = useCallback(
    (id: string) => {
      commit(entriesRef.current.filter((entry) => entry.id !== id));
    },
    [commit],
  );

  const moveEntry = useCallback(
    (id: string, direction: -1 | 1) => {
      const ordered = sortSpeechesToastEntries(entriesRef.current);
      const index = ordered.findIndex((entry) => entry.id === id);
      if (index < 0) return;
      const target = index + direction;
      if (target < 0 || target >= ordered.length) return;
      const next = ordered.slice();
      const [moved] = next.splice(index, 1);
      next.splice(target, 0, moved);
      commit(next);
    },
    [commit],
  );

  const sortedEntries = sortSpeechesToastEntries(entries);

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-stone-600">{SPEECHES_TOASTS_HELPER_COPY}</p>

      {sortedEntries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50/60 px-4 py-6 text-center">
          <p className="text-sm font-medium text-stone-800">No speakers added yet</p>
          <p className="mt-1.5 text-xs leading-relaxed text-stone-600">
            Add each toast in the order you want them to happen.
          </p>
        </div>
      ) : (
        sortedEntries.map((entry, index) => (
          <section
            key={entry.id}
            className="rounded-xl border border-stone-200/90 bg-stone-50/50 p-4 sm:p-5"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <p className={fieldLabel}>Speaker {index + 1}</p>
              {canEdit ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  <PrimaryButton
                    type="button"
                    onClick={() => moveEntry(entry.id, -1)}
                    disabled={index === 0}
                    className="rounded-lg border border-stone-300 bg-white px-2 py-1 text-[11px] font-semibold text-stone-800 disabled:opacity-40"
                  >
                    Up
                  </PrimaryButton>
                  <PrimaryButton
                    type="button"
                    onClick={() => moveEntry(entry.id, 1)}
                    disabled={index === sortedEntries.length - 1}
                    className="rounded-lg border border-stone-300 bg-white px-2 py-1 text-[11px] font-semibold text-stone-800 disabled:opacity-40"
                  >
                    Down
                  </PrimaryButton>
                  <PrimaryButton
                    type="button"
                    onClick={() => removeEntry(entry.id)}
                    className="rounded-lg border border-stone-300 bg-white px-2 py-1 text-[11px] font-semibold text-stone-700"
                  >
                    Remove
                  </PrimaryButton>
                </div>
              ) : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className={fieldLabel}>Role / introduction</span>
                <input
                  type="text"
                  value={entry.role}
                  disabled={!canEdit}
                  onChange={(event) => patchEntry(entry.id, { role: event.target.value })}
                  className={inputClass}
                  placeholder="Best Man"
                />
              </label>
              <label className="block">
                <span className={fieldLabel}>Name</span>
                <input
                  type="text"
                  value={entry.name}
                  disabled={!canEdit}
                  onChange={(event) => patchEntry(entry.id, { name: event.target.value })}
                  className={inputClass}
                  placeholder="Alex Johnson"
                />
              </label>
            </div>
          </section>
        ))
      )}

      {canEdit ? (
        <PrimaryButton
          type="button"
          onClick={addEntry}
          className="w-full rounded-xl border border-dashed border-stone-300 bg-white px-4 py-3 text-sm font-semibold text-stone-800 hover:bg-stone-50 sm:w-auto"
        >
          + Add speaker
        </PrimaryButton>
      ) : null}
    </div>
  );
}
