import type { CSSProperties, ElementType, HTMLAttributes } from "react";
import { cx } from "@/lib/cx";
import styles from "@/styles/reveal";

export type StaggerProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType;
  effect?: "rise" | "fade" | "fade-up" | "wipe";
  index?: number;
  step?: "coarse" | "fine";
  enabled?: boolean;
  href?: string;
};

/**
 * One staggered reveal item (the original's `Reveal` server component).
 * It only sets classes and `--stagger`; the parent RevealGroup triggers the CSS animation.
 */
export function Stagger({
  as,
  effect = "rise",
  index = 0,
  step = "coarse",
  enabled = true,
  className,
  style,
  ...rest
}: StaggerProps) {
  const Tag = as ?? "span";
  if (!enabled) return <Tag className={className} style={style} {...rest} />;
  return (
    <Tag
      className={cx(styles.root, styles[effect], step === "fine" && styles.fine, className)}
      style={{ ...style, "--stagger": index } as CSSProperties}
      {...rest}
    />
  );
}
