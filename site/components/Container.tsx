import type { ElementType, ReactNode } from "react";
import { cx } from "@/lib/cx";
import styles from "@/styles/container";

export function Container({
  children,
  width = "wide",
  className,
  as: Tag = "div",
}: {
  children?: ReactNode;
  width?: "full" | "wide" | "narrow" | "prose";
  className?: string;
  as?: ElementType;
}) {
  return <Tag className={cx(styles.root, styles[width], className)}>{children}</Tag>;
}
