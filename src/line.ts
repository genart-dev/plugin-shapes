import type {
  LayerTypeDefinition,
  LayerPropertySchema,
  LayerProperties,
  LayerBounds,
  RenderResources,
  ValidationError,
} from "@genart-dev/core";

const LINE_PROPERTIES: LayerPropertySchema[] = [
  {
    key: "strokeColor",
    label: "Line Color",
    type: "color",
    default: "#ffffff",
    group: "stroke",
  },
  {
    key: "strokeWidth",
    label: "Line Width",
    type: "number",
    default: 2,
    min: 0.5,
    max: 100,
    step: 0.5,
    group: "stroke",
  },
  {
    key: "lineCap",
    label: "Line Cap",
    type: "select",
    default: "round",
    group: "stroke",
    options: [
      { value: "butt", label: "Butt" },
      { value: "round", label: "Round" },
      { value: "square", label: "Square" },
    ],
  },
  {
    key: "dashPattern",
    label: "Dash Pattern",
    type: "string",
    default: "",
    group: "stroke",
  },
];

export const lineLayerType: LayerTypeDefinition = {
  typeId: "shapes:line",
  displayName: "Line",
  icon: "minus",
  category: "shape",
  properties: LINE_PROPERTIES,
  propertyEditorId: "shapes:line-editor",

  createDefault(): LayerProperties {
    const props: LayerProperties = {};
    for (const schema of LINE_PROPERTIES) {
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
    const color = (properties.strokeColor as string) ?? "#ffffff";
    const width = (properties.strokeWidth as number) ?? 2;
    const cap = (properties.lineCap as string) ?? "round";
    const dashStr = (properties.dashPattern as string) ?? "";

    ctx.save();
    ctx.beginPath();
    // Line from top-left to bottom-right of bounds
    ctx.moveTo(bounds.x, bounds.y);
    ctx.lineTo(bounds.x + bounds.width, bounds.y + bounds.height);

    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = cap as CanvasLineCap;

    if (dashStr) {
      const dashes = dashStr.split(",").map(Number).filter((n) => !isNaN(n) && n > 0);
      if (dashes.length > 0) ctx.setLineDash(dashes);
    }

    ctx.stroke();
    ctx.restore();
  },

  renderSVG(
    properties: LayerProperties,
    bounds: LayerBounds,
    _resources: RenderResources,
  ): string {
    const color = (properties.strokeColor as string) ?? "#ffffff";
    const width = (properties.strokeWidth as number) ?? 2;
    const cap = (properties.lineCap as string) ?? "round";

    return `<line x1="${bounds.x}" y1="${bounds.y}" x2="${bounds.x + bounds.width}" y2="${bounds.y + bounds.height}" stroke="${color}" stroke-width="${width}" stroke-linecap="${cap}"/>`;
  },

  validate(properties: LayerProperties): ValidationError[] | null {
    const errors: ValidationError[] = [];
    const sw = properties.strokeWidth;
    if (typeof sw !== "number" || sw < 0.5) {
      errors.push({ property: "strokeWidth", message: "Line width must be >= 0.5" });
    }
    return errors.length > 0 ? errors : null;
  },
};
