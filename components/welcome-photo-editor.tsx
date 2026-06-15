"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

import {
  clampCoverPhotoScale,
  COUPLE_DASHBOARD_HERO_ASPECT_RATIO,
  computeCoverPhotoScaleLimits,
  coverPhotoTransformToImageStyle,
  DEFAULT_COVER_PHOTO_TRANSFORM,
  type CoverPhotoScaleLimits,
} from "@/lib/coverPhotoTransform";
import type { CoverPhotoTransform } from "@/types/planning";

type WelcomePhotoEditorProps = {
  imageSrc: string;
  initialTransform?: CoverPhotoTransform;
  saving?: boolean;
  onCancel: () => void;
  onSave: (transform: CoverPhotoTransform) => void | Promise<void>;
};

function getTouchDistance(
  touches: { length: number; item(index: number): { clientX: number; clientY: number } | null },
): number | null {
  if (touches.length < 2) return null;
  const first = touches.item(0);
  const second = touches.item(1);
  if (!first || !second) return null;
  const dx = first.clientX - second.clientX;
  const dy = first.clientY - second.clientY;
  return Math.hypot(dx, dy);
}

export function WelcomePhotoEditor({
  imageSrc,
  initialTransform,
  saving = false,
  onCancel,
  onSave,
}: WelcomePhotoEditorProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const initializedRef = useRef(false);
  const [transform, setTransform] = useState<CoverPhotoTransform>(
    initialTransform ?? DEFAULT_COVER_PHOTO_TRANSFORM,
  );
  const [scaleLimits, setScaleLimits] = useState<CoverPhotoScaleLimits>({
    minScale: 1,
    maxScale: 3,
    initialScale: 1,
  });
  const [ready, setReady] = useState(false);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const pinchRef = useRef<{ distance: number; scale: number } | null>(null);

  const applyScaleLimits = useCallback(
    (limits: CoverPhotoScaleLimits, preferred?: CoverPhotoTransform) => {
      setScaleLimits(limits);
      setTransform((prev) => {
        const source = preferred ?? prev;
        return {
          ...source,
          scale: clampCoverPhotoScale(source.scale, limits.minScale, limits.maxScale),
        };
      });
    },
    [],
  );

  const syncLayout = useCallback(() => {
    const frame = frameRef.current;
    const img = imageRef.current;
    if (!frame || !img || img.naturalWidth <= 0 || img.naturalHeight <= 0) return false;

    const rect = frame.getBoundingClientRect();
    if (rect.width < 8 || rect.height < 8) return false;

    const limits = computeCoverPhotoScaleLimits(
      img.naturalWidth,
      img.naturalHeight,
      rect.width,
      rect.height,
    );

    if (!initializedRef.current) {
      if (initialTransform) {
        applyScaleLimits(limits, initialTransform);
      } else {
        applyScaleLimits(limits, {
          ...DEFAULT_COVER_PHOTO_TRANSFORM,
          scale: limits.initialScale,
        });
      }
      initializedRef.current = true;
    } else {
      applyScaleLimits(limits);
    }

    setReady(true);
    return true;
  }, [applyScaleLimits, initialTransform]);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const delta = event.deltaY > 0 ? -0.06 : 0.06;
      setTransform((prev) => ({
        ...prev,
        scale: clampCoverPhotoScale(
          prev.scale + delta,
          scaleLimits.minScale,
          scaleLimits.maxScale,
        ),
      }));
    };

    frame.addEventListener("wheel", onWheel, { passive: false });
    return () => frame.removeEventListener("wheel", onWheel);
  }, [scaleLimits.maxScale, scaleLimits.minScale]);

  useEffect(() => {
    let cancelled = false;
    initializedRef.current = false;
    setReady(false);
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      imageRef.current = img;
      requestAnimationFrame(() => {
        if (!cancelled) syncLayout();
      });
    };
    img.src = imageSrc;
    return () => {
      cancelled = true;
      imageRef.current = null;
    };
  }, [imageSrc, syncLayout]);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const observer = new ResizeObserver(() => {
      if (imageRef.current) {
        syncLayout();
      }
    });
    observer.observe(frame);
    return () => observer.disconnect();
  }, [syncLayout]);

  const updateScale = useCallback(
    (nextScale: number) => {
      setTransform((prev) => ({
        ...prev,
        scale: clampCoverPhotoScale(nextScale, scaleLimits.minScale, scaleLimits.maxScale),
      }));
    },
    [scaleLimits.maxScale, scaleLimits.minScale],
  );

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.pointerType === "touch" && event.currentTarget.hasPointerCapture?.(event.pointerId)) {
        return;
      }
      event.currentTarget.setPointerCapture(event.pointerId);
      dragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        originX: transform.x,
        originY: transform.y,
      };
    },
    [transform.x, transform.y],
  );

  const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const frame = frameRef.current;
    if (!frame) return;
    const rect = frame.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const deltaX = ((event.clientX - drag.startX) / rect.width) * 100;
    const deltaY = ((event.clientY - drag.startY) / rect.height) * 100;

    setTransform((prev) => ({
      ...prev,
      x: drag.originX + deltaX,
      y: drag.originY + deltaY,
    }));
  }, []);

  const handlePointerUp = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  const handleTouchStart = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      if (event.touches.length === 2) {
        const distance = getTouchDistance(event.touches);
        if (distance) {
          pinchRef.current = { distance, scale: transform.scale };
        }
      }
    },
    [transform.scale],
  );

  const handleTouchMove = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      if (event.touches.length !== 2 || !pinchRef.current) return;
      event.preventDefault();
      const distance = getTouchDistance(event.touches);
      if (!distance) return;
      const ratio = distance / pinchRef.current.distance;
      updateScale(pinchRef.current.scale * ratio);
    },
    [updateScale],
  );

  const handleTouchEnd = useCallback(() => {
    pinchRef.current = null;
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  const imageStyle = coverPhotoTransformToImageStyle(transform);

  return (
    <div
      className="cm-welcome-photo-editor-backdrop"
      role="presentation"
      onClick={onCancel}
    >
      <div
        className="cm-welcome-photo-editor"
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-photo-editor-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="cm-welcome-photo-editor-header">
          <h2 id="welcome-photo-editor-title" className="cm-welcome-photo-editor-title">
            Choose Your Welcome Photo
          </h2>
          <p className="cm-welcome-photo-editor-subtitle">
            This photo greets you every time you open your planning dashboard.
          </p>
        </header>

        <div
          ref={frameRef}
          className="cm-welcome-photo-editor-frame"
          style={{ aspectRatio: COUPLE_DASHBOARD_HERO_ASPECT_RATIO }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
        >
          {ready ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageSrc}
              alt=""
              className="cm-welcome-photo-editor-image cm-blanc-hero-photo-treatment"
              style={imageStyle}
              draggable={false}
            />
          ) : (
            <div className="cm-welcome-photo-editor-loading" aria-hidden />
          )}
        </div>

        <label className="cm-welcome-photo-editor-zoom-label">
          Zoom
          <input
            type="range"
            min={scaleLimits.minScale}
            max={scaleLimits.maxScale}
            step={0.01}
            value={transform.scale}
            onChange={(event) => updateScale(Number(event.target.value))}
            className="cm-welcome-photo-editor-zoom"
          />
        </label>

        <div className="cm-welcome-photo-editor-actions">
          <button type="button" className="cm-welcome-photo-editor-cancel" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
          <button
            type="button"
            className="cm-welcome-photo-editor-save"
            onClick={() => void onSave(transform)}
            disabled={!ready || saving}
          >
            {saving ? "Saving…" : "Save Photo"}
          </button>
        </div>
      </div>
    </div>
  );
}
