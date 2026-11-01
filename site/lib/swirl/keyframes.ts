import { hexToRgba, METALLIC_SWIRL_DEFAULTS, type SwirlParams } from "./metallic-swirl";

// The swirl behind the white band morphs through these looks as the page scrolls:
// band top -> capabilities -> proprietary investments -> infrastructure -> band bottom.
export const SWIRL_BASE = {
  speed: 0,
  initialTime: 0,
  zoom: 2.1,
  iterations: 2,
  sampleGap: 0.14,
  tangentForce: 0.83,
  gradientForce: 0.27,
  centerX: 0.17,
  centerY: 0.95,
  radialMix: 0,
  beams: 5,
  beamWidth: 0.62,
  radialStretch: 1.46,
  radialFlow: 2,
  radialSpin: -0.3,
  twist: -0.19,
  vortex: -0.55,
  hole: 0.16,
  colorMode: "stripes",
  colorA: "#a8d2ff",
  colorB: "#00000000",
  colorC: "#dfeaff00",
  tintColor: "#ffffff00",
  softness: 0.7,
  shiftRed: 0.3,
  shiftBlue: 0.2,
  repetition: 3,
  stripeFlow: 0.56,
  spread: 0.03,
  brightness: 1,
  contrast: 1,
  vignette: 0,
  detailFade: 1,
  backgroundColor: "#00000000",
  opacity: 1,
  fadeTop: 0.5,
  fadeBottom: 0.5,
  threshold: 0.69,
};

export const SWIRL_KEYFRAMES: SwirlParams[] = [
  SWIRL_BASE,
  {
    speed: 0,
    initialTime: 0,
    zoom: 2.11,
    iterations: 2,
    sampleGap: 0.14,
    tangentForce: 0.83,
    gradientForce: 0.27,
    centerX: 0.17,
    centerY: 0.45,
    radialMix: 0,
    beams: 5,
    beamWidth: 1,
    radialStretch: 0.69,
    radialFlow: -2.07,
    radialSpin: -0.3,
    twist: -0.19,
    vortex: -0.55,
    hole: 0,
    colorMode: "stripes",
    colorA: "#a8d2ff",
    colorB: "#00000000",
    colorC: "#dfeaff00",
    tintColor: "#ffffff00",
    softness: 0.31,
    shiftRed: 0.3,
    shiftBlue: 0.2,
    repetition: 1.9,
    stripeFlow: 0.99,
    spread: 0.02,
    brightness: 1,
    contrast: 1,
    vignette: 0,
    detailFade: 1,
    backgroundColor: "#00000000",
    opacity: 1,
    fadeTop: 0.5,
    fadeBottom: 0.5,
  },
  {
    speed: 0,
    initialTime: 0,
    zoom: 0.25,
    iterations: 2,
    sampleGap: 0.147,
    tangentForce: 0.83,
    gradientForce: 0.2,
    centerX: 0.5,
    centerY: 0.59,
    radialMix: 0.39,
    beams: 5,
    beamWidth: 0.84,
    radialStretch: 1.3,
    radialFlow: -2.07,
    radialSpin: -0.3,
    twist: 0.12,
    vortex: -0.52,
    hole: 1,
    colorMode: "stripes",
    colorA: "#a8d2ff",
    colorB: "#00000000",
    colorC: "#dfeaff00",
    tintColor: "#ffffff00",
    softness: 0.31,
    shiftRed: 0.3,
    shiftBlue: 0.2,
    repetition: 3.5,
    stripeFlow: 0.99,
    spread: 0.02,
    brightness: 0.14,
    contrast: 1,
    vignette: 0,
    detailFade: 1,
    backgroundColor: "#00000000",
    opacity: 1,
    fadeTop: 0.5,
    fadeBottom: 0.5,
  },
  {
    speed: 0.1,
    initialTime: 0,
    zoom: 2,
    iterations: 3,
    sampleGap: 0.147,
    tangentForce: -1.2,
    gradientForce: 0.5,
    centerX: 0.5,
    centerY: 0.594,
    radialMix: 1,
    beams: 5,
    beamWidth: 1,
    radialStretch: 2,
    radialFlow: 1.91,
    radialSpin: -0.24,
    twist: -0,
    vortex: -0,
    hole: 1,
    colorMode: "stripes",
    colorA: "#ffffffff",
    colorB: "#00000000",
    colorC: "#dfeaff00",
    tintColor: "#ffffff00",
    softness: 0.41,
    shiftRed: -0.7,
    shiftBlue: -0.59,
    repetition: 1.14,
    stripeFlow: 0.99,
    spread: 0.02,
    brightness: 1,
    contrast: 1,
    vignette: 0,
    detailFade: 1,
    backgroundColor: "#00000000",
    opacity: 1,
    fadeTop: 0.5,
    fadeBottom: 0.5,
    threshold: 0.72,
  },
  {
    speed: 0,
    initialTime: 0,
    zoom: 2,
    iterations: 3,
    sampleGap: 0.147,
    tangentForce: -1.2,
    gradientForce: 0.5,
    centerX: 0.5,
    centerY: 1,
    radialMix: 1,
    beams: 5,
    beamWidth: 1,
    radialStretch: 2,
    radialFlow: 1.91,
    radialSpin: -0.24,
    twist: -0,
    vortex: -0,
    hole: 1,
    colorMode: "stripes",
    colorA: "#ffffffff",
    colorB: "#00000000",
    colorC: "#dfeaff00",
    tintColor: "#ffffff00",
    softness: 0.41,
    shiftRed: -0.7,
    shiftBlue: -0.59,
    repetition: 1.14,
    stripeFlow: 0.99,
    spread: 0.02,
    brightness: 1,
    contrast: 1,
    vignette: 0,
    detailFade: 1,
    backgroundColor: "#00000000",
    opacity: 1,
    fadeTop: 0.5,
    fadeBottom: 0.5,
    threshold: 0.72,
  },
].map((frame) => ({ ...METALLIC_SWIRL_DEFAULTS, ...frame }));

