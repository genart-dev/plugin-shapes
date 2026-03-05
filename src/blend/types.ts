export interface BlendEndpoint {
  /** Path vertices normalized 0–1, or named primitive string */
  path: Array<{ x: number; y: number }> | string;
  fill: string | null;
  stroke: string | null;
  strokeWidth: number;
  opacity: number;
  scale: number;
  rotation: number;
}

export interface BlendSettings {
  mode: "steps" | "distance" | "smooth";
  steps: number;
  distance: number;
  easing: "linear" | "ease-in" | "ease-out" | "ease-in-out";
  interpolate: {
    path: boolean;
    fill: boolean;
    stroke: boolean;
    strokeWidth: boolean;
    opacity: boolean;
    scale: boolean;
    rotation: boolean;
  };
}

export interface BlendSpine {
  type: "straight" | "path";
  points?: Array<{ x: number; y: number }>;
}
