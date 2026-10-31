"use client";

import type { ComponentProps } from "react";
import { cx } from "@/lib/cx";
import styles from "@/styles/wipe-link";
import { Link } from "./Link";
import { useWipe, WipeBars } from "./wipe";

export function WipeLink({ className, children, ...rest }: ComponentProps<typeof Link>) {
  const { wipes, spawn, release, settle } = useWipe();
  return (
    <Link {...rest} className={cx(styles.root, className)} onMouseEnter={spawn} onMouseLeave={release}>
      {children}
      <span className={styles.sweep}>
        <WipeBars wipes={wipes} settle={settle} />
      </span>
    </Link>
  );
}
