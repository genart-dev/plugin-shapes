import { polygonPoints } from "../polygon.js";
import { starPoints } from "../star.js";

type Point = { x: number; y: number };

/** Normalize vertices to [0,1] bounding box. */
function normalize(pts: Point[]): Point[] {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of pts) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;
  return pts.map((p) => ({
    x: (p.x - minX) / rangeX,
    y: (p.y - minY) / rangeY,
  }));
}

/** Expand a named primitive to normalized vertex array. */
export function expandPrimitive(name: string): Point[] {
  if (name === "circle") {
    // 64-gon approximation
    return normalize(polygonPoints(0.5, 0.5, 0.5, 64, 0));
  }
  if (name === "rect") {
    return [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
    ];
  }
  if (name === "triangle") {
    return normalize(polygonPoints(0.5, 0.5, 0.5, 3, 0));
  }
  if (name.startsWith("star-")) {
    const n = parseInt(name.slice(5), 10);
    if (!isNaN(n) && n >= 3) {
      return normalize(starPoints(0.5, 0.5, 0.5, 0.4, n, 0));
    }
  }
  if (name.startsWith("polygon-")) {
    const n = parseInt(name.slice(8), 10);
    if (!isNaN(n) && n >= 3) {
      return normalize(polygonPoints(0.5, 0.5, 0.5, n, 0));
    }
  }
  throw new Error(`Unknown primitive: "${name}"`);
}

/** Resolve a path value (string or array) to a vertex array. */
export function resolvePath(path: Point[] | string): Point[] {
  if (typeof path === "string") return expandPrimitive(path);
  return path;
}
