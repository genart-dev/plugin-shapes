import type {
  LayerTypeDefinition,
  LayerProperties,
  LayerBounds,
  RenderResources,
  ValidationError,
} from "@genart-dev/core";
import { applyShapeStyle, COMMON_SHAPE_PROPERTIES } from "./shared.js";

export const ellipseLayerType: LayerTypeDefinition = {
  typeId: "shapes:ellipse",
  displayName: "Ellipse",
  icon: "circle",
  category: "shape",
  properties: COMMON_SHAPE_PROPERTIES,
  propertyEditorId: "shapes:ellipse-editor",

  createDefault(): LayerProperties {
    const props: LayerProperties = {};
    for (const schema of COMMON_SHAPE_PROPERTIES) {
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
    const cx = bounds.x + bounds.width / 2;
    const cy = bounds.y + bounds.height / 2;
    const rx = bounds.width / 2;
    const ry = bounds.height / 2;

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    applyShapeStyle(properties, ctx);
    ctx.restore();
  },

  renderSVG(
    properties: LayerProperties,
    bounds: LayerBounds,
    _resources: RenderResources,
  ): string {
    const fill = (properties.fillColor as string) ?? "#ffffff";
    const stroke = (properties.strokeColor as string) ?? "#000000";
    const strokeWidth = (properties.strokeWidth as number) ?? 0;
    const cx = bounds.x + bounds.width / 2;
    const cy = bounds.y + bounds.height / 2;

    return `<ellipse cx="${cx}" cy="${cy}" rx="${bounds.width / 2}" ry="${bounds.height / 2}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/>`;
  },

  validate(_properties: LayerProperties): ValidationError[] | null {
    return null;
  },
};
