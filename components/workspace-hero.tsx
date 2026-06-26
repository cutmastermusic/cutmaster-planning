"use client";

import type { CSSProperties, ReactNode } from "react";

type WorkspaceHeroProps = {
  eyebrow: string;
  title: ReactNode;
  subtitle: ReactNode;
  description: ReactNode;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  actionHelper?: ReactNode;
  coverImageSrc?: string;
  coverImageAlt?: string;
  coverFallback?: ReactNode;
  summaryEyebrow?: ReactNode;
  summaryTitle?: ReactNode;
  summarySubtitle?: ReactNode;
  summaryContent?: ReactNode;
  summaryCornerGlyph?: ReactNode;
  waveformHeights?: number[];
  imageStyle?: CSSProperties;
  className?: string;
};

const defaultWaveformHeights = [28, 44, 22, 52, 34, 18, 46, 30, 58, 24, 40, 20];

export function WorkspaceHero({
  eyebrow,
  title,
  subtitle,
  description,
  primaryAction,
  secondaryAction,
  actionHelper,
  coverImageSrc,
  coverImageAlt = "",
  coverFallback,
  summaryEyebrow,
  summaryTitle,
  summarySubtitle,
  summaryContent,
  summaryCornerGlyph,
  waveformHeights = defaultWaveformHeights,
  imageStyle,
  className = "",
}: WorkspaceHeroProps) {
  const hasActions = primaryAction || secondaryAction;
  const hasSummary =
    coverImageSrc ||
    coverFallback ||
    summaryEyebrow ||
    summaryTitle ||
    summarySubtitle ||
    summaryContent ||
    summaryCornerGlyph;

  const hasBanner = coverImageSrc || coverFallback;

  return (
    <section
      className={`relative overflow-hidden rounded-[2rem] border border-[#2f4a3e]/15 bg-[#f7f5f1] shadow-[0_22px_70px_-42px_rgba(47,74,62,0.55)] ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(127,143,122,0.26),transparent_34%),linear-gradient(135deg,#f7f5f1,#efe8dc_50%,#dfe7dc)]" />
      <div className="relative grid min-h-[25rem] gap-7 px-5 py-8 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-10 lg:py-10">
        <div className="flex flex-col justify-center text-[#1f2724]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#2f4a3e]/75">
            {eyebrow}
          </p>
          <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight text-[#214637] sm:text-5xl">
            {title}
          </h1>
          <p className="mt-3 max-w-xl text-xl font-medium italic text-[#b08a45]">
            {subtitle}
          </p>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-stone-700 sm:text-base">
            {description}
          </p>
          {hasActions ? (
            <div className="mt-7">
              <div className="flex flex-col gap-3 sm:flex-row">
                {primaryAction}
                {secondaryAction}
              </div>
              {actionHelper ? (
                <div className="mt-3 text-sm font-semibold text-[#2f4a3e]">
                  {actionHelper}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
        {hasSummary ? (
          <div className="lg:justify-self-end">
            <div className="relative w-full max-w-md overflow-hidden rounded-[1.75rem] border border-white/75 bg-white/72 shadow-[0_22px_60px_-45px_rgba(47,74,62,0.72)] ring-1 ring-[#2f4a3e]/10 backdrop-blur-sm">
              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#b08a45]/15 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-12 left-8 h-36 w-36 rounded-full bg-[#2f4a3e]/10 blur-3xl" />

              {hasBanner ? (
                <div className="relative h-24 w-full overflow-hidden">
                  {coverImageSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={coverImageSrc}
                      alt={coverImageAlt}
                      className="h-full w-full object-cover object-top"
                      style={imageStyle}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[#f7f5f1] text-2xl text-[#2f4a3e]">
                      {coverFallback}
                    </div>
                  )}
                </div>
              ) : null}

              <div className="relative p-5">
                {summaryEyebrow || summaryTitle || summarySubtitle ? (
                  <div className="mb-4">
                    {summaryEyebrow ? (
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#b08a45]">
                        {summaryEyebrow}
                      </p>
                    ) : null}
                    {summaryTitle || summarySubtitle ? (
                      <h2 className="mt-1 text-xl font-semibold tracking-tight text-[#214637]">
                        {summaryTitle}
                        {summarySubtitle ? (
                          <span className="block text-base font-medium text-[#2f4a3e]/80">
                            {summarySubtitle}
                          </span>
                        ) : null}
                      </h2>
                    ) : null}
                  </div>
                ) : null}

                <div className="h-8 overflow-hidden rounded-full bg-[#f7f5f1]/85 px-3">
                  <div className="flex h-full items-center gap-1.5" aria-hidden>
                    {waveformHeights.map((height, index) => (
                      <span
                        key={`workspace-hero-wave-${index}`}
                        className="w-1 rounded-full bg-[#2f4a3e]/35"
                        style={{ height: `${height}%` }}
                      />
                    ))}
                  </div>
                </div>

                {summaryContent ? <div className="mt-5 space-y-2.5">{summaryContent}</div> : null}
              </div>

              {summaryCornerGlyph ? (
                <span className="pointer-events-none absolute bottom-5 right-6 text-2xl text-[#b08a45]/35" aria-hidden>
                  {summaryCornerGlyph}
                </span>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
