// Builds the hero liquid mask off the main thread.
// (The original worker chunk wasn't in the scrape; it wraps the same buildLiquidMask.)
import { buildLiquidMask, createRasterizer, type LiquidMaskOptions } from "./liquid-mask";

self.onmessage = (event: MessageEvent<LiquidMaskOptions>) => {
  try {
    const rasterize = createRasterizer((width, height) => {
      const ctx = new OffscreenCanvas(width, height).getContext("2d", { willReadFrequently: true });
      if (!ctx) throw Error("2d context unavailable");
      return ctx;
    });
    const mask = buildLiquidMask(event.data, rasterize);
    self.postMessage({ type: "mask", mask }, {
      transfer: [mask.base.buffer, mask.meta.buffer, mask.field.buffer],
    });
  } catch (error) {
    self.postMessage({ type: "error", message: error instanceof Error ? error.message : String(error) });
  }
};
