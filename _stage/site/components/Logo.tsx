import type { CSSProperties } from "react";

import { SYMBOL_PATH, SYMBOL_VIEW_BOX } from "@/lib/symbol";

export { SYMBOL_PATH, SYMBOL_VIEW_BOX };

const [, , VB_W, VB_H] = SYMBOL_VIEW_BOX.split(" ").map(Number);
export const SYMBOL_RATIO = VB_W / VB_H;

type MarkProps = {
  width?: string | number;
  height?: string | number;
  title?: string;
  className?: string;
  style?: CSSProperties;
};

export function Symbol({ width, height, title, className, style }: MarkProps) {
  return (
    <svg
      viewBox={SYMBOL_VIEW_BOX}
      role={title ? "img" : undefined}
      aria-hidden={!title || undefined}
      focusable="false"
      className={className}
      style={{
        display: "block",
        aspectRatio: SYMBOL_RATIO,
        width: width ?? "auto",
        height: height ?? (width === undefined ? "1em" : "auto"),
        ...style,
      }}
    >
      {title ? <title>{title}</title> : null}
      <path fillRule="evenodd" clipRule="evenodd" d={SYMBOL_PATH} fill="currentColor" />
    </svg>
  );
}
