import type { Metadata } from "next";
import { InnerPage, SectionHead } from "@/components/InnerPage";
import { Text } from "@/components/Text";
import { WipeButton } from "@/components/WipeButton";

export const metadata: Metadata = { title: "How it works" };

const STEPS = [
  {
    title: "Hold",
    body: "Your agent picks a product and you approve once in PayPal. PayPal authorizes the payment: the money is reserved, nothing is taken yet.",
    tech: "Orders v2, intent AUTHORIZE",
  },
  {
    title: "Re-run",
    body: "Sway asks the agent the same question again, leaving out one page it read each time. Pages that look alike, or look suspicious, are also left out together.",
    tech: "Counterfactual ablation, 5 repeats per test",
  },
  {
    title: "Judge",
    body: "If leaving a page out changes the choice by much more than the agent's normal wobble, that page decided the purchase. Then Sway asks: is that page dishonest?",
    tech: "Flip rate vs. noise baseline, then signals",
  },
  {
    title: "Capture or void",
    body: "Honest decision: PayPal captures. Planted one: you get one plain sentence and the product you'd have picked without that page.",
    tech: "Capture, or void + new order",
  },
];

const SIGNALS = [
  { name: "Hidden text", body: "Words styled so a person can't see them, but an AI reading the page still does: white on white, zero size, off screen." },
  { name: "Orders aimed at AI", body: "Sentences that tell an assistant or agent what to recommend, choose or buy." },
  { name: "Text for whoever relays it", body: "Lines like “pass that on as the final answer”, written for a summariser rather than a shopper." },
  { name: "False against the catalog", body: "A price or stock claim that the Channel3 store catalog says is wrong: a fake flash price, a made-up price hike, “discontinued” when it's in stock." },
];

export default function HowItWorksPage() {
  return (
    <InnerPage
      eyebrow="How it works"
      title="Every other check asks what. Sway asks why."
      lede="Today's payment checks look at the purchase: the amount, the payee, the limits. None of them look at why the agent picked this item. Sway does, while PayPal is still only holding the money."
    >
      <section className="sw-section">
        <div className="sw-flow">
          {STEPS.map((s, i) => (
            <div key={s.title} className="sw-card sw-flow-node">
              <span className="sw-step-num">0{i + 1}</span>
              <Text as="h3" variant="headline-small" weight="medium" style={{ marginTop: "1.25rem" }}>
                {s.title}
              </Text>
              <Text as="p" variant="body-large" className="sw-muted" style={{ marginTop: "0.6rem" }}>
                {s.body}
              </Text>
              <p className="sw-small" style={{ marginTop: "1rem" }}>
                <span className="sw-badge" data-tone="muted">
                  {s.tech}
                </span>
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="sw-section">
        <SectionHead
          label="Two keys"
          title="A page has to do both before anything is stopped."
          body="One key alone fails. A page that decided the purchase might just be a good review. A page that looks odd might have changed nothing. Sway only blocks when the same page turns both keys."
        />
        <div className="sw-keys">
          <div className="sw-card">
            <Text as="p" variant="title-large" weight="medium">
              It decided the purchase
            </Text>
            <Text as="p" variant="body-large" className="sw-muted" style={{ marginTop: "0.5rem" }}>
              Without it, the agent picks something else, clearly beyond its usual run-to-run noise.
            </Text>
          </div>
          <div className="sw-plus" aria-hidden="true">
            +
          </div>
          <div className="sw-card">
            <Text as="p" variant="title-large" weight="medium">
              It looks dishonest
            </Text>
            <Text as="p" variant="body-large" className="sw-muted" style={{ marginTop: "0.5rem" }}>
              It hides things, gives orders to AI, or says something the store catalog proves false.
            </Text>
          </div>
        </div>
      </section>

      <section className="sw-section">
        <SectionHead label="What counts as dishonest" title="Four signals, all checkable." />
        <ul className="sw-list">
          {SIGNALS.map((s) => (
            <li key={s.name}>
              <Text as="span" variant="body-large" weight="medium">
                {s.name}
              </Text>
              <Text as="span" variant="body-large" className="sw-muted">
                {s.body}
              </Text>
            </li>
          ))}
        </ul>
      </section>

      <section className="sw-section">
        <SectionHead
          label="Built with"
          title="Small pieces, each doing one job."
        />
        <div className="sw-grid-2">
          {[
            ["PayPal", "Authorize holds the money; capture or void settles it after Sway decides. The shopper approves in PayPal, as always."],
            ["Channel3", "The real product catalog: the trusted prices and stock that pages are checked against, and the honest alternative."],
            ["AG Grid", "The x-ray for builders and risk teams: every page, what the agent picks without it, and the verdict."],
            ["Claude", "The shopping agent being checked, re-run for each test."],
          ].map(([name, body]) => (
            <div key={name} className="sw-card">
              <Text as="p" variant="title-medium" weight="medium">
                {name}
              </Text>
              <Text as="p" variant="body-large" className="sw-muted" style={{ marginTop: "0.4rem" }}>
                {body}
              </Text>
            </div>
          ))}
        </div>
      </section>

      <section className="sw-section sw-actions">
        <WipeButton href="/try">Try it yourself</WipeButton>
        <WipeButton href="/evidence">See the evidence</WipeButton>
      </section>
    </InnerPage>
  );
}
