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
  imageStyle?: CSSProperties;
  className?: string;
};

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
  imageStyle,
  className = "",
}: WorkspaceHeroProps) {
  const hasActions = primaryAction || secondaryAction;
  const hasPhoto = coverImageSrc || coverFallback;

  return (
    <section
      className={`relative overflow-hidden rounded-[2rem] border border-[#2f4a3e]/15 bg-[#f7f5f1] shadow-[0_22px_70px_-42px_rgba(47,74,62,0.55)] ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(127,143,122,0.26),transparent_34%),linear-gradient(135deg,#f7f5f1,#efe8dc_50%,#dfe7dc)]" />
      <div className="relative grid min-h-[25rem] gap-7 px-5 py-8 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch lg:gap-10 lg:px-10 lg:py-10">

        {/* Left: text + actions */}
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

        {/* Right: large couple photo */}
        {hasPhoto ? (
          <div className="relative min-h-[18rem] overflow-hidden rounded-[1.75rem] lg:min-h-0">
            {coverImageSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverImageSrc}
                alt={coverImageAlt}
                className="absolute inset-0 h-full w-full object-cover object-center"
                style={imageStyle}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[#f7f5f1] text-4xl text-[#2f4a3e]">
                {coverFallback}
              </div>
            )}
            {(summaryEyebrow || summaryTitle || summarySubtitle) ? (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-5 pb-5 pt-14">
                {summaryEyebrow ? (
                  <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70">
                    {summaryEyebrow}
                  </p>
                ) : null}
                {summaryTitle ? (
                  <p className="text-lg font-semibold leading-tight text-white">
                    {summaryTitle}
                  </p>
                ) : null}
                {summarySubtitle ? (
                  <p className="mt-0.5 text-sm text-white/80">{summarySubtitle}</p>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

      </div>
    </section>
  );
}
