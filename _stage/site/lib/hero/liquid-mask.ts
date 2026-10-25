// Builds the data textures for the hero "liquid" effect from the four hero
// strokes (the same curves as the fallback SVG). Pure maths, so it runs in a
// worker when possible (see mask.worker.ts) and on the main thread otherwise.

type Cubic = [number, number, number, number, number, number];
export type Branch = { start: [number, number]; curves: Cubic[]; gray: number };

/** The area of the 1440x810 viewBox that the mask covers. */
export const REGION = { x: -90, y: -90, width: 1620, height: 1192.5 };
export const VIEWBOX_WIDTH = 1440;
export const VIEWBOX_HEIGHT = 810;
export const STROKE_WIDTH = 151.074;
export const OVERFLOW_SCALE = 1.25;
export const CROP_ASPECT = 1;

export const BRANCHES: Branch[] = [
  {
    start: [-222.724, 504.473],
    curves: [
      [-222.724, 504.473, 304.862, 504.473, 749.059, 504.473],
      [1193.25, 504.473, 1176.74, 692.755, 1668, 692.755],
    ],
    gray: 32 / 255,
  },
  {
    start: [-222.724, 504.473],
    curves: [
      [-222.724, 504.473, 60.4716, 504.473, 504.668, 504.473],
      [948.864, 504.473, 1176.74, -52.4742, 1668, -52.4742],
    ],
    gray: 132 / 255,
  },
  {
    start: [-222.724, 504.473],
    curves: [
      [-222.724, 504.473, 304.862, 504.473, 749.059, 504.473],
      [1193.25, 504.473, 1176.74, 259.574, 1668, 259.574],
    ],
    gray: 56 / 255,
  },
  {
    start: [-223.057, 504.476],
    curves: [
      [-223.057, 504.476, -299.029, 504.476, 145.246, 504.476],
      [912.887, 504.476, 657.455, 924.491, 1668, 924.491],
    ],
    gray: 0,
  },
];

const MAX_GRAY = Math.max(...BRANCHES.map((b) => b.gray));
const CURVE_STEPS = 48;
const BLUR_RADIUS = 2;
const SOR_ITERATIONS = 40;
const SOR_OMEGA = 1.9;

/** Remap a branch grey so the darkest branch sits at `floor` instead of black. */
export function branchTone(gray: number, floor: number) {
  return floor + (gray / MAX_GRAY) * (MAX_GRAY - floor);
}

/** Sample a branch into a polyline with cumulative arc length. */
export function flattenBranch(branch: Branch) {
  const coords = [branch.start[0], branch.start[1]];
  let [x0, y0] = branch.start;
  for (const [c1x, c1y, c2x, c2y, x, y] of branch.curves) {
    for (let step = 1; step <= CURVE_STEPS; step++) {
      const t = step / CURVE_STEPS;
      const u = 1 - t;
      const a = u * u * u;
      const b = 3 * u * u * t;
      const c = 3 * u * t * t;
      const d = t * t * t;
      coords.push(a * x0 + b * c1x + c * c2x + d * x, a * y0 + b * c1y + c * c2y + d * y);
    }
    x0 = x;
    y0 = y;
  }
  const points = Float64Array.from(coords);
  const count = points.length / 2;
  const cumulative = new Float64Array(count);
  for (let i = 1; i < count; i++) {
    const dx = points[2 * i] - points[2 * i - 2];
    const dy = points[2 * i + 1] - points[2 * i - 1];
    cumulative[i] = cumulative[i - 1] + Math.hypot(dx, dy);
  }
  return { points, cumulative, total: cumulative[count - 1] };
}

export function buildBranchPath(branch: Branch) {
  const path = new Path2D();
  path.moveTo(branch.start[0], branch.start[1]);
  for (const [c1x, c1y, c2x, c2y, x, y] of branch.curves) path.bezierCurveTo(c1x, c1y, c2x, c2y, x, y);
  return path;
}

/** Rasterise one branch stroke; returns its coverage (alpha) per pixel. */
export type Rasterizer = (branch: Branch, width: number, height: number) => Uint8Array;

