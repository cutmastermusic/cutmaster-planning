"use client";

/**
 * Compact Serato library status card for DJ Prep.
 * Shows index status and links to Serato Setup. Never shown to couples.
 */

import { useEffect, useState } from "react";
import { getLibraryMeta, isFileSystemAccessSupported, type SeratoLibraryMeta } from "@/lib/serato-library";

function formatRelativeDate(ts: number): string {
  const diffMs = Date.now() - ts;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 30) return `${diffDays} days ago`;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(ts));
}

type Props = {
  onGoToDjTools: () => void;
};

export function SeratoLibraryStatusCard({ onGoToDjTools }: Props) {
  const [meta, setMeta] = useState<SeratoLibraryMeta | undefined>();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!isFileSystemAccessSupported()) { setLoaded(true); return; }
    getLibraryMeta()
      .then(setMeta)
      .catch(console.error)
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded) return null;

  const indexed = !!meta;

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#2f4a3e]/8 text-[15px] text-[#2f4a3e]">
          ♫
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#2f4a3e]/55">
            DJ Prep · Serato Library
          </p>
          {indexed ? (
            <p className="text-sm font-medium text-[#214637]">
              {meta.trackCount.toLocaleString()} tracks indexed
              <span className="ml-2 text-[12px] font-normal text-stone-400">
                · scanned {formatRelativeDate(meta.lastScanned)}
              </span>
            </p>
          ) : (
            <p className="text-sm text-stone-500">
              Library not connected — check client songs against your music.
            </p>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onGoToDjTools}
        className="shrink-0 rounded-xl border border-[#2f4a3e]/20 bg-white px-3 py-1.5 text-[12px] font-medium text-[#2f4a3e] transition hover:border-[#2f4a3e]/35 hover:bg-[#f0ece5]"
      >
        {indexed ? "DJ Prep →" : "Set Up →"}
      </button>
    </div>
  );
}
