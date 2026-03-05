import type {
  McpToolDefinition,
  McpToolContext,
  McpToolResult,
  JsonSchema,
  DesignLayer,
  LayerTransform,
  LayerProperties,
} from "@genart-dev/core";
import { rectLayerType } from "./rect.js";
import { ellipseLayerType } from "./ellipse.js";
import { lineLayerType } from "./line.js";
import { polygonLayerType } from "./polygon.js";
import { starLayerType } from "./star.js";

const SHAPE_TYPES = {
  rect: rectLayerType,
  ellipse: ellipseLayerType,
  polygon: polygonLayerType,
  star: starLayerType,
} as const;

function textResult(text: string): McpToolResult {
  return { content: [{ type: "text", text }] };
}

function errorResult(text: string): McpToolResult {
  return { content: [{ type: "text", text }], isError: true };
}

function generateLayerId(): string {
  return `layer-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export const addShapeTool: McpToolDefinition = {
  name: "add_shape",
  description:
    "Add a shape layer (rect, ellipse, polygon, or star) to the canvas.",
  inputSchema: {
    type: "object",
    properties: {
      shape: {
        type: "string",
        enum: ["rect", "ellipse", "polygon", "star"],
        description: "Shape type to add.",
      },
      x: { type: "number", description: "X position (default: 100)." },
      y: { type: "number", description: "Y position (default: 100)." },
      width: { type: "number", description: "Width (default: 200)." },
      height: { type: "number", description: "Height (default: 200)." },
      fillColor: {
        type: "string",
        description: "Fill color as hex (default: '#ffffff').",
      },
      strokeColor: {
        type: "string",
        description: "Stroke color as hex (default: '#000000').",
      },
      strokeWidth: {
        type: "number",
        description: "Stroke width (default: 0).",
      },
      sides: {
        type: "number",
        description: "Number of sides for polygon (default: 6).",
      },
      points: {
        type: "number",
        description: "Number of points for star (default: 5).",
      },
      cornerRadius: {
        type: "number",
        description: "Corner radius for rect (default: 0).",
      },
    },
    required: ["shape"],
  } satisfies JsonSchema,

  async handler(
    input: Record<string, unknown>,
    context: McpToolContext,
  ): Promise<McpToolResult> {
    const shapeKey = input.shape as string;
    const shapeDef = SHAPE_TYPES[shapeKey as keyof typeof SHAPE_TYPES];
    if (!shapeDef) return errorResult(`Unknown shape type '${shapeKey}'.`);

    const defaults = shapeDef.createDefault();
    const properties = { ...defaults };

    // Merge user-provided properties
    if (input.fillColor !== undefined) properties.fillColor = input.fillColor as string;
    if (input.strokeColor !== undefined) properties.strokeColor = input.strokeColor as string;
    if (input.strokeWidth !== undefined) {
      properties.strokeWidth = input.strokeWidth as number;
      properties.strokeEnabled = (input.strokeWidth as number) > 0;
    }
    if (input.sides !== undefined) properties.sides = input.sides as number;
    if (input.points !== undefined) properties.points = input.points as number;
    if (input.cornerRadius !== undefined) properties.cornerRadius = input.cornerRadius as number;

    const id = generateLayerId();
    const transform: LayerTransform = {
      x: (input.x as number) ?? 100,
      y: (input.y as number) ?? 100,
      width: (input.width as number) ?? 200,
      height: (input.height as number) ?? 200,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      anchorX: 0.5,
      anchorY: 0.5,
    };

    const layer: DesignLayer = {
      id,
      type: shapeDef.typeId,
      name: shapeDef.displayName,
      visible: true,
      locked: false,
      opacity: 1,
      blendMode: "normal",
      transform,
      properties,
    };

    context.layers.add(layer);
    context.emitChange("layer-added");
    return textResult(`Added ${shapeDef.displayName} layer '${id}'.`);
  },
};

export const setShapeStyleTool: McpToolDefinition = {
  name: "set_shape_style",
  description: "Update fill and stroke styles of an existing shape layer.",
  inputSchema: {
    type: "object",
    properties: {
      layerId: { type: "string", description: "ID of the shape layer." },
      fillColor: { type: "string", description: "Fill color (hex)." },
      fillEnabled: { type: "boolean", description: "Enable/disable fill." },
      strokeColor: { type: "string", description: "Stroke color (hex)." },
      strokeWidth: { type: "number", description: "Stroke width in pixels." },
      strokeEnabled: { type: "boolean", description: "Enable/disable stroke." },
    },
    required: ["layerId"],
  } satisfies JsonSchema,

  async handler(
    input: Record<string, unknown>,
    context: McpToolContext,
  ): Promise<McpToolResult> {
    const layerId = input.layerId as string;
    const layer = context.layers.get(layerId);
    if (!layer) return errorResult(`Layer '${layerId}' not found.`);
    if (!layer.type.startsWith("shapes:"))
      return errorResult(`Layer '${layerId}' is not a shape layer.`);

    const updates: Record<string, unknown> = {};
    const keys = ["fillColor", "fillEnabled", "strokeColor", "strokeWidth", "strokeEnabled"];
    for (const key of keys) {
      if (input[key] !== undefined) updates[key] = input[key];
    }

    if (Object.keys(updates).length === 0)
      return errorResult("No style properties provided.");

    context.layers.updateProperties(layerId, updates as Partial<LayerProperties>);
    context.emitChange("layer-updated");
    return textResult(`Updated style on shape layer '${layerId}'.`);
  },
};

export const setPolygonTool: McpToolDefinition = {
  name: "set_polygon",
  description: "Update polygon-specific properties (sides, rotation).",
  inputSchema: {
    type: "object",
    properties: {
      layerId: { type: "string", description: "ID of the polygon layer." },
      sides: { type: "number", description: "Number of sides (3–100)." },
      rotation: { type: "number", description: "Rotation in degrees (0–360)." },
    },
    required: ["layerId"],
  } satisfies JsonSchema,

  async handler(
    input: Record<string, unknown>,
    context: McpToolContext,
  ): Promise<McpToolResult> {
    const layerId = input.layerId as string;
    const layer = context.layers.get(layerId);
    if (!layer) return errorResult(`Layer '${layerId}' not found.`);
    if (layer.type !== "shapes:polygon")
      return errorResult(`Layer '${layerId}' is not a polygon layer.`);

    const updates: Record<string, unknown> = {};
    if (input.sides !== undefined) updates.sides = input.sides;
    if (input.rotation !== undefined) updates.rotation = input.rotation;

    context.layers.updateProperties(layerId, updates as Partial<LayerProperties>);
    context.emitChange("layer-updated");
    return textResult(`Updated polygon layer '${layerId}'.`);
  },
};

export const addLineTool: McpToolDefinition = {
  name: "add_line",
  description: "Add a line layer from (x1, y1) to (x2, y2).",
  inputSchema: {
    type: "object",
    properties: {
      x1: { type: "number", description: "Start X (default: 0)." },
      y1: { type: "number", description: "Start Y (default: 0)." },
      x2: { type: "number", description: "End X (default: 200)." },
      y2: { type: "number", description: "End Y (default: 200)." },
      strokeColor: {
        type: "string",
        description: "Line color (default: '#ffffff').",
      },
      strokeWidth: {
        type: "number",
        description: "Line width (default: 2).",
      },
    },
  } satisfies JsonSchema,

  async handler(
    input: Record<string, unknown>,
    context: McpToolContext,
  ): Promise<McpToolResult> {
    const x1 = (input.x1 as number) ?? 0;
    const y1 = (input.y1 as number) ?? 0;
    const x2 = (input.x2 as number) ?? 200;
    const y2 = (input.y2 as number) ?? 200;

    const defaults = lineLayerType.createDefault();
    const properties = { ...defaults };
    if (input.strokeColor !== undefined) properties.strokeColor = input.strokeColor as string;
    if (input.strokeWidth !== undefined) properties.strokeWidth = input.strokeWidth as number;

    const id = generateLayerId();
    const layer: DesignLayer = {
      id,
      type: "shapes:line",
      name: "Line",
      visible: true,
      locked: false,
      opacity: 1,
      blendMode: "normal",
      transform: {
        x: x1,
        y: y1,
        width: x2 - x1,
        height: y2 - y1,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        anchorX: 0,
        anchorY: 0,
      },
      properties,
    };

    context.layers.add(layer);
    context.emitChange("layer-added");
    return textResult(`Added line layer '${id}' from (${x1},${y1}) to (${x2},${y2}).`);
  },
};

export const listShapesTool: McpToolDefinition = {
  name: "list_shapes",
  description: "List all available shape types and their properties.",
  inputSchema: {
    type: "object",
    properties: {},
  } satisfies JsonSchema,

  async handler(
    _input: Record<string, unknown>,
    _context: McpToolContext,
  ): Promise<McpToolResult> {
    const shapes = [
      rectLayerType,
      ellipseLayerType,
      lineLayerType,
      polygonLayerType,
      starLayerType,
    ];
    const lines = shapes.map((s) => {
      const props = s.properties.map((p) => p.key).join(", ");
      return `• ${s.displayName} (${s.typeId}) — properties: ${props}`;
    });
    return textResult(`Available shapes:\n${lines.join("\n")}`);
  },
};

import type { BlendEndpoint, BlendSettings, BlendSpine } from "./blend/types.js";
import { blendLayerType } from "./blend-layer.js";

export const blendShapesTool: McpToolDefinition = {
  name: "blend_shapes",
  description:
    "Create a shape blend layer: two shapes interpolated along a spine (color transitions, shape morphing, contour shading, neon glows).",
  inputSchema: {
    type: "object",
    properties: {
      startPath: {
        description: 'Start shape: "circle", "rect", "triangle", "star-N", "polygon-N", or vertex array [{x,y}].',
      },
      startFill: { type: "string", description: "Start fill color (hex). Default #E63946." },
      startStroke: { type: "string", description: "Start stroke color (hex)." },
      startStrokeWidth: { type: "number", description: "Start stroke width." },
      startOpacity: { type: "number", description: "Start opacity 0–1." },
      startScale: { type: "number", description: "Start scale multiplier." },
      startRotation: { type: "number", description: "Start rotation degrees." },
      endPath: {
        description: 'End shape: "circle", "rect", "triangle", "star-N", "polygon-N", or vertex array [{x,y}].',
      },
      endFill: { type: "string", description: "End fill color (hex). Default #457B9D." },
      endStroke: { type: "string", description: "End stroke color (hex)." },
      endStrokeWidth: { type: "number", description: "End stroke width." },
      endOpacity: { type: "number", description: "End opacity 0–1." },
      endScale: { type: "number", description: "End scale multiplier." },
      endRotation: { type: "number", description: "End rotation degrees." },
      mode: { type: "string", enum: ["steps", "distance", "smooth"], description: 'Blend mode. Default "steps".' },
      steps: { type: "number", description: "Intermediate step count (steps mode). Default 10." },
      distance: { type: "number", description: "Spacing in px between steps (distance mode). Default 20." },
      easing: { type: "string", enum: ["linear", "ease-in", "ease-out", "ease-in-out"], description: "Easing function." },
      spine: { type: "array", description: "Spine control points [{x,y}]. Omit for straight line." },
      x: { type: "number", description: "Layer X position." },
      y: { type: "number", description: "Layer Y position." },
      width: { type: "number", description: "Layer width." },
      height: { type: "number", description: "Layer height." },
      interpolatePath: { type: "boolean", description: "Morph path geometry. Default true." },
      interpolateFill: { type: "boolean", description: "Blend fill color. Default true." },
      interpolateStroke: { type: "boolean", description: "Blend stroke color. Default true." },
      interpolateOpacity: { type: "boolean", description: "Blend opacity. Default true." },
      interpolateScale: { type: "boolean", description: "Blend scale. Default true." },
      interpolateRotation: { type: "boolean", description: "Blend rotation. Default true." },
      showEndpoints: { type: "boolean", description: "Include start/end shapes in output. Default true." },
    },
    required: ["startPath", "endPath"],
  } satisfies JsonSchema,

  async handler(input: Record<string, unknown>, context: McpToolContext): Promise<McpToolResult> {
    const startEndpoint: BlendEndpoint = {
      path: (input.startPath as BlendEndpoint["path"]) ?? "circle",
      fill: (input.startFill as string) ?? "#E63946",
      stroke: (input.startStroke as string | null) ?? null,
      strokeWidth: (input.startStrokeWidth as number) ?? 0,
      opacity: (input.startOpacity as number) ?? 1,
      scale: (input.startScale as number) ?? 1,
      rotation: (input.startRotation as number) ?? 0,
    };
    const endEndpoint: BlendEndpoint = {
      path: (input.endPath as BlendEndpoint["path"]) ?? "circle",
      fill: (input.endFill as string) ?? "#457B9D",
      stroke: (input.endStroke as string | null) ?? null,
      strokeWidth: (input.endStrokeWidth as number) ?? 0,
      opacity: (input.endOpacity as number) ?? 1,
      scale: (input.endScale as number) ?? 1,
      rotation: (input.endRotation as number) ?? 0,
    };

    const spinePoints = input.spine as Array<{ x: number; y: number }> | undefined;
    const spine: BlendSpine = spinePoints && spinePoints.length >= 2
      ? { type: "path", points: spinePoints }
      : { type: "straight" };

    const defaults = blendLayerType.createDefault();
    const properties: LayerProperties = {
      ...defaults,
      start: JSON.stringify(startEndpoint),
      end: JSON.stringify(endEndpoint),
      spine: JSON.stringify(spine),
      mode: (input.mode as string) ?? "steps",
      steps: (input.steps as number) ?? 10,
      distance: (input.distance as number) ?? 20,
      easing: (input.easing as string) ?? "linear",
      interpolatePath: (input.interpolatePath as boolean) ?? true,
      interpolateFill: (input.interpolateFill as boolean) ?? true,
      interpolateStroke: (input.interpolateStroke as boolean) ?? true,
      interpolateOpacity: (input.interpolateOpacity as boolean) ?? true,
      interpolateScale: (input.interpolateScale as boolean) ?? true,
      interpolateRotation: (input.interpolateRotation as boolean) ?? true,
      showEndpoints: (input.showEndpoints as boolean) ?? true,
    };

    const id = generateLayerId();
    const transform: LayerTransform = {
      x: (input.x as number) ?? 0,
      y: (input.y as number) ?? 0,
      width: (input.width as number) ?? 600,
      height: (input.height as number) ?? 200,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      anchorX: 0.5,
      anchorY: 0.5,
    };

    const layer: DesignLayer = {
      id,
      type: "shapes:blend",
      name: "Shape Blend",
      visible: true,
      locked: false,
      opacity: 1,
      blendMode: "normal",
      transform,
      properties,
    };

    context.layers.add(layer);
    context.emitChange("layer-added");
    return textResult(`Added shapes:blend layer '${id}'.`);
  },
};

export const updateBlendTool: McpToolDefinition = {
  name: "update_blend",
  description: "Modify properties on an existing shapes:blend layer.",
  inputSchema: {
    type: "object",
    properties: {
      layerId: { type: "string", description: "ID of the blend layer." },
      steps: { type: "number" },
      easing: { type: "string", enum: ["linear", "ease-in", "ease-out", "ease-in-out"] },
      mode: { type: "string", enum: ["steps", "distance", "smooth"] },
      spine: { description: 'Spine control points [{x,y}] or "straight".' },
      startFill: { type: "string" },
      endFill: { type: "string" },
      startScale: { type: "number" },
      endScale: { type: "number" },
      startOpacity: { type: "number" },
      endOpacity: { type: "number" },
      startRotation: { type: "number" },
      endRotation: { type: "number" },
      interpolatePath: { type: "boolean" },
      interpolateFill: { type: "boolean" },
      showEndpoints: { type: "boolean" },
    },
    required: ["layerId"],
  } satisfies JsonSchema,

  async handler(input: Record<string, unknown>, context: McpToolContext): Promise<McpToolResult> {
    const layerId = input.layerId as string;
    const layer = context.layers.get(layerId);
    if (!layer) return errorResult(`Layer '${layerId}' not found.`);
    if (layer.type !== "shapes:blend")
      return errorResult(`Layer '${layerId}' is not a shapes:blend layer.`);

    const updates: Record<string, unknown> = {};

    // Simple numeric/boolean properties
    for (const key of ["steps", "easing", "mode", "interpolatePath", "interpolateFill", "showEndpoints"]) {
      if (input[key] !== undefined) updates[key] = input[key];
    }

    // Start endpoint patches
    if (input.startFill !== undefined || input.startScale !== undefined || input.startOpacity !== undefined || input.startRotation !== undefined) {
      const start = JSON.parse(layer.properties.start as string) as BlendEndpoint;
      if (input.startFill !== undefined) start.fill = input.startFill as string;
      if (input.startScale !== undefined) start.scale = input.startScale as number;
      if (input.startOpacity !== undefined) start.opacity = input.startOpacity as number;
      if (input.startRotation !== undefined) start.rotation = input.startRotation as number;
      updates.start = JSON.stringify(start);
    }

    // End endpoint patches
    if (input.endFill !== undefined || input.endScale !== undefined || input.endOpacity !== undefined || input.endRotation !== undefined) {
      const end = JSON.parse(layer.properties.end as string) as BlendEndpoint;
      if (input.endFill !== undefined) end.fill = input.endFill as string;
      if (input.endScale !== undefined) end.scale = input.endScale as number;
      if (input.endOpacity !== undefined) end.opacity = input.endOpacity as number;
      if (input.endRotation !== undefined) end.rotation = input.endRotation as number;
      updates.end = JSON.stringify(end);
    }

    // Spine
    if (input.spine !== undefined) {
      if (input.spine === "straight") {
        updates.spine = JSON.stringify({ type: "straight" });
      } else {
        const spinePoints = input.spine as Array<{ x: number; y: number }>;
        updates.spine = JSON.stringify({ type: "path", points: spinePoints });
      }
    }

    if (Object.keys(updates).length === 0) return errorResult("No properties to update.");
    context.layers.updateProperties(layerId, updates as Partial<LayerProperties>);
    context.emitChange("layer-updated");
    return textResult(`Updated shapes:blend layer '${layerId}'.`);
  },
};

export const shapeMcpTools: McpToolDefinition[] = [
  addShapeTool,
  setShapeStyleTool,
  setPolygonTool,
  addLineTool,
  listShapesTool,
  blendShapesTool,
  updateBlendTool,
];
