import type { LayerPropertySchema, LayerProperties } from "@genart-dev/core";

/** Common properties shared by all shape layer types. */
export const COMMON_SHAPE_PROPERTIES: LayerPropertySchema[] = [
  {
    key: "fillColor",
    label: "Fill Color",
    type: "color",
    default: "#ffffff",
    group: "fill",
  },
  {
    key: "fillEnabled",
    label: "Fill Enabled",
    type: "boolean",
    default: true,
    group: "fill",
  },
  {
    key: "strokeColor",
    label: "Stroke Color",
    type: "color",
    default: "#000000",
    group: "stroke",
  },
  {
    key: "strokeWidth",
    label: "Stroke Width",
    type: "number",
    default: 0,
    min: 0,
    max: 100,
    step: 0.5,
    group: "stroke",
  },
  {
    key: "strokeEnabled",
    label: "Stroke Enabled",
    type: "boolean",
    default: false,
    group: "stroke",
  },
];

/** Apply fill and stroke style from common shape properties. */
export function applyShapeStyle(
  properties: LayerProperties,
  ctx: CanvasRenderingContext2D,
): void {
  const fillEnabled = (properties.fillEnabled as boolean) ?? true;
  const strokeEnabled = (properties.strokeEnabled as boolean) ?? false;

  if (fillEnabled) {
    ctx.fillStyle = (properties.fillColor as string) ?? "#ffffff";
    ctx.fill();
  }

  if (strokeEnabled) {
    const strokeWidth = (properties.strokeWidth as number) ?? 0;
    if (strokeWidth > 0) {
      ctx.strokeStyle = (properties.strokeColor as string) ?? "#000000";
      ctx.lineWidth = strokeWidth;
      ctx.stroke();
    }
  }
}
