import type { ElementType, HTMLAttributes } from "react";
import { cx } from "@/lib/cx";
import styles from "@/styles/text";

type Variant =
  | "body-large" | "body-medium" | "body-small"
  | "display-extra-large" | "display-fluid" | "display-large" | "display-medium" | "display-small"
  | "headline-large" | "headline-medium" | "headline-small"
  | "label-large" | "label-medium" | "label-small"
  | "title-large" | "title-medium" | "title-small";

type Props = HTMLAttributes<HTMLElement> & {
  as?: ElementType;
  variant?: Variant;
  weight?: "bold" | "medium" | "regular" | "semibold";
  color?: string;
  /** Passed through when `as` is a link component. */
  href?: string;
};

export function Text({ as, variant = "body-medium", weight, color, className, ...rest }: Props) {
  const Tag = as ?? "span";
  const map = styles as Record<string, string>;
  return (
    <Tag
      className={cx(
        styles.root,
        map[variant],
        weight && map[`weight-${weight}`],
        color && map[`color-${color}`],
        className,
      )}
      {...rest}
    />
  );
}
