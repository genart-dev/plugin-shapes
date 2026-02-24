import { describe, it, expect, vi } from "vitest";
import {
  addShapeTool,
  setShapeStyleTool,
  setPolygonTool,
  addLineTool,
  listShapesTool,
} from "../src/shape-tools.js";
import type {
  McpToolContext,
  DesignLayer,
  LayerStackAccessor,
} from "@genart-dev/core";

function createMockLayer(overrides: Partial<DesignLayer> = {}): DesignLayer {
  return {
    id: "layer-1",
    type: "shapes:rect",
    name: "Rectangle",
    visible: true,
    locked: false,
    opacity: 1,
    blendMode: "normal",
    transform: {
      x: 100, y: 100, width: 200, height: 200,
      rotation: 0, scaleX: 1, scaleY: 1, anchorX: 0.5, anchorY: 0.5,
    },
    properties: { fillColor: "#ffffff", fillEnabled: true },
    ...overrides,
  };
}

function createMockContext(layers: DesignLayer[] = []): McpToolContext {
  const layerMap = new Map(layers.map((l) => [l.id, l]));

  const accessor: LayerStackAccessor = {
    getAll: () => layers,
    get: (id: string) => layerMap.get(id) ?? null,
    add: vi.fn((layer: DesignLayer) => {
      layers.push(layer);
      layerMap.set(layer.id, layer);
    }),
    remove: vi.fn(),
    updateProperties: vi.fn(),
    updateTransform: vi.fn(),
    updateBlend: vi.fn(),
    reorder: vi.fn(),
    duplicate: vi.fn(() => "dup-id"),
    count: layers.length,
  };

  return {
    layers: accessor,
    sketchState: {
      seed: 42, params: {}, colorPalette: [],
      canvasWidth: 800, canvasHeight: 600, rendererId: "canvas2d",
    },
    canvasWidth: 800,
    canvasHeight: 600,
    resolveAsset: vi.fn(async () => null),
    captureComposite: vi.fn(async () => Buffer.from("")),
    emitChange: vi.fn(),
  };
}

describe("add_shape tool", () => {
  it("adds a rect layer", async () => {
    const ctx = createMockContext();
    const result = await addShapeTool.handler(
      { shape: "rect", x: 50, y: 50, fillColor: "#ff0000" },
      ctx,
    );
    expect(result.isError).toBeUndefined();
    const layer = (ctx.layers.add as ReturnType<typeof vi.fn>).mock.calls[0]![0] as DesignLayer;
    expect(layer.type).toBe("shapes:rect");
    expect(layer.properties.fillColor).toBe("#ff0000");
    expect(layer.transform.x).toBe(50);
  });

  it("adds a star layer with custom points", async () => {
    const ctx = createMockContext();
    await addShapeTool.handler({ shape: "star", points: 8 }, ctx);
    const layer = (ctx.layers.add as ReturnType<typeof vi.fn>).mock.calls[0]![0] as DesignLayer;
    expect(layer.type).toBe("shapes:star");
    expect(layer.properties.points).toBe(8);
  });

  it("rejects unknown shape", async () => {
    const ctx = createMockContext();
    const result = await addShapeTool.handler({ shape: "hexaflop" }, ctx);
    expect(result.isError).toBe(true);
  });
});

describe("set_shape_style tool", () => {
  it("updates shape style", async () => {
    const layer = createMockLayer();
    const ctx = createMockContext([layer]);
    const result = await setShapeStyleTool.handler(
      { layerId: "layer-1", fillColor: "#00ff00", strokeWidth: 3, strokeEnabled: true },
      ctx,
    );
    expect(result.isError).toBeUndefined();
    expect(ctx.layers.updateProperties).toHaveBeenCalledWith("layer-1", {
      fillColor: "#00ff00",
      strokeWidth: 3,
      strokeEnabled: true,
    });
  });

  it("rejects non-shape layer", async () => {
    const layer = createMockLayer({ type: "typography:text" });
    const ctx = createMockContext([layer]);
    const result = await setShapeStyleTool.handler(
      { layerId: "layer-1", fillColor: "#ff0000" },
      ctx,
    );
    expect(result.isError).toBe(true);
  });
});

describe("set_polygon tool", () => {
  it("updates polygon sides", async () => {
    const layer = createMockLayer({ type: "shapes:polygon" });
    const ctx = createMockContext([layer]);
    const result = await setPolygonTool.handler(
      { layerId: "layer-1", sides: 8 },
      ctx,
    );
    expect(result.isError).toBeUndefined();
    expect(ctx.layers.updateProperties).toHaveBeenCalledWith("layer-1", { sides: 8 });
  });
});

describe("add_line tool", () => {
  it("creates a line layer", async () => {
    const ctx = createMockContext();
    const result = await addLineTool.handler(
      { x1: 10, y1: 20, x2: 300, y2: 400, strokeColor: "#00ff00" },
      ctx,
    );
    expect(result.isError).toBeUndefined();
    const layer = (ctx.layers.add as ReturnType<typeof vi.fn>).mock.calls[0]![0] as DesignLayer;
    expect(layer.type).toBe("shapes:line");
    expect(layer.transform.x).toBe(10);
    expect(layer.properties.strokeColor).toBe("#00ff00");
  });
});

describe("list_shapes tool", () => {
  it("lists all shape types", async () => {
    const ctx = createMockContext();
    const result = await listShapesTool.handler({}, ctx);
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain("Rectangle");
    expect(text).toContain("Ellipse");
    expect(text).toContain("Line");
    expect(text).toContain("Polygon");
    expect(text).toContain("Star");
  });
});
