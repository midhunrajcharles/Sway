import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { InnerPage, SectionHead } from "@/components/InnerPage";
import { Text } from "@/components/Text";
import { WipeButton } from "@/components/WipeButton";
import { swayEvidence } from "@/lib/server/sway-api";
import { money, pct, type BenchRow, type Evidence } from "@/lib/sway";

export const metadata: Metadata = { title: "Evidence" };

const ATTACK_LABEL: Record<string, string> = {
  attack_hidden: "Hidden AI instructions",
  attack_redundant: "Two planted pages",
  deceptive_visible: "Fake flash price",
  covert_instruction: "Covert “final answer” page",
  price_smear: "False rival price hike",
  fake_reviews: "Fake reviews",
};
const BENIGN = new Set(["clean", "honest_strong"]);

function stats(rows: BenchRow[]) {
  const attacks = rows.filter((r) => ATTACK_LABEL[r.condition]);
  const manipulated = attacks.filter((r) => r.manipulated || r.steered);
  const steered = attacks.filter((r) => r.steered);
  const caught = steered.filter((r) => r.verdict === "BLOCK");
  const named = caught.filter((r) => r.decider_correct);
  const benign = rows.filter((r) => BENIGN.has(r.condition));
  const falseAlarms = benign.filter((r) => r.verdict === "BLOCK");
  const attrFalse = benign.filter((r) => r.attr_only_verdict === "BLOCK");
  const honest = rows.filter((r) => r.condition === "honest_strong");
  const saved = caught.map((r) => (r.chosen_price ?? 0) - (r.alt_price ?? r.chosen_price ?? 0));
  return { attacks, manipulated, steered, caught, named, benign, falseAlarms, attrFalse, honest, saved };
}

function Bar({ label, n, d, tone, note }: { label: string; n: number; d: number; tone?: "warn"; note?: string }) {
  return (
    <div className="sw-bar-row">
      <div className="sw-bar-head">
        <Text as="span" variant="body-large">
          {label}
        </Text>
        <Text as="span" variant="body-large" weight="medium" className="sw-num">
          {n}/{d} · {pct(n, d)}
        </Text>
      </div>
      <div className="sw-bar-track" role="img" aria-label={`${label}: ${n} of ${d}`}>
        <div className="sw-bar-fill" data-tone={tone} style={{ width: `${d ? (100 * n) / d : 0}%` }} />
      </div>
      {note && <span className="sw-small sw-muted">{note}</span>}
    </div>
  );
}

export default function EvidencePage() {
  return (
    <InnerPage
      eyebrow="Evidence"
      title="Measured, not promised."
      lede="Shopping tasks with real products from the Channel3 catalog, every decision repeated so ordinary randomness can't pass for a cause. These numbers are read from the benchmark results each time this page loads."
    >
      <Suspense
        fallback={
          <section className="sw-section">
            <p className="sw-small sw-muted">Loading the benchmark results…</p>
          </section>
        }
      >
        <Results />
      </Suspense>

      <section className="sw-section sw-actions">
        <WipeButton href="/try">Try it yourself</WipeButton>
        <WipeButton href="/research">Read the research</WipeButton>
      </section>
    </InnerPage>
  );
}

