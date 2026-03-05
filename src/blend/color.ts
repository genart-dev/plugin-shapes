/** Oklab color interpolation for perceptually uniform blending. */

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return [r, g, b];
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v * 255)));
  return `#${clamp(r).toString(16).padStart(2, "0")}${clamp(g).toString(16).padStart(2, "0")}${clamp(b).toString(16).padStart(2, "0")}`;
}

function linearize(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function delinearize(c: number): number {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

function linearRgbToOklab(r: number, g: number, b: number): [number, number, number] {
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  const lc = Math.cbrt(l);
  const mc = Math.cbrt(m);
  const sc = Math.cbrt(s);

  return [
    0.2104542553 * lc + 0.7936177850 * mc - 0.0040720468 * sc,
    1.9779984951 * lc - 2.4285922050 * mc + 0.4505937099 * sc,
    0.0259040371 * lc + 0.7827717662 * mc - 0.8086757660 * sc,
  ];
}

function oklabToLinearRgb(L: number, a: number, b: number): [number, number, number] {
  const lc = L + 0.3963377774 * a + 0.2158037573 * b;
  const mc = L - 0.1055613458 * a - 0.0638541728 * b;
  const sc = L - 0.0894841775 * a - 1.2914855480 * b;

  const l = lc * lc * lc;
  const m = mc * mc * mc;
  const s = sc * sc * sc;

  return [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  ];
}

export function hexToOklab(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex);
  return linearRgbToOklab(linearize(r), linearize(g), linearize(b));
}

export function oklabToHex(lab: [number, number, number]): string {
  const [r, g, b] = oklabToLinearRgb(lab[0], lab[1], lab[2]);
  return rgbToHex(delinearize(r), delinearize(g), delinearize(b));
}

export function interpolateColor(colorA: string, colorB: string, t: number): string {
  const labA = hexToOklab(colorA);
  const labB = hexToOklab(colorB);
  const lab: [number, number, number] = [
    labA[0] + (labB[0] - labA[0]) * t,
    labA[1] + (labB[1] - labA[1]) * t,
    labA[2] + (labB[2] - labA[2]) * t,
  ];
  return oklabToHex(lab);
}

/** Perceptual color distance in Oklab (approximate ΔE). */
export function colorDistance(colorA: string, colorB: string): number {
  const labA = hexToOklab(colorA);
  const labB = hexToOklab(colorB);
  const dL = labB[0] - labA[0];
  const da = labB[1] - labA[1];
  const db = labB[2] - labA[2];
  return Math.sqrt(dL * dL + da * da + db * db);
}
