import { isOverlayLifted, onOverlayLifted } from "@/lib/entry";
import { disposePendingProgram, finishProgram, isProgramComplete, linkProgramAsync, type PendingProgram } from "@/lib/gl";
import { SWIRL_FRAGMENT, SWIRL_VERTEX } from "./swirl-shaders";

export const MAX_ITERATIONS = 12;

export const METALLIC_SWIRL_DEFAULTS = {
  speed: 0.11,
  initialTime: 0,
  zoom: 0.9,
  iterations: 4,
  sampleGap: 0.005,
  tangentForce: 0.81,
  gradientForce: 0.08,
  brightness: 1,
  contrast: 1,
  backgroundColor: "#000000ff",
  opacity: 1,
  radialMix: 1,
  beams: 5,
  radialStretch: 0.49,
  radialFlow: 3,
  radialSpin: 0.2,
  beamWidth: 0.2,
  twist: 1.4,
  vortex: 0,
  hole: 0,
  centerX: 0.5,
  centerY: 0.5,
  vignette: 0,
  colorMode: "stripes",
  colorA: "#fafaff",
  colorB: "#000000",
  colorC: "#8b93a6",
  tintColor: "#ffffff00",
  repetition: 1.1,
  softness: 0.2,
  bandWidth: 0.12,
  shiftRed: 0,
  shiftBlue: 0,
  stripeFlow: -1.69,
  stripeRadial: 0,
  spread: 0.02,
  threshold: 0.72,
  detailFade: 0,
  fadeLeft: 0,
  fadeRight: 0,
  fadeTop: 0,
  fadeBottom: 0,
};

export type SwirlParams = typeof METALLIC_SWIRL_DEFAULTS;
export type TimeOffsetOptions = { immediate?: boolean };

const QUAD = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);

/** "#rgb", "#rgba", "#rrggbb" or "#rrggbbaa" to [r, g, b, a] in 0..1. */
export function hexToRgba(hex: string): [number, number, number, number] {
  const raw = hex.replace("#", "");
  const double = (s: string) =>
    s
      .split("")
      .map((c) => c + c)
      .join("");
  const full =
    raw.length === 3 ? double(raw) + "ff" : raw.length === 4 ? double(raw) : raw.length === 6 ? raw + "ff" : raw;
  return [
    parseInt(full.slice(0, 2), 16) / 255,
    parseInt(full.slice(2, 4), 16) / 255,
    parseInt(full.slice(4, 6), 16) / 255,
    parseInt(full.slice(6, 8), 16) / 255,
  ];
}

type Options = {
  params: SwirlParams;
  animated: boolean;
  capture?: boolean;
  onReady: () => void;
  onError: () => void;
};

export type SwirlRenderer = ReturnType<typeof createMetallicSwirlRenderer>;

