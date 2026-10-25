"use client";

import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ComponentProps } from "react";
import { coverPage } from "./PageFade";

type Props = ComponentProps<typeof NextLink> & { fade?: boolean };

/** next/link that fades the page out before navigating to another route. */
export function Link({
  prefetch = true,
  fade = true,
  onClick,
  href,
  replace = false,
  scroll,
  target,
  ...rest
}: Props) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <NextLink
      prefetch={prefetch}
      href={href}
      replace={replace}
      scroll={scroll}
      target={target}
      onClick={(event) => {
        onClick?.(event);
        if (
          !fade ||
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          (target && target !== "_self")
        )
          return;
        const raw = typeof href === "string" ? href : (href.pathname ?? null);
        const path = raw && raw.startsWith("/") ? raw.split("#")[0].split("?")[0] : null;
        if (!path || path === pathname) return;
        event.preventDefault();
        const destination = typeof href === "string" ? href : (href.href ?? path);
        coverPage().then(() => {
          if (replace) router.replace(destination, { scroll });
          else router.push(destination, { scroll });
        });
      }}
      {...rest}
    />
  );
}
