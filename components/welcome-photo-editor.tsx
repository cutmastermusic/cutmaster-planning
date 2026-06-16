"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

import {
  buildCoverPhotoTransformFromContainFit,
  clampCoverPhotoScale,
  COUPLE_DASHBOARD_HERO_ASPECT_RATIO,
  computeEditorScaleLimits,
  coverPhotoTransformToImageStyle,
  DEFAULT_COVER_PHOTO_TRANSFORM,
  migrateLegacyCoverTransform,
  type CoverPhotoScaleLimits,
} from "@/lib/coverPhotoTransform";
import type { CoverPhotoTransform } from "@/types/planning";

type WelcomePhotoEditorProps = {
  imageSrc?: string;
  preparing?: boolean;
  initialTransform?: CoverPhotoTransform;
  saving?: boolean;
  title?: string;
  subtitle?: string;
  saveLabel?: string;
  onCancel: () => void;
  onSave: (transform: CoverPhotoTransform) => void | Promise<void>;
};

function getTouchDistance(touches: TouchList): number | null {
  if (touches.length < 2) return null;
  const first = touches[0];
  const second = touches[1];
  if (!first || !second) return null;
  const dx = first.clientX - second.clientX;
  const dy = first.clientY - second.clientY;
  return Math.hypot(dx, dy);
}

