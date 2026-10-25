import { Fragment, type MouseEventHandler, type ReactNode } from "react";
import { cx } from "@/lib/cx";
import { routes } from "@/lib/routes";
import actionRow from "@/styles/action-row";
import errorPage from "@/styles/error-page";
import pageShell from "@/styles/page-shell";
import { ArrowIcon, type ArrowDirection } from "./ArrowIcon";
import { Container } from "./Container";
import { HeaderTone } from "./HeaderTone";
import { HoverSweep } from "./HoverSweep";
import { Link } from "./Link";
import { Stagger } from "./Stagger";
import { Text } from "./Text";

/** A full-width link row with an arrow (the original's ActionRow). */
function ActionRow({
  href,
  label,
  caption,
  arrow = "up-right",
  size = "md",
  external = false,
  download = false,
  rule = "top",
  padded = false,
  fill = false,
  className,
  onClick,
}: {
  href: string;
  label: ReactNode;
  caption?: ReactNode;
  arrow?: ArrowDirection;
  size?: "md" | "lg";
  external?: boolean;
  download?: boolean;
  rule?: "top" | "bottom" | "both";
  padded?: boolean;
  fill?: boolean;
  className?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}) {
  const classes = cx(
    actionRow.root,
    rule !== "bottom" && "ruled",
    rule !== "top" && actionRow.bottom,
    padded && actionRow.padded,
    fill && actionRow.fill,
    (actionRow as Record<string, string>)[size],
    className,
  );
  const content = (
    <>
      <span className={actionRow.text}>
        <Text as="span" variant={size === "lg" ? "headline-large" : "body-large"}>
          {label}
        </Text>
        {caption && (
          <Text as="span" variant="label-medium" color="foreground-50">
            {caption}
          </Text>
        )}
      </span>
      <span className={actionRow.arrow}>
        <ArrowIcon direction={arrow} />
      </span>
      {fill && <HoverSweep />}
    </>
  );
  if (external || download) {
    return (
      <a
        className={classes}
        href={href}
        onClick={onClick}
        {...(download ? { download: true } : { target: "_blank", rel: "noopener noreferrer" })}
      >
        {content}
      </a>
    );
  }
  return (
    <Link className={classes} href={href} onClick={onClick}>
      {content}
    </Link>
  );
}

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Splits text into staggered words, keeping the original whitespace between them. */
function RevealWords({ text, offset = 0, step = "fine" as const, effect = "rise" as const }: { text: string; offset?: number; step?: "fine" | "coarse"; effect?: "rise" | "fade" | "fade-up" }) {
  let index = 0;
  return text.split(/(\s+)/).map((part, i) =>
    i % 2 === 1 ? (
      <Fragment key={i}>{part}</Fragment>
    ) : (
      <Stagger key={i} index={offset + index++} step={step} effect={effect}>
        {part}
      </Stagger>
    ),
  );
}

export type StatusCopy = {
  label: string;
  figure: string;
  title: string;
  body: string;
  cta: string;
  indexLabel: string;
  links: { label: string; href: string }[];
};

export const STATUS_COPY = {
  notFound: {
    label: "Error 404",
    figure: "404",
    title: "Nothing at this address.",
    body: "The page may have moved, been removed, or never existed. Choose a route below or return to the start.",
    cta: "Back to home",
    indexLabel: "Index",
    links: [
      { label: "How it works", href: routes.howItWorks },
      { label: "Evidence", href: routes.evidence },
      { label: "Research", href: routes.research },
      { label: "Try it", href: routes.tryIt },
    ],
  },
  error: {
    label: "Error 500",
    figure: "500",
    title: "Something went wrong.",
    body: "An unexpected error interrupted this page. Try again, or choose a route below.",
    cta: "Try again",
    indexLabel: "Index",
    links: [
      { label: "Home", href: routes.home },
      { label: "How it works", href: routes.howItWorks },
      { label: "Evidence", href: routes.evidence },
      { label: "Try it", href: routes.tryIt },
    ],
  },
  reference: "Ref.",
};

/** Shared layout of the 404 and 500 pages: big staggered figure, message, action and an index of links. */
export function StatusPage({ copy, meta, action }: { copy: StatusCopy; meta: ReactNode; action: ReactNode }) {
  const digits = copy.figure.split("");
  const figureCount = digits.length;
  const bodyIndex = Math.ceil((figureCount + countWords(copy.title)) / 2) + 1;
  const actionIndex = bodyIndex + 1;
  const indexStart = actionIndex + 1;

  return (
    <main className={pageShell.root}>
      <HeaderTone />
      <Container width="full" className={errorPage.root}>
        <Stagger as="div" effect="fade" className={errorPage.meta}>
          <Text as="span" variant="label-medium" weight="medium">
            {copy.label}
          </Text>
          <span className={errorPage.metaAside}>{meta}</span>
        </Stagger>
        <div className={errorPage.body}>
          <Text as="p" variant="display-extra-large" weight="medium" className={errorPage.figure} aria-label={copy.figure}>
            {digits.map((digit, i) => (
              <Stagger key={i} index={i} step="fine" aria-hidden="true">
                {digit}
              </Stagger>
            ))}
          </Text>
          <div className={errorPage.column}>
            <div className={errorPage.text}>
              <Text as="h1" variant="headline-large" weight="medium" className={errorPage.title}>
                <RevealWords text={copy.title} offset={figureCount} />
              </Text>
              <Text as="p" variant="body-large" color="foreground-50" className={errorPage.lede}>
                <Stagger effect="fade" index={bodyIndex}>
                  {copy.body}
                </Stagger>
              </Text>
              <Stagger as="div" effect="fade-up" index={actionIndex} className={errorPage.action}>
                {action}
              </Stagger>
            </div>
            <nav className={errorPage.index} aria-label={copy.indexLabel}>
              <Stagger as="div" effect="fade" index={indexStart}>
                <Text as="span" variant="label-medium" color="foreground-50">
                  {copy.indexLabel}
                </Text>
              </Stagger>
              <ul className={errorPage.list}>
                {copy.links.map((link, i) => (
                  <Stagger
                    key={link.href}
                    as="li"
                    effect="fade-up"
                    index={indexStart + 1 + i}
                    className={errorPage.item}
                  >
                    <ActionRow
                      href={link.href}
                      label={link.label}
                      arrow="right"
                      rule={i === copy.links.length - 1 ? "both" : "top"}
                      fill
                    />
                  </Stagger>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      </Container>
    </main>
  );
}
