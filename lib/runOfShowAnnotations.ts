/**
 * Shipped off until a viewport-sized live ink layer (document-mapped coords) passes iPad testing.
 * Set true to re-enable Annotate UI and canvas runtime.
 */
export const RUN_OF_SHOW_ANNOTATION_ENABLED = false;

/** One ink stroke in Run Of Show annotation layer (document / scroll content coordinates). */
export type RunOfShowAnnotationStroke = {
  points: { x: number; y: number }[];
  /** Optional pen width hint captured at stroke start. */
  width?: number;
};

const MIN_POINT_DISTANCE_SQ = 1.25 * 1.25;
/** Cap retina backing store — full-document ROS canvases get expensive above 2x. */
const RUN_OF_SHOW_ANNOTATION_MAX_DPR = 2;

/** Pencil/mouse draw; finger scroll passes through on touch devices. */
export function runOfShowAnnotationAcceptsPointer(pointerType: string, button: number): boolean {
  if (pointerType === "pen") return true;
  if (pointerType === "mouse" && button === 0) return true;
  return false;
}

export function runOfShowClientToContentCoords(
  clientX: number,
  clientY: number,
  main: HTMLElement,
): { x: number; y: number } {
  const r = main.getBoundingClientRect();
  return {
    x: clientX - r.left + main.scrollLeft,
    y: clientY - r.top + main.scrollTop,
  };
}

export function runOfShowAnnotationStrokeWidth(pointerType: string, pressure: number): number {
  if (pointerType === "pen") {
    const p = pressure > 0 ? pressure : 0.5;
    return 1.6 + p * 1.4;
  }
  return 1.35;
}

export function appendRunOfShowStrokePoint(
  stroke: { x: number; y: number }[],
  point: { x: number; y: number },
): boolean {
  if (stroke.length === 0) {
    stroke.push(point);
    return true;
  }
  const last = stroke[stroke.length - 1];
  const dx = point.x - last.x;
  const dy = point.y - last.y;
  if (dx * dx + dy * dy < MIN_POINT_DISTANCE_SQ) return false;
  stroke.push(point);
  return true;
}

export function ensureRunOfShowAnnotationCanvas(
  canvas: HTMLCanvasElement,
  cssW: number,
  cssH: number,
): CanvasRenderingContext2D | null {
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx || cssW <= 0 || cssH <= 0) return null;
  const dpr = Math.min(
    RUN_OF_SHOW_ANNOTATION_MAX_DPR,
    typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1,
  );
  const targetW = Math.max(1, Math.floor(cssW * dpr));
  const targetH = Math.max(1, Math.floor(cssH * dpr));
  if (canvas.width !== targetW || canvas.height !== targetH) {
    canvas.width = targetW;
    canvas.height = targetH;
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
  return ctx;
}

function drawRunOfShowStrokePath(
  ctx: CanvasRenderingContext2D,
  pts: { x: number; y: number }[],
  lineWidth: number,
): void {
  if (pts.length === 0) return;
  ctx.strokeStyle = "rgba(28, 25, 23, 0.88)";
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (pts.length === 1) {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    ctx.lineTo(pts[0].x + 0.4, pts[0].y);
    ctx.stroke();
    return;
  }

  if (pts.length === 2) {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    ctx.lineTo(pts[1].x, pts[1].y);
    ctx.stroke();
    return;
  }

  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length - 1; i++) {
    const cx = pts[i].x;
    const cy = pts[i].y;
    const nx = (pts[i].x + pts[i + 1].x) / 2;
    const ny = (pts[i].y + pts[i + 1].y) / 2;
    ctx.quadraticCurveTo(cx, cy, nx, ny);
  }
  const last = pts[pts.length - 1];
  ctx.lineTo(last.x, last.y);
  ctx.stroke();
}

/** Full redraw of committed strokes only — used on load, undo, resize, stroke commit. */
export function redrawRunOfShowCommittedStrokes(
  canvas: HTMLCanvasElement,
  strokes: RunOfShowAnnotationStroke[],
  cssW: number,
  cssH: number,
): void {
  const ctx = ensureRunOfShowAnnotationCanvas(canvas, cssW, cssH);
  if (!ctx) return;
  ctx.clearRect(0, 0, cssW, cssH);
  for (const s of strokes) {
    drawRunOfShowStrokePath(ctx, s.points, s.width ?? 1.35);
  }
}

/**
 * Imperative ink extension during an active stroke — no clear, no React updates.
 * Returns the number of points now painted on the canvas.
 */
export function paintRunOfShowInkIncrement(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
  paintedCount: number,
  lineWidth: number,
): number {
  if (points.length <= paintedCount) return paintedCount;

  ctx.strokeStyle = "rgba(28, 25, 23, 0.88)";
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (paintedCount === 0 && points.length === 1) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    ctx.lineTo(points[0].x + 0.4, points[0].y);
    ctx.stroke();
    return 1;
  }

  ctx.beginPath();
  const anchor = Math.max(0, paintedCount - 1);
  ctx.moveTo(points[anchor].x, points[anchor].y);
  for (let i = Math.max(paintedCount, anchor + 1); i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();
  return points.length;
}

/** @deprecated Use redrawRunOfShowCommittedStrokes during live draw; kept for callers that pass in-progress. */
export function redrawRunOfShowAnnotationCanvas(
  canvas: HTMLCanvasElement,
  strokes: RunOfShowAnnotationStroke[],
  inProgress: { points: { x: number; y: number }[]; width: number } | null,
  cssW: number,
  cssH: number,
): void {
  redrawRunOfShowCommittedStrokes(canvas, strokes, cssW, cssH);
  if (!inProgress || inProgress.points.length === 0) return;
  const ctx = ensureRunOfShowAnnotationCanvas(canvas, cssW, cssH);
  if (!ctx) return;
  drawRunOfShowStrokePath(ctx, inProgress.points, inProgress.width);
}
