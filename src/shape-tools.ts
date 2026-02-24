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

export const shapeMcpTools: McpToolDefinition[] = [
  addShapeTool,
  setShapeStyleTool,
  setPolygonTool,
  addLineTool,
  listShapesTool,
];
