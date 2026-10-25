"use client";

import { useEffect, useRef, type ElementType, type HTMLAttributes } from "react";
import { cx } from "@/lib/cx";
import { resolveInView } from "@/lib/in-view";
import styles from "@/styles/group";

type Props = HTMLAttributes<HTMLElement> & { as?: ElementType };

/** Sets data-in-view once scrolled into view; CSS runs the staggered reveals inside. */
export function RevealGroup({ as, className, ...rest }: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || el.dataset.inView !== undefined) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.dataset.inView = "";
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => resolveInView(e))) {
          el.dataset.inView = "";
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -7% 0px", threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const Tag = as ?? "div";
  return <Tag ref={ref} className={cx(styles.group, className)} {...rest} />;
}
