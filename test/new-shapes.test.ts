import { describe, it, expect, vi } from "vitest";
import { arcLayerType } from "../src/arc.js";
import { pathLayerType } from "../src/path.js";
import shapesPlugin from "../src/index.js";
import type { LayerBounds, RenderResources, McpToolContext, DesignLayer } from "@genart-dev/core";

const BOUNDS: LayerBounds = { x: 0, y: 0, width: 200, height: 200, rotation: 0, scaleX: 1, scaleY: 1 };
const RESOURCES: RenderResources = { getFont: () => null, getImage: () => null, theme: "dark", pixelRatio: 1 };

function createMockCtx() {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    bezierCurveTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
  } as unknown as CanvasRenderingContext2D;
}

function makeMockToolContext(): McpToolContext {
  return {
    layers: {
      add: vi.fn(),
      get: vi.fn(),
      updateProperties: vi.fn(),
    },
    canvasWidth: 800,
    canvasHeight: 600,
    emitChange: vi.fn(),
  } as unknown as McpToolContext;
}

// ---------------------------------------------------------------------------
// Arc / Sector
// ---------------------------------------------------------------------------
describe("shapes:arc", () => {
  it("has correct metadata", () => {
    expect(arcLayerType.typeId).toBe("shapes:arc");
    expect(arcLayerType.category).toBe("shape");
  });

  it("creates defaults", () => {
    const d = arcLayerType.createDefault();
    expect(d.startAngle).toBe(0);
    expect(d.endAngle).toBe(270);
    expect(d.innerRadius).toBe(0);
    expect(d.closePath).toBe(true);
  });

  it("renders a pie sector (no inner radius)", () => {
    const ctx = createMockCtx();
    arcLayerType.render(arcLayerType.createDefault(), ctx, BOUNDS, RESOURCES);
    expect(ctx.save).toHaveBeenCalled();
    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.arc).toHaveBeenCalledTimes(1);
    expect(ctx.closePath).toHaveBeenCalled();
    expect(ctx.fill).toHaveBeenCalled();
    expect(ctx.restore).toHaveBeenCalled();
  });

  it("renders an annular sector (with inner radius)", () => {
    const ctx = createMockCtx();
    arcLayerType.render(
      { ...arcLayerType.createDefault(), innerRadius: 0.5 },
      ctx, BOUNDS, RESOURCES,
    );
    // Should draw two arcs (outer + inner)
    expect(ctx.arc).toHaveBeenCalledTimes(2);
  });

  it("renders with stroke when enabled", () => {
    const ctx = createMockCtx();
    arcLayerType.render(
      { ...arcLayerType.createDefault(), strokeEnabled: true, strokeWidth: 2 },
      ctx, BOUNDS, RESOURCES,
    );
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it("validate accepts valid innerRadius", () => {
    expect(arcLayerType.validate({ innerRadius: 0.5 })).toBeNull();
  });

  it("validate rejects innerRadius >= 1", () => {
    const errors = arcLayerType.validate({ innerRadius: 1.0 });
    expect(errors).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Path
// ---------------------------------------------------------------------------
describe("shapes:path", () => {
  it("has correct metadata", () => {
    expect(pathLayerType.typeId).toBe("shapes:path");
    expect(pathLayerType.category).toBe("shape");
  });

  it("creates defaults with path data", () => {
    const d = pathLayerType.createDefault();
    expect(typeof d.d).toBe("string");
    expect((d.d as string).length).toBeGreaterThan(0);
    expect(d.scaleToFit).toBe(true);
  });

  it("renders M/L/Z commands", () => {
    const ctx = createMockCtx();
    pathLayerType.render(
      { ...pathLayerType.createDefault(), d: "M 0 0 L 100 0 L 100 100 Z" },
      ctx, BOUNDS, RESOURCES,
    );
    expect(ctx.moveTo).toHaveBeenCalled();
    expect(ctx.lineTo).toHaveBeenCalled();
    expect(ctx.closePath).toHaveBeenCalled();
    expect(ctx.fill).toHaveBeenCalled();
  });

  it("renders C (cubic Bezier) commands", () => {
    const ctx = createMockCtx();
    pathLayerType.render(
      { ...pathLayerType.createDefault(), d: "M 0 0 C 10 20 30 40 50 60" },
      ctx, BOUNDS, RESOURCES,
    );
    expect(ctx.bezierCurveTo).toHaveBeenCalled();
  });

  it("renders Q (quadratic Bezier) commands", () => {
    const ctx = createMockCtx();
    pathLayerType.render(
      { ...pathLayerType.createDefault(), d: "M 0 0 Q 50 100 100 0" },
      ctx, BOUNDS, RESOURCES,
    );
    expect(ctx.quadraticCurveTo).toHaveBeenCalled();
  });

  it("skips empty path data", () => {
    const ctx = createMockCtx();
    pathLayerType.render(
      { ...pathLayerType.createDefault(), d: "" },
      ctx, BOUNDS, RESOURCES,
    );
    expect(ctx.beginPath).not.toHaveBeenCalled();
  });

  it("validate accepts valid path", () => {
    expect(pathLayerType.validate({ d: "M 0 0 L 100 100" })).toBeNull();
  });

  it("validate rejects path without commands", () => {
    const errors = pathLayerType.validate({ d: "123 456 789" });
    expect(errors).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// add_path MCP tool
// ---------------------------------------------------------------------------
describe("add_path tool", () => {
  it("creates a path layer", async () => {
    const ctx = makeMockToolContext();
    const tool = shapesPlugin.mcpTools.find((t) => t.name === "add_path")!;
    expect(tool).toBeDefined();
    const result = await tool.handler({ d: "M 0 0 L 100 100 L 0 100 Z" }, ctx);
    expect(result.isError).toBeFalsy();
    expect(ctx.layers.add).toHaveBeenCalled();
  });

  it("rejects empty path data", async () => {
    const ctx = makeMockToolContext();
    const tool = shapesPlugin.mcpTools.find((t) => t.name === "add_path")!;
    const result = await tool.handler({ d: "" }, ctx);
    expect(result.isError).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// add_shape with arc type
// ---------------------------------------------------------------------------
describe("add_shape with arc", () => {
  it("creates an arc layer via add_shape", async () => {
    const ctx = makeMockToolContext();
    const tool = shapesPlugin.mcpTools.find((t) => t.name === "add_shape")!;
    const result = await tool.handler({ shape: "arc", startAngle: 0, endAngle: 180 }, ctx);
    expect(result.isError).toBeFalsy();
    expect(ctx.layers.add).toHaveBeenCalled();
  });
});
