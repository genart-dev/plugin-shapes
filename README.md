# @genart-dev/plugin-shapes

Shape design layer plugin for [genart.dev](https://genart.dev) — overlay rectangles, ellipses, lines, polygons, and stars on any sketch. Shapes are positioned, styled, and composited as design layers. Includes MCP tools for AI-agent control.

Part of [genart.dev](https://genart.dev) — a generative art platform with an MCP server, desktop app, and IDE extensions.

## Install

```bash
npm install @genart-dev/plugin-shapes
```

## Usage

```typescript
import shapesPlugin from "@genart-dev/plugin-shapes";
import { createDefaultRegistry } from "@genart-dev/core";

const registry = createDefaultRegistry();
registry.registerPlugin(shapesPlugin);

// Or access individual layer types
import {
  rectLayerType,
  ellipseLayerType,
  lineLayerType,
  polygonLayerType,
  starLayerType,
  shapeMcpTools,
} from "@genart-dev/plugin-shapes";
```

## Shape Layers (5)

All shape layers share common fill and stroke properties. Position and size are set via the layer transform (`x`, `y`, `width`, `height`).

### Common Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `fillColor` | color | `"#ffffff"` | Fill color |
| `fillEnabled` | boolean | `true` | Enable fill |
| `strokeColor` | color | `"#000000"` | Stroke color |
| `strokeWidth` | number | `0` | Stroke width in pixels |
| `strokeEnabled` | boolean | `false` | Enable stroke |

### Rectangle (`shapes:rect`)

Axis-aligned rectangle with optional corner radius.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `cornerRadius` | number | `0` | Corner radius in pixels (0 = sharp) |

### Ellipse (`shapes:ellipse`)

Ellipse or circle. Set equal width/height for a circle.

*(Common properties only — no additional properties.)*

### Line (`shapes:line`)

Straight line from one point to another.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `x1` | number | `0` | Start X |
| `y1` | number | `0` | Start Y |
| `x2` | number | `100` | End X |
| `y2` | number | `100` | End Y |
| `lineWidth` | number | `2` | Line width in pixels |
| `color` | color | `"#ffffff"` | Line color |
| `lineCap` | select | `"round"` | `"butt"`, `"round"`, `"square"` |

### Polygon (`shapes:polygon`)

Regular polygon with N sides, centered in the layer transform bounds.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `sides` | number | `6` | Number of sides (3–20) |
| `rotation` | number | `0` | Rotation offset in degrees |

### Star (`shapes:star`)

N-pointed star, centered in the layer transform bounds.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `points` | number | `5` | Number of points (3–20) |
| `innerRadius` | number | `0.4` | Inner radius relative to outer (0–1) |
| `rotation` | number | `0` | Rotation offset in degrees |

## MCP Tools (5)

Exposed to AI agents through the MCP server when this plugin is registered:

| Tool | Description |
|------|-------------|
| `add_shape` | Add a shape layer (rect, ellipse, polygon, or star) |
| `set_shape_style` | Update fill/stroke properties on an existing shape layer |
| `set_polygon` | Set the number of sides on a polygon layer |
| `add_line` | Add a line layer between two points |
| `list_shapes` | List all available shape layer types |

## Related Packages

| Package | Purpose |
|---------|---------|
| [`@genart-dev/core`](https://github.com/genart-dev/core) | Plugin host, layer system (dependency) |
| [`@genart-dev/mcp-server`](https://github.com/genart-dev/mcp-server) | MCP server that surfaces plugin tools to AI agents |

## Support

Questions, bugs, or feedback — [support@genart.dev](mailto:support@genart.dev) or [open an issue](https://github.com/genart-dev/plugin-shapes/issues).

## License

MIT
