import type { DesignPlugin, PluginContext } from "@genart-dev/core";
import { rectLayerType } from "./rect.js";
import { ellipseLayerType } from "./ellipse.js";
import { lineLayerType } from "./line.js";
import { polygonLayerType } from "./polygon.js";
import { starLayerType } from "./star.js";
import { shapeMcpTools } from "./shape-tools.js";

const shapesPlugin: DesignPlugin = {
  id: "shapes",
  name: "Shapes",
  version: "0.1.0",
  tier: "free",
  description: "Shape layers: rectangle, ellipse, line, polygon, star.",

  layerTypes: [
    rectLayerType,
    ellipseLayerType,
    lineLayerType,
    polygonLayerType,
    starLayerType,
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
export { shapeMcpTools } from "./shape-tools.js";
