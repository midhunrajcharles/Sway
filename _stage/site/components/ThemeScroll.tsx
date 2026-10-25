"use client";

import { useEffect } from "react";

/** Switches the page to the dark theme once the target section reaches mid-screen. */
export function ThemeScroll({ targetId }: { targetId: string }) {
  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target) return;
    const root = document.documentElement;
    const initial = root.dataset.theme;
    const restore = () => {
      if (initial === undefined) delete root.dataset.theme;
      else root.dataset.theme = initial;
    };
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        if (!entry) return;
        const theme = entry.rootBounds
          ? entry.boundingClientRect.top <= entry.rootBounds.bottom
            ? "dark"
            : "light"
          : entry.isIntersecting || entry.boundingClientRect.top < 0
            ? "dark"
            : "light";
        if (theme === "dark") {
          root.dataset.theme = "dark";
          target.dataset.inView = "";
        } else {
          delete root.dataset.theme;
        }
      },
      { rootMargin: "0px 0px -50% 0px" },
    );
    const reobserve = () => {
      observer.unobserve(target);
      observer.observe(target);
    };
    observer.observe(target);
    window.addEventListener("pagehide", restore);
    window.addEventListener("pageshow", reobserve);
    return () => {
      observer.disconnect();
      window.removeEventListener("pagehide", restore);
      window.removeEventListener("pageshow", reobserve);
      restore();
    };
  }, [targetId]);
  return null;
}
