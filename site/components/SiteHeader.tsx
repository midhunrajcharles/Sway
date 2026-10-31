import type { CSSProperties } from "react";
import { Link } from "@/components/Link";
import { Menu } from "@/components/Menu";
import { Symbol } from "@/components/Logo";

/** Site header: logo + menu button. */
export default function SiteHeader() {
  return (
    <header className="styles-module__dkF0kG__root" style={{ "--entry-swap": "200ms", "--entry-brand": "400ms" } as CSSProperties}>
      <a className="styles-module__dkF0kG__skip" href="#main">
        Skip to content
      </a>
      <div className="container-module__fR7GYG__root container-module__fR7GYG__full styles-module__dkF0kG__inner">
        <Link className="styles-module__dkF0kG__brand" href="/">
          <span className="styles-module__dkF0kG__symbol" data-site-symbol>
            <Symbol height="1.5em" />
          </span>
          <span className="styles-module__dkF0kG__brandText">
            Sway
          </span>
        </Link>
        <Menu
          labels={{ open: "Menu", close: "Close", menu: "Site menu" }}
          primaryLinks={[
            { label: "Overview", href: "/" },
            { label: "How it works", href: "/how-it-works" },
            { label: "Evidence", href: "/evidence" },
            { label: "Research", href: "/research" },
            { label: "Try it", href: "/try" },
          ]}
          secondaryLinks={[
            { label: "Shopping assistant", href: "/shop" },
            { label: "Purchase x-ray", href: "/xray" },
            { label: "Risk dashboard", href: "/ops" },
          ]}
          contacts={[]}
        />
      </div>
    </header>
  );
}
