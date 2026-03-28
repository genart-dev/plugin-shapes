import type {
  LayerTypeDefinition,
  LayerPropertySchema,
  LayerProperties,
  LayerBounds,
  RenderResources,
  ValidationError,
} from "@genart-dev/core";
import { applyShapeStyle, COMMON_SHAPE_PROPERTIES } from "./shared.js";

const PATH_PROPERTIES: LayerPropertySchema[] = [
  ...COMMON_SHAPE_PROPERTIES,
  {
    key: "d",
    label: "Path Data",
    type: "string",
    default: "M 10 10 L 90 10 L 90 90 L 10 90 Z",
    group: "path",
  },
  {
    key: "scaleToFit",
    label: "Scale to Fit",
    type: "boolean",
    default: true,
    group: "path",
  },
];

/**
 * Minimal SVG path data parser supporting M, L, C, Q, Z commands (absolute only).
 * Sufficient for the most common generative art use cases.
 */
function drawPath(ctx: CanvasRenderingContext2D, d: string, bounds: LayerBounds, scaleToFit: boolean): void {
  // Tokenize: split on command letters, keeping command as first char
  const commands = d.match(/[MLCQZmlcqz][^MLCQZmlcqz]*/gi);
  if (!commands) return;

  // First pass: find bounding box of the path for scaleToFit
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  let cx = 0, cy = 0;

  for (const cmd of commands) {
    const type = cmd[0]!;
    const nums = cmd.slice(1).trim().split(/[\s,]+/).map(Number).filter((n) => !isNaN(n));

    switch (type.toUpperCase()) {
      case "M":
      case "L":
        for (let i = 0; i < nums.length; i += 2) {
          const x = nums[i]!, y = nums[i + 1] ?? 0;
          minX = Math.min(minX, x); minY = Math.min(minY, y);
          maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
          cx = x; cy = y;
        }
        break;
      case "C":
        for (let i = 0; i < nums.length; i += 6) {
          for (let j = 0; j < 6; j += 2) {
            const x = nums[i + j]!, y = nums[i + j + 1] ?? 0;
            minX = Math.min(minX, x); minY = Math.min(minY, y);
            maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
          }
          cx = nums[i + 4]!; cy = nums[i + 5] ?? 0;
        }
        break;
      case "Q":
        for (let i = 0; i < nums.length; i += 4) {
          for (let j = 0; j < 4; j += 2) {
            const x = nums[i + j]!, y = nums[i + j + 1] ?? 0;
            minX = Math.min(minX, x); minY = Math.min(minY, y);
            maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
          }
          cx = nums[i + 2]!; cy = nums[i + 3] ?? 0;
        }
        break;
    }
  }

  // Compute transform
  const pathW = maxX - minX || 1;
  const pathH = maxY - minY || 1;
  let sx = 1, sy = 1, tx = bounds.x, ty = bounds.y;

  if (scaleToFit && isFinite(minX)) {
    sx = bounds.width / pathW;
    sy = bounds.height / pathH;
    tx = bounds.x - minX * sx;
    ty = bounds.y - minY * sy;
  }

  // Second pass: draw
  ctx.beginPath();
  for (const cmd of commands) {
    const type = cmd[0]!;
    const nums = cmd.slice(1).trim().split(/[\s,]+/).map(Number).filter((n) => !isNaN(n));

    switch (type.toUpperCase()) {
      case "M":
        ctx.moveTo(nums[0]! * sx + tx, (nums[1] ?? 0) * sy + ty);
        break;
      case "L":
        for (let i = 0; i < nums.length; i += 2) {
          ctx.lineTo(nums[i]! * sx + tx, (nums[i + 1] ?? 0) * sy + ty);
        }
        break;
      case "C":
        for (let i = 0; i < nums.length; i += 6) {
          ctx.bezierCurveTo(
            nums[i]! * sx + tx, (nums[i + 1] ?? 0) * sy + ty,
            (nums[i + 2] ?? 0) * sx + tx, (nums[i + 3] ?? 0) * sy + ty,
            (nums[i + 4] ?? 0) * sx + tx, (nums[i + 5] ?? 0) * sy + ty,
          );
        }
        break;
      case "Q":
        for (let i = 0; i < nums.length; i += 4) {
          ctx.quadraticCurveTo(
            nums[i]! * sx + tx, (nums[i + 1] ?? 0) * sy + ty,
            (nums[i + 2] ?? 0) * sx + tx, (nums[i + 3] ?? 0) * sy + ty,
          );
        }
        break;
      case "Z":
        ctx.closePath();
        break;
    }
  }
}

export const pathLayerType: LayerTypeDefinition = {
  typeId: "shapes:path",
  displayName: "Path",
  icon: "path",
  category: "shape",
  properties: PATH_PROPERTIES,
  propertyEditorId: "shapes:path-editor",

  createDefault(): LayerProperties {
    const props: LayerProperties = {};
    for (const schema of PATH_PROPERTIES) {
      props[schema.key] = schema.default;
    }
    return props;
  },

  render(
    properties: LayerProperties,
    ctx: CanvasRenderingContext2D,
    bounds: LayerBounds,
    _resources: RenderResources,
  ): void {
    const d = (properties.d as string) ?? "";
    const scaleToFit = (properties.scaleToFit as boolean) ?? true;

    if (!d.trim()) return;

    ctx.save();
    drawPath(ctx, d, bounds, scaleToFit);
    applyShapeStyle(properties, ctx);
    ctx.restore();
  },

  validate(properties: LayerProperties): ValidationError[] | null {
    const d = properties.d as string;
    if (typeof d === "string" && d.trim() && !/[MLCQZmlcqz]/.test(d)) {
      return [{ property: "d", message: "Path data must contain valid SVG path commands (M, L, C, Q, Z)" }];
    }
    return null;
  },
};
