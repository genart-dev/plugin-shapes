import type {
  LayerTypeDefinition,
  LayerPropertySchema,
  LayerProperties,
  LayerBounds,
  RenderResources,
  ValidationError,
} from "@genart-dev/core";
import { applyShapeStyle, COMMON_SHAPE_PROPERTIES } from "./shared.js";

const STAR_PROPERTIES: LayerPropertySchema[] = [
  ...COMMON_SHAPE_PROPERTIES,
  {
    key: "points",
    label: "Points",
    type: "number",
    default: 5,
    min: 3,
    max: 50,
    step: 1,
    group: "shape",
  },
  {
    key: "innerRadius",
    label: "Inner Radius",
    type: "number",
    default: 0.4,
    min: 0.05,
    max: 0.95,
    step: 0.01,
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

/** Generate star vertices with alternating outer/inner radii. */
export function starPoints(
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadiusRatio: number,
  numPoints: number,
  rotationDeg: number,
): Array<{ x: number; y: number }> {
  const vertices: Array<{ x: number; y: number }> = [];
  const innerRadius = outerRadius * innerRadiusRatio;
  const angleStep = Math.PI / numPoints;
  const startAngle = (rotationDeg * Math.PI) / 180 - Math.PI / 2;

  for (let i = 0; i < numPoints * 2; i++) {
    const angle = startAngle + i * angleStep;
    const r = i % 2 === 0 ? outerRadius : innerRadius;
    vertices.push({
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    });
  }
  return vertices;
}

export const starLayerType: LayerTypeDefinition = {
  typeId: "shapes:star",
  displayName: "Star",
  icon: "star",
  category: "shape",
  properties: STAR_PROPERTIES,
  propertyEditorId: "shapes:star-editor",

  createDefault(): LayerProperties {
    const props: LayerProperties = {};
    for (const schema of STAR_PROPERTIES) {
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
    const numPoints = (properties.points as number) ?? 5;
    const innerRadiusRatio = (properties.innerRadius as number) ?? 0.4;
    const rotation = (properties.rotation as number) ?? 0;
    const cx = bounds.x + bounds.width / 2;
    const cy = bounds.y + bounds.height / 2;
    const outerRadius = Math.min(bounds.width, bounds.height) / 2;

    const vertices = starPoints(cx, cy, outerRadius, innerRadiusRatio, numPoints, rotation);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(vertices[0]!.x, vertices[0]!.y);
    for (let i = 1; i < vertices.length; i++) {
      ctx.lineTo(vertices[i]!.x, vertices[i]!.y);
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
    const numPoints = (properties.points as number) ?? 5;
    const innerRadiusRatio = (properties.innerRadius as number) ?? 0.4;
    const rotation = (properties.rotation as number) ?? 0;
    const fill = (properties.fillColor as string) ?? "#ffffff";
    const stroke = (properties.strokeColor as string) ?? "#000000";
    const strokeWidth = (properties.strokeWidth as number) ?? 0;
    const cx = bounds.x + bounds.width / 2;
    const cy = bounds.y + bounds.height / 2;
    const outerRadius = Math.min(bounds.width, bounds.height) / 2;

    const vertices = starPoints(cx, cy, outerRadius, innerRadiusRatio, numPoints, rotation);
    const pointsStr = vertices.map((p) => `${p.x},${p.y}`).join(" ");

    return `<polygon points="${pointsStr}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/>`;
  },

  validate(properties: LayerProperties): ValidationError[] | null {
    const errors: ValidationError[] = [];
    const pts = properties.points;
    if (typeof pts !== "number" || pts < 3 || pts > 50) {
      errors.push({ property: "points", message: "Points must be 3–50" });
    }
    const ir = properties.innerRadius;
    if (typeof ir !== "number" || ir < 0.05 || ir > 0.95) {
      errors.push({ property: "innerRadius", message: "Inner radius must be 0.05–0.95" });
    }
    return errors.length > 0 ? errors : null;
  },
};