export function createRasterizer(
  createContext: (width: number, height: number) => CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
): Rasterizer {
  const contexts = new Map<number, CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D>();
  return (branch, width, height) => {
    let ctx = contexts.get(width);
    if (!ctx) {
      ctx = createContext(width, height);
      contexts.set(width, ctx);
    }
    const scale = width / REGION.width;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.setTransform(scale, 0, 0, scale, -REGION.x * scale, -REGION.y * scale);
    ctx.lineWidth = STROKE_WIDTH;
    ctx.lineCap = "butt";
    ctx.strokeStyle = "#fff";
    ctx.stroke(buildBranchPath(branch));
    const rgba = ctx.getImageData(0, 0, width, height).data;
    const alpha = new Uint8Array(width * height);
    for (let i = 0; i < alpha.length; i++) alpha[i] = rgba[4 * i + 3];
    return alpha;
  };
}

export type LiquidMaskOptions = { width: number; shadeFloor: number };
export type LiquidMask = {
  base: Uint8Array;
  meta: Uint8Array;
  width: number;
  height: number;
  field: Float32Array;
  fieldWidth: number;
  fieldHeight: number;
};

const heightFor = (width: number) => Math.round((width * REGION.height) / REGION.width);

/** For each pixel near the stroke: position along the branch (0..65535) of the closest point. */
function arcLengthMap(
  points: Float64Array,
  cumulative: Float64Array,
  total: number,
  width: number,
  height: number,
) {
  const scale = width / REGION.width;
  const offsetX = -REGION.x * scale;
  const offsetY = -REGION.y * scale;
  const reach = 75.537 * scale + 8;
  const bestDist = new Float32Array(width * height).fill(Infinity);
  const arc = new Uint16Array(width * height);
  for (let i = 1; i < cumulative.length; i++) {
    const ax = points[2 * i - 2] * scale + offsetX;
    const ay = points[2 * i - 1] * scale + offsetY;
    const bx = points[2 * i] * scale + offsetX;
    const by = points[2 * i + 1] * scale + offsetY;
    const dx = bx - ax;
    const dy = by - ay;
    const lenSq = dx * dx + dy * dy;
    const startArc = cumulative[i - 1] / total;
    const endArc = cumulative[i] / total;
    const minX = Math.max(0, Math.floor(Math.min(ax, bx) - reach));
    const maxX = Math.min(width - 1, Math.ceil(Math.max(ax, bx) + reach));
    const minY = Math.max(0, Math.floor(Math.min(ay, by) - reach));
    const maxY = Math.min(height - 1, Math.ceil(Math.max(ay, by) + reach));
    for (let y = minY; y <= maxY; y++) {
      const row = y * width;
      for (let x = minX; x <= maxX; x++) {
        const t = lenSq > 0 ? Math.min(Math.max(((x - ax) * dx + (y - ay) * dy) / lenSq, 0), 1) : 0;
        const px = x - (ax + t * dx);
        const py = y - (ay + t * dy);
        const dist = px * px + py * py;
        const index = row + x;
        if (dist < bestDist[index]) {
          bestDist[index] = dist;
          arc[index] = Math.round((startArc + (endArc - startArc) * t) * 65535);
        }
      }
    }
  }
  return arc;
}

/** Separable 5x5 box blur with clamped edges. */
function boxBlur(src: Uint8Array, width: number, height: number) {
  const r = BLUR_RADIUS;
  const tmp = new Float32Array(src.length);
  for (let y = 0; y < height; y++) {
    const row = y * width;
    let sum = 0;
    for (let k = -r; k <= r; k++) sum += src[row + Math.min(Math.max(k, 0), width - 1)];
    for (let x = 0; x < width; x++) {
      tmp[row + x] = sum / 5;
      sum += src[row + Math.min(x + r + 1, width - 1)] - src[row + Math.max(x - r, 0)];
    }
  }
  const out = new Uint8Array(src.length);
  for (let x = 0; x < width; x++) {
    let sum = 0;
    for (let k = -r; k <= r; k++) sum += tmp[Math.min(Math.max(k, 0), height - 1) * width + x];
    for (let y = 0; y < height; y++) {
      out[y * width + x] = Math.round(sum / 5);
      sum += tmp[Math.min(y + r + 1, height - 1) * width + x] - tmp[Math.max(y - r, 0) * width + x];
    }
  }
  return out;
}

