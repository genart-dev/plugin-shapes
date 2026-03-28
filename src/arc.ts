import type {
  LayerTypeDefinition,
  LayerPropertySchema,
  LayerProperties,
  LayerBounds,
  RenderResources,
  ValidationError,
} from "@genart-dev/core";
import { applyShapeStyle, COMMON_SHAPE_PROPERTIES } from "./shared.js";

const ARC_PROPERTIES: LayerPropertySchema[] = [
  ...COMMON_SHAPE_PROPERTIES,
  {
    key: "startAngle",
    label: "Start Angle (deg)",
    type: "number",
    default: 0,
    min: 0,
    max: 360,
    step: 1,
    group: "arc",
  },
  {
    key: "endAngle",
    label: "End Angle (deg)",
    type: "number",
    default: 270,
    min: 0,
    max: 360,
    step: 1,
    group: "arc",
  },
  {
    key: "innerRadius",
    label: "Inner Radius (ratio)",
    type: "number",
    default: 0,
    min: 0,
    max: 0.99,
    step: 0.01,
    group: "arc",
  },
  {
    key: "closePath",
    label: "Close Path",
    type: "boolean",
    default: true,
    group: "arc",
  },
];

export const arcLayerType: LayerTypeDefinition = {
  typeId: "shapes:arc",
  displayName: "Arc / Sector",
  icon: "arc",
  category: "shape",
  properties: ARC_PROPERTIES,
  propertyEditorId: "shapes:arc-editor",

  createDefault(): LayerProperties {
    const props: LayerProperties = {};
    for (const schema of ARC_PROPERTIES) {
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
    const startDeg = (properties.startAngle as number) ?? 0;
    const endDeg = (properties.endAngle as number) ?? 270;
    const innerRadius = (properties.innerRadius as number) ?? 0;
    const closePath = (properties.closePath as boolean) ?? true;

    const cx = bounds.x + bounds.width / 2;
    const cy = bounds.y + bounds.height / 2;
    const outerR = Math.min(bounds.width, bounds.height) / 2;
    const innerR = outerR * innerRadius;

    const startRad = (startDeg - 90) * Math.PI / 180;
    const endRad = (endDeg - 90) * Math.PI / 180;

    ctx.save();
    ctx.beginPath();

    if (innerR > 0) {
      // Annular sector (donut slice)
      ctx.arc(cx, cy, outerR, startRad, endRad);
      ctx.arc(cx, cy, innerR, endRad, startRad, true);
      if (closePath) ctx.closePath();
    } else {
      // Pie sector
      if (closePath) ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, outerR, startRad, endRad);
      if (closePath) ctx.closePath();
    }

    applyShapeStyle(properties, ctx);
    ctx.restore();
  },

  validate(properties: LayerProperties): ValidationError[] | null {
    const errors: ValidationError[] = [];
    const innerRadius = properties.innerRadius as number;
    if (typeof innerRadius === "number" && (innerRadius < 0 || innerRadius >= 1)) {
      errors.push({ property: "innerRadius", message: "Inner radius must be 0–0.99" });
    }
    return errors.length > 0 ? errors : null;
  },
};
