"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cx } from "@/lib/cx";
import overlay from "@/styles/overlay";
import wipeLabel from "@/styles/wipe-label";

/** Keeps a component mounted for `durationMs` after close() so its exit animation can play. */
export function useClosing(durationMs: number, onClosed: () => void) {
  const [closing, setClosing] = useState(false);
  const pending = useRef(false);
  const reset = useCallback(() => {
    pending.current = false;
    setClosing(false);
  }, []);
  const close = useCallback(() => {
    if (pending.current) return;
    pending.current = true;
    setClosing(true);
    window.setTimeout(onClosed, durationMs);
  }, [durationMs, onClosed]);
  return { closing, close, reset };
}

export function Overlay({
  children,
  onClose,
  closeLabel,
  align = "top",
  open = true,
  durationMs = 0,
  className,
}: {
  children?: ReactNode;
  onClose: () => void;
  closeLabel: string;
  align?: "top" | "center";
  open?: boolean;
  durationMs?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    ref.current?.querySelector<HTMLElement>("[data-overlay-focus]")?.focus();
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className={cx(overlay.root, overlay[align], className)}
      style={{ "--overlay-duration": `${durationMs}ms` } as CSSProperties}
    >
      <button
        type="button"
        className={cx(overlay.backdrop, !open && overlay.backdropHidden)}
        aria-label={closeLabel}
        onClick={onClose}
      />
      {children}
    </div>
  );
}

export function WipeLabel({ children, hiding = false }: { children?: ReactNode; hiding?: boolean }) {
  return (
    <span className={cx(wipeLabel.root, hiding && wipeLabel.hiding)}>
      <span className={wipeLabel.text}>{children}</span>
      <span className={wipeLabel.box} aria-hidden="true" />
    </span>
  );
}
