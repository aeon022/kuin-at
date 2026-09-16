// Shared by any inline SVG that needs an organic, continuously-morphing
// blob outline (currently: the KUIN logo badge in Header.astro). Cheap
// stand-in for simplex noise — a couple of summed sine waves per vertex,
// phase-offset per point so they don't all move in lockstep — rejoined
// with a Catmull-Rom-style smoothed closed curve (tension 1/6).
export type Point = [number, number];

export function smoothPath(points: Point[]): string {
  const n = points.length;
  const parts: string[] = [];
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    if (i === 0) parts.push(`M${p1[0].toFixed(2)},${p1[1].toFixed(2)}`);
    parts.push(`C${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`);
  }
  parts.push('Z');
  return parts.join(' ');
}

// Classic parametric "cartoon" heart (two lobes + a point) — NOT a polar
// r(θ) cardioid; a single-valued r(θ) can only ever produce one cusp, not
// the two-lobe-plus-point silhouette people actually recognize as a
// heart. `scale` should be sized so the curve's own extent (empirically
// up to ~17 units at scale 1) respects the same safe-margin-before-the-
// edge rule as `blobPoints`. y is negated because this formula assumes a
// math y-up convention; SVG's y grows downward.
export function heartPoint(cx: number, cy: number, scale: number, i: number, count: number): Point {
  const t = (i / count) * Math.PI * 2;
  const x = 16 * Math.pow(Math.sin(t), 3);
  const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
  return [cx + x * scale, cy + y * scale];
}

// Max reach (baseR + ampA + ampB) needs to stay well under the viewBox's
// own edge (plus any filter blur spread) wherever this is used — same
// "safe margin before empty space" lesson the hero blob's edge bugs
// taught, just applied to a radius instead of a gradient stop.
export function blobPoints(
  cx: number,
  cy: number,
  count: number,
  baseR: number,
  ampA: number,
  ampB: number,
  freqA: number,
  freqB: number,
  phase: number,
  t: number,
): Point[] {
  const pts: Point[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const wobble = ampA * Math.sin(freqA * t + i * 1.7 + phase) + ampB * Math.sin(freqB * t + i * 2.3 + phase * 1.3);
    const r = baseR + wobble;
    pts.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
  }
  return pts;
}
