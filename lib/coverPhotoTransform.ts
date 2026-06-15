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
/** Max zoom for contain-baseline framing (editor + persisted). */
export const COVER_PHOTO_MAX_SCALE = 6;
export const COVER_PHOTO_EDITOR_MAX_SCALE = 6;

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

/** Scale multiplier from contain-fit (full image) to cover-fit inside the same frame. */
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
 * Canonical transform uses contain-fit baseline:
 * scale 1 = full image visible, scale > 1 = zoom in, uniform sizing via base*scale %.
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
    maxScale: Math.max(COVER_PHOTO_EDITOR_MAX_SCALE, coverZoom),
    initialScale: 1,
    containFit,
  };
}

/** True when baseWidth/baseHeight store contain-fit metadata from the unified model. */
export function isContainBaselineTransform(transform: CoverPhotoTransform): boolean {
  const width = transform.baseWidthPercent;
  const height = transform.baseHeightPercent;
  if (Math.abs(width - 100) < 0.01 && Math.abs(height - 100) < 0.01) {
    return false;
  }
  if (width > 100.5 || height > 100.5) {
    return false;
  }
  return Math.abs(Math.max(width, height) - 100) < 0.5;
}

/**
 * Converts legacy cover-baseline transforms (scale relative to cover-fit sizing)
 * into the canonical contain-baseline model used by editor and dashboard.
 */
export function migrateLegacyCoverTransform(
  transform: CoverPhotoTransform,
  imageWidth: number,
  imageHeight: number,
  frameWidth: number,
  frameHeight: number,
): CoverPhotoTransform {
  if (isContainBaselineTransform(transform)) {
    return {
      ...transform,
      scale: clampCoverPhotoScale(transform.scale, COVER_PHOTO_MIN_SCALE, COVER_PHOTO_EDITOR_MAX_SCALE),
    };
  }

  const containFit = computeContainFitFramePercents(imageWidth, imageHeight, frameWidth, frameHeight);
  const coverZoom = computeContainToCoverScaleMultiplier(imageWidth, imageHeight, frameWidth, frameHeight);

  return {
    scale: clampCoverPhotoScale(transform.scale * coverZoom, COVER_PHOTO_MIN_SCALE, COVER_PHOTO_EDITOR_MAX_SCALE),
    x: transform.x,
    y: transform.y,
    baseWidthPercent: containFit.widthPercent,
    baseHeightPercent: containFit.heightPercent,
  };
}

export function resolveCoverPhotoTransformForDisplay(
  transform: CoverPhotoTransform | null | undefined,
  imageWidth: number,
  imageHeight: number,
  frameWidth: number,
  frameHeight: number,
): CoverPhotoTransform {
  const normalized = normalizeCoverPhotoTransform(transform) ?? DEFAULT_COVER_PHOTO_TRANSFORM;
  return migrateLegacyCoverTransform(normalized, imageWidth, imageHeight, frameWidth, frameHeight);
}

export function buildCoverPhotoTransformFromContainFit(
  scale: number,
  x: number,
  y: number,
  containFit: ContainFitFramePercents,
): CoverPhotoTransform {
  return {
    scale: clampCoverPhotoScale(scale, COVER_PHOTO_MIN_SCALE, COVER_PHOTO_EDITOR_MAX_SCALE),
    x,
    y,
    baseWidthPercent: containFit.widthPercent,
    baseHeightPercent: containFit.heightPercent,
  };
}

/** @deprecated Dashboard-only legacy helper. */
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

/**
 * Canonical renderer for editor preview and dashboard hero.
 * Frame fixed; image aspect preserved via uniform baseWidth/baseHeight × scale.
 */
export function coverPhotoTransformToImageStyle(
  transform: CoverPhotoTransform,
): CSSProperties {
  const { scale, x, y, baseWidthPercent, baseHeightPercent } = transform;
  return {
    position: "absolute",
    left: `calc(50% + ${x}%)`,
    top: `calc(50% + ${y}%)`,
    width: `${baseWidthPercent * scale}%`,
    height: `${baseHeightPercent * scale}%`,
    maxWidth: "none",
    transform: "translate(-50%, -50%)",
    transformOrigin: "center center",
  };
}

/** @deprecated Use coverPhotoTransformToImageStyle — same canonical model. */
export function coverPhotoTransformToEditorImageStyle(
  transform: CoverPhotoTransform,
  containFit?: ContainFitFramePercents,
): CSSProperties {
  const fit = containFit ?? {
    widthPercent: transform.baseWidthPercent,
    heightPercent: transform.baseHeightPercent,
  };
  return coverPhotoTransformToImageStyle({
    ...transform,
    baseWidthPercent: fit.widthPercent,
    baseHeightPercent: fit.heightPercent,
  });
}

/**
 * Legacy cover-fit metadata kept for backward compatibility reads only.
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
  const containFit = computeContainFitFramePercents(imageWidth, imageHeight, frameWidth, frameHeight);
  return buildCoverPhotoTransformFromContainFit(1, 0, 0, containFit);
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

/** Verifies two transforms render the same crop in the canonical model. */
export function coverPhotoTransformsRenderEquivalently(
  left: CoverPhotoTransform,
  right: CoverPhotoTransform,
  tolerance = 0.01,
): boolean {
  const fields: (keyof CoverPhotoTransform)[] = [
    "scale",
    "x",
    "y",
    "baseWidthPercent",
    "baseHeightPercent",
  ];
  return fields.every((field) => Math.abs(left[field] - right[field]) <= tolerance);
}
