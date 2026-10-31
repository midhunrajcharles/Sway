"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cx } from "@/lib/cx";
import { durations } from "@/lib/durations";
import styles from "@/styles/page-fade";

type Phase = "idle" | "cover" | "hold" | "reveal";

let cover: (() => Promise<void>) | null = null;

/** Fade the page out before a route change. Resolves once the cover is opaque. */
export function coverPage() {
  return cover ? cover() : Promise.resolve();
}

export function PageFade() {
  const [phase, setPhase] = useState<Phase>("idle");
  const pathname = usePathname();
  const fromPath = useRef<string | null>(null);

  useEffect(() => {
    cover = () => {
      fromPath.current = window.location.pathname;
      setPhase("cover");
      return new Promise<void>((resolve) => {
        window.setTimeout(() => {
          setPhase((p) => (p === "cover" ? "hold" : p));
          resolve();
        }, durations.slow);
      });
    };
    return () => {
      cover = null;
    };
  }, []);

  useEffect(() => {
    if (fromPath.current === null || pathname === fromPath.current) return;
    fromPath.current = null;
    if (!window.location.hash) window.scrollTo(0, 0);
    const raf = requestAnimationFrame(() => setPhase("reveal"));
    const timer = window.setTimeout(() => setPhase("idle"), durations.slow + 100);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, [pathname]);

  // Safety net: if navigation never lands, uncover after 4s.
  useEffect(() => {
    if (phase !== "hold") return;
    const timer = window.setTimeout(() => {
      fromPath.current = null;
      setPhase("reveal");
      window.setTimeout(() => setPhase("idle"), durations.slow + 100);
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [phase]);

  return (
    <div
      aria-hidden="true"
      className={cx(
        styles.root,
        (phase === "cover" || phase === "hold") && styles.covered,
        phase === "idle" && styles.idle,
      )}
    />
  );
}
