import type {
  LayerTypeDefinition,
  LayerPropertySchema,
  LayerProperties,
  LayerBounds,
  RenderResources,
  ValidationError,
} from "@genart-dev/core";
import type { BlendEndpoint, BlendSettings, BlendSpine } from "./blend/types.js";
import { renderBlend } from "./blend/blend-renderer.js";

const BLEND_PROPERTIES: LayerPropertySchema[] = [
  {
    key: "start",
    label: "Start Shape",
    type: "string",
    default: JSON.stringify({
      path: "circle",
      fill: "#E63946",
      stroke: null,
      strokeWidth: 0,
      opacity: 1,
      scale: 1,
      rotation: 0,
    } satisfies BlendEndpoint),
    group: "endpoints",
  },
  {
    key: "end",
    label: "End Shape",
    type: "string",
    default: JSON.stringify({
      path: "circle",
      fill: "#457B9D",
      stroke: null,
      strokeWidth: 0,
      opacity: 1,
      scale: 1,
      rotation: 0,
    } satisfies BlendEndpoint),
    group: "endpoints",
  },
  {
    key: "mode",
    label: "Mode",
    type: "select",
    default: "steps",
    options: [
      { value: "steps", label: "Steps" },
      { value: "distance", label: "Distance" },
      { value: "smooth", label: "Smooth" },
    ],
    group: "blend",
  },
  {
    key: "steps",
    label: "Steps",
    type: "number",
    default: 10,
    min: 1,
    max: 200,
    step: 1,
    group: "blend",
  },
  {
    key: "distance",
    label: "Distance (px)",
    type: "number",
    default: 20,
    min: 1,
    max: 1000,
    step: 1,
    group: "blend",
  },
  {
    key: "easing",
    label: "Easing",
    type: "select",
    default: "linear",
    options: [
      { value: "linear", label: "Linear" },
      { value: "ease-in", label: "Ease In" },
      { value: "ease-out", label: "Ease Out" },
      { value: "ease-in-out", label: "Ease In-Out" },
    ],
    group: "blend",
  },
  {
    key: "spine",
    label: "Spine",
    type: "string",
    default: JSON.stringify({ type: "straight" } satisfies BlendSpine),
    group: "spine",
  },
  { key: "interpolatePath", label: "Morph Shape", type: "boolean", default: true, group: "interpolation" },
  { key: "interpolateFill", label: "Blend Fill", type: "boolean", default: true, group: "interpolation" },
  { key: "interpolateStroke", label: "Blend Stroke", type: "boolean", default: true, group: "interpolation" },
  { key: "interpolateStrokeWidth", label: "Blend Stroke Width", type: "boolean", default: true, group: "interpolation" },
  { key: "interpolateOpacity", label: "Blend Opacity", type: "boolean", default: true, group: "interpolation" },
  { key: "interpolateScale", label: "Blend Scale", type: "boolean", default: true, group: "interpolation" },
  { key: "interpolateRotation", label: "Blend Rotation", type: "boolean", default: true, group: "interpolation" },
  { key: "showEndpoints", label: "Show Endpoints", type: "boolean", default: true, group: "display" },
  { key: "seed", label: "Seed", type: "number", default: 42, min: 0, max: 99999, step: 1, group: "blend" },
];

function parseBlendProps(properties: LayerProperties): {
  start: BlendEndpoint;
  end: BlendEndpoint;
  settings: BlendSettings;
  spine: BlendSpine;
  showEndpoints: boolean;
} {
  const start = JSON.parse(properties.start as string) as BlendEndpoint;
  const end = JSON.parse(properties.end as string) as BlendEndpoint;
  const spine = JSON.parse((properties.spine as string) ?? '{"type":"straight"}') as BlendSpine;
  const showEndpoints = (properties.showEndpoints as boolean) ?? true;

  const settings: BlendSettings = {
    mode: (properties.mode as BlendSettings["mode"]) ?? "steps",
    steps: (properties.steps as number) ?? 10,
    distance: (properties.distance as number) ?? 20,
    easing: (properties.easing as BlendSettings["easing"]) ?? "linear",
    interpolate: {
      path: (properties.interpolatePath as boolean) ?? true,
      fill: (properties.interpolateFill as boolean) ?? true,
      stroke: (properties.interpolateStroke as boolean) ?? true,
      strokeWidth: (properties.interpolateStrokeWidth as boolean) ?? true,
      opacity: (properties.interpolateOpacity as boolean) ?? true,
      scale: (properties.interpolateScale as boolean) ?? true,
      rotation: (properties.interpolateRotation as boolean) ?? true,
    },
  };

  return { start, end, settings, spine, showEndpoints };
}

export const blendLayerType: LayerTypeDefinition = {
  typeId: "shapes:blend",
  displayName: "Shape Blend",
  icon: "blend",
  category: "shape",
  properties: BLEND_PROPERTIES,
  propertyEditorId: "shapes:blend-editor",

  createDefault(): LayerProperties {
    const props: LayerProperties = {};
    for (const schema of BLEND_PROPERTIES) {
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
    const { start, end, settings, spine, showEndpoints } = parseBlendProps(properties);
    renderBlend(start, end, settings, spine, showEndpoints, ctx, bounds);
  },

  validate(properties: LayerProperties): ValidationError[] | null {
    const errors: ValidationError[] = [];
    try {
      JSON.parse(properties.start as string);
    } catch {
      errors.push({ property: "start", message: "Invalid JSON for start endpoint" });
    }
    try {
      JSON.parse(properties.end as string);
    } catch {
      errors.push({ property: "end", message: "Invalid JSON for end endpoint" });
    }
    const steps = properties.steps as number;
    if (typeof steps !== "number" || steps < 1) {
      errors.push({ property: "steps", message: "Steps must be ≥ 1" });
    }
    return errors.length > 0 ? errors : null;
  },
};
