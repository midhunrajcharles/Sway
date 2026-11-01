// Flattens SVG path data into closed polygons, normalised so the viewBox
// height is 1 and the centre is (0, 0) with y pointing up.

const NUMBER = /[+-]?(?:\d*\.\d+|\d+\.?)(?:[eE][+-]?\d+)?/y;
const SEPARATOR = /[\s,]*/y;

export function flattenPath(
  d: string,
  viewBox: number[],
  tolerance: number,
  offset?: [number, number],
): Float64Array[] {
  const [vx, vy, vw, vh] = viewBox;
  if (!(vh > 0)) return [];
  const scale = 1 / vh;
  const cx = vx + vw / 2 - (offset ? offset[0] : 0);
  const cy = vy + vh / 2 - (offset ? offset[1] : 0);
  const polygons: Float64Array[] = [];
  let points: number[] = [];

  const emit = (x: number, y: number) => {
    points.push((x - cx) * scale, (cy - y) * scale);
  };
  const closePolygon = () => {
    if (points.length >= 6) polygons.push(Float64Array.from(points));
    points = [];
  };

  let at = 0;
  let failed = false;
  const skipSeparators = () => {
    SEPARATOR.lastIndex = at;
    const match = SEPARATOR.exec(d);
    if (match) at += match[0].length;
  };
  const readNumber = () => {
    skipSeparators();
    NUMBER.lastIndex = at;
    const match = NUMBER.exec(d);
    if (match && match[0] !== "" && match[0] !== ".") {
      at += match[0].length;
      return Number(match[0]);
    }
    failed = true;
    return 0;
  };
  const readFlag = () => {
    skipSeparators();
    const c = d[at];
    if (c === "0" || c === "1") {
      at += 1;
      return c === "1";
    }
    return readNumber() !== 0;
  };

  let command = "";
  let relative = false;
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;
  let cubicX = 0;
  let cubicY = 0;
  let quadX = 0;
  let quadY = 0;
  let afterCubic = false;
  let afterQuad = false;

  const cubic = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) => {
    const length = Math.hypot(x1 - x, y1 - y) + Math.hypot(x2 - x1, y2 - y1) + Math.hypot(x3 - x2, y3 - y2);
    const steps = Math.min(64, Math.max(3, Math.ceil((length * scale) / tolerance)));
    for (let i = 1; i <= steps; i += 1) {
      const t = i / steps;
      const u = 1 - t;
      emit(
        u * u * u * x + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3,
        u * u * u * y + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3,
      );
    }
    x = x3;
    y = y3;
    cubicX = x2;
    cubicY = y2;
    afterCubic = true;
    afterQuad = false;
  };

  const quad = (x1: number, y1: number, x2: number, y2: number) => {
    const length = Math.hypot(x1 - x, y1 - y) + Math.hypot(x2 - x1, y2 - y1);
    const steps = Math.min(64, Math.max(3, Math.ceil((length * scale) / tolerance)));
    for (let i = 1; i <= steps; i += 1) {
      const t = i / steps;
      const u = 1 - t;
      emit(u * u * x + 2 * u * t * x1 + t * t * x2, u * u * y + 2 * u * t * y1 + t * t * y2);
    }
    x = x2;
    y = y2;
    quadX = x1;
    quadY = y1;
    afterQuad = true;
    afterCubic = false;
  };

  const arc = (
    radiusX: number,
    radiusY: number,
    rotation: number,
    largeArc: boolean,
    sweep: boolean,
    x2: number,
    y2: number,
  ) => {
    let rx = Math.abs(radiusX);
    let ry = Math.abs(radiusY);
    if (rx === 0 || ry === 0 || (x === x2 && y === y2)) {
      emit(x2, y2);
      x = x2;
      y = y2;
      afterCubic = false;
      afterQuad = false;
      return;
    }
    const phi = (rotation * Math.PI) / 180;
    const cos = Math.cos(phi);
    const sin = Math.sin(phi);
    const dx = (x - x2) / 2;
    const dy = (y - y2) / 2;
    const x1p = cos * dx + sin * dy;
    const y1p = -sin * dx + cos * dy;
    const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
    if (lambda > 1) {
      const k = Math.sqrt(lambda);
      rx *= k;
      ry *= k;
    }
    const rx2 = rx * rx;
    const ry2 = ry * ry;
    const den = rx2 * y1p * y1p + ry2 * x1p * x1p;
    const num = Math.max(0, rx2 * ry2 - den);
    let coef = den === 0 ? 0 : Math.sqrt(num / den);
    if (largeArc === sweep) coef = -coef;
    const cxp = (coef * rx * y1p) / ry;
    const cyp = (-coef * ry * x1p) / rx;
    const centreX = cos * cxp - sin * cyp + (x + x2) / 2;
    const centreY = sin * cxp + cos * cyp + (y + y2) / 2;
    const start = Math.atan2((y1p - cyp) / ry, (x1p - cxp) / rx);
    let delta = Math.atan2((-y1p - cyp) / ry, (-x1p - cxp) / rx) - start;
    if (!sweep && delta > 0) delta -= 2 * Math.PI;
    if (sweep && delta < 0) delta += 2 * Math.PI;
    const steps = Math.min(256, Math.max(3, Math.ceil((Math.abs(delta) * Math.max(rx, ry) * scale) / tolerance)));
    for (let i = 1; i <= steps; i += 1) {
      const a = start + (delta * i) / steps;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      emit(centreX + rx * ca * cos - ry * sa * sin, centreY + rx * ca * sin + ry * sa * cos);
    }
    x = x2;
    y = y2;
    afterCubic = false;
    afterQuad = false;
  };

  while (!failed) {
    skipSeparators();
    if (at >= d.length) break;
    const c = d[at];
    if (/[a-zA-Z]/.test(c)) {
      const upper = c.toUpperCase();
      if (!"MLHVCSQTAZ".includes(upper)) break;
      command = upper;
      relative = c !== upper;
      at += 1;
      if (command === "Z") {
        closePolygon();
        x = startX;
        y = startY;
        afterCubic = false;
        afterQuad = false;
        continue;
      }
    } else if (!command || command === "Z") {
      break;
    }

    const bx = relative ? x : 0;
    const by = relative ? y : 0;
    if (command === "M") {
      closePolygon();
      x = bx + readNumber();
      y = by + readNumber();
      startX = x;
      startY = y;
      if (!failed) emit(x, y);
      afterCubic = false;
      afterQuad = false;
      command = "L"; // further pairs are implicit line-tos
    } else if (command === "L") {
      x = bx + readNumber();
      y = by + readNumber();
      if (!failed) emit(x, y);
      afterCubic = false;
      afterQuad = false;
    } else if (command === "H") {
      x = bx + readNumber();
      if (!failed) emit(x, y);
      afterCubic = false;
      afterQuad = false;
    } else if (command === "V") {
      y = by + readNumber();
      if (!failed) emit(x, y);
      afterCubic = false;
      afterQuad = false;
    } else if (command === "C") {
      const x1 = bx + readNumber();
      const y1 = by + readNumber();
      const x2 = bx + readNumber();
      const y2 = by + readNumber();
      const x3 = bx + readNumber();
      const y3 = by + readNumber();
      if (!failed) cubic(x1, y1, x2, y2, x3, y3);
    } else if (command === "S") {
      const x1 = afterCubic ? 2 * x - cubicX : x;
      const y1 = afterCubic ? 2 * y - cubicY : y;
      const x2 = bx + readNumber();
      const y2 = by + readNumber();
      const x3 = bx + readNumber();
      const y3 = by + readNumber();
      if (!failed) cubic(x1, y1, x2, y2, x3, y3);
    } else if (command === "Q") {
      const x1 = bx + readNumber();
      const y1 = by + readNumber();
      const x2 = bx + readNumber();
      const y2 = by + readNumber();
      if (!failed) quad(x1, y1, x2, y2);
    } else if (command === "T") {
      const x1 = afterQuad ? 2 * x - quadX : x;
      const y1 = afterQuad ? 2 * y - quadY : y;
      const x2 = bx + readNumber();
      const y2 = by + readNumber();
      if (!failed) quad(x1, y1, x2, y2);
    } else if (command === "A") {
      const rx = readNumber();
      const ry = readNumber();
      const rotation = readNumber();
      const largeArc = readFlag();
      const sweep = readFlag();
      const x2 = bx + readNumber();
      const y2 = by + readNumber();
      if (!failed) arc(rx, ry, rotation, largeArc, sweep, x2, y2);
    }
  }
  closePolygon();
  return polygons;
}
