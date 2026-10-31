"use client";

import styles from "@/styles/action-row";
import { useWipe, WipeBars } from "./wipe";

export function HoverSweep() {
  const { wipes, spawn, release, settle } = useWipe();
  return (
    <span className={styles.sweep} onMouseEnter={spawn} onMouseLeave={release}>
      <WipeBars wipes={wipes} settle={settle} />
    </span>
  );
}
