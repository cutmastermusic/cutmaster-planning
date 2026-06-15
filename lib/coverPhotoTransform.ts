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

export const COVER_PHOTO_ABSOLUTE_MIN_SCALE = 0.25;
export const COVER_PHOTO_MIN_SCALE = 1;
export const COVER_PHOTO_MAX_SCALE = 3;

export function clampCoverPhotoScale(
  scale: number,
  minScale: number = COVER_PHOTO_ABSOLUTE_MIN_SCALE,
  maxScale: number = COVER_PHOTO_MAX_SCALE,
): number {
  return Math.min(maxScale, Math.max(minScale, scale));
}

export type CoverPhotoScaleLimits = {
  minScale: number;
  maxScale: number;
  initialScale: number;
};

export type ContainFitFramePercents = {
  widthPercent: number;
  heightPercent: number;
};

/** Contain-fit size of the image inside the frame, expressed as % of frame width/height. */
export function computeContainFitFramePercents(
  imageWidth: number,
  imageHeight: number,
  frameWidth: number,
  frameHeight: number,
): ContainFitFramePercents {
  if (imageWidth <= 0 || imageHeight <= 0 || frameWidth <= 0 || frameHeight <= 0) {
    return { widthPercent: 100, heightPercent: 100 };
  }

  const containScale = Math.min(frameWidth / imageWidth, frameHeight / imageHeight);
  return {
    widthPercent: ((imageWidth * containScale) / frameWidth) * 100,
    heightPercent: ((imageHeight * containScale) / frameHeight) * 100,
  };
}

/** Multiplier to convert editor scale (contain baseline) to persisted/dashboard scale (cover baseline). */
export function computeContainToCoverScaleMultiplier(
  imageWidth: number,
  imageHeight: number,
  frameWidth: number,
  frameHeight: number,
): number {
  const contain = computeContainFitFramePercents(imageWidth, imageHeight, frameWidth, frameHeight);
  return Math.max(100 / contain.widthPercent, 100 / contain.heightPercent);
}

/**
 * Editor uses contain baseline: scale 1 = full image visible.
 * Dashboard uses cover baseline: scale 1 = cover fit.
 */
export function computeEditorScaleLimits(
  imageWidth: number,
  imageHeight: number,
  frameWidth: number,
  frameHeight: number,
): CoverPhotoScaleLimits & { containFit: ContainFitFramePercents } {
  if (imageWidth <= 0 || imageHeight <= 0 || frameWidth <= 0 || frameHeight <= 0) {
    return {
      minScale: 1,
      maxScale: COVER_PHOTO_MAX_SCALE,
      initialScale: 1,
      containFit: { widthPercent: 100, heightPercent: 100 },
    };
  }

  const containFit = computeContainFitFramePercents(imageWidth, imageHeight, frameWidth, frameHeight);
  const coverZoom = computeContainToCoverScaleMultiplier(imageWidth, imageHeight, frameWidth, frameHeight);

  return {
    minScale: 1,
    maxScale: Math.min(COVER_PHOTO_MAX_SCALE, coverZoom),
    initialScale: 1,
    containFit,
  };
}

/** @deprecated Dashboard-only; editor uses computeEditorScaleLimits. */
export function computeCoverPhotoScaleLimits(
  imageWidth: number,
  imageHeight: number,
  frameWidth: number,
  frameHeight: number,
): CoverPhotoScaleLimits {
  const coverZoom = computeContainToCoverScaleMultiplier(imageWidth, imageHeight, frameWidth, frameHeight);
  return {
    minScale: 1 / coverZoom,
    maxScale: COVER_PHOTO_MAX_SCALE,
    initialScale: 1,
  };
}

export function editorTransformToPersistedTransform(
  transform: CoverPhotoTransform,
  imageWidth: number,
  imageHeight: number,
  frameWidth: number,
  frameHeight: number,
): CoverPhotoTransform {
  const multiplier = computeContainToCoverScaleMultiplier(
    imageWidth,
    imageHeight,
    frameWidth,
    frameHeight,
  );
  if (multiplier <= 0) return transform;
  return {
    ...transform,
    scale: clampCoverPhotoScale(transform.scale / multiplier),
  };
}

export function persistedTransformToEditorTransform(
  transform: CoverPhotoTransform,
  imageWidth: number,
  imageHeight: number,
  frameWidth: number,
  frameHeight: number,
): CoverPhotoTransform {
  const multiplier = computeContainToCoverScaleMultiplier(
    imageWidth,
    imageHeight,
    frameWidth,
    frameHeight,
  );
  return {
    ...transform,
    scale: clampCoverPhotoScale(transform.scale * multiplier, 1, COVER_PHOTO_MAX_SCALE),
  };
}

export function coverPhotoTransformToEditorImageStyle(
  transform: CoverPhotoTransform,
  containFit: ContainFitFramePercents,
): CSSProperties {
  const { scale, x, y } = transform;
  return {
    position: "absolute",
    left: `calc(50% + ${x}%)`,
    top: `calc(50% + ${y}%)`,
    width: `${containFit.widthPercent * scale}%`,
    height: `${containFit.heightPercent * scale}%`,
    maxWidth: "none",
    transform: "translate(-50%, -50%)",
    transformOrigin: "center center",
  };
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
    COVER_PHOTO_ABSOLUTE_MIN_SCALE,
    COVER_PHOTO_MAX_SCALE,
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
