import type { Metadata } from "next";
import "./sway.css";
import type { ReactNode } from "react";
import { PageFade } from "@/components/PageFade";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { ViewportLock } from "@/components/ViewportLock";
import { ENTRY_SCRIPT } from "@/lib/entry";
import { SITE_URL } from "@/lib/routes";
import { SITE_DESCRIPTION } from "@/lib/structured-data";

const TITLE = "Sway | They check what. We check why.";

// The original compiled stylesheets, served unchanged from /public/assets/chunks (same order as the live site).
const STYLESHEETS = ["0ifg9kyxfi8qm.css", "01knk2oxdfznu.css", "1er25w4wq48_c.css", "0lwjj5dljl6wr.css"];

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: SITE_DESCRIPTION,
  manifest: "/manifest.webmanifest",
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: "Sway",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" dir="ltr" className="instrument_sans_f5a7536e-module__HLg-pG__variable" suppressHydrationWarning>
      <head>
        <link
          rel="preload"
          href="/assets/media/f06bf9da926bae75-s.p.3uuun_-7zsf1g.woff2"
          as="font"
          crossOrigin=""
          type="font/woff2"
        />
        {STYLESHEETS.map((file) => (
          <link key={file} rel="stylesheet" href={`/assets/chunks/${file}`} />
        ))}
      </head>
      <body>
        {/* Before first paint: flag the home intro (data-entry). */}
        <script dangerouslySetInnerHTML={{ __html: ENTRY_SCRIPT }} />
        <ViewportLock />
        <SiteHeader />
        <div id="main">{children}</div>
        <SiteFooter />
        <div className="site-frame-module__lGVkBW__root" aria-hidden="true" />
        <PageFade />
      </body>
    </html>
  );
}
