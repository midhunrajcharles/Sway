// Signed distance field of the symbol outline (negative inside), baked on the
// CPU and uploaded as an R16F texture for the ray-marching shader.
import { SYMBOL_PATH, SYMBOL_VIEW_BOX } from "@/lib/symbol";
import { FIELD_PADDING, FIELD_PIXELS_PER_UNIT, type Shape } from "./constants";
import { flattenPath } from "./flatten-path";

const MAX_TEXTURE = 4096;
const MAX_POINTS = 50000;
const SYMBOL_BOX = SYMBOL_VIEW_BOX.split(" ").map(Number);

export type FieldExtent = {
  width: number;
  height: number;
  halfWidth: number;
  halfHeight: number;
  glyphHalfWidth: number;
  glyphHalfHeight: number;
  pixelsPerUnit: number;
};
export type Field = FieldExtent & { data: Float32Array; band: number };

/** Texture size for a viewBox: glyph is 1 unit tall, plus `padding` on each side, capped at 4096px. */
export function shapeFieldExtent(viewBox: number[], pixelsPerUnit: number, padding: number): FieldExtent {
  const glyphHalfWidth = viewBox[2] / viewBox[3] / 2;
  const maxPpu = MAX_TEXTURE / ((Math.max(glyphHalfWidth, 0.5) + padding) * 2);
  const ppu = pixelsPerUnit > maxPpu ? maxPpu : pixelsPerUnit;
  const width = Math.ceil((glyphHalfWidth + padding) * 2 * ppu);
  const height = Math.ceil((0.5 + padding) * 2 * ppu);
  return {
    width,
    height,
    halfWidth: width / (2 * ppu),
    halfHeight: height / (2 * ppu),
    glyphHalfWidth,
    glyphHalfHeight: 0.5,
    pixelsPerUnit: ppu,
  };
}

export const SYMBOL_FIELD_EXTENT = shapeFieldExtent(SYMBOL_BOX, FIELD_PIXELS_PER_UNIT, FIELD_PADDING);

