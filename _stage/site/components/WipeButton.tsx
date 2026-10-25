"use client";

import type { MouseEventHandler, ReactNode } from "react";
import { cx } from "@/lib/cx";
import styles from "@/styles/wipe-button";
import { ArrowIcon, type ArrowDirection } from "./ArrowIcon";
import { Link } from "./Link";
import { Text } from "./Text";
import { useWipe, WipeBars } from "./wipe";

type Props = {
  href?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  children?: ReactNode;
  arrow?: ArrowDirection;
  external?: boolean;
  className?: string;
};

export function WipeButton({ href, onClick, children, arrow, external = false, className }: Props) {
  const { wipes, spawn, release, settle } = useWipe();

  const label = (
    <>
      <Text as="span" variant="body-large" weight="medium">
        {children}
      </Text>
      {arrow && <ArrowIcon direction={arrow} />}
    </>
  );

  const inner = (
    <>
      <span className={styles.content}>{label}</span>
      <span className={styles.sweep} aria-hidden="true">
        <WipeBars wipes={wipes} settle={settle}>
          <span className={cx(styles.content, styles.ghost)}>{label}</span>
          <span className={styles.cornerStart} />
          <span className={styles.cornerEnd} />
        </WipeBars>
      </span>
    </>
  );

  if (href === undefined) {
    return (
      <button
        type="button"
        className={cx(styles.root, className)}
        onClick={onClick}
        onMouseEnter={spawn}
        onMouseLeave={release}
      >
        {inner}
      </button>
    );
  }

  return (
    <Link
      className={cx(styles.root, className)}
      href={href}
      {...(external && { target: "_blank", rel: "noopener noreferrer" })}
      onMouseEnter={spawn}
      onMouseLeave={release}
    >
      {inner}
    </Link>
  );
}
