import type {
  LayerTypeDefinition,
  LayerPropertySchema,
  LayerProperties,
  LayerBounds,
  RenderResources,
  ValidationError,
} from "@genart-dev/core";
import { applyShapeStyle, COMMON_SHAPE_PROPERTIES } from "./shared.js";

const RECT_PROPERTIES: LayerPropertySchema[] = [
  ...COMMON_SHAPE_PROPERTIES,
  {
    key: "cornerRadius",
    label: "Corner Radius",
    type: "number",
    default: 0,
    min: 0,
    max: 500,
    step: 1,
    group: "shape",
  },
];

export const rectLayerType: LayerTypeDefinition = {
  typeId: "shapes:rect",
  // Draws at the canvas's own resolution (ADR 111).
  resolution: "device",
  displayName: "Rectangle",
  icon: "square",
  category: "shape",
  properties: RECT_PROPERTIES,
  propertyEditorId: "shapes:rect-editor",

  createDefault(): LayerProperties {
    const props: LayerProperties = {};
    for (const schema of RECT_PROPERTIES) {
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
    // Device pixels per layout unit (ADR 111): the corner radius is a length,
    // the rectangle itself comes from the bounds.
    const dsc = bounds.scale ?? 1;
    const cornerRadius = ((properties.cornerRadius as number) ?? 0) * dsc;

    ctx.save();
    ctx.beginPath();

    if (cornerRadius > 0) {
      const r = Math.min(cornerRadius, bounds.width / 2, bounds.height / 2);
      ctx.roundRect(bounds.x, bounds.y, bounds.width, bounds.height, r);
    } else {
      ctx.rect(bounds.x, bounds.y, bounds.width, bounds.height);
    }

    applyShapeStyle(properties, ctx, bounds.scale ?? 1);
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
    const cornerRadius = (properties.cornerRadius as number) ?? 0;

    return `<rect x="${bounds.x}" y="${bounds.y}" width="${bounds.width}" height="${bounds.height}" rx="${cornerRadius}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/>`;
  },

  validate(properties: LayerProperties): ValidationError[] | null {
    const errors: ValidationError[] = [];
    const cr = properties.cornerRadius;
    if (cr !== undefined && (typeof cr !== "number" || cr < 0)) {
      errors.push({ property: "cornerRadius", message: "Corner radius must be >= 0" });
    }
    return errors.length > 0 ? errors : null;
  },
};
