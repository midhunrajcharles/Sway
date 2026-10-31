"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import { cx } from "@/lib/cx";
import styles from "@/styles/wipe-bar";

type Wipe = { id: number; exiting: boolean; instant: boolean };

/** A stack of hover "wipe" bars: spawn on enter, release on leave, settle when the animation ends. */
export function useWipe() {
  const [wipes, setWipes] = useState<Wipe[]>([]);
  const nextId = useRef(0);

  const add = useCallback((instant: boolean) => {
    const id = nextId.current;
    nextId.current += 1;
    setWipes((list) => [...list, { id, exiting: false, instant }]);
  }, []);
  const spawn = useCallback(() => add(false), [add]);
  const prefill = useCallback(() => add(true), [add]);

  const release = useCallback(() => {
    setWipes((list) => {
      let index = -1;
      for (let i = list.length - 1; i >= 0; i -= 1) {
        if (!list[i].exiting) {
          index = i;
          break;
        }
      }
      if (index === -1) return list;
      const next = [...list];
      next[index] = { ...next[index], exiting: true };
      return next;
    });
  }, []);

  const settle = useCallback((id: number) => {
    setWipes((list) => list.filter((w) => w.id !== id));
  }, []);

  return { wipes, spawn, prefill, release, settle };
}

export function WipeBars({
  wipes,
  settle,
  align = "center",
  children,
}: {
  wipes: Wipe[];
  settle: (id: number) => void;
  align?: "center" | "baseline";
  children?: ReactNode;
}) {
  return wipes.map((wipe) => (
    <span
      key={wipe.id}
      aria-hidden="true"
      className={cx(
        styles.bar,
        styles[align],
        wipe.instant && styles.instant,
        wipe.exiting && styles.exiting,
      )}
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget) settle(wipe.id);
      }}
    >
      <span className={styles.fill}>{children}</span>
    </span>
  ));
}
