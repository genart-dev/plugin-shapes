import type { BlendSpine } from "./types.js";

type Point = { x: number; y: number };

interface SpineResult {
  totalLength: number;
  positionAt(t: number): Point;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function dist(a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/** Catmull-Rom spline through control points. */
function catmullRom(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const t2 = t * t;
  const t3 = t2 * t;
  return {
    x:
      0.5 *
      (2 * p1.x +
        (-p0.x + p2.x) * t +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
    y:
      0.5 *
      (2 * p1.y +
        (-p0.y + p2.y) * t +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
  };
}

/** Build arc-length parameterized spine from control points. */
function buildCurveSpine(points: Point[]): SpineResult {
  // Pad endpoints for Catmull-Rom
  const pts = [points[0]!, ...points, points[points.length - 1]!];
  const SAMPLES = 500;
  const arcLengths: number[] = [0];
  let totalLength = 0;
  const samples: Point[] = [];

  const segments = pts.length - 3;
  for (let seg = 0; seg < segments; seg++) {
    const p0 = pts[seg]!;
    const p1 = pts[seg + 1]!;
    const p2 = pts[seg + 2]!;
    const p3 = pts[seg + 3]!;
    const segSamples = Math.ceil(SAMPLES / segments);
    for (let i = 0; i <= segSamples; i++) {
      const t = i / segSamples;
      const pt = catmullRom(p0, p1, p2, p3, t);
      if (samples.length > 0) {
        totalLength += dist(samples[samples.length - 1]!, pt);
        arcLengths.push(totalLength);
      }
      samples.push(pt);
    }
  }

  return {
    totalLength,
    positionAt(t: number): Point {
      const targetLen = t * totalLength;
      // Binary search for the arc length segment
      let lo = 0;
      let hi = arcLengths.length - 1;
      while (lo < hi - 1) {
        const mid = (lo + hi) >> 1;
        if (arcLengths[mid]! <= targetLen) lo = mid;
        else hi = mid;
      }
      const segLen = arcLengths[hi]! - arcLengths[lo]!;
      const frac = segLen === 0 ? 0 : (targetLen - arcLengths[lo]!) / segLen;
      return {
        x: lerp(samples[lo]!.x, samples[hi]!.x, frac),
        y: lerp(samples[lo]!.y, samples[hi]!.y, frac),
      };
    },
  };
}

export function computeSpine(
  spine: BlendSpine,
  startPos: Point,
  endPos: Point,
): SpineResult {
  if (spine.type === "straight" || !spine.points || spine.points.length < 2) {
    const totalLength = dist(startPos, endPos);
    return {
      totalLength,
      positionAt(t: number): Point {
        return { x: lerp(startPos.x, endPos.x, t), y: lerp(startPos.y, endPos.y, t) };
      },
    };
  }
  // Use provided control points
  return buildCurveSpine(spine.points);
}
