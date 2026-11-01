"use client";

import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, type CSSProperties, type Ref } from "react";
import { cx } from "@/lib/cx";
import {
  CHROME_SYMBOL_DEFAULTS,
  FIELD_PADDING,
  FIELD_PIXELS_PER_UNIT,
  type ChromeParams,
  type Shape,
} from "@/lib/chrome-symbol/constants";
import { createChromeController, type ChromeController } from "@/lib/chrome-symbol/controller";
import { shapeFieldExtent, SYMBOL_FIELD_EXTENT, type FieldExtent } from "@/lib/chrome-symbol/field";
import styles from "@/styles/chrome-symbol";
import { Symbol } from "./Logo";

/** How much the canvas extends past the glyph on each side (the field padding), as a fraction. */
function canvasPads(extent: FieldExtent) {
  return {
    x: (extent.halfWidth - extent.glyphHalfWidth) / (2 * extent.glyphHalfWidth),
    y: (extent.halfHeight - extent.glyphHalfHeight) / (2 * extent.glyphHalfHeight),
  };
}
const SYMBOL_PADS = canvasPads(SYMBOL_FIELD_EXTENT);

type SizeProps = { width?: string | number; height?: string | number; title?: string };

/** Flat SVG version of a custom shape (shown under the canvas / when WebGL fails). */
function ShapeGlyph({ shape, width, height, title, className, style }: SizeProps & { shape: Shape; className?: string; style?: CSSProperties }) {
  const [x, y, w, h] = shape.viewBox;
  return (
    <svg
      viewBox={`${x} ${y} ${w} ${h}`}
      role={title ? "img" : undefined}
      aria-hidden={!title || undefined}
      focusable="false"
      className={className}
      style={{
        display: "block",
        aspectRatio: w / h,
        width: width ?? "auto",
        height: height ?? (width === undefined ? "1em" : "auto"),
        ...style,
      }}
    >
      {title ? <title>{title}</title> : null}
      {shape.paths.map((path, i) => (
        <path
          key={i}
          d={path.d}
          fill="currentColor"
          fillRule={path.fillRule}
          clipRule={path.fillRule}
          transform={path.offset ? `translate(${path.offset[0]} ${path.offset[1]})` : undefined}
        />
      ))}
    </svg>
  );
}

export type ChromeSymbolHandle = {
  setParams: (params: Partial<ChromeParams>) => void;
  getParams: () => ChromeParams;
  land: () => void;
  replayIntro: () => void;
  beginSequence: () => unknown;
};

type Props = SizeProps & {
  className?: string;
  style?: CSSProperties;
  params?: Partial<ChromeParams>;
  intro?: boolean;
  spin?: boolean;
  shape?: Shape;
  capture?: boolean;
  canvasRef?: Ref<HTMLCanvasElement | null>;
  onLanded?: () => void;
  onLive?: (live: boolean) => void;
  ref?: Ref<ChromeSymbolHandle>;
};

/** The Sway symbol rendered as 3D chrome (WebGL), over a flat SVG fallback. */
export function ChromeSymbol({
  className,
  style,
  params,
  intro = false,
  spin = false,
  shape,
  capture = false,
  canvasRef,
  onLanded,
  onLive,
  ref,
  ...size
}: Props) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const controller = useRef<ChromeController | null>(null);
  const overrides = useRef<Partial<ChromeParams>>({});
  const introDone = useRef(false);
  const landRequested = useRef(false);
  const onLandedRef = useRef(onLanded);
  const onLiveRef = useRef(onLive);
  const [live, setLive] = useState(false);
  const [failed, setFailed] = useState(false);

  const paramsKey = JSON.stringify(params ?? {});
  const baseParams = useMemo<ChromeParams>(() => ({ ...CHROME_SYMBOL_DEFAULTS, ...JSON.parse(paramsKey) }), [paramsKey]);
  const shapeKey = shape ? JSON.stringify(shape) : "";
  const shapeInfo = useMemo(() => {
    const source: Shape | undefined = shapeKey ? JSON.parse(shapeKey) : undefined;
    return {
      source,
      // A new canvas is needed whenever the session config changes (control was transferred).
      key: `${shapeKey}|${capture}|${intro}|${spin}`,
      pads: source ? canvasPads(shapeFieldExtent(source.viewBox, FIELD_PIXELS_PER_UNIT, FIELD_PADDING)) : SYMBOL_PADS,
    };
  }, [shapeKey, capture, intro, spin]);
  const { source, pads } = shapeInfo;

  useEffect(() => {
    onLandedRef.current = onLanded;
    onLiveRef.current = onLive;
  }, [onLanded, onLive]);

  const handleLive = useCallback((value: boolean) => {
    setLive(value);
    onLiveRef.current?.(value);
  }, []);
  const handleLanded = useCallback(() => {
    if (introDone.current) return;
    introDone.current = true;
    onLandedRef.current?.();
  }, []);

  useImperativeHandle<HTMLCanvasElement | null, HTMLCanvasElement | null>(canvasRef, () => canvas.current);

  useEffect(() => {
    const root = rootRef.current;
    const el = canvas.current;
    if (!root || !el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      if (landRequested.current) handleLanded();
      return;
    }
    const c = createChromeController({
      root,
      canvas: el,
      params: { ...baseParams, ...overrides.current },
      intro: intro && !introDone.current,
      spin,
      shape: source,
      capture,
      onLive: handleLive,
      onLanded: handleLanded,
      onFail: () => setFailed(true),
    });
    controller.current = c;
    if (landRequested.current) c.land();
    return () => {
      c.dispose();
      controller.current = null;
      handleLive(false);
    };
  }, [baseParams, intro, spin, shapeInfo, source, capture, handleLanded, handleLive]);

  useImperativeHandle(
    ref,
    () => ({
      setParams: (next) => {
        overrides.current = { ...overrides.current, ...next };
        controller.current?.setParams(next);
      },
      getParams: () => ({ ...baseParams, ...overrides.current }),
      land: () => {
        landRequested.current = true;
        const c = controller.current;
        if (c) c.land();
        else handleLanded();
      },
      replayIntro: () => {
        introDone.current = false;
        landRequested.current = false;
        controller.current?.replayIntro();
      },
      beginSequence: () => controller.current?.beginSequence() ?? null,
    }),
    [handleLanded, baseParams],
  );

  return (
    <span
      ref={rootRef}
      className={cx(styles.root, className)}
      data-live={live || undefined}
      data-failed={failed || undefined}
      style={{ ...style, "--chrome-symbol-pad-x": pads.x, "--chrome-symbol-pad-y": pads.y } as CSSProperties}
    >
      {source ? (
        <ShapeGlyph {...size} shape={source} className={styles.glyph} />
      ) : (
        <Symbol {...size} className={styles.glyph} />
      )}
      <canvas key={shapeInfo.key} ref={canvas} className={styles.canvas} aria-hidden="true" />
    </span>
  );
}