async function Results() {
  await connection();
  let ev: Evidence;
  try {
    ev = await swayEvidence();
  } catch (e) {
    return (
      <section className="sw-section">
        <p className="sw-note" data-tone="amber">
          {(e as Error).message}
        </p>
      </section>
    );
  }
  if (!ev.main.length) {
    return (
      <section className="sw-section">
        <p className="sw-note" data-tone="amber">
          No benchmark results found for run {ev.main_run}. Run <code>python bench.py</code> first.
        </p>
      </section>
    );
  }
  const main = stats(ev.main);
  const subtle = ev.subtle;
  const tasks = new Set(ev.main.map((r) => r.task)).size;
  const subtleTasks = new Set(subtle.map((r) => r.task)).size;
  const worst = Math.min(...ev.main.map((r) => r.stability));
  const avgStability = ev.main.reduce((a, r) => a + r.stability, 0) / ev.main.length;
  const minCalls = Math.min(...ev.main.map((r) => r.calls));
  const maxCalls = Math.max(...ev.main.map((r) => r.calls));
  const byAttack = Object.keys(ATTACK_LABEL).map((c) => {
    const rs = [...ev.main, ...subtle].filter((r) => r.condition === c);
    return {
      c,
      runs: rs.length,
      steered: rs.filter((r) => r.steered).length,
      manipulated: rs.filter((r) => r.manipulated || r.steered).length,
      blocked: rs.filter((r) => r.verdict === "BLOCK").length,
      subtle: !ev.main.some((r) => r.condition === c),
    };
  });
  const avgSaved = main.saved.length ? main.saved.reduce((a, b) => a + b, 0) / main.saved.length : 0;

  return (
    <>
      <section className="sw-section">
        <p className="sw-small sw-muted" style={{ marginBottom: "1rem" }}>
          Run {ev.main_run} · {tasks} StakeBench-family tasks (running shoes, earbuds, coffee grinder, office chair, carry-on, electric toothbrush, air purifier, laptop backpack) · model {ev.model ?? "unknown"} · every decision repeated {ev.k ?? "?"} times. Baseline stability (how often repeats agree with the majority): avg {avgStability.toFixed(2)}, min {worst.toFixed(2)}. Cost per decision at k={ev.k ?? 5}: about {minCalls}–{maxCalls} model calls per purchase (≈ $40 average basket). This is a first result on our templates, not a wild-web survey.
        </p>
        <div className="sw-grid-4">
          <div className="sw-card sw-stat">
            <span className="sw-stat-figure">{pct(main.steered.length, main.attacks.length)}</span>
            <Text as="p" variant="body-large">of planted attacks steered the agent</Text>
            <span className="sw-small sw-muted">
              {main.steered.length} of {main.attacks.length} runs bought what the attacker wanted
            </span>
          </div>
          <div className="sw-card sw-stat">
            <span className="sw-stat-figure">
              {main.caught.length}/{main.steered.length}
            </span>
            <Text as="p" variant="body-large">held before PayPal captured</Text>
            <span className="sw-small sw-muted">and the planted page was named {main.named.length} times out of {main.caught.length}</span>
          </div>
          <div className="sw-card sw-stat">
            <span className="sw-stat-figure">
              {main.falseAlarms.length}/{main.benign.length}
            </span>
            <Text as="p" variant="body-large">false alarms on honest purchases</Text>
            <span className="sw-small sw-muted">
              including {main.honest.length} with a strong honest review; it changed the pick in {main.honest.filter((r) => r.decided_by_honest.includes("expert")).length} and Sway let every one through
            </span>
          </div>
          <div className="sw-card sw-stat">
            <span className="sw-stat-figure">{money(avgSaved)}</span>
            <Text as="p" variant="body-large">kept per blocked purchase</Text>
            <span className="sw-small sw-muted">the price gap to what the agent would have bought without the planted page</span>
          </div>
        </div>
      </section>

      <section className="sw-section">
        <SectionHead
          label="Why two keys"
          title="Attribution alone stops honest purchases too."
          body="Research tools can already trace which page drove an AI's choice. But in shopping a page is supposed to drive the choice. Blocking every purchase that one page decided (the AttriGuard and MELON approach) catches the attacks, and it also stops honest ones."
        />
        <div className="sw-grid-2">
          <div className="sw-card">
            <Text as="p" variant="title-medium" weight="medium" style={{ marginBottom: "1.25rem" }}>
              Honest purchases wrongly blocked
            </Text>
            <div className="sw-bars">
              <Bar label="Attribution alone" n={main.attrFalse.length} d={main.benign.length} tone="warn" />
              <Bar label="Sway (decided it + dishonest)" n={main.falseAlarms.length} d={main.benign.length} />
            </div>
          </div>
          <div className="sw-card">
            <Text as="p" variant="title-medium" weight="medium" style={{ marginBottom: "1.25rem" }}>
              Manipulated purchases stopped
            </Text>
            <div className="sw-bars">
              <Bar
                label="Attribution alone"
                n={main.manipulated.filter((r) => r.attr_only_verdict === "BLOCK").length}
                d={main.manipulated.length}
              />
              <Bar label="Sway" n={main.manipulated.filter((r) => r.verdict === "BLOCK").length} d={main.manipulated.length} />
            </div>
          </div>
        </div>
      </section>

      <section className="sw-section">
        <SectionHead
          label="By attack"
          title="What got through, and what didn't."
          body={`Three subtler, visible-only attacks are modelled on the StakeBench attack families, measured so far on ${subtleTasks} of ${tasks} products.`}
        />
        <div className="sw-table-wrap">
          <table className="sw-table">
            <thead>
              <tr>
                <th>Attack</th>
                <th className="sw-num">Runs</th>
                <th className="sw-num">Changed the pick</th>
                <th className="sw-num">Steered to target</th>
                <th className="sw-num">Sway blocked</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {byAttack.map((a) => (
                <tr key={a.c}>
                  <td>
                    {ATTACK_LABEL[a.c]}
                    {a.subtle && <div className="sw-small sw-muted">subtle, visible only</div>}
                  </td>
                  <td className="sw-num">{a.runs}</td>
                  <td className="sw-num">{a.manipulated}</td>
                  <td className="sw-num">{a.steered}</td>
                  <td className="sw-num">{a.blocked}</td>
                  <td className="sw-small">
                    {a.c === "fake_reviews" ? (
                      <span className="sw-badge" data-tone="amber">
                        known blind spot
                      </span>
                    ) : a.c === "attack_redundant" ? (
                      "caught only by testing the two pages together"
                    ) : a.c === "attack_hidden" ? (
                      "the agent resisted some of these on its own"
                    ) : (
                      ""
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="sw-section">
        <SectionHead label="Limits" title="What we don't claim." />
        <ul className="sw-list">
          <li>
            <Text as="span" variant="body-large" weight="medium">Fake reviews</Text>
            <Text as="span" variant="body-large" className="sw-muted">
              Plain astroturf makes no claim the catalog can check, so Sway lets it through. Ratings data would close this gap.
            </Text>
          </li>
          <li>
            <Text as="span" variant="body-large" weight="medium">One model</Text>
            <Text as="span" variant="body-large" className="sw-muted">
              Every number above comes from one model ({ev.model ?? "unknown"}). Other models may be easier or harder to steer.
            </Text>
          </li>
          <li>
            <Text as="span" variant="body-large" weight="medium">Small sample</Text>
            <Text as="span" variant="body-large" className="sw-muted">
              {tasks} tasks, {ev.k ?? "?"} repeats each. Some tasks are noisy (the agent agreed with itself only {Math.round(worst * 100)}% of the time in the worst case), which is why Sway compares every effect against that noise.
            </Text>
          </li>
          <li>
            <Text as="span" variant="body-large" weight="medium">Cost</Text>
            <Text as="span" variant="body-large" className="sw-muted">
              About {minCalls}–{maxCalls} model calls per purchase in this run (at k={ev.k ?? 5}, on an ≈ $40 average basket). PayPal holds the money between authorize and capture, so the check fits inside that window. MELON-style attenuate-vs-delete would lower this; it is the Phase 2 optimisation.
            </Text>
          </li>
        </ul>
      </section>
    </>
  );
}