export function WelcomePhotoEditor({
  imageSrc,
  preparing = false,
  initialTransform,
  saving = false,
  title = "Choose Your Welcome Photo",
  subtitle = "This photo greets you every time you open your planning dashboard.",
  saveLabel = "Save Photo",
  onCancel,
  onSave,
}: WelcomePhotoEditorProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const initializedRef = useRef(false);
  const transformRef = useRef<CoverPhotoTransform>(DEFAULT_COVER_PHOTO_TRANSFORM);
  const scaleLimitsRef = useRef<CoverPhotoScaleLimits>({
    minScale: 1,
    maxScale: 6,
    initialScale: 1,
  });
  const [transform, setTransform] = useState<CoverPhotoTransform>(DEFAULT_COVER_PHOTO_TRANSFORM);
  const [scaleLimits, setScaleLimits] = useState<CoverPhotoScaleLimits>({
    minScale: 1,
    maxScale: 6,
    initialScale: 1,
  });
  const [ready, setReady] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  useEffect(() => {
    transformRef.current = transform;
  }, [transform]);

  useEffect(() => {
    scaleLimitsRef.current = scaleLimits;
  }, [scaleLimits]);

  const applyPanDelta = useCallback((deltaX: number, deltaY: number, originX: number, originY: number) => {
    setTransform((prev) => ({
      ...prev,
      x: originX + deltaX,
      y: originY + deltaY,
    }));
  }, []);

  const applyScaleLimits = useCallback(
    (
      limits: CoverPhotoScaleLimits & { containFit: { widthPercent: number; heightPercent: number } },
      preferred?: CoverPhotoTransform,
    ) => {
      setScaleLimits(limits);
      scaleLimitsRef.current = limits;
      setTransform((prev) => {
        const source = preferred ?? prev;
        const next = {
          ...source,
          baseWidthPercent: limits.containFit.widthPercent,
          baseHeightPercent: limits.containFit.heightPercent,
          scale: clampCoverPhotoScale(source.scale, limits.minScale, limits.maxScale),
        };
        transformRef.current = next;
        return next;
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

    const limits = computeEditorScaleLimits(
      img.naturalWidth,
      img.naturalHeight,
      rect.width,
      rect.height,
    );

    if (!initializedRef.current) {
      if (initialTransform) {
        const editorTransform = migrateLegacyCoverTransform(
          initialTransform,
          img.naturalWidth,
          img.naturalHeight,
          rect.width,
          rect.height,
        );
        applyScaleLimits(limits, {
          ...editorTransform,
          baseWidthPercent: limits.containFit.widthPercent,
          baseHeightPercent: limits.containFit.heightPercent,
        });
      } else {
        applyScaleLimits(
          limits,
          buildCoverPhotoTransformFromContainFit(limits.initialScale, 0, 0, limits.containFit),
        );
      }
      initializedRef.current = true;
    } else {
      setScaleLimits(limits);
      scaleLimitsRef.current = limits;
      setTransform((prev) => {
        const next = {
          ...prev,
          baseWidthPercent: limits.containFit.widthPercent,
          baseHeightPercent: limits.containFit.heightPercent,
          scale: clampCoverPhotoScale(prev.scale, limits.minScale, limits.maxScale),
        };
        transformRef.current = next;
        return next;
      });
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
      const limits = scaleLimitsRef.current;
      setTransform((prev) => {
        const next = {
          ...prev,
          scale: clampCoverPhotoScale(prev.scale + delta, limits.minScale, limits.maxScale),
        };
        transformRef.current = next;
        return next;
      });
    };

    frame.addEventListener("wheel", onWheel, { passive: false });
    return () => frame.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => {
    if (!imageSrc) {
      initializedRef.current = false;
      setReady(false);
      imageRef.current = null;
      return;
    }

    let cancelled = false;
    initializedRef.current = false;
    setReady(false);
    setTransform(DEFAULT_COVER_PHOTO_TRANSFORM);
    transformRef.current = DEFAULT_COVER_PHOTO_TRANSFORM;

    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      imageRef.current = img;
      requestAnimationFrame(() => {
        if (!cancelled) syncLayout();
      });
    };
    img.onerror = () => {
      if (!cancelled) setReady(false);
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

  const updateScale = useCallback((nextScale: number) => {
    const limits = scaleLimitsRef.current;
    setTransform((prev) => {
      const next = {
        ...prev,
        scale: clampCoverPhotoScale(nextScale, limits.minScale, limits.maxScale),
      };
      transformRef.current = next;
      return next;
    });
  }, []);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || !ready) return;

    let panTouchId: number | null = null;
    let panStart = { x: 0, y: 0, originX: 0, originY: 0 };
    let pinchStart: { distance: number; scale: number } | null = null;

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 1) {
        const touch = event.touches[0];
        if (!touch) return;
        panTouchId = touch.identifier;
        panStart = {
          x: touch.clientX,
          y: touch.clientY,
          originX: transformRef.current.x,
          originY: transformRef.current.y,
        };
        pinchStart = null;
        setDragging(true);
      } else if (event.touches.length === 2) {
        panTouchId = null;
        setDragging(false);
        const distance = getTouchDistance(event.touches);
        if (distance) {
          pinchStart = { distance, scale: transformRef.current.scale };
        }
      }
    };

    const onTouchMove = (event: TouchEvent) => {
      const rect = frame.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      if (event.touches.length === 2 && pinchStart) {
        event.preventDefault();
        const distance = getTouchDistance(event.touches);
        if (!distance) return;
        const ratio = distance / pinchStart.distance;
        updateScale(pinchStart.scale * ratio);
        return;
      }

      if (event.touches.length === 1 && panTouchId !== null) {
        const touch = Array.from(event.touches).find((item) => item.identifier === panTouchId);
        if (!touch) return;
        event.preventDefault();
        const deltaX = ((touch.clientX - panStart.x) / rect.width) * 100;
        const deltaY = ((touch.clientY - panStart.y) / rect.height) * 100;
        applyPanDelta(deltaX, deltaY, panStart.originX, panStart.originY);
      }
    };

    const endTouch = (event: TouchEvent) => {
      if (
        panTouchId !== null &&
        !Array.from(event.touches).some((item) => item.identifier === panTouchId)
      ) {
        panTouchId = null;
        setDragging(false);
      }
      if (event.touches.length < 2) {
        pinchStart = null;
      }
    };

    frame.addEventListener("touchstart", onTouchStart, { passive: true });
    frame.addEventListener("touchmove", onTouchMove, { passive: false });
    frame.addEventListener("touchend", endTouch, { passive: true });
    frame.addEventListener("touchcancel", endTouch, { passive: true });

    return () => {
      frame.removeEventListener("touchstart", onTouchStart);
      frame.removeEventListener("touchmove", onTouchMove);
      frame.removeEventListener("touchend", endTouch);
      frame.removeEventListener("touchcancel", endTouch);
    };
  }, [applyPanDelta, ready, updateScale]);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.pointerType === "touch") return;
      event.currentTarget.setPointerCapture(event.pointerId);
      setDragging(true);
      dragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        originX: transformRef.current.x,
        originY: transformRef.current.y,
      };
    },
    [],
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
    applyPanDelta(deltaX, deltaY, drag.originX, drag.originY);
  }, [applyPanDelta]);

  const handlePointerUp = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
      setDragging(false);
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  const imageStyle = coverPhotoTransformToImageStyle(transform);
  const showPreparing = preparing && !imageSrc;
  const showImageLoading = Boolean(imageSrc) && !ready;
  const editorInteractive = ready && !preparing;

  const handleSave = useCallback(() => {
    const frame = frameRef.current;
    const img = imageRef.current;
    if (!frame || !img || img.naturalWidth <= 0 || img.naturalHeight <= 0 || preparing) return;
    const rect = frame.getBoundingClientRect();
    const limits = computeEditorScaleLimits(
      img.naturalWidth,
      img.naturalHeight,
      rect.width,
      rect.height,
    );
    const persisted = buildCoverPhotoTransformFromContainFit(
      transformRef.current.scale,
      transformRef.current.x,
      transformRef.current.y,
      limits.containFit,
    );
    void onSave(persisted);
  }, [onSave, preparing]);

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
            {title}
          </h2>
          <p className="cm-welcome-photo-editor-subtitle">
            {showPreparing
              ? "Preparing your photo…"
              : preparing
                ? "Finishing upload preparation…"
                : subtitle}
          </p>
        </header>

        <div
          ref={frameRef}
          className={`cm-welcome-photo-editor-frame${dragging ? " cm-welcome-photo-editor-frame--dragging" : ""}`}
          style={{ aspectRatio: COUPLE_DASHBOARD_HERO_ASPECT_RATIO }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {ready && imageSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageSrc}
              alt=""
              className="cm-welcome-photo-editor-image cm-blanc-hero-photo-treatment"
              style={imageStyle}
              draggable={false}
            />
          ) : (
            <div className="cm-welcome-photo-editor-loading" aria-hidden>
              <span className="cm-welcome-photo-editor-loading-label">
                {showPreparing ? "Preparing your photo…" : showImageLoading ? "Loading preview…" : "Preparing your photo…"}
              </span>
            </div>
          )}
        </div>

        <label className={`cm-welcome-photo-editor-zoom-label${editorInteractive ? "" : " cm-welcome-photo-editor-zoom-label--disabled"}`}>
          Zoom
          <input
            type="range"
            min={scaleLimits.minScale}
            max={scaleLimits.maxScale}
            step={0.01}
            value={transform.scale}
            onChange={(event) => updateScale(Number(event.target.value))}
            className="cm-welcome-photo-editor-zoom"
            disabled={!editorInteractive}
          />
        </label>

        <div className="cm-welcome-photo-editor-actions">
          <button type="button" className="cm-welcome-photo-editor-cancel" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
          <button
            type="button"
            className="cm-welcome-photo-editor-save"
            onClick={handleSave}
            disabled={!editorInteractive || saving}
          >
            {saving ? "Saving…" : saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
