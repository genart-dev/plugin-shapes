import { describe, it, expect, vi } from "vitest";
import shapesPlugin from "../src/index.js";
import { rectLayerType } from "../src/rect.js";
import { ellipseLayerType } from "../src/ellipse.js";
import { lineLayerType } from "../src/line.js";
import { polygonLayerType } from "../src/polygon.js";
import { starLayerType } from "../src/star.js";
import { polygonPoints } from "../src/polygon.js";
import { starPoints } from "../src/star.js";
import type { LayerBounds, RenderResources } from "@genart-dev/core";

const BOUNDS: LayerBounds = {
  x: 0,
  y: 0,
  width: 200,
  height: 200,
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
};

const RESOURCES: RenderResources = {
  getFont: () => null,
  getImage: () => null,
  theme: "dark",
  pixelRatio: 1,
};

function createMockCtx() {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    rect: vi.fn(),
    roundRect: vi.fn(),
    ellipse: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    setLineDash: vi.fn(),
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 0,
    lineCap: "" as CanvasLineCap,
  } as unknown as CanvasRenderingContext2D;
}

describe("shapes plugin", () => {
  it("exports a valid DesignPlugin", () => {
    expect(shapesPlugin.id).toBe("shapes");
    expect(shapesPlugin.tier).toBe("free");
    expect(shapesPlugin.layerTypes).toHaveLength(5);
    expect(shapesPlugin.mcpTools).toHaveLength(5);
  });

  it("all layer types have unique typeIds", () => {
    const ids = shapesPlugin.layerTypes.map((t) => t.typeId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("rectLayerType", () => {
  it("renders a rectangle", () => {
    const ctx = createMockCtx();
    rectLayerType.render(rectLayerType.createDefault(), ctx, BOUNDS, RESOURCES);
    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.rect).toHaveBeenCalledWith(0, 0, 200, 200);
    expect(ctx.fill).toHaveBeenCalled();
  });

  it("renders a rounded rect when cornerRadius > 0", () => {
    const ctx = createMockCtx();
    const props = { ...rectLayerType.createDefault(), cornerRadius: 10 };
    rectLayerType.render(props, ctx, BOUNDS, RESOURCES);
    expect(ctx.roundRect).toHaveBeenCalledWith(0, 0, 200, 200, 10);
  });

  it("renders SVG", () => {
    const svg = rectLayerType.renderSVG!(rectLayerType.createDefault(), BOUNDS, RESOURCES);
    expect(svg).toContain("<rect");
    expect(svg).toContain('width="200"');
  });

  it("validates corner radius", () => {
    expect(rectLayerType.validate({ ...rectLayerType.createDefault(), cornerRadius: -5 })).not.toBeNull();
    expect(rectLayerType.validate(rectLayerType.createDefault())).toBeNull();
  });
});

describe("ellipseLayerType", () => {
  it("renders an ellipse", () => {
    const ctx = createMockCtx();
    ellipseLayerType.render(ellipseLayerType.createDefault(), ctx, BOUNDS, RESOURCES);
    expect(ctx.ellipse).toHaveBeenCalledWith(100, 100, 100, 100, 0, 0, Math.PI * 2);
  });

  it("renders SVG", () => {
    const svg = ellipseLayerType.renderSVG!(ellipseLayerType.createDefault(), BOUNDS, RESOURCES);
    expect(svg).toContain("<ellipse");
    expect(svg).toContain('cx="100"');
  });
});

describe("lineLayerType", () => {
  it("renders a line", () => {
    const ctx = createMockCtx();
    lineLayerType.render(lineLayerType.createDefault(), ctx, BOUNDS, RESOURCES);
    expect(ctx.moveTo).toHaveBeenCalledWith(0, 0);
    expect(ctx.lineTo).toHaveBeenCalledWith(200, 200);
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it("sets dash pattern", () => {
    const ctx = createMockCtx();
    const props = { ...lineLayerType.createDefault(), dashPattern: "5,3" };
    lineLayerType.render(props, ctx, BOUNDS, RESOURCES);
    expect(ctx.setLineDash).toHaveBeenCalledWith([5, 3]);
  });

  it("validates stroke width", () => {
    expect(lineLayerType.validate({ ...lineLayerType.createDefault(), strokeWidth: 0 })).not.toBeNull();
    expect(lineLayerType.validate(lineLayerType.createDefault())).toBeNull();
  });
});

describe("polygonLayerType", () => {
  it("renders a hexagon by default", () => {
    const ctx = createMockCtx();
    polygonLayerType.render(polygonLayerType.createDefault(), ctx, BOUNDS, RESOURCES);
    expect(ctx.moveTo).toHaveBeenCalled();
    // 6 sides = 1 moveTo + 5 lineTo
    expect(ctx.lineTo).toHaveBeenCalledTimes(5);
    expect(ctx.closePath).toHaveBeenCalled();
  });

  it("generates correct number of polygon points", () => {
    const pts = polygonPoints(100, 100, 50, 6, 0);
    expect(pts).toHaveLength(6);
  });

  it("validates sides range", () => {
    expect(polygonLayerType.validate({ ...polygonLayerType.createDefault(), sides: 2 })).not.toBeNull();
    expect(polygonLayerType.validate(polygonLayerType.createDefault())).toBeNull();
  });
});

describe("starLayerType", () => {
  it("renders a 5-pointed star by default", () => {
    const ctx = createMockCtx();
    starLayerType.render(starLayerType.createDefault(), ctx, BOUNDS, RESOURCES);
    expect(ctx.moveTo).toHaveBeenCalled();
    // 5 points = 10 vertices, 1 moveTo + 9 lineTo
    expect(ctx.lineTo).toHaveBeenCalledTimes(9);
    expect(ctx.closePath).toHaveBeenCalled();
  });

  it("generates correct star vertices", () => {
    const pts = starPoints(100, 100, 50, 0.4, 5, 0);
    expect(pts).toHaveLength(10); // 5 outer + 5 inner
  });

  it("validates points and inner radius", () => {
    expect(starLayerType.validate({ ...starLayerType.createDefault(), points: 2 })).not.toBeNull();
    expect(starLayerType.validate({ ...starLayerType.createDefault(), innerRadius: 0 })).not.toBeNull();
    expect(starLayerType.validate(starLayerType.createDefault())).toBeNull();
  });
});
