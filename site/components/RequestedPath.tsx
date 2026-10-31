"use client";

import { useSyncExternalStore } from "react";
import { Text } from "./Text";

const subscribe = () => () => {};
const clientPath = () => `${window.location.pathname}${window.location.search}`;
const serverPath = () => null;

export function RequestedPath({ className }: { className?: string }) {
  const path = useSyncExternalStore(subscribe, clientPath, serverPath);
  if (!path) return null;
  return (
    <Text as="span" variant="label-medium" color="foreground-50" className={className}>
      {path}
    </Text>
  );
}
