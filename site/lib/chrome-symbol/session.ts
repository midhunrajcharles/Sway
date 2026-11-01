// One WebGL2 session that ray-marches the extruded chrome symbol from its
// distance field. Works with an HTMLCanvasElement or an OffscreenCanvas (worker).
import { disposePendingProgram, finishProgram, isProgramComplete, linkProgramAsync, type PendingProgram } from "@/lib/gl";
import { FIELD_BAND, FIELD_PADDING, FIELD_PIXELS_PER_UNIT, type ChromeParams, type Shape } from "./constants";
import { buildShapeField, buildSymbolField, type Field } from "./field";
import { CHROME_FRAGMENT, CHROME_VERTEX } from "./shaders";
import { createIntroTimeline, type IntroTimeline } from "./timeline";

const DEG = Math.PI / 180;
const UNIFORMS = [
  "field",
  "resolution",
  "half",
  "view",
  "bounds",
  "toObject",
  "toWorld",
  "depth",
  "bevel",
  "roughness",
  "parallax",
  "exposure",
  "pixel",
  "normalEps",
  "key",
  "fill",
  "tint",
] as const;
type Uniforms = Record<(typeof UNIFORMS)[number], WebGLUniformLocation | null>;

const hasRaf = typeof requestAnimationFrame === "function";

let symbolField: Field | null = null;
const shapeFields = new Map<string, Field>();

/** Small LRU (4 entries) of baked shape fields. */
function shapeField(shape: Shape) {
  const key = JSON.stringify(shape);
  const cached = shapeFields.get(key);
  if (cached) {
    shapeFields.delete(key);
    shapeFields.set(key, cached);
    return cached;
  }
  const field = buildShapeField(shape, FIELD_PIXELS_PER_UNIT, FIELD_PADDING, FIELD_BAND);
  shapeFields.set(key, field);
  if (shapeFields.size > 4) {
    const oldest = shapeFields.keys().next();
    if (!oldest.done) shapeFields.delete(oldest.value);
  }
  return field;
}

function lightDirection(azimuth: number, elevation: number): [number, number, number] {
  const a = azimuth * DEG;
  const e = elevation * DEG;
  return [Math.cos(e) * Math.sin(a), Math.sin(e), Math.cos(e) * Math.cos(a)];
}

function uploadField(gl: WebGL2RenderingContext, field: Field) {
  const texture = gl.createTexture();
  if (!texture) return null;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  // Drain stale errors so the check below only sees this upload.
  for (let i = 0; i < 8 && gl.getError() !== gl.NO_ERROR; i += 1);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, field.width, field.height, 0, gl.RED, gl.FLOAT, field.data);
  if (gl.getError() === gl.NO_ERROR) return texture;
  // Fallback: 32-bit float, if it can be filtered.
  if (gl.getExtension("OES_texture_float_linear")) {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, field.width, field.height, 0, gl.RED, gl.FLOAT, field.data);
    if (gl.getError() === gl.NO_ERROR) return texture;
  }
  gl.deleteTexture(texture);
  return null;
}

export type SessionOptions = {
  canvas: HTMLCanvasElement | OffscreenCanvas;
  params: ChromeParams;
  intro: boolean;
  spin: boolean;
  width: number;
  height: number;
  shape?: Shape;
  preserveDrawingBuffer?: boolean;
  onLive: (live: boolean) => void;
  onLanded: () => void;
};

export type ChromeSession = NonNullable<ReturnType<typeof createSession>>;

