"use client";

import { useCallback, useId, useState, type ComponentProps } from "react";
import { cx } from "@/lib/cx";
import { durations } from "@/lib/durations";
import styles from "@/styles/header";
import { ArrowIcon } from "./ArrowIcon";
import { Link } from "./Link";
import { Overlay, useClosing, WipeLabel } from "./Overlay";
import { Stagger } from "./Stagger";
import { Text } from "./Text";
import { useWipe, WipeBars } from "./wipe";
import { WipeRule } from "./WipeRule";

type NavLink = { label: string; href: string };
type Contact = { email: string; caption: string };

function SecondaryLink({ className, children, ...rest }: ComponentProps<typeof Link>) {
  const { wipes, spawn, release, settle } = useWipe();
  return (
    <Link {...rest} className={cx(styles.secondaryLink, className)} onMouseEnter={spawn} onMouseLeave={release}>
      {children}
      <WipeBars wipes={wipes} settle={settle} align="baseline" />
    </Link>
  );
}

/** Tracks the hovered row; the rules above and below it light up. */
function useRuleHover() {
  const [hovered, setHovered] = useState<number | null>(null);
  return {
    isActive: (rule: number) => hovered !== null && (rule === hovered || rule === hovered + 1),
    handlers: (index: number) => ({
      onMouseEnter: () => setHovered(index),
      onMouseLeave: () => setHovered((h) => (h === index ? null : h)),
    }),
  };
}

export function Menu({
  labels,
  primaryLinks,
  secondaryLinks,
  contacts,
  durationMs = durations.slower,
}: {
  labels: { open: string; close: string; menu: string };
  primaryLinks: NavLink[];
  secondaryLinks: NavLink[];
  contacts: Contact[];
  durationMs?: number;
}) {
  const [open, setOpen] = useState(false);
  const primaryHover = useRuleHover();
  const contactHover = useRuleHover();
  const panelId = useId();
  const primaryCount = primaryLinks.length;
  const linkCount = primaryCount + secondaryLinks.length;
  const onClosed = useCallback(() => setOpen(false), []);
  const { closing, close, reset } = useClosing(durationMs, onClosed);

  return (
    <>
      <button
        type="button"
        className={styles.menu}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          reset();
          setOpen(true);
        }}
      >
        {labels.open}
      </button>
      {open && (
        <Overlay
          onClose={close}
          closeLabel={labels.close}
          className={styles.overlay}
          open={!closing}
          durationMs={durationMs}
        >
          <div className={cx(styles.panelClip, closing && styles.panelClosing)}>
            <div
              id={panelId}
              role="dialog"
              aria-modal="true"
              aria-label={labels.menu}
              tabIndex={-1}
              data-overlay-focus
              className={styles.panel}
            >
              <div className={styles.panelInner}>
                <button type="button" className={styles.close} onClick={close}>
                  <WipeLabel hiding={closing}>{labels.close}</WipeLabel>
                </button>
                <nav className={styles.panelBody} aria-label={labels.menu}>
                  <ul className={styles.primary}>
                    {primaryLinks.map((link, i) => (
                      <Stagger
                        key={link.href}
                        as="li"
                        effect="fade-up"
                        step="fine"
                        index={i}
                        className={styles.staggerItem}
                        {...primaryHover.handlers(i)}
                      >
                        <WipeRule active={primaryHover.isActive(i)} />
                        <Text
                          as={Link}
                          variant="headline-large"
                          className={styles.primaryLink}
                          href={link.href}
                          onClick={close}
                        >
                          {link.label}
                        </Text>
                        {i === primaryLinks.length - 1 && <WipeRule active={primaryHover.isActive(i + 1)} />}
                      </Stagger>
                    ))}
                  </ul>
                  <ul className={styles.secondary}>
                    {secondaryLinks.map((link, i) => (
                      <Stagger
                        key={link.href}
                        as="li"
                        effect="fade-up"
                        step="fine"
                        index={primaryCount + i}
                        className={styles.staggerItem}
                      >
                        <SecondaryLink href={link.href} onClick={close}>
                          {link.label}
                        </SecondaryLink>
                      </Stagger>
                    ))}
                  </ul>
                  <ul className={styles.contacts}>
                    {contacts.map((contact, i) => (
                      <Stagger
                        key={contact.email}
                        as="li"
                        effect="fade-up"
                        step="fine"
                        index={linkCount + i}
                        className={styles.staggerItem}
                        {...contactHover.handlers(i)}
                      >
                        <WipeRule active={contactHover.isActive(i)} />
                        <a className={styles.contact} href={`mailto:${contact.email}`}>
                          <span className={styles.contactText}>
                            <Text as="span" variant="body-large">
                              {contact.email}
                            </Text>
                            <Text as="span" variant="label-medium" color="foreground-50">
                              {contact.caption}
                            </Text>
                          </span>
                          <ArrowIcon />
                        </a>
                        {i === contacts.length - 1 && <WipeRule active={contactHover.isActive(i + 1)} />}
                      </Stagger>
                    ))}
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        </Overlay>
      )}
    </>
  );
}
