import type { LayerBounds } from "@genart-dev/core";
import type { BlendEndpoint, BlendSettings, BlendSpine } from "./types.js";
import { resolvePath } from "./primitives.js";
import { interpolateColor, colorDistance } from "./color.js";
import { computeSpine } from "./spine.js";
import { applyEasing } from "./easing.js";
import { alignPaths, interpolateVertices } from "./interpolation.js";

type Point = { x: number; y: number };

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function scaleAndRotate(pts: Point[], scale: number, rotationDeg: number): Point[] {
  const rad = (rotationDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return pts.map((p) => {
    // pts are 0–1 normalized; scale relative to center (0.5, 0.5)
    const sx = (p.x - 0.5) * scale;
    const sy = (p.y - 0.5) * scale;
    return {
      x: sx * cos - sy * sin + 0.5,
      y: sx * sin + sy * cos + 0.5,
    };
  });
}

function drawPath(ctx: CanvasRenderingContext2D, pts: Point[]): void {
  if (pts.length === 0) return;
  ctx.beginPath();
  ctx.moveTo(pts[0]!.x, pts[0]!.y);
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i]!.x, pts[i]!.y);
  }
  ctx.closePath();
}

export function renderBlend(
  start: BlendEndpoint,
  end: BlendEndpoint,
  settings: BlendSettings,
  spine: BlendSpine,
  showEndpoints: boolean,
  ctx: CanvasRenderingContext2D,
  bounds: LayerBounds,
): void {
  // Resolve paths
  const startVerts = resolvePath(start.path);
  const endVerts = resolvePath(end.path);

  // Prepare morphing if needed
  let alignedA = startVerts;
  let alignedB = endVerts;
  if (settings.interpolate.path) {
    const aligned = alignPaths(startVerts, endVerts);
    alignedA = aligned.a;
    alignedB = aligned.b;
  }

  // Compute spine
  const startPos = { x: bounds.x, y: bounds.y + bounds.height / 2 };
  const endPos = { x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2 };
  const spineResult = computeSpine(spine, startPos, endPos);

  // Determine step count
  let stepCount: number;
  if (settings.mode === "steps") {
    stepCount = settings.steps;
  } else if (settings.mode === "distance") {
    stepCount = Math.max(1, Math.floor(spineResult.totalLength / settings.distance));
  } else {
    // smooth: based on perceptual color distance
    const startColor = start.fill ?? "#000000";
    const endColor = end.fill ?? "#ffffff";
    const deltaE = colorDistance(startColor, endColor) * 100;
    stepCount = Math.max(2, Math.ceil(deltaE / 4));
  }

  // Total shapes = stepCount intermediates + 2 endpoints (if showEndpoints)
  // t values: showEndpoints → 0, 1/(N+1), ..., N/(N+1), 1; else → 1/(N+1), ..., N/(N+1)
  const tValues: number[] = [];
  const total = stepCount + 2;
  if (showEndpoints) {
    for (let i = 0; i < total; i++) {
      tValues.push(i / (total - 1));
    }
  } else {
    for (let i = 1; i <= stepCount; i++) {
      tValues.push(i / (stepCount + 1));
    }
  }

  ctx.save();

  for (const t of tValues) {
    const easedT = applyEasing(t, settings.easing);

    // Spine position
    const pos = spineResult.positionAt(t);

    // Interpolate shape properties
    const opacity = settings.interpolate.opacity
      ? lerp(start.opacity, end.opacity, easedT)
      : start.opacity;
    const scale = settings.interpolate.scale
      ? lerp(start.scale, end.scale, easedT)
      : start.scale;
    const rotation = settings.interpolate.rotation
      ? lerp(start.rotation, end.rotation, easedT)
      : start.rotation;
    const strokeWidth = settings.interpolate.strokeWidth
      ? lerp(start.strokeWidth, end.strokeWidth, easedT)
      : start.strokeWidth;

    const fill =
      settings.interpolate.fill && start.fill && end.fill
        ? interpolateColor(start.fill, end.fill, easedT)
        : t < 0.5
          ? start.fill
          : end.fill;

    const stroke =
      settings.interpolate.stroke && start.stroke && end.stroke
        ? interpolateColor(start.stroke, end.stroke, easedT)
        : t < 0.5
          ? start.stroke
          : end.stroke;

    // Interpolate vertex positions
    const baseVerts = settings.interpolate.path
      ? interpolateVertices(alignedA, alignedB, easedT)
      : alignedA;

    // Scale and rotate around local center (0.5, 0.5)
    const transformed = scaleAndRotate(baseVerts, scale, rotation);

    // Determine render size (use min of bounds width/height as reference size unit)
    const refSize = Math.min(bounds.width, bounds.height);

    // Map from normalized [0,1] to canvas coordinates centered at spine position
    const mapped = transformed.map((p) => ({
      x: pos.x + (p.x - 0.5) * refSize,
      y: pos.y + (p.y - 0.5) * refSize,
    }));

    ctx.save();
    ctx.globalAlpha = opacity;
    drawPath(ctx, mapped);

    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke && strokeWidth > 0) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = strokeWidth;
      ctx.stroke();
    }
    ctx.restore();
  }

  ctx.restore();
}