export function createSession({
  canvas,
  params,
  intro,
  spin,
  width,
  height,
  shape,
  preserveDrawingBuffer = false,
  onLive,
  onLanded,
}: SessionOptions) {
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: true,
    preserveDrawingBuffer,
  }) as WebGL2RenderingContext | null;
  if (!gl) return null;

  let pending: PendingProgram | null = null;
  try {
    pending = linkProgramAsync(gl, CHROME_VERTEX, CHROME_FRAGMENT);
  } catch {
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return null;
  }

  const field = shape ? shapeField(shape) : (symbolField ??= buildSymbolField(FIELD_PIXELS_PER_UNIT, FIELD_PADDING, FIELD_BAND));
  const fieldTexture = uploadField(gl, field);
  if (!fieldTexture) {
    disposePendingProgram(gl, pending);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return null;
  }

  const current: ChromeParams = { ...params };
  const toObject = new Float32Array(9);
  const toWorld = new Float32Array(9);
  let program: WebGLProgram | null = null;
  let u: Uniforms | null = null;
  let pixelWidth = Math.max(1, Math.round(width));
  let pixelHeight = Math.max(1, Math.round(height));
  let fit = 1;
  let visible = true;
  let live = false;
  let landed = false;
  let disposed = false;
  let lost = false;
  let sequencing = false;
  let paramsDirty = true;
  let sizeDirty = true;
  let frameId = 0;
  let startTime = 0;
  let lastFrame = 0;
  let swayTime = 0;
  let elapsed = 0;

  const makeTimeline = () =>
    createIntroTimeline(() => current, {
      spin,
      onLanded: () => {
        landed = true;
        onLanded();
      },
    });
  let timeline: IntroTimeline | null = intro ? makeTimeline() : null;

  const applyView = () => {
    if (!u) return;
    const halfView = field.halfHeight / fit;
    gl.uniform2f(u.view, (halfView * pixelWidth) / pixelHeight, halfView);
    gl.uniform1f(u.pixel, (2 * halfView) / pixelHeight);
  };

  const applyParams = (p: ChromeParams) => {
    if (!u) return;
    fit = p.fit > 0 ? p.fit : 1;
    const [kx, ky, kz] = lightDirection(p.keyAzimuth, p.keyElevation);
    const [fx, fy, fz] = lightDirection(p.fillAzimuth, p.fillElevation);
    gl.uniform3f(u.bounds, field.glyphHalfWidth, field.glyphHalfHeight, p.depth);
    gl.uniform1f(u.depth, p.depth);
    gl.uniform1f(u.bevel, Math.min(p.bevel, 0.98 * p.depth));
    gl.uniform1f(u.roughness, p.roughness);
    gl.uniform1f(u.parallax, p.parallax);
    gl.uniform1f(u.exposure, p.exposure);
    gl.uniform3f(u.key, kx, ky, kz);
    gl.uniform3f(u.fill, fx, fy, fz);
    gl.uniform3f(u.tint, p.tintR, p.tintG, p.tintB);
    applyView();
  };

  const applySize = () => {
    if (!u || !sizeDirty) return;
    sizeDirty = false;
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
    gl.viewport(0, 0, pixelWidth, pixelHeight);
    gl.uniform2f(u.resolution, pixelWidth, pixelHeight);
    applyView();
  };

  const render = (p: ChromeParams) => {
    if (!u) return;
    const yaw = (p.yaw + p.sway * Math.sin(0.8 * swayTime)) * DEG;
    const pitch = (p.pitch + 0.55 * p.sway * Math.sin(0.53 * swayTime + 1.1)) * DEG;
    const cy = Math.cos(yaw);
    const sy = Math.sin(yaw);
    const cp = Math.cos(pitch);
    const sp = Math.sin(pitch);
    toObject[0] = cy;
    toObject[1] = 0;
    toObject[2] = sy;
    toObject[3] = sy * sp;
    toObject[4] = cp;
    toObject[5] = -cy * sp;
    toObject[6] = -sy * cp;
    toObject[7] = sp;
    toObject[8] = cy * cp;
    // Transpose (rotation inverse).
    toWorld[0] = toObject[0];
    toWorld[1] = toObject[3];
    toWorld[2] = toObject[6];
    toWorld[3] = toObject[1];
    toWorld[4] = toObject[4];
    toWorld[5] = toObject[7];
    toWorld[6] = toObject[2];
    toWorld[7] = toObject[5];
    toWorld[8] = toObject[8];
    gl.uniformMatrix3fv(u.toObject, false, toObject);
    gl.uniformMatrix3fv(u.toWorld, false, toWorld);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!live) {
      live = true;
      onLive(true);
    }
  };

  const ensureProgram = () => {
    if (program) return true;
    if (!pending || !isProgramComplete(gl, pending)) return false;
    let linked: WebGLProgram;
    try {
      linked = finishProgram(gl, pending);
    } catch {
      pending = null;
      fail();
      return false;
    }
    pending = null;
    program = linked;
    gl.useProgram(linked);
    u = Object.fromEntries(UNIFORMS.map((name) => [name, gl.getUniformLocation(linked, `u_${name}`)])) as Uniforms;
    gl.uniform1i(u.field, 0);
    gl.uniform2f(u.half, field.halfWidth, field.halfHeight);
    gl.uniform1f(u.normalEps, 1.25 / field.pixelsPerUnit);
    sizeDirty = true;
    paramsDirty = true;
    return true;
  };

  const frame = (now: number) => {
    frameId = 0;
    if (disposed) return;
    if (!ensureProgram()) {
      if (!disposed) schedule();
      return;
    }
    if (startTime === 0) startTime = now;
    if (lastFrame !== 0) swayTime += Math.min((now - lastFrame) / 1000, 0.1) * current.speed;
    lastFrame = now;
    elapsed = (now - startTime) / 1000;
    applySize();
    const sampled = timeline && !timeline.isFinished() ? timeline.sample(elapsed) : null;
    if (sampled) applyParams(sampled);
    else if (paramsDirty) {
      applyParams(current);
      paramsDirty = false;
    }
    render(sampled ?? current);
    schedule();
  };

  // Only keep drawing while something changes: compiling, intro, sway, or dirty params/size.
  function schedule() {
    if (
      !disposed &&
      !lost &&
      !sequencing &&
      frameId === 0 &&
      visible &&
      (!program || (timeline && !timeline.isFinished()) || current.speed !== 0 || paramsDirty || sizeDirty)
    ) {
      frameId = hasRaf ? requestAnimationFrame(frame) : (setTimeout(() => frame(performance.now()), 16) as unknown as number);
    }
  }

  function cancel() {
    if (frameId === 0) return;
    if (hasRaf) cancelAnimationFrame(frameId);
    else clearTimeout(frameId);
    frameId = 0;
  }

  function fail() {
    lost = true;
    cancel();
    live = false;
    onLive(false);
  }

  const onContextLost = (event: Event) => {
    event.preventDefault();
    fail();
  };
  canvas.addEventListener("webglcontextlost", onContextLost);
  schedule();

  return {
    setParams: (next: Partial<ChromeParams>) => {
      Object.assign(current, next);
      paramsDirty = true;
      schedule();
    },
    resize: (w: number, h: number) => {
      const nw = Math.max(1, Math.round(w));
      const nh = Math.max(1, Math.round(h));
      if (nw !== pixelWidth || nh !== pixelHeight) {
        pixelWidth = nw;
        pixelHeight = nh;
        sizeDirty = true;
        schedule();
      }
    },
    setVisible: (next: boolean) => {
      if (next === visible) return;
      visible = next;
      if (next) schedule();
      else {
        cancel();
        lastFrame = 0;
      }
    },
    land: () => {
      if (!timeline) {
        if (landed) return;
        landed = true;
        onLanded();
        return;
      }
      timeline.land(elapsed);
      schedule();
    },
    replayIntro: () => {
      timeline = makeTimeline();
      landed = false;
      startTime = 0;
      paramsDirty = true;
      schedule();
    },
    /** Render frames on demand (for capture). */
    beginSequence: () => {
      sequencing = true;
      cancel();
      const sequenceTimeline = intro ? createIntroTimeline(() => current, { spin }) : null;
      return {
        frame: (t: number) => {
          if (disposed || lost || !ensureProgram()) return false;
          applySize();
          swayTime = t * current.speed;
          const sampled = sequenceTimeline && !sequenceTimeline.isFinished() ? sequenceTimeline.sample(t) : null;
          applyParams(sampled ?? current);
          render(sampled ?? current);
          return true;
        },
        land: (t: number) => sequenceTimeline?.land(t),
        end: () => {
          sequencing = false;
          paramsDirty = true;
          lastFrame = 0;
          schedule();
        },
      };
    },
    dispose: () => {
      disposed = true;
      cancel();
      canvas.removeEventListener("webglcontextlost", onContextLost);
      if (pending) disposePendingProgram(gl, pending);
      gl.deleteTexture(fieldTexture);
      if (program) gl.deleteProgram(program);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
