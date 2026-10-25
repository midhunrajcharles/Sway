"use client";

import { useEffect, useImperativeHandle, useMemo, useRef, useState, type Ref } from "react";
import { cx } from "@/lib/cx";
import { claimReady } from "@/lib/entry";
import {
  createMetallicSwirlRenderer,
  METALLIC_SWIRL_DEFAULTS,
  type SwirlParams,
  type SwirlRenderer,
  type TimeOffsetOptions,
} from "@/lib/swirl/metallic-swirl";
import styles from "@/styles/metallic-swirl";

export type MetallicSwirlHandle = {
  setParams: (params: Partial<SwirlParams>) => void;
  setTimeOffset: (value: number, options?: TimeOffsetOptions) => void;
  getTime: () => number;
  draw: () => void;
  beginSequence: () => ReturnType<SwirlRenderer["beginSequence"]>;
};

type Props = Partial<SwirlParams> & {
  className?: string;
  ref?: Ref<MetallicSwirlHandle>;
  capture?: boolean;
  canvasRef?: Ref<HTMLCanvasElement | null>;
};

export function MetallicSwirl({ className, ref, capture = false, canvasRef, ...paramProps }: Props) {
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");
  const canvas = useRef<HTMLCanvasElement>(null);
  const renderer = useRef<SwirlRenderer | null>(null);
  const key = JSON.stringify(paramProps);
  const params = useMemo<SwirlParams>(() => ({ ...METALLIC_SWIRL_DEFAULTS, ...JSON.parse(key) }), [key]);
  const latestParams = useRef(params);
  const overrides = useRef<Partial<SwirlParams>>({});
  const pendingOffset = useRef<[number, TimeOffsetOptions?] | null>(null);
  const captureRef = useRef(capture);

  useImperativeHandle<HTMLCanvasElement | null, HTMLCanvasElement | null>(canvasRef, () => canvas.current, []);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    let cancelled = false;
    const release = claimReady();
    Promise.resolve().then(() => {
      if (cancelled) return;
      try {
        renderer.current = createMetallicSwirlRenderer(el, {
          params: { ...latestParams.current, ...overrides.current },
          animated: !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
          capture: captureRef.current,
          onReady: () => {
            setState("ready");
            release();
          },
          onError: () => {
            setState("failed");
            release();
          },
        });
        if (pendingOffset.current) {
          renderer.current.setTimeOffset(...pendingOffset.current);
          pendingOffset.current = null;
        }
      } catch {
        setState("failed");
        release();
      }
    });
    return () => {
      cancelled = true;
      release();
      renderer.current?.dispose();
      renderer.current = null;
    };
  }, []);

  useEffect(() => {
    latestParams.current = params;
    renderer.current?.setParams({ ...params, ...overrides.current });
  }, [params]);

  useImperativeHandle(
    ref,
    () => ({
      setParams: (next) => {
        overrides.current = { ...overrides.current, ...next };
        renderer.current?.setParams(next);
      },
      setTimeOffset: (value, options) => {
        if (renderer.current) renderer.current.setTimeOffset(value, options);
        else pendingOffset.current = [value, options];
      },
      getTime: () => renderer.current?.getTime() ?? latestParams.current.initialTime,
      draw: () => renderer.current?.draw(),
      beginSequence: () => renderer.current?.beginSequence() ?? null,
    }),
    [],
  );

  return (
    <canvas
      ref={canvas}
      className={cx(styles.canvas, className)}
      data-ready={state === "ready"}
      hidden={state === "failed"}
      aria-hidden="true"
    />
  );
}
