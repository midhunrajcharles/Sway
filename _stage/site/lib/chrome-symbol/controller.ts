// Drives a chrome symbol canvas: prefers a worker + OffscreenCanvas, falls back
// to rendering on the main thread if the worker doesn't say hello within 1.2s.
import type { ChromeParams, Shape } from "./constants";
import { createSession } from "./session";

type Driver = {
  setParams: (params: Partial<ChromeParams>) => void;
  resize: (width: number, height: number) => void;
  setVisible: (visible: boolean) => void;
  land: () => void;
  replayIntro: () => void;
  beginSequence: () => unknown;
  dispose: () => void;
};

export type ChromeController = ReturnType<typeof createChromeController>;

export function createChromeController({
  root,
  canvas,
  params,
  intro,
  spin,
  shape,
  capture = false,
  onLive,
  onLanded,
  onFail,
}: {
  root: HTMLElement;
  canvas: HTMLCanvasElement;
  params: ChromeParams;
  intro: boolean;
  spin: boolean;
  shape?: Shape;
  capture?: boolean;
  onLive: (live: boolean) => void;
  onLanded: () => void;
  onFail: () => void;
}) {
  let driver: Driver | null = null;
  let worker: Worker | null = null;
  let disposed = false;
  let failed = false;
  let landed = false;
  let landRequested = false;
  let width = 0;
  let height = 0;
  let inView = true;
  let startFrame = 0;
  let helloTimer = 0;
  const queue: ((d: Driver) => void)[] = [];

  const withDriver = (fn: (d: Driver) => void) => {
    if (driver) fn(driver);
    else queue.push(fn);
  };
  const setDriver = (d: Driver) => {
    driver = d;
    for (const fn of queue.splice(0)) fn(d);
  };
  const reportLanded = () => {
    if (landed || disposed) return;
    landed = true;
    onLanded();
  };
  const fail = () => {
    if (failed) return;
    failed = true;
    queue.length = 0;
    if (!disposed) onFail();
    // A failed symbol must not hold up the intro.
    if (landRequested) reportLanded();
  };

  const measure = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width * dpr));
    const h = Math.max(1, Math.round(rect.height * dpr));
    if (w !== width || h !== height) {
      width = w;
      height = h;
      withDriver((d) => d.resize(width, height));
    }
  };
  const updateVisible = () => {
    const visible = inView && document.visibilityState === "visible";
    withDriver((d) => d.setVisible(visible));
  };

  const startOnMainThread = () => {
    if (disposed || driver) return;
    startFrame = requestAnimationFrame(() => {
      startFrame = 0;
      if (disposed || driver) return;
      const session = createSession({
        canvas,
        params,
        intro,
        spin,
        width,
        height,
        shape,
        preserveDrawingBuffer: capture,
        onLive: (live) => {
          if (!live) fail();
          onLive(live);
        },
        onLanded: reportLanded,
      });
      if (session) setDriver(session);
      else fail();
    });
  };

  const resizeObserver = new ResizeObserver(measure);
  resizeObserver.observe(root);
  const visibility = new IntersectionObserver((entries) => {
    inView = entries[entries.length - 1]?.isIntersecting ?? true;
    updateVisible();
  });
  visibility.observe(canvas);
  const onVisibility = () => updateVisible();
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("resize", measure);
  measure();

  const startWorker = () => {
    if (
      capture ||
      typeof Worker !== "function" ||
      typeof OffscreenCanvas !== "function" ||
      typeof canvas.transferControlToOffscreen !== "function"
    )
      return false;
    let w: Worker;
    try {
      w = new Worker(new URL("./symbol.worker.ts", import.meta.url), { type: "module" });
    } catch {
      return false;
    }
    worker = w;
    const post = (message: unknown, transfer?: Transferable[]) => {
      if (transfer) w.postMessage(message, transfer);
      else w.postMessage(message);
    };
    const giveUp = () => {
      if (worker !== w) return;
      worker = null;
      w.terminate();
      if (!driver && !disposed) startOnMainThread();
    };
    helloTimer = window.setTimeout(giveUp, 1200);
    w.onerror = () => {
      window.clearTimeout(helloTimer);
      if (driver) {
        fail();
        onLive(false);
        return;
      }
      giveUp();
    };
    w.onmessage = (event) => {
      const msg = event.data;
      if (msg.type === "hello") {
        window.clearTimeout(helloTimer);
        if (disposed || driver) return;
        const offscreen = canvas.transferControlToOffscreen();
        post({ type: "init", canvas: offscreen, params, intro, spin, width, height, shape }, [offscreen]);
        setDriver({
          setParams: (p) => post({ type: "params", params: p }),
          resize: (rw, rh) => post({ type: "resize", width: rw, height: rh }),
          setVisible: (v) => post({ type: "visible", visible: v }),
          land: () => post({ type: "land" }),
          replayIntro: () => post({ type: "replay" }),
          beginSequence: () => null,
          dispose: () => post({ type: "dispose" }),
        });
        return;
      }
      if (msg.type === "live") {
        if (!msg.live) fail();
        onLive(msg.live);
        return;
      }
      reportLanded();
    };
    return true;
  };

  if (!startWorker()) startOnMainThread();

  return {
    setParams: (next: Partial<ChromeParams>) => {
      Object.assign(params, next);
      withDriver((d) => d.setParams(next));
    },
    land: () => {
      landRequested = true;
      if (failed) reportLanded();
      else withDriver((d) => d.land());
    },
    replayIntro: () => {
      landed = false;
      landRequested = false;
      withDriver((d) => d.replayIntro());
    },
    beginSequence: () => (!driver || worker || failed ? null : driver.beginSequence()),
    dispose: () => {
      disposed = true;
      if (startFrame !== 0) cancelAnimationFrame(startFrame);
      window.clearTimeout(helloTimer);
      resizeObserver.disconnect();
      visibility.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", measure);
      driver?.dispose();
      driver = null;
      queue.length = 0;
      if (worker) {
        worker.terminate();
        worker = null;
      }
    },
  };
}