export function createMetallicSwirlRenderer(
  canvas: HTMLCanvasElement,
  { params, animated, capture = false, onReady, onError }: Options,
) {
  const gl = canvas.getContext("webgl2", {
    antialias: true,
    alpha: true,
    premultipliedAlpha: true,
    preserveDrawingBuffer: capture,
  });
  if (!gl) throw Error("webgl2 unavailable");

  let pending: PendingProgram | null = linkProgramAsync(gl, SWIRL_VERTEX, SWIRL_FRAGMENT);
  let program: WebGLProgram | null = null;
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, QUAD, gl.STATIC_DRAW);
  gl.enable(gl.BLEND);
  gl.blendFuncSeparate(gl.ONE, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  const loc = (name: string) => (program ? gl.getUniformLocation(program, name) : null);
  const locate = () => ({
    time: loc("uTime"),
    res: loc("uRes"),
    zoom: loc("uZoom"),
    iter: loc("uIter"),
    eps: loc("uEps"),
    tangent: loc("uTangent"),
    grad: loc("uGrad"),
    bright: loc("uBright"),
    contrast: loc("uContrast"),
    bg: loc("uBg"),
    alpha: loc("uAlpha"),
    radial: loc("uRadial"),
    beams: loc("uBeams"),
    stretch: loc("uStretch"),
    flow: loc("uFlow"),
    spinPhase: loc("uSpinPhase"),
    beamWidth: loc("uBeamWidth"),
    twist: loc("uTwist"),
    vortex: loc("uVortex"),
    hole: loc("uHole"),
    center: loc("uCenter"),
    vignette: loc("uVignette"),
    colorMode: loc("uColorMode"),
    colorA: loc("uColorA"),
    colorB: loc("uColorB"),
    colorC: loc("uColorC"),
    tint: loc("uTint"),
    repetition: loc("uRepetition"),
    softness: loc("uSoftness"),
    bandWidth: loc("uBandWidth"),
    shiftRed: loc("uShiftRed"),
    shiftBlue: loc("uShiftBlue"),
    stripePhase: loc("uStripePhase"),
    stripeRadial: loc("uStripeRadial"),
    spread: loc("uSpread"),
    threshold: loc("uThreshold"),
    detailFade: loc("uDetailFade"),
    fadeLeft: loc("uFadeLeft"),
    fadeRight: loc("uFadeRight"),
    fadeTop: loc("uFadeTop"),
    fadeBottom: loc("uFadeBottom"),
  });
  let u = locate();
  let p: SwirlParams = { ...params };

  const applyParams = () => {
    const bg = hexToRgba(p.backgroundColor);
    const a = hexToRgba(p.colorA);
    const b = hexToRgba(p.colorB);
    const c = hexToRgba(p.colorC);
    const tint = hexToRgba(p.tintColor);
    gl.uniform1f(u.zoom, p.zoom);
    gl.uniform1f(u.iter, p.iterations);
    gl.uniform1f(u.eps, Math.max(p.sampleGap, 1e-4));
    gl.uniform1f(u.tangent, p.tangentForce);
    gl.uniform1f(u.grad, p.gradientForce);
    gl.uniform1f(u.bright, p.brightness);
    gl.uniform1f(u.contrast, p.contrast);
    gl.uniform4f(u.bg, ...bg);
    gl.uniform1f(u.alpha, p.opacity);
    gl.uniform1f(u.radial, p.radialMix);
    gl.uniform1f(u.beams, Math.round(p.beams));
    gl.uniform1f(u.stretch, p.radialStretch);
    gl.uniform1f(u.flow, p.radialFlow);
    gl.uniform1f(u.beamWidth, p.beamWidth);
    gl.uniform1f(u.twist, p.twist);
    gl.uniform1f(u.vortex, p.vortex);
    gl.uniform1f(u.hole, p.hole);
    gl.uniform2f(u.center, p.centerX, p.centerY);
    gl.uniform1f(u.vignette, p.vignette);
    gl.uniform1i(u.colorMode, +(p.colorMode === "stripes"));
    gl.uniform4f(u.colorA, ...a);
    gl.uniform4f(u.colorB, ...b);
    gl.uniform4f(u.colorC, ...c);
    gl.uniform4f(u.tint, ...tint);
    gl.uniform1f(u.repetition, p.repetition);
    gl.uniform1f(u.softness, p.softness);
    gl.uniform1f(u.bandWidth, p.bandWidth);
    gl.uniform1f(u.shiftRed, p.shiftRed);
    gl.uniform1f(u.shiftBlue, p.shiftBlue);
    gl.uniform1f(u.spread, p.spread);
    gl.uniform1f(u.stripeRadial, p.stripeRadial);
    gl.uniform1f(u.threshold, p.threshold);
    gl.uniform1f(u.detailFade, p.detailFade);
    gl.uniform1f(u.fadeLeft, p.fadeLeft);
    gl.uniform1f(u.fadeRight, p.fadeRight);
    gl.uniform1f(u.fadeTop, p.fadeTop);
    gl.uniform1f(u.fadeBottom, p.fadeBottom);
  };

  let disposed = false;
  let drawnOnce = false;
  let compileId = 0;
  let running = false;
  let sequencing = false;
  let inView = true;
  let frameId = 0;
  let lastFrame = 0;
  let elapsed = 0; // time from `speed`
  let offset = 0; // smoothed scroll time offset
  let offsetTarget = 0;

  const currentTime = () => p.initialTime + elapsed + offset;
  let lastTime = currentTime();
  // Phases accumulate so that changing stripeFlow / radialSpin never jumps the pattern.
  let stripePhase = lastTime * p.stripeFlow;
  let spinPhase = lastTime * p.radialSpin;

  const ensureProgram = () => {
    if (program) return true;
    if (!pending || !isProgramComplete(gl, pending)) return false;
    const linked = finishProgram(gl, pending);
    pending = null;
    program = linked;
    gl.useProgram(linked);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    const position = gl.getAttribLocation(linked, "aPosition");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    u = locate();
    applyParams();
    return true;
  };

  const draw = () => {
    if (disposed || !program) return;
    const now = currentTime();
    const delta = now - lastTime;
    lastTime = now;
    stripePhase += delta * p.stripeFlow;
    spinPhase += delta * p.radialSpin;
    gl.uniform1f(u.time, currentTime());
    gl.uniform1f(u.stripePhase, stripePhase);
    gl.uniform1f(u.spinPhase, spinPhase);
    gl.uniform2f(u.res, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    if (!drawnOnce) {
      drawnOnce = true;
      onReady();
    }
  };

  const resize = () => {
    if (disposed) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      if (!running) draw();
    }
  };

  const offsetSettled = () => Math.abs(offsetTarget - offset) < 1e-4;
  const needsFrames = () => p.speed !== 0 || !offsetSettled();

  const tick = (now: number) => {
    const dt = Math.min((now - lastFrame) / 1000, 0.1);
    lastFrame = now;
    elapsed += dt * p.speed;
    if (offsetSettled()) offset = offsetTarget;
    else offset += (offsetTarget - offset) * (1 - Math.exp(-(6 * dt)));
    draw();
    if (needsFrames()) frameId = requestAnimationFrame(tick);
    else running = false;
  };

  const updateRunning = () => {
    if (disposed || sequencing) return;
    const shouldRun =
      animated &&
      inView &&
      document.visibilityState === "visible" &&
      (!drawnOnce || isOverlayLifted()) &&
      needsFrames();
    if (shouldRun && !running) {
      running = true;
      lastFrame = performance.now();
      frameId = requestAnimationFrame(tick);
    } else if (!shouldRun && running) {
      running = false;
      cancelAnimationFrame(frameId);
    }
  };

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  const visibility = new IntersectionObserver(([entry]) => {
    inView = entry?.isIntersecting ?? true;
    updateRunning();
  });
  visibility.observe(canvas);
  document.addEventListener("visibilitychange", updateRunning);
  const offLift = onOverlayLifted(updateRunning);
  const onContextLost = (event: Event) => {
    event.preventDefault();
    running = false;
    cancelAnimationFrame(frameId);
    onError();
  };
  canvas.addEventListener("webglcontextlost", onContextLost);

  const pollCompile = () => {
    compileId = 0;
    if (disposed) return;
    let ready = false;
    try {
      ready = ensureProgram();
    } catch {
      onError();
      return;
    }
    if (!ready) {
      compileId = requestAnimationFrame(pollCompile);
      return;
    }
    resize();
    draw();
    updateRunning();
  };
  resize();
  pollCompile();

  return {
    setParams: (next: Partial<SwirlParams>) => {
      if (disposed) return;
      p = { ...p, ...next };
      applyParams();
      if (!running) draw();
      updateRunning();
    },
    setTimeOffset: (value: number, options?: TimeOffsetOptions) => {
      if (disposed) return;
      offsetTarget = value;
      if (options?.immediate || !animated) {
        offset = value;
        if (!running) draw();
      }
      updateRunning();
    },
    getTime: currentTime,
    draw,
    beginSequence: () => {
      if (disposed) return null;
      sequencing = true;
      if (running) {
        running = false;
        cancelAnimationFrame(frameId);
      }
      offset = offsetTarget;
      const base = elapsed;
      let last = 0;
      return {
        frame: (t: number) => {
          if (disposed) return false;
          try {
            if (!ensureProgram()) return false;
          } catch {
            return false;
          }
          last = t;
          elapsed = base + t * p.speed;
          draw();
          return true;
        },
        end: () => {
          sequencing = false;
          elapsed = base + last * p.speed;
          updateRunning();
        },
      };
    },
    dispose: () => {
      disposed = true;
      running = false;
      cancelAnimationFrame(frameId);
      if (compileId !== 0) cancelAnimationFrame(compileId);
      resizeObserver.disconnect();
      visibility.disconnect();
      document.removeEventListener("visibilitychange", updateRunning);
      offLift();
      canvas.removeEventListener("webglcontextlost", onContextLost);
      gl.deleteBuffer(buffer);
      if (pending) disposePendingProgram(gl, pending);
      if (program) gl.deleteProgram(program);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
