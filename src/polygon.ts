import type {
  LayerTypeDefinition,
  LayerPropertySchema,
  LayerProperties,
  LayerBounds,
  RenderResources,
  ValidationError,
} from "@genart-dev/core";
import { applyShapeStyle, COMMON_SHAPE_PROPERTIES } from "./shared.js";

const POLYGON_PROPERTIES: LayerPropertySchema[] = [
  ...COMMON_SHAPE_PROPERTIES,
  {
    key: "sides",
    label: "Sides",
    type: "number",
    default: 6,
    min: 3,
    max: 100,
    step: 1,
    group: "shape",
  },
  {
    key: "rotation",
    label: "Rotation",
    type: "number",
    default: 0,
    min: 0,
    max: 360,
    step: 1,
    group: "shape",
  },
];

/** Generate polygon vertices centered in bounds. */
export function polygonPoints(
  cx: number,
  cy: number,
  radius: number,
  sides: number,
  rotationDeg: number,
): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const angleStep = (Math.PI * 2) / sides;
  const startAngle = (rotationDeg * Math.PI) / 180 - Math.PI / 2;

  for (let i = 0; i < sides; i++) {
    const angle = startAngle + i * angleStep;
    points.push({
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    });
  }
  return points;
}

export const polygonLayerType: LayerTypeDefinition = {
  typeId: "shapes:polygon",
  displayName: "Polygon",
  icon: "hexagon",
  category: "shape",
  properties: POLYGON_PROPERTIES,
  propertyEditorId: "shapes:polygon-editor",

  createDefault(): LayerProperties {
    const props: LayerProperties = {};
    for (const schema of POLYGON_PROPERTIES) {
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
    const sides = (properties.sides as number) ?? 6;
    const rotation = (properties.rotation as number) ?? 0;
    const cx = bounds.x + bounds.width / 2;
    const cy = bounds.y + bounds.height / 2;
    const radius = Math.min(bounds.width, bounds.height) / 2;

    const points = polygonPoints(cx, cy, radius, sides, rotation);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(points[0]!.x, points[0]!.y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i]!.x, points[i]!.y);
    }
    ctx.closePath();

    applyShapeStyle(properties, ctx);
    ctx.restore();
  },

  renderSVG(
    properties: LayerProperties,
    bounds: LayerBounds,
    _resources: RenderResources,
  ): string {
    const sides = (properties.sides as number) ?? 6;
    const rotation = (properties.rotation as number) ?? 0;
    const fill = (properties.fillColor as string) ?? "#ffffff";
    const stroke = (properties.strokeColor as string) ?? "#000000";
    const strokeWidth = (properties.strokeWidth as number) ?? 0;
    const cx = bounds.x + bounds.width / 2;
    const cy = bounds.y + bounds.height / 2;
    const radius = Math.min(bounds.width, bounds.height) / 2;

    const points = polygonPoints(cx, cy, radius, sides, rotation);
    const pointsStr = points.map((p) => `${p.x},${p.y}`).join(" ");

    return `<polygon points="${pointsStr}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/>`;
  },

  validate(properties: LayerProperties): ValidationError[] | null {
    const errors: ValidationError[] = [];
    const sides = properties.sides;
    if (typeof sides !== "number" || sides < 3 || sides > 100) {
      errors.push({ property: "sides", message: "Sides must be 3–100" });
    }
    return errors.length > 0 ? errors : null;
  },
};
