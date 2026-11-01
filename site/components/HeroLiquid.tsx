"use client";

import { useEffect, useRef, useState } from "react";
import { claimReady } from "@/lib/entry";
import { CROP_ASPECT, OVERFLOW_SCALE } from "@/lib/hero/liquid-mask";
import { createLiquidRenderer } from "@/lib/hero/liquid-renderer";
import { loadLiquidMask } from "@/lib/hero/load-liquid-mask";
import { isGated, whenGateReleased } from "@/lib/gate";
import styles from "@/styles/hero";

/** Static stand-in for the liquid (shown until WebGL is ready, or when it can't run). */
function HeroLines({ className }: { className?: string }) {
  return (
    <svg
      className={className ? `${styles.lines} ${className}` : styles.lines}
      viewBox="0 0 1440 810"
      preserveAspectRatio="none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M-222.724 504.473C-222.724 504.473 304.862 504.473 749.059 504.473C1193.25 504.473 1176.74 692.755 1668 692.755"
        stroke="#202020"
        strokeWidth="151.074"
      />
      <path
        d="M-222.724 504.473C-222.724 504.473 60.4716 504.473 504.668 504.473C948.864 504.473 1176.74 -52.4742 1668 -52.4742"
        stroke="#868383"
        strokeWidth="151.074"
      />
      <path
        d="M-222.724 504.473C-222.724 504.473 304.862 504.473 749.059 504.473C1193.25 504.473 1176.74 259.574 1668 259.574"
        stroke="#383838"
        strokeWidth="151.074"
      />
      <path
        d="M-223.057 504.476C-223.057 504.476 -299.029 504.476 145.246 504.476C912.887 504.476 657.455 924.491 1668 924.491"
        stroke="#000000"
        strokeWidth="151.074"
      />
    </svg>
  );
}

/** Mask resolution: 2048 on large screens, 1024 otherwise. */
function maskWidth(width: number, height: number) {
  return Math.max(width, height * OVERFLOW_SCALE * CROP_ASPECT) >= 1024 ? 2048 : 1024;
}

export function HeroLiquid({ intro = true, shadeFloor = 0.35 }: { intro?: boolean; shadeFloor?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<"loading" | "active" | "fallback">("loading");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setState("fallback");
      return;
    }
    let cancelled = false;
    let renderer: ReturnType<typeof createLiquidRenderer> | null = null;
    const release = claimReady();
    // If a notice ever covered the page, the intro would not wait for it.
    if (isGated()) release();

    (async () => {
      try {
        const mask = await loadLiquidMask({
          width: maskWidth(window.innerWidth, window.innerHeight),
          shadeFloor,
        });
        await whenGateReleased();
        if (cancelled) return;
        renderer = createLiquidRenderer(canvas, mask, {
          intro,
          onActive: () => {
            setState("active");
            release();
          },
          onError: () => {
            setState("fallback");
            release();
          },
        });
      } catch {
        release();
        if (!cancelled) setState("fallback");
      }
    })();

    return () => {
      cancelled = true;
      release();
      renderer?.dispose();
    };
  }, [intro, shadeFloor]);

  const hideLines = state !== "fallback" && (intro || state === "active");
  return (
    <>
      <HeroLines className={hideLines ? styles.linesHidden : undefined} />
      <canvas
        ref={canvasRef}
        className={styles.liquid}
        data-active={state === "active"}
        hidden={state === "fallback"}
        aria-hidden="true"
      />
    </>
  );
}
