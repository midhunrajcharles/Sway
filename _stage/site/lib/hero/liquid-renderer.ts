import { isOverlayLifted, onOverlayLifted } from "@/lib/entry";
import { disposePendingProgram, finishProgram, isProgramComplete, linkProgramAsync, type PendingProgram } from "@/lib/gl";
import { BRANCHES, CROP_ASPECT, OVERFLOW_SCALE, REGION, VIEWBOX_HEIGHT, VIEWBOX_WIDTH, type LiquidMask } from "./liquid-mask";
import { LIQUID_FRAGMENT, LIQUID_VERTEX } from "./liquid-shaders";

export type LiquidIntroTiming = { startDelay: number; stagger: number; duration: number; feather: number };
export type LiquidParams = {
  repetition: number;
  softness: number;
  shiftRed: number;
  shiftBlue: number;
  shadowBlue: number;
  distortion: number;
  contour: number;
  angle: number;
  flow: number;
  speed: number;
};

export const HERO_LIQUID_INTRO: LiquidIntroTiming = { startDelay: 0, stagger: 0.13, duration: 2.5, feather: 0.2 };
export const HERO_LIQUID_EFFECT: LiquidParams = {
  repetition: 1.79,
  softness: 1,
  shiftRed: 0.61,
  shiftBlue: 0.33,
  shadowBlue: 0.075,
  distortion: 0.07,
  contour: 0.97,
  angle: 0,
  flow: 1,
  speed: 0.48,
};

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const MAX_PIXELS = 12_500_000;

type Options = {
  intro: boolean;
  onActive: () => void;
  onError: () => void;
  params?: LiquidParams;
  introTiming?: LiquidIntroTiming;
  capture?: boolean;
};

