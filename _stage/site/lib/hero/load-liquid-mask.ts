import { buildLiquidMask, createRasterizer, type LiquidMask, type LiquidMaskOptions } from "./liquid-mask";

const cache = new Map<string, Promise<LiquidMask>>();

function buildOnMainThread(options: LiquidMaskOptions) {
  const rasterize = createRasterizer((width, height) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw Error("2d context unavailable");
    return ctx;
  });
  return buildLiquidMask(options, rasterize);
}

/** Build (once per size) the hero mask, in a worker when the browser supports OffscreenCanvas. */
export function loadLiquidMask(options: LiquidMaskOptions) {
  const key = `${options.width}:${options.shadeFloor}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const pending = (async () => {
    performance.mark("hero-liquid-mask:start");
    try {
      if (!(typeof Worker !== "undefined" && typeof OffscreenCanvas !== "undefined")) {
        return buildOnMainThread(options);
      }
      return await new Promise<LiquidMask>((resolve, reject) => {
        const worker = new Worker(new URL("./mask.worker.ts", import.meta.url), { type: "module" });
        const finish = (fn: () => void) => {
          worker.terminate();
          fn();
        };
        worker.onerror = (event) => finish(() => reject(Error(event.message || "mask worker failed")));
        worker.onmessage = (event) => {
          const data = event.data;
          if (data.type === "mask") finish(() => resolve(data.mask));
          else finish(() => reject(Error(data.message)));
        };
        worker.postMessage(options);
      }).catch(() => buildOnMainThread(options));
    } finally {
      performance.measure("hero-liquid-mask", "hero-liquid-mask:start");
    }
  })();
  pending.catch(() => cache.delete(key));
  cache.set(key, pending);
  return pending;
}
