type Point = { x: number; y: number };

function dist(a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Resample a path to exactly targetCount vertices via arc-length subdivision. */
export function resamplePath(path: Point[], targetCount: number): Point[] {
  if (path.length === targetCount) return path;
  if (path.length === 0) return Array(targetCount).fill({ x: 0, y: 0 });
  if (path.length === 1) return Array(targetCount).fill(path[0]);

  // Compute arc lengths
  const arcLengths: number[] = [0];
  for (let i = 1; i < path.length; i++) {
    arcLengths.push(arcLengths[i - 1]! + dist(path[i - 1]!, path[i]!));
  }
  const totalLength = arcLengths[arcLengths.length - 1]!;

  if (totalLength === 0) return Array(targetCount).fill(path[0]);

  const result: Point[] = [];
  for (let i = 0; i < targetCount; i++) {
    const targetLen = (i / (targetCount - 1)) * totalLength;
    // Find segment
    let lo = 0;
    let hi = arcLengths.length - 1;
    while (lo < hi - 1) {
      const mid = (lo + hi) >> 1;
      if (arcLengths[mid]! <= targetLen) lo = mid;
      else hi = mid;
    }
    const segLen = arcLengths[hi]! - arcLengths[lo]!;
    const frac = segLen === 0 ? 0 : (targetLen - arcLengths[lo]!) / segLen;
    result.push({
      x: lerp(path[lo]!.x, path[hi]!.x, frac),
      y: lerp(path[lo]!.y, path[hi]!.y, frac),
    });
  }
  return result;
}

/** Rotate vertex order of b to minimize total squared distance vs a. */
function alignRotation(a: Point[], b: Point[]): Point[] {
  const n = a.length;
  let bestCost = Infinity;
  let bestOffset = 0;
  for (let offset = 0; offset < n; offset++) {
    let cost = 0;
    for (let i = 0; i < n; i++) {
      const bv = b[(i + offset) % n]!;
      const av = a[i]!;
      const dx = av.x - bv.x;
      const dy = av.y - bv.y;
      cost += dx * dx + dy * dy;
    }
    if (cost < bestCost) {
      bestCost = cost;
      bestOffset = offset;
    }
  }
  if (bestOffset === 0) return b;
  return [...b.slice(bestOffset), ...b.slice(0, bestOffset)];
}

/** Align two paths to same count and optimal rotation. */
export function alignPaths(pathA: Point[], pathB: Point[]): { a: Point[]; b: Point[] } {
  const targetCount = Math.max(pathA.length, pathB.length);
  const a = resamplePath(pathA, targetCount);
  const b = resamplePath(pathB, targetCount);
  const bAligned = alignRotation(a, b);
  return { a, b: bAligned };
}

/** Linearly interpolate between two aligned vertex arrays. */
export function interpolateVertices(pathA: Point[], pathB: Point[], t: number): Point[] {
  return pathA.map((va, i) => {
    const vb = pathB[i]!;
    return { x: lerp(va.x, vb.x, t), y: lerp(va.y, vb.y, t) };
  });
}
