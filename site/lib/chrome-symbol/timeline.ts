import { CHROME_SYMBOL_INTRO, type ChromeParams } from "./constants";

/** CSS-style cubic-bezier easing (Newton steps, then bisection). */
export function cubicBezier([x1, y1, x2, y2]: number[]) {
  const curve = (t: number, p1: number, p2: number) => ((1 - 3 * p2 + 3 * p1) * t * t + (3 * p2 - 6 * p1) * t + 3 * p1) * t;
  const slope = (t: number, p1: number, p2: number) =>
    3 * (1 - 3 * p2 + 3 * p1) * t * t + 2 * (3 * p2 - 6 * p1) * t + 3 * p1;
  const solveX = (x: number) => {
    let t = x;
    for (let i = 0; i < 8; i++) {
      const err = curve(t, x1, x2) - x;
      if (Math.abs(err) < 1e-6) return t;
      const d = slope(t, x1, x2);
      if (Math.abs(d) < 1e-6) break;
      t -= err / d;
    }
    let lo = 0;
    let hi = 1;
    while (hi - lo > 1e-6) {
      t = (lo + hi) / 2;
      if (curve(t, x1, x2) < x) lo = t;
      else hi = t;
    }
    return t;
  };
  return (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : curve(solveX(x), y1, y2));
}

export type IntroTimeline = ReturnType<typeof createIntroTimeline>;

export function createIntroTimeline(
  getParams: () => ChromeParams,
  { spin = false, onLanded }: { spin?: boolean; onLanded?: () => void } = {},
) {
  const { initialDelay, depthDuration, depthEase, blendDuration, blendEase, spinPeriod, landMinDuration } =
    CHROME_SYMBOL_INTRO;
  const easeDepth = cubicBezier(depthEase);
  const easeBlend = cubicBezier(blendEase);
  const introEnd = depthDuration + blendDuration;
  const degreesPerSecond = 360 / spinPeriod;
  let landRequested = false;
  let finished = false;
  let landStart = 0;
  let yawFrom = 0;
  let yawTo = 0;
  let landDuration = 0;

  const finish = (params: ChromeParams) => {
    if (!finished) {
      finished = true;
      onLanded?.();
    }
    return params;
  };
  const spinYaw = (params: ChromeParams, t: number) => params.yaw + degreesPerSecond * (t - introEnd);

  return {
    sample: (time: number): ChromeParams => {
      const t = Math.max(0, time - initialDelay);
      const target = getParams();
      if (finished) return target;
      const from = { ...target, ...CHROME_SYMBOL_INTRO.from };
      if (t < depthDuration) return { ...from, depth: from.depth * easeDepth(t / depthDuration) };
      if (t < introEnd) {
        const k = easeBlend((t - depthDuration) / blendDuration);
        const out = { ...from };
        for (const key of Object.keys(from) as (keyof ChromeParams)[]) {
          out[key] = from[key] + (target[key] - from[key]) * k;
        }
        return out;
      }
      if (!spin || (landRequested && landDuration === 0)) return finish(target);
      if (landDuration === 0) return { ...target, yaw: spinYaw(target, t) };
      const k = (t - landStart) / landDuration;
      return k >= 1 ? finish(target) : { ...target, yaw: yawFrom + (yawTo - yawFrom) * (k + k * k - k * k * k) };
    },
    /** Ease the spin out to the next full turn (at least landMinDuration long). */
    land: (time: number) => {
      const t = Math.max(0, time - initialDelay);
      if (landRequested) return;
      landRequested = true;
      if (!spin || t <= introEnd) return;
      const params = getParams();
      const current = spinYaw(params, t);
      let target = params.yaw + 360 * Math.ceil((current - params.yaw) / 360);
      if (target - current < 0.001) target += 360;
      landStart = t;
      yawFrom = current;
      yawTo = target;
      landDuration = Math.max(landMinDuration, (target - current) / degreesPerSecond);
    },
    isFinished: () => finished,
  };
}
