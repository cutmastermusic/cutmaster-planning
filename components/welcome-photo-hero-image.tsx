"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  coverPhotoTransformToImageStyle,
  normalizeCoverPhotoTransform,
  resolveCoverPhotoTransformForDisplay,
} from "@/lib/coverPhotoTransform";
import type { CoverPhotoTransform } from "@/types/planning";

type WelcomePhotoHeroImageProps = {
  src: string;
  transform?: CoverPhotoTransform;
  stageClassName?: string;
  imageClassName?: string;
  visible?: boolean;
};

/** Renders a welcome/cover photo inside the couple dashboard hero frame with pan/zoom transform. */
export function WelcomePhotoHeroImage({
  src,
  transform,
  stageClassName = "cm-dashboard-v3-hero-photo-stage",
  imageClassName = "",
  visible = true,
}: WelcomePhotoHeroImageProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const normalizedTransform = normalizeCoverPhotoTransform(transform);
  const normalizedTransformRef = useRef(normalizedTransform);
  const imageMetricsRef = useRef<{ width: number; height: number } | null>(null);
  const [displayTransform, setDisplayTransform] = useState(normalizedTransform);

  useEffect(() => {
    normalizedTransformRef.current = normalizedTransform;
  }, [normalizedTransform]);

  const resolveDisplayTransformForMetrics = useCallback((imageWidth: number, imageHeight: number) => {
    const stage = stageRef.current;
    if (!stage || imageWidth <= 0 || imageHeight <= 0) return;
    const rect = stage.getBoundingClientRect();
    if (rect.width < 8 || rect.height < 8) return;
    setDisplayTransform(
      resolveCoverPhotoTransformForDisplay(
        normalizedTransformRef.current,
        imageWidth,
        imageHeight,
        rect.width,
        rect.height,
      ),
    );
  }, []);

  useEffect(() => {
    if (imageMetricsRef.current) {
      resolveDisplayTransformForMetrics(
        imageMetricsRef.current.width,
        imageMetricsRef.current.height,
      );
    } else {
      setDisplayTransform(normalizedTransform);
    }
  }, [normalizedTransform, resolveDisplayTransformForMetrics]);

  const imageStyle = displayTransform
    ? coverPhotoTransformToImageStyle(displayTransform)
    : undefined;
  const positioned = Boolean(normalizedTransform && imageStyle);

  return (
    <div ref={stageRef} className={stageClassName}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className={`cm-dashboard-v3-hero-photo-img cm-blanc-hero-photo-treatment ${
          positioned ? "cm-dashboard-v3-hero-photo-img--positioned" : ""
        } ${visible ? "cm-dashboard-v3-hero-photo-img--visible" : ""} ${imageClassName}`.trim()}
        style={imageStyle}
        onLoad={(event) => {
          const img = event.currentTarget;
          imageMetricsRef.current = {
            width: img.naturalWidth,
            height: img.naturalHeight,
          };
          resolveDisplayTransformForMetrics(img.naturalWidth, img.naturalHeight);
        }}
      />
    </div>
  );
}
