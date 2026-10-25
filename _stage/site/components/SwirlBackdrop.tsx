"use client";

import { useEffect, useRef } from "react";
import { homeAnchors } from "@/lib/routes";
import { createInterpolator, SWIRL_KEYFRAMES } from "@/lib/swirl/keyframes";
import { MetallicSwirl, type MetallicSwirlHandle } from "./MetallicSwirl";

const interpolate = createInterpolator(SWIRL_KEYFRAMES);
const STOP_IDS = [homeAnchors.capabilities, homeAnchors.proprietaryInvestments, homeAnchors.infrastructure];

// Values of the original's dev-only tuning panel (SwirlTweaks), which renders nothing in production.
const SMOOTHING = 3;
const SCROLL_SCRUB = 0;

/** The swirl behind the [data-swirl-band]; scroll position eases it between keyframes. */
export function SwirlBackdrop() {
  const swirl = useRef<MetallicSwirlHandle>(null);

  useEffect(() => {
    const band = document.querySelector<HTMLElement>("[data-swirl-band]");
    const sections = STOP_IDS.map((id) => document.getElementById(id));
    if (!band || sections.some((s) => !s)) return;

    let stops: number[] = [];
    let bandTop = 0;
    let target = 0;
    let current = 0;
    let force = true;
    let frameId = 0;
    let lastFrame = 0;

    // Keyframe stops: band top, the middle of each section, band bottom.
    const measure = () => {
      const scrollY = window.scrollY;
      const top = band.getBoundingClientRect().top + scrollY;
      bandTop = top;
      stops = [
        top,
        ...sections.map((s) => {
          const rect = s!.getBoundingClientRect();
          return rect.top + scrollY + rect.height / 2;
        }),
        top + band.offsetHeight,
      ];
    };

    const positionAt = (y: number) => {
      const last = stops.length - 1;
      if (y <= stops[0]) return 0;
      if (y >= stops[last]) return last;
      let i = 0;
      while (i < last - 1 && y >= stops[i + 1]) i++;
      return i + (y - stops[i]) / (stops[i + 1] - stops[i]);
    };

    const step = (now: number) => {
      const dt = Math.min((now - lastFrame) / 1000, 0.1);
      lastFrame = now;
      const diff = target - current;
      if (Math.abs(diff) < 1e-4) current = target;
      else current += diff * (1 - Math.exp(-dt * SMOOTHING));
      swirl.current?.setParams(interpolate(current));
      force = false;
      frameId = current !== target ? requestAnimationFrame(step) : 0;
    };

    const onScroll = () => {
      const scrollY = window.scrollY;
      const viewport = window.innerHeight;
      target = positionAt(scrollY + viewport / 2);
      swirl.current?.setTimeOffset(((scrollY - bandTop) / viewport) * SCROLL_SCRUB);
      if ((current !== target || force) && !frameId) {
        lastFrame = performance.now();
        frameId = requestAnimationFrame(step);
      }
    };

    const onResize = () => {
      measure();
      onScroll();
    };

    measure();
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    const observer = new ResizeObserver(onResize);
    observer.observe(band);
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      observer.disconnect();
    };
  }, []);

  return <MetallicSwirl ref={swirl} {...SWIRL_KEYFRAMES[0]} />;
}
