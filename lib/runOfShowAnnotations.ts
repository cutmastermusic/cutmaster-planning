/** One ink stroke in Run Of Show annotation layer (document / scroll content coordinates). */
export type RunOfShowAnnotationStroke = { points: { x: number; y: number }[] };

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

export function redrawRunOfShowAnnotationCanvas(
  canvas: HTMLCanvasElement,
  strokes: RunOfShowAnnotationStroke[],
  inProgress: { x: number; y: number }[] | null,
  cssW: number,
  cssH: number,
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx || cssW <= 0 || cssH <= 0) return;
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  canvas.width = Math.max(1, Math.floor(cssW * dpr));
  canvas.height = Math.max(1, Math.floor(cssH * dpr));
  canvas.style.width = `${cssW}px`;
  canvas.style.height = `${cssH}px`;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, cssW, cssH);
  ctx.strokeStyle = "rgba(28, 25, 23, 0.88)";
  ctx.lineWidth = 1.35;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const drawStroke = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return;
    if (pts.length === 1) {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      ctx.lineTo(pts[0].x + 0.4, pts[0].y);
      ctx.stroke();
      return;
    }
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
  };

  for (const s of strokes) drawStroke(s.points);
  if (inProgress && inProgress.length > 0) drawStroke(inProgress);
}
