"use client";

import { useEffect, useRef } from "react";
import { cx } from "@/lib/cx";
import styles from "@/styles/wipe-rule";
import { useWipe, WipeBars } from "./wipe";

/** A divider line that wipes to full strength while `active`. */
export function WipeRule({ active = false, className }: { active?: boolean; className?: string }) {
  const { wipes, spawn, prefill, release, settle } = useWipe();
  const last = useRef(active);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      if (active) prefill();
      return;
    }
    if (active === last.current) return;
    last.current = active;
    if (active) spawn();
    else release();
  }, [active, spawn, prefill, release]);

  return (
    <div className={cx(styles.rule, className)}>
      <div className={styles.base} />
      <WipeBars wipes={wipes} settle={settle} />
    </div>
  );
}
