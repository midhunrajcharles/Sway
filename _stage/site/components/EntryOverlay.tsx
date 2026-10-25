"use client";

import { Fragment, useCallback, useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { CHROME_SYMBOL_INTRO } from "@/lib/chrome-symbol/constants";
import { cubicBezier } from "@/lib/chrome-symbol/timeline";
import {
  clearEntryBrand,
  clearEntryOverlay,
  ENTRY_LOCK_ATTRIBUTE,
  ENTRY_LOCK_FRAMES,
  ENTRY_OVERLAY_FAILSAFE,
  ENTRY_SWAP_DURATION,
  hasEntryOverlay,
  isOverlayLifted,
  liftOverlay,
  onOverlayLifted,
  whenPageReady,
} from "@/lib/entry";
import { isGateSettled, subscribeToGateSettled } from "@/lib/gate";
import styles from "@/styles/entry-overlay";
import { ChromeSymbol, type ChromeSymbolHandle } from "./ChromeSymbol";
import { Container } from "./Container";
import { Text } from "./Text";

const WORDS = ["Check", "why"];
const DOCK_EASE = [0.5, 0, 0, 1];
const DOCK_DURATION = 800;

const overlayStyle = {
  "--dock-duration": `${DOCK_DURATION}ms`,
  "--swap-duration": `${ENTRY_SWAP_DURATION}ms`,
  "--bg-duration": "400ms",
  "--text-duration": "400ms",
  "--dock-ease": `cubic-bezier(${DOCK_EASE.join(", ")})`,
  "--wordmark-delay": `${CHROME_SYMBOL_INTRO.initialDelay}s`,
  "--wordmark-reveal": `${CHROME_SYMBOL_INTRO.depthDuration}s`,
  "--wordmark-spread": `${CHROME_SYMBOL_INTRO.blendDuration}s`,
  "--wordmark-reveal-ease": `cubic-bezier(${CHROME_SYMBOL_INTRO.depthEase.join(", ")})`,
  "--wordmark-spread-ease": `cubic-bezier(${CHROME_SYMBOL_INTRO.blendEase.join(", ")})`,
} as CSSProperties;

const noopSubscribe = () => () => {};
const notSettled = () => false;

function isDarkColor(color: string) {
  const [r = 0, g = 0, b = 0] = color.match(/[\d.]+/g)?.map(Number) ?? [];
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 < 0.5;
}

/** Reads the CSS `--reveal-delay` custom property as milliseconds. */
function revealDelayMs() {
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--reveal-delay").trim();
  const value = parseFloat(raw);
  if (!Number.isFinite(value)) return 0;
  return raw.endsWith("ms") ? value : 1000 * value;
}

type Phase = "holding" | "docking" | "leaving" | "swapping" | "gone";

/**
 * Home-page intro: the chrome symbol spins between "Check" and "why" until the page
 * is ready, then flies into the header logo while the overlay fades away.
 */
export function EntryOverlay() {
  const initial = useRef<boolean | null>(null);
  const active = useSyncExternalStore(
    noopSubscribe,
    () => (initial.current ??= hasEntryOverlay()),
    () => true,
  );
  const symbol = useRef<ChromeSymbolHandle>(null);
  const dock = useRef<HTMLSpanElement>(null);
  const frame = useRef(0);
  const docked = useRef(false);
  const pageReady = useRef(false);
  const symbolLanded = useRef(false);
  const [phase, setPhase] = useState<Phase>("holding");
  const [live, setLive] = useState(false);
  const gated = !useSyncExternalStore(subscribeToGateSettled, isGateSettled, notSettled);

  const leave = useCallback(() => {
    setPhase((p) => (p === "holding" || p === "docking" ? "leaving" : p));
  }, []);

  // Fly the 3D symbol onto the header logo, fading its exposure towards the logo colour.
  const dockSymbol = useCallback(() => {
    const dockEl = dock.current;
    const handle = symbol.current;
    const target = document.querySelector("[data-site-symbol] svg");
    if (!dockEl || !handle || !target) return void leave();
    const from = dockEl.getBoundingClientRect();
    const to = target.getBoundingClientRect();
    if (from.height === 0 || to.height === 0) return void leave();
    const { fit, exposure } = handle.getParams();
    dockEl.style.setProperty("--dock-x", `${to.left + to.width / 2 - (from.left + from.width / 2)}px`);
    dockEl.style.setProperty("--dock-y", `${to.top + to.height / 2 - (from.top + from.height / 2)}px`);
    dockEl.style.setProperty("--dock-scale", String(to.height / (from.height * fit)));
    const targetExposure = 64 * Number(!isDarkColor(getComputedStyle(target).color));
    const ease = cubicBezier(DOCK_EASE);
    const liftAt = Math.max(0, 0 - revealDelayMs());
    let lifted = false;
    let leaving = false;
    const start = performance.now();
    const step = (now: number) => {
      const t = now - start;
      const k = Math.min(t / DOCK_DURATION, 1);
      handle.setParams({ exposure: exposure + (targetExposure - exposure) * ease(k) });
      if (!lifted && t >= liftAt) {
        lifted = true;
        liftOverlay();
        clearEntryOverlay();
      }
      if (!leaving && t >= 0) {
        leaving = true;
        setPhase("leaving");
      }
      if (t < DOCK_DURATION) {
        frame.current = requestAnimationFrame(step);
        return;
      }
      frame.current = 0;
      setPhase("swapping");
    };
    docked.current = true;
    frame.current = requestAnimationFrame(step);
    setPhase("docking");
  }, [leave]);

  const tryDock = useCallback(() => {
    if (pageReady.current && symbolLanded.current) dockSymbol();
  }, [dockSymbol]);

  const handleLanded = useCallback(() => {
    symbolLanded.current = true;
    tryDock();
  }, [tryDock]);

  // When the page is ready, ask the symbol to finish its spin; dock once it has landed.
  useEffect(() => {
    if (!active || gated) return;
    let cancelled = false;
    whenPageReady().then(() => {
      if (cancelled) return;
      pageReady.current = true;
      const handle = symbol.current;
      if (handle) handle.land();
      else symbolLanded.current = true;
      tryDock();
    });
    const failsafe = window.setTimeout(leave, ENTRY_OVERLAY_FAILSAFE);
    return () => {
      cancelled = true;
      window.clearTimeout(failsafe);
      cancelAnimationFrame(frame.current);
    };
  }, [active, gated, leave, tryDock]);

  // Show the wordmark anyway if the symbol hasn't gone live after 1.5s.
  useEffect(() => {
    if (!active || gated || live) return;
    const timer = window.setTimeout(() => setLive(true), 1500);
    return () => window.clearTimeout(timer);
  }, [active, gated, live]);

  // Lock scrolling (data-entry-lock) a few frames in, until the overlay lifts.
  useEffect(() => {
    if (!active || isOverlayLifted()) return;
    const root = document.documentElement;
    const unlock = () => root.removeAttribute(ENTRY_LOCK_ATTRIBUTE);
    let raf = 0;
    let frames = ENTRY_LOCK_FRAMES;
    const wait = () => {
      if (--frames > 0) {
        raf = requestAnimationFrame(wait);
        return;
      }
      raf = 0;
      if (!isOverlayLifted()) root.setAttribute(ENTRY_LOCK_ATTRIBUTE, "");
    };
    raf = requestAnimationFrame(wait);
    const offLift = onOverlayLifted(unlock);
    return () => {
      cancelAnimationFrame(raf);
      offLift();
      unlock();
    };
  }, [active]);

  // Leaving without docking (failsafe): lift now, unmount after the fade.
  useEffect(() => {
    if (phase !== "leaving" || docked.current) return;
    liftOverlay();
    clearEntryOverlay();
    const timer = window.setTimeout(() => setPhase("gone"), 400);
    return () => window.clearTimeout(timer);
  }, [phase]);

  // Swap the flying symbol for the real header logo.
  useEffect(() => {
    if (phase !== "swapping" && phase !== "gone") return;
    clearEntryBrand();
    if (phase !== "swapping") return;
    const timer = window.setTimeout(() => setPhase("gone"), ENTRY_SWAP_DURATION);
    return () => window.clearTimeout(timer);
  }, [phase]);

  if (!active || phase === "gone") return null;

  return (
    <div
      className={styles.root}
      data-theme="light"
      data-leaving={phase === "leaving" || phase === "swapping" || undefined}
      data-docking={phase !== "holding" || undefined}
      data-swapping={phase === "swapping" || undefined}
      data-live={live || undefined}
      style={overlayStyle}
      aria-hidden="true"
      role="presentation"
    >
      <Container width="full" className={styles.wordmark}>
        {WORDS.map((word, i) => (
          <Fragment key={word}>
            {i === 1 && (
              <span ref={dock} className={styles.dock}>
                {!gated && (
                  <ChromeSymbol
                    ref={symbol}
                    height="5rem"
                    intro
                    spin
                    onLanded={handleLanded}
                    onLive={(value) => value && setLive(true)}
                  />
                )}
              </span>
            )}
            <Text variant="display-fluid" className={styles.word}>
              {word}
            </Text>
          </Fragment>
        ))}
      </Container>
    </div>
  );
}
