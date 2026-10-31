"use client";

import { useLayoutEffect } from "react";

export function HeaderTone({ tone }: { tone?: string }) {
  useLayoutEffect(() => {
    if (!tone) return;
    document.documentElement.dataset.headerTone = tone;
    return () => {
      delete document.documentElement.dataset.headerTone;
    };
  }, [tone]);
  return null;
}
