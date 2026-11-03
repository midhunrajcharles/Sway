import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { InnerPage, SectionHead } from "@/components/InnerPage";
import { Text } from "@/components/Text";
import { WipeButton } from "@/components/WipeButton";
import { readPublishers } from "@/lib/server/publishers";
import { ConnectPublisherForm } from "./ConnectPublisherForm";

export const metadata: Metadata = {
  title: "Publishers",
  description: "Get paid when an AI reads your page and buys. One check, before the money moves.",
};

export default function PublishersPage() {
  return (
    <InnerPage
      eyebrow="Publishers"
      title="Get paid when an AI reads your page and buys."
      lede="Sway's ablation measures which page actually changed the agent's pick. When that page is yours and it passes the honesty test, Sway sends you a PayPal Payout after capture — on the same mechanism that voids a manipulated buy."
    >
      <Suspense
        fallback={
          <section className="sw-section">
            <p className="sw-small sw-muted">Loading the publisher directory…</p>
          </section>
        }
      >
        <Directory />
      </Suspense>

      <section className="sw-section">
        <SectionHead
          label="Connect"
          title="PayPal Partner Referrals, in two clicks."
          body="Enter your site and your PayPal receiver email. We create a Partner Referrals session; you approve it in PayPal; we record your host and your email. No credentials ever touch Sway."
        />
        <ConnectPublisherForm />
      </section>

      <section className="sw-section">
        <SectionHead label="How attribution works" title="One mechanism, measured, before the money moves." />
        <ul className="sw-list">
          <li>
            <Text as="span" variant="body-large" weight="medium">Causal, not cookie.</Text>
            <Text as="span" variant="body-large" className="sw-muted">
              Sway re-runs the agent with each page it read removed and scores how much your page changed the pick, adjusted for the agent's own noise. The one page that decided it gets paid.
            </Text>
          </li>
          <li>
            <Text as="span" variant="body-large" weight="medium">Honest-only.</Text>
            <Text as="span" variant="body-large" className="sw-muted">
              A page that decided the pick but contradicts the Channel3 catalog, or hides instructions aimed at the agent, is not paid; the order is voided. Honest reviewers never share a payout with manipulated pages.
            </Text>
          </li>
          <li>
            <Text as="span" variant="body-large" weight="medium">Rate.</Text>
            <Text as="span" variant="body-large" className="sw-muted">
              Launch default: 2% of basket. On the benchmark's ~$42.50 average, that's about $0.80 per attributed agent purchase. Per-publisher rates are configurable by the merchant.
            </Text>
          </li>
        </ul>
      </section>

      <section className="sw-section sw-actions">
        <WipeButton href="/evidence">See the evidence</WipeButton>
        <WipeButton href="/try">Try it yourself</WipeButton>
      </section>
    </InnerPage>
  );
}

async function Directory() {
  await connection();
  const dir = await readPublishers();
  const rows = Object.entries(dir.publishers);
  if (!rows.length) {
    return (
      <section className="sw-section">
        <p className="sw-small sw-muted">No publishers connected yet.</p>
      </section>
    );
  }
  return (
    <section className="sw-section">
      <div className="sw-table-wrap">
        <table className="sw-table">
          <thead>
            <tr>
              <th>Host</th>
              <th className="sw-num">Payout rate</th>
              <th>Receiver</th>
              <th>Source</th>
              <th>Onboarded</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([host, p]) => (
              <tr key={host}>
                <td>{host}</td>
                <td className="sw-num">{Math.round(p.payoutRate * 100)}%</td>
                <td className="sw-small">{p.paypalEmail || <span className="sw-muted">pending callback</span>}</td>
                <td className="sw-small">{p.source}</td>
                <td className="sw-small">{p.onboardedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
