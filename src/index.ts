import type { DesignPlugin, PluginContext } from "@genart-dev/core";
import { rectLayerType } from "./rect.js";
import { ellipseLayerType } from "./ellipse.js";
import { lineLayerType } from "./line.js";
import { polygonLayerType } from "./polygon.js";
import { starLayerType } from "./star.js";
import { blendLayerType } from "./blend-layer.js";
import { shapeMcpTools } from "./shape-tools.js";

const shapesPlugin: DesignPlugin = {
  id: "shapes",
  name: "Shapes",
  version: "0.2.0",
  tier: "free",
  description: "Shape layers: rectangle, ellipse, line, polygon, star, blend.",

  layerTypes: [
    rectLayerType,
    ellipseLayerType,
    lineLayerType,
    polygonLayerType,
    starLayerType,
    blendLayerType,
  ],
  tools: [],
  exportHandlers: [],
  mcpTools: shapeMcpTools,

  async initialize(_context: PluginContext): Promise<void> {
    // No async setup needed for shapes
  },

  dispose(): void {
    // No resources to release
  },
};

export default shapesPlugin;
export { rectLayerType } from "./rect.js";
export { ellipseLayerType } from "./ellipse.js";
export { lineLayerType } from "./line.js";
export { polygonLayerType } from "./polygon.js";
export { starLayerType } from "./star.js";
export { blendLayerType } from "./blend-layer.js";
export { shapeMcpTools, blendShapesTool, updateBlendTool } from "./shape-tools.js";
export type { BlendEndpoint, BlendSettings, BlendSpine } from "./blend/types.js";
