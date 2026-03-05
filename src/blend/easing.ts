export type EasingName = "linear" | "ease-in" | "ease-out" | "ease-in-out";

export function applyEasing(t: number, easing: EasingName): number {
  switch (easing) {
    case "linear":
      return t;
    case "ease-in":
      return t * t * t;
    case "ease-out":
      return 1 - Math.pow(1 - t, 3);
    case "ease-in-out":
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
}
