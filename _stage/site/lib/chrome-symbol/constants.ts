export const CHROME_SYMBOL_DEFAULTS = {
  depth: 0.09,
  bevel: 0.032,
  roughness: 0.265,
  yaw: 0,
  pitch: 0,
  sway: 4.5,
  speed: 0,
  fit: 1.125,
  parallax: 1.25,
  exposure: 1.05,
  keyAzimuth: 0,
  keyElevation: 34,
  fillAzimuth: 118,
  fillElevation: 8,
  tintR: 0.95,
  tintG: 0.955,
  tintB: 0.97,
};

export type ChromeParams = typeof CHROME_SYMBOL_DEFAULTS;

/** The intro: the symbol extrudes, blends from its "from" look to the defaults, then spins until landed. */
export const CHROME_SYMBOL_INTRO = {
  from: { depth: 0.112, bevel: 0.044, roughness: 0.43, yaw: -90 },
  initialDelay: 0.12,
  depthDuration: 0.8,
  depthEase: [0, 0, 0, 1] as [number, number, number, number],
  blendDuration: 1.5,
  blendEase: [0.5, 0, 0, 1] as [number, number, number, number],
  spinPeriod: 2,
  landMinDuration: 0.6,
};

/** Signed-distance band (in glyph units) kept around the outline. */
export const FIELD_BAND = 0.09;
export const FIELD_PADDING = 0.28;
export const FIELD_PIXELS_PER_UNIT = 384;

export type ShapePath = { d: string; fillRule?: "evenodd" | "nonzero"; offset?: [number, number] };
export type Shape = { viewBox: [number, number, number, number]; paths: ShapePath[] };
