import type { CSSProperties, ReactNode } from "react";
import { Container } from "@/components/Container";
import { HeaderTone } from "@/components/HeaderTone";
import { Words } from "@/components/kit";
import { RevealGroup } from "@/components/RevealGroup";
import { Text } from "@/components/Text";

/** Shell for the inner pages: same page frame as the home page, a rising title and a lede. */
export function InnerPage({ eyebrow, title, lede, children }: { eyebrow: string; title: string; lede?: ReactNode; children: ReactNode }) {
  return (
    <main className="page-shell-module__L3Btcq__root">
      <HeaderTone />
      <Container width="full" className="sw-page">
        <RevealGroup>
          <Text as="span" variant="label-medium" weight="medium" className="sw-eyebrow">
            {eyebrow}
          </Text>
          <Text as="h1" variant="display-fluid" weight="medium">
            <Words text={title} />
          </Text>
          {lede && (
            <Text as="p" variant="body-large" className="sw-lede">
              <span className="reveal-module__nuDBzW__root reveal-module__nuDBzW__fade" style={{ "--stagger": title.split(" ").length } as CSSProperties}>
                {lede}
              </span>
            </Text>
          )}
        </RevealGroup>
        {children}
      </Container>
    </main>
  );
}

export function SectionHead({ label, title, body }: { label?: string; title: string; body?: ReactNode }) {
  return (
    <div className="sw-section-head">
      {label && (
        <Text as="span" variant="label-medium" weight="medium" className="sw-muted">
          {label}
        </Text>
      )}
      <Text as="h2" variant="headline-large" weight="medium">
        {title}
      </Text>
      {body && (
        <Text as="p" variant="body-large" className="sw-muted">
          {body}
        </Text>
      )}
    </div>
  );
}