/** Animated chrome "liquid" pipes, drawn in one full-screen WebGL2 pass from the precomputed mask. */
export function createLiquidRenderer(
  canvas: HTMLCanvasElement,
  mask: LiquidMask,
  { intro, onActive, onError, params = HERO_LIQUID_EFFECT, introTiming = HERO_LIQUID_INTRO, capture = false }: Options,
) {
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: true,
    preserveDrawingBuffer: capture,
    powerPreference: "high-performance",
  });
  if (!gl) throw Error("webgl2 unavailable");

  let pending: PendingProgram | null = linkProgramAsync(gl, LIQUID_VERTEX, LIQUID_FRAGMENT);
  let program: WebGLProgram | null = null;
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

  const imageTex = gl.createTexture();
  const metaTex = gl.createTexture();
  const edgeTex = gl.createTexture();

  const uploadRGBA = (unit: number, texture: WebGLTexture | null, size: LiquidMask, data: Uint8Array, filter: number) => {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size.width, size.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  };

  const uploadMask = (m: LiquidMask) => {
    uploadRGBA(0, imageTex, m, m.base, gl.LINEAR);
    uploadRGBA(1, metaTex, m, m.meta, gl.NEAREST);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, edgeTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, m.fieldWidth, m.fieldHeight, 0, gl.RED, gl.FLOAT, m.field);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  };
  uploadMask(mask);

  let uTime: WebGLUniformLocation | null = null;
  let uResolution: WebGLUniformLocation | null = null;
  let uBranchReveal: WebGLUniformLocation | null = null;
  let uUvScale: WebGLUniformLocation | null = null;
  let uUvOffset: WebGLUniformLocation | null = null;

  // The visible 1440x810 viewBox inside the padded mask region, in mask UV space.
  const scaleX = VIEWBOX_WIDTH / REGION.width;
  const scaleY = (VIEWBOX_HEIGHT * OVERFLOW_SCALE) / REGION.height;
  const offsetX = -REGION.x / REGION.width;
  const offsetY = -REGION.y / REGION.height;

  const revealAll = () => {
    gl.uniform1fv(uBranchReveal, [2, 2, 2, 2]);
  };

  let currentParams = params;
  let timing = introTiming;
  let uniform: ((name: string) => WebGLUniformLocation | null) | null = null;

  const applyParams = () => {
    if (!uniform) return;
    gl.uniform1f(uniform("u_repetition"), currentParams.repetition);
    gl.uniform1f(uniform("u_softness"), currentParams.softness);
    gl.uniform1f(uniform("u_shiftRed"), currentParams.shiftRed);
    gl.uniform1f(uniform("u_shiftBlue"), currentParams.shiftBlue);
    gl.uniform1f(uniform("u_shadowBlue"), currentParams.shadowBlue);
    gl.uniform1f(uniform("u_distortion"), currentParams.distortion);
    gl.uniform1f(uniform("u_contour"), currentParams.contour);
    gl.uniform1f(uniform("u_angle"), currentParams.angle);
    gl.uniform1f(uniform("u_flow"), currentParams.flow);
  };
  const applyFeather = () => {
    if (uniform) gl.uniform1f(uniform("u_feather"), timing.feather);
  };
  // Last branch draws first.
  const branchDelays = () => BRANCHES.map((_, i) => timing.startDelay + (BRANCHES.length - 1 - i) * timing.stagger);

  let delays = branchDelays();
  let introEnabled = intro;
  let introDone = !intro;
  let introStart = 0;
  let disposed = false;
  let frameId = 0;
  let compileId = 0;
  let running = false;
  let inView = true;
  let activated = false;
  let sequencing = false;
  let clock = 0;
  let lastFrame = 0;

  const resize = () => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height) return;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pixels = width * height * dpr * dpr;
    if (pixels > MAX_PIXELS) dpr *= Math.sqrt(MAX_PIXELS / pixels);
    const w = Math.max(1, Math.round(width * dpr));
    const h = Math.max(1, Math.round(height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    gl.viewport(0, 0, w, h);
    gl.uniform2f(uResolution, w, h);
    const crop = Math.min(1, width / height / CROP_ASPECT);
    gl.uniform2f(uUvScale, scaleX * crop, scaleY);
    gl.uniform2f(uUvOffset, offsetX + (scaleX * (1 - crop)) / 2, offsetY);
  };

  const updateReveal = (elapsed: number) => {
    const reveal = new Float32Array(4);
    let complete = true;
    for (let i = 0; i < 4; i++) {
      const progress = Math.min(Math.max((elapsed - delays[i]) / timing.duration, 0), 1);
      if (progress < 1) complete = false;
      reveal[i] = easeInOutCubic(progress) * (1 + 2 * timing.feather + 0.02);
    }
    gl.uniform1fv(uBranchReveal, reveal);
    if (complete) {
      introDone = true;
      revealAll();
    }
  };

  const draw = (time: number) => {
    gl.uniform1f(uTime, time * currentParams.speed);
    if (!introDone) updateReveal(time - introStart);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const loop = (now: number) => {
    frameId = requestAnimationFrame(loop);
    const dt = lastFrame ? Math.min((now - lastFrame) / 1000, 0.1) : 0;
    lastFrame = now;
    draw((clock += dt));
    if (!activated) {
      activated = true;
      onActive();
    }
    if (!shouldRun()) setRunning(false);
  };

  // Draw one frame first (so the intro overlay can lift onto a ready hero), then pause until it lifts.
  const shouldRun = () => !!program && inView && (!activated || isOverlayLifted());

  const setRunning = (next: boolean) => {
    if (disposed || next === running || (next && sequencing)) return;
    running = next;
    if (next) {
      lastFrame = 0;
      frameId = requestAnimationFrame(loop);
    } else {
      cancelAnimationFrame(frameId);
    }
  };

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  const visibility = new IntersectionObserver(([entry]) => {
    inView = entry?.isIntersecting ?? true;
    setRunning(shouldRun());
  });
  visibility.observe(canvas);

  const onContextLost = (event: Event) => {
    event.preventDefault();
    setRunning(false);
    onError();
  };
  canvas.addEventListener("webglcontextlost", onContextLost);
  const offLift = onOverlayLifted(() => setRunning(shouldRun()));

  const pollCompile = () => {
    compileId = 0;
    if (disposed || !pending) return;
    if (!isProgramComplete(gl, pending)) {
      compileId = requestAnimationFrame(pollCompile);
      return;
    }
    let linked: WebGLProgram;
    try {
      linked = finishProgram(gl, pending);
    } catch {
      pending = null;
      onError();
      return;
    }
    pending = null;
    program = linked;
    gl.useProgram(linked);
    const get = (uniform = (name: string) => gl.getUniformLocation(linked, name));
    gl.uniform1i(get("u_image"), 0);
    gl.uniform1i(get("u_meta"), 1);
    gl.uniform1i(get("u_edge"), 2);
    applyParams();
    applyFeather();
    uUvScale = get("u_uvScale");
    uUvOffset = get("u_uvOffset");
    uTime = get("u_time");
    uResolution = get("u_resolution");
    uBranchReveal = get("u_branchReveal");
    if (introDone) revealAll();
    resize();
    setRunning(true);
  };
  resize();
  pollCompile();

  const restartIntro = () => {
    introStart = clock;
    introDone = false;
    setRunning(shouldRun());
  };

  return {
    setParams: (next: LiquidParams) => {
      if (disposed) return;
      currentParams = next;
      applyParams();
    },
    setIntroTiming: (next: LiquidIntroTiming) => {
      if (disposed) return;
      timing = next;
      delays = branchDelays();
      applyFeather();
    },
    setIntro: (enabled: boolean) => {
      if (disposed) return;
      introEnabled = enabled;
      if (enabled) restartIntro();
      else {
        introDone = true;
        revealAll();
      }
    },
    setMask: (next: LiquidMask) => {
      if (!disposed) uploadMask(next);
    },
    replayIntro: () => {
      if (!disposed) restartIntro();
    },
    /** Take over the clock to render frames on demand (used for capture). */
    beginSequence: () => {
      if (disposed) return null;
      sequencing = true;
      setRunning(false);
      const base = clock;
      let last = 0;
      if (introEnabled) {
        introStart = base;
        introDone = false;
      }
      return {
        frame: (t: number) => {
          if (disposed || !program) return false;
          last = t;
          draw(base + t);
          return true;
        },
        end: () => {
          sequencing = false;
          clock = base + last;
          setRunning(shouldRun());
        },
      };
    },
    dispose: () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      if (compileId !== 0) cancelAnimationFrame(compileId);
      running = false;
      resizeObserver.disconnect();
      visibility.disconnect();
      canvas.removeEventListener("webglcontextlost", onContextLost);
      offLift();
      gl.deleteTexture(imageTex);
      gl.deleteTexture(metaTex);
      gl.deleteTexture(edgeTex);
      if (pending) disposePendingProgram(gl, pending);
      if (program) gl.deleteProgram(program);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