function rasterField(
  polygons: Float64Array[],
  extent: FieldExtent,
  band: number,
  rule: "evenodd" | "nonzero",
): Field {
  const { width, height, halfWidth, halfHeight, pixelsPerUnit } = extent;
  const unit = 1 / pixelsPerUnit;
  const data = new Float32Array(width * height).fill(band);
  const toPx = (x: number) => (x + halfWidth) * pixelsPerUnit - 0.5;
  const toPy = (y: number) => (y + halfHeight) * pixelsPerUnit - 0.5;
  const reach = band * pixelsPerUnit;

  // Unsigned distance to the nearest edge, within the band.
  for (const poly of polygons) {
    const count = poly.length / 2;
    for (let i = 0; i < count; i += 1) {
      const j = (i + 1) % count;
      const ax = poly[2 * i];
      const ay = poly[2 * i + 1];
      const bx = poly[2 * j];
      const by = poly[2 * j + 1];
      const dx = bx - ax;
      const dy = by - ay;
      const lenSq = dx * dx + dy * dy;
      if (lenSq === 0) continue;
      const minX = Math.max(0, Math.ceil(toPx(Math.min(ax, bx)) - reach));
      const maxX = Math.min(width - 1, Math.floor(toPx(Math.max(ax, bx)) + reach));
      const minY = Math.max(0, Math.ceil(toPy(Math.min(ay, by)) - reach));
      const maxY = Math.min(height - 1, Math.floor(toPy(Math.max(ay, by)) + reach));
      for (let row = minY; row <= maxY; row += 1) {
        const py = (row + 0.5) * unit - halfHeight - ay;
        const rowOffset = row * width;
        for (let col = minX; col <= maxX; col += 1) {
          const px = (col + 0.5) * unit - halfWidth - ax;
          let t = (px * dx + py * dy) / lenSq;
          t = t < 0 ? 0 : t > 1 ? 1 : t;
          const ex = px - dx * t;
          const ey = py - dy * t;
          const dist = Math.sqrt(ex * ex + ey * ey);
          if (dist < data[rowOffset + col]) data[rowOffset + col] = dist;
        }
      }
    }
  }

  // Scanline fill: negate the distance inside the shape.
  const negateSpan = (rowOffset: number, from: number, to: number) => {
    const start = Math.max(0, Math.ceil(toPx(from)));
    const end = Math.min(width - 1, Math.floor(toPx(to)));
    for (let col = start; col <= end; col += 1) data[rowOffset + col] *= -1;
  };

  if (rule === "evenodd") {
    const xs: number[] = [];
    for (let row = 0; row < height; row += 1) {
      const y = (row + 0.5) * unit - halfHeight;
      xs.length = 0;
      for (const poly of polygons) {
        const count = poly.length / 2;
        for (let i = 0; i < count; i += 1) {
          const j = (i + 1) % count;
          const y0 = poly[2 * i + 1];
          const y1 = poly[2 * j + 1];
          if (y0 <= y === y1 <= y) continue;
          const x0 = poly[2 * i];
          const x1 = poly[2 * j];
          xs.push(x0 + ((y - y0) / (y1 - y0)) * (x1 - x0));
        }
      }
      if (xs.length === 0) continue;
      xs.sort((a, b) => a - b);
      const rowOffset = row * width;
      for (let k = 0; k + 1 < xs.length; k += 2) negateSpan(rowOffset, xs[k], xs[k + 1]);
    }
  } else {
    const hits: { at: number; direction: number }[] = [];
    for (let row = 0; row < height; row += 1) {
      const y = (row + 0.5) * unit - halfHeight;
      hits.length = 0;
      for (const poly of polygons) {
        const count = poly.length / 2;
        for (let i = 0; i < count; i += 1) {
          const j = (i + 1) % count;
          const y0 = poly[2 * i + 1];
          const y1 = poly[2 * j + 1];
          if (y0 <= y === y1 <= y) continue;
          const x0 = poly[2 * i];
          const x1 = poly[2 * j];
          hits.push({ at: x0 + ((y - y0) / (y1 - y0)) * (x1 - x0), direction: y1 > y0 ? 1 : -1 });
        }
      }
      if (hits.length === 0) continue;
      hits.sort((a, b) => a.at - b.at);
      const rowOffset = row * width;
      let winding = 0;
      for (let k = 0; k + 1 < hits.length; k += 1) {
        winding += hits[k].direction;
        if (winding !== 0) negateSpan(rowOffset, hits[k].at, hits[k + 1].at);
      }
    }
  }

  return { ...extent, data, band };
}

/** Field of the Sway symbol. */
export function buildSymbolField(pixelsPerUnit: number, padding: number, band: number) {
  const extent = shapeFieldExtent(SYMBOL_BOX, pixelsPerUnit, padding);
  const tolerance = (1 / extent.pixelsPerUnit) * 0.35;
  return rasterField(flattenPath(SYMBOL_PATH, SYMBOL_BOX, tolerance), extent, band, "evenodd");
}

/** Field of an arbitrary shape (capped at 50k points). */
export function buildShapeField(shape: Shape, pixelsPerUnit: number, padding: number, band: number) {
  const extent = shapeFieldExtent(shape.viewBox, pixelsPerUnit, padding);
  const tolerance = (1 / extent.pixelsPerUnit) * 0.35;
  const polygons: Float64Array[] = [];
  let points = 0;
  let evenOdd = false;
  for (const path of shape.paths) {
    if (path.fillRule === "evenodd") evenOdd = true;
    if (points >= MAX_POINTS) continue;
    for (const poly of flattenPath(path.d, shape.viewBox, tolerance, path.offset)) {
      if (points >= MAX_POINTS) break;
      polygons.push(poly);
      points += poly.length / 2;
    }
  }
  return rasterField(polygons, extent, band, evenOdd ? "evenodd" : "nonzero");
}
