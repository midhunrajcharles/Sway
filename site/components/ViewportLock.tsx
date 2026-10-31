"use client";

import { useEffect } from "react";

export const VIEWPORT_HEIGHT_PROPERTY = "--viewport-height";

export function ViewportLock() {
  useEffect(() => {
    const root = document.documentElement;
    const coarse = window.matchMedia("(pointer: coarse)");
    let width = window.innerWidth;
    const apply = () => {
      root.style.setProperty(VIEWPORT_HEIGHT_PROPERTY, `${window.innerHeight}px`);
    };
    const onResize = () => {
      const next = window.innerWidth;
      // On touch devices, ignore height-only resizes (URL bar show/hide).
      if (coarse.matches && next === width) return;
      width = next;
      apply();
    };
    const onOrientation = () => {
      width = window.innerWidth;
      apply();
    };
    apply();
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onOrientation);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onOrientation);
      root.style.removeProperty(VIEWPORT_HEIGHT_PROPERTY);
    };
  }, []);
  return null;
}
