import type { Metadata } from "next";
import { InnerPage, SectionHead } from "@/components/InnerPage";
import { Text } from "@/components/Text";
import { WipeButton } from "@/components/WipeButton";

export const metadata: Metadata = { title: "Research" };

const WORK: { group: string; items: { name: string; ref: string; what: string }[] }[] = [
  {
    group: "The method we build on",
    items: [
      { name: "ContextCite", ref: "MIT, 2024", what: "Traces which part of the context an answer came from, by leaving parts out." },
      { name: "TracLLM", ref: "USENIX Security 2025", what: "Perturbation-based attribution for finding the injected text after an attack." },
      { name: "MELON", ref: "ICML 2025", what: "Re-runs an agent with its tool outputs masked to spot injected actions." },
      { name: "AttriGuard", ref: "arXiv 2603.10749, 2026", what: "Re-runs with weakened observations and blocks tool calls that don't survive. The closest work to Sway." },
      { name: "AttnTrace", ref: "2025", what: "Attention-based attribution; its attribution-then-detection order matches ours." },
    ],
  },
  {
    group: "The problem in shopping and payments",
    items: [
      { name: "StakeBench", ref: "arXiv 2606.13385", what: "Indirect injections steer web shopping agents in 41.67–68.59% of cases. No defences evaluated." },
      { name: "Whispers of Wealth", ref: "arXiv 2601.22569", what: "Red-teams AP2; product-ranking injection passes signed mandates." },
      { name: "Beyond the Mandate", ref: "arXiv 2608.23858", what: "Mandates protect data after signing, not the inputs that shaped the choice." },
      { name: "Market Signal Injection", ref: "2026", what: "One sentence of plain commentary can shift an agent. Our detector won't flag that; we say so." },
    ],
  },
];

export default function ResearchPage() {
  return (
    <InnerPage
      eyebrow="Research"
      title="Standing on good work."
      lede="Leaving parts of the input out to see what drove an AI's answer is an established idea, and we credit it. What's new in Sway is where it runs and what it adds: before PayPal captures a purchase, with a second question that attribution alone can't answer."
    >
      <section className="sw-section">
        <div className="sw-card-soft">
          <Text as="p" variant="headline-small" weight="medium">
            The gap, in the authors&apos; own words
          </Text>
          <Text as="p" variant="body-large" className="sw-muted" style={{ marginTop: "0.75rem", maxWidth: "48rem" }}>
            AttriGuard notes that when a user hands a decision to outside content, as shoppers do with reviews, causal attribution alone can&apos;t verify
            whether that content is trustworthy. Shopping is exactly that case. Sway&apos;s second key checks the deciding page against a real product
            catalog, so an honest review still gets through.
          </Text>
        </div>
      </section>

      {WORK.map((g) => (
        <section key={g.group} className="sw-section">
          <SectionHead title={g.group} />
          <ul className="sw-list">
            {g.items.map((w) => (
              <li key={w.name}>
                <span>
                  <Text as="span" variant="body-large" weight="medium">
                    {w.name}
                  </Text>
                  <span className="sw-small sw-muted" style={{ display: "block" }}>
                    {w.ref}
                  </span>
                </span>
                <Text as="span" variant="body-large" className="sw-muted">
                  {w.what}
                </Text>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="sw-section sw-actions">
        <WipeButton href="/how-it-works">How Sway works</WipeButton>
        <WipeButton href="/evidence">See the evidence</WipeButton>
      </section>
    </InnerPage>
  );
}