/** Solve a Poisson "pillow" inside the shape (red-black SOR); higher in the middle of the stroke. */
function poissonField(inside: Uint8Array, width: number, height: number) {
  const red: number[] = [];
  const black: number[] = [];
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      if (
        inside[i] && inside[i - 1] && inside[i + 1] && inside[i - width] && inside[i + width] &&
        inside[i - width - 1] && inside[i - width + 1] && inside[i + width - 1] && inside[i + width + 1]
      ) {
        if (((x + y) & 1) === 0) red.push(i);
        else black.push(i);
      }
    }
  }
  const sets = [Uint32Array.from(red), Uint32Array.from(black)];
  const field = new Float32Array(width * height);
  for (let iter = 0; iter < SOR_ITERATIONS; iter++) {
    for (const set of sets) {
      for (let k = 0; k < set.length; k++) {
        const i = set[k];
        const avg = (0.01 + field[i - 1] + field[i + 1] + field[i - width] + field[i + width]) * 0.25;
        field[i] = SOR_OMEGA * avg + (1 - SOR_OMEGA) * field[i];
      }
    }
  }
  return field;
}

/** Normalise the pillow to 1 at the edge, 0 at the deepest point; 1 outside the shape. */
function normaliseField(field: Float32Array, inside: Uint8Array) {
  let max = 0;
  for (let i = 0; i < field.length; i++) if (field[i] > max) max = field[i];
  const out = new Float32Array(field.length).fill(1);
  if (max <= 0) return out;
  for (let i = 0; i < field.length; i++) if (inside[i]) out[i] = 1 - field[i] / max;
  return out;
}

export function buildLiquidMask({ width, shadeFloor }: LiquidMaskOptions, rasterize: Rasterizer): LiquidMask {
  const height = heightFor(width);
  const fieldWidth = Math.round(width / 2);
  const fieldHeight = heightFor(fieldWidth);
  // base: R = blurred coverage, G = coverage, B = tone.  meta: R = branch id, GB = arc position.
  const base = new Uint8Array(width * height * 4);
  const meta = new Uint8Array(width * height * 4);
  for (let i = 0; i < base.length; i += 4) {
    base[i + 3] = 255;
    meta[i + 3] = 255;
  }
  const field = new Float32Array(fieldWidth * fieldHeight).fill(1);

  for (let b = 0; b < BRANCHES.length; b++) {
    const branch = BRANCHES[b];
    const line = flattenBranch(branch);
    const coverage = rasterize(branch, width, height);
    const arc = arcLengthMap(line.points, line.cumulative, line.total, width, height);
    const blurred = boxBlur(coverage, width, height);

    const fieldCoverage = rasterize(branch, fieldWidth, fieldHeight);
    const inside = new Uint8Array(fieldCoverage.length);
    for (let i = 0; i < inside.length; i++) inside[i] = +(fieldCoverage[i] > 127);
    const pillow = normaliseField(poissonField(inside, fieldWidth, fieldHeight), inside);
    for (let i = 0; i < field.length; i++) {
      const a = fieldCoverage[i] / 255;
      if (a > 0) field[i] = pillow[i] * a + field[i] * (1 - a);
    }

    const id = Math.round((b + 0.5) * (255 / BRANCHES.length));
    const tone = Math.round(255 * branchTone(branch.gray, shadeFloor));
    for (let i = 0; i < coverage.length; i++) {
      const cov = coverage[i];
      const soft = blurred[i];
      if (!cov && !soft) continue;
      const o = 4 * i;
      const a = soft / 255;
      base[o] = Math.round(soft + base[o] * (1 - a));
      base[o + 1] = Math.round(cov + base[o + 1] * (1 - cov / 255));
      base[o + 2] = Math.round(tone * a + base[o + 2] * (1 - a));
      if (cov) {
        meta[o] = id;
        meta[o + 1] = arc[i] >> 8;
        meta[o + 2] = arc[i] & 255;
      }
    }
  }

  return { base, meta, width, height, field, fieldWidth, fieldHeight };
}
