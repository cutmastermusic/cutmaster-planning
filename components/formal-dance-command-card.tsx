"use client";

import type { ReactNode } from "react";

type FormalDanceCommandCardProps = {
  title: string;
  songTitle?: string;
  artist?: string;
  fadeOutEarly?: boolean;
  fadeOutTimestamp?: string;
  done?: boolean;
};

function sectionLabelClass(done: boolean) {
  return `text-[10px] font-semibold uppercase tracking-[0.14em] ${
    done ? "text-stone-400" : "text-stone-500"
  }`;
}

function sectionDividerClass() {
  return "border-t border-stone-200/80 pt-4 mt-4 first:border-t-0 first:pt-0 first:mt-0";
}

function emptyTextClass(done: boolean) {
  return `text-sm leading-snug ${done ? "text-stone-500" : "text-stone-600"}`;
}

function CommandCardSection({
  label,
  done,
  children,
}: {
  label: string;
  done: boolean;
  children: ReactNode;
}) {
  return (
    <section className={sectionDividerClass()}>
      <p className={sectionLabelClass(done)}>{label}</p>
      <div className="mt-2">{children}</div>
    </section>
  );
}

/** Read-only formal dance operational reference for Run Of Show — song and fade cue. */
export function FormalDanceCommandCard({
  title,
  songTitle,
  artist,
  fadeOutEarly = false,
  fadeOutTimestamp,
  done = false,
}: FormalDanceCommandCardProps) {
  const songLabel = [songTitle?.trim(), artist?.trim()].filter(Boolean).join(" - ");
  const fadeLabel = fadeOutEarly
    ? fadeOutTimestamp?.trim()
      ? `Fade at ${fadeOutTimestamp.trim()}`
      : "Fade early"
    : "";

  const bodyStrong = done ? "text-stone-600" : "text-stone-950";
  const momentTitle = title.trim() || "Formal dance";

  return (
    <div
      className={`mt-6 rounded-2xl border border-stone-200/90 bg-stone-50/80 px-4 py-5 text-left sm:px-5 sm:py-6 ${
        done ? "opacity-90" : ""
      }`}
      aria-label={`${momentTitle} command reference`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-600">
        Formal Dance
      </p>
      <p className={`mt-2 text-lg font-semibold leading-snug sm:text-xl ${bodyStrong}`}>
        {momentTitle}
      </p>

      <CommandCardSection label="Song" done={done}>
        {songLabel ? (
          <p className={`text-lg font-semibold leading-snug sm:text-xl ${bodyStrong}`}>
            {songLabel}
          </p>
        ) : (
          <p className={emptyTextClass(done)}>No song yet</p>
        )}
      </CommandCardSection>

      {fadeOutEarly ? (
        <CommandCardSection label="Fade cue" done={done}>
          <p className={`text-base font-semibold leading-snug sm:text-lg ${bodyStrong}`}>
            {fadeLabel}
          </p>
        </CommandCardSection>
      ) : null}
    </div>
  );
}