/** These numbers interpolate in log space (they scale multiplicatively). */
const GEOMETRIC_KEYS = new Set(["zoom", "repetition"]);

const toHexByte = (v: number) =>
  Math.round(255 * Math.min(Math.max(v, 0), 1))
    .toString(16)
    .padStart(2, "0");
const isHex = (v: unknown): v is string => typeof v === "string" && v.startsWith("#");

type Track = { values: number[]; tangents: number[] };

/** Monotone cubic (Fritsch–Carlson) tangents, so values never overshoot between keyframes. */
function monotoneTrack(values: number[]): Track {
  const n = values.length;
  const slopes = values.slice(0, -1).map((v, i) => values[i + 1] - v);
  const tangents = Array(n).fill(0);
  for (let i = 1; i < n - 1; i++) {
    tangents[i] = slopes[i - 1] * slopes[i] <= 0 ? 0 : (slopes[i - 1] + slopes[i]) / 2;
  }
  for (let i = 0; i < n - 1; i++) {
    if (slopes[i] === 0) {
      tangents[i] = 0;
      tangents[i + 1] = 0;
      continue;
    }
    const a = tangents[i] / slopes[i];
    const b = tangents[i + 1] / slopes[i];
    const s = a * a + b * b;
    if (s > 9) {
      const k = 3 / Math.sqrt(s);
      tangents[i] = k * a * slopes[i];
      tangents[i + 1] = k * b * slopes[i];
    }
  }
  return { values, tangents };
}

function hermite({ values, tangents }: Track, position: number) {
  const last = values.length - 1;
  const x = Math.min(Math.max(position, 0), last);
  const i = Math.min(Math.floor(x), last - 1);
  const t = x - i;
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    (2 * t3 - 3 * t2 + 1) * values[i] +
    (t3 - 2 * t2 + t) * tangents[i] +
    (-2 * t3 + 3 * t2) * values[i + 1] +
    (t3 - t2) * tangents[i + 1]
  );
}

/** Returns params at a fractional keyframe position (0 = first keyframe). */
export function createInterpolator(frames: SwirlParams[]) {
  if (frames.length < 2) throw Error("need at least two keyframes");
  const numeric = new Map<string, { track: Track; geometric: boolean }>();
  const colours = new Map<string, Track[]>();
  const stepped: string[] = [];
  for (const key of Object.keys(frames[0])) {
    const values = frames.map((f) => (f as Record<string, unknown>)[key]);
    if (values.every((v) => typeof v === "number")) {
      const nums = values as number[];
      const geometric = GEOMETRIC_KEYS.has(key) && nums.every((v) => v > 0);
      numeric.set(key, { track: monotoneTrack(geometric ? nums.map(Math.log) : nums), geometric });
    } else if (values.every(isHex)) {
      const rgba = (values as string[]).map(hexToRgba);
      colours.set(
        key,
        [0, 1, 2, 3].map((c) => monotoneTrack(rgba.map((v) => v[c]))),
      );
    } else {
      stepped.push(key);
    }
  }
  return (position: number): SwirlParams => {
    const out: Record<string, unknown> = { ...frames[0] };
    for (const [key, { track, geometric }] of numeric) {
      const v = hermite(track, position);
      out[key] = geometric ? Math.exp(v) : v;
    }
    for (const [key, tracks] of colours) out[key] = `#${tracks.map((t) => toHexByte(hermite(t, position))).join("")}`;
    const nearest = frames[Math.min(Math.max(Math.round(position), 0), frames.length - 1)];
    for (const key of stepped) out[key] = (nearest as Record<string, unknown>)[key];
    return out as SwirlParams;
  };
}
