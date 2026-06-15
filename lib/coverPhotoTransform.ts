import type { CSSProperties } from "react";

import type { CoverPhotoTransform } from "@/types/planning";

/**
 * Width / height of the couple dashboard hero photo frame.
 * Matches `.cm-dashboard-v3-hero-photo-wrap` (`aspect-ratio: 46 / 55`).
 */
export const COUPLE_DASHBOARD_HERO_ASPECT_RATIO = 46 / 55;

export const DEFAULT_COVER_PHOTO_TRANSFORM: CoverPhotoTransform = {
  scale: 1,
  x: 0,
  y: 0,
  baseWidthPercent: 100,
  baseHeightPercent: 100,
};

export const COVER_PHOTO_MIN_SCALE = 1;
export const COVER_PHOTO_MAX_SCALE = 3;

export function clampCoverPhotoScale(scale: number): number {
  return Math.min(COVER_PHOTO_MAX_SCALE, Math.max(COVER_PHOTO_MIN_SCALE, scale));
}

/**
 * Legacy cover-fit metadata kept for persisted transforms.
 * Rendering no longer uses independent width/height percentages (they caused distortion).
 */
export function computeCoverFitPercents(
  imageWidth: number,
  imageHeight: number,
  frameWidth: number,
  frameHeight: number,
): Pick<CoverPhotoTransform, "baseWidthPercent" | "baseHeightPercent"> {
  if (imageWidth <= 0 || imageHeight <= 0 || frameWidth <= 0 || frameHeight <= 0) {
    return { baseWidthPercent: 100, baseHeightPercent: 100 };
  }

  const imageAspect = imageWidth / imageHeight;
  const frameAspect = frameWidth / frameHeight;

  if (imageAspect > frameAspect) {
    return {
      baseHeightPercent: 100,
      baseWidthPercent: (imageAspect / frameAspect) * 100,
    };
  }

  return {
    baseWidthPercent: 100,
    baseHeightPercent: (frameAspect / imageAspect) * 100,
  };
}

export function computeInitialCoverPhotoTransform(
  imageWidth: number,
  imageHeight: number,
  frameWidth: number,
  frameHeight: number,
): CoverPhotoTransform {
  const fit = computeCoverFitPercents(imageWidth, imageHeight, frameWidth, frameHeight);
  return {
    scale: 1,
    x: 0,
    y: 0,
    ...fit,
  };
}

export function normalizeCoverPhotoTransform(
  value: CoverPhotoTransform | null | undefined,
): CoverPhotoTransform | undefined {
  if (!value) return undefined;
  const scale = clampCoverPhotoScale(
    typeof value.scale === "number" && Number.isFinite(value.scale) ? value.scale : 1,
  );
  const x = typeof value.x === "number" && Number.isFinite(value.x) ? value.x : 0;
  const y = typeof value.y === "number" && Number.isFinite(value.y) ? value.y : 0;
  const baseWidthPercent =
    typeof value.baseWidthPercent === "number" && Number.isFinite(value.baseWidthPercent)
      ? value.baseWidthPercent
      : 100;
  const baseHeightPercent =
    typeof value.baseHeightPercent === "number" && Number.isFinite(value.baseHeightPercent)
      ? value.baseHeightPercent
      : 100;

  return { scale, x, y, baseWidthPercent, baseHeightPercent };
}

/**
 * Positions the image inside a fixed frame without distorting aspect ratio.
 *
 * Cover fit: min-width/min-height 100% with auto dimensions preserves natural aspect.
 * Zoom: uniform scale() only (never independent width/height).
 * Pan: x/y are % of frame width/height, applied via left/top on the frame container.
 */
export function coverPhotoTransformToImageStyle(
  transform: CoverPhotoTransform,
): CSSProperties {
  const { scale, x, y } = transform;
  return {
    position: "absolute",
    left: `calc(50% + ${x}%)`,
    top: `calc(50% + ${y}%)`,
    minWidth: "100%",
    minHeight: "100%",
    width: "auto",
    height: "auto",
    maxWidth: "none",
    transform: `translate(-50%, -50%) scale(${scale})`,
    transformOrigin: "center center",
  };
}
