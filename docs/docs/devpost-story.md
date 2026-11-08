# Sway: Devpost story (draft, updated 2026-11-03)

**Tagline (≤60 chars):** Agents listen. The money should know to whom.

**Pitch (worldview):** Agents don't need better payment limits. They need to know who they're listening to — and so does the money.

**One sentence:** When an AI buys something, Sway pays whoever actually convinced it — and stops the pages that tried to trick it. The first causally-attributed payment rail for agent commerce.

## Inspiration
AI agents are starting to shop for people. They read product pages and reviews, pick an item, and pay. Anyone who can write a web page can write one aimed at the agent instead of the human.

This is already measured:
- A 2026 benchmark of real web shopping agents (StakeBench) found indirect prompt injections succeed **41–68%** of the time, and seller-side review attacks are the strongest.
- Unit 42 found a live page built to make agents buy running shoes.
- Wharton's AI lab showed one planted review can redirect what agents buy.

Every guard we found checks **what** the agent buys: amount limits, allowed merchants, signed mandates. None of them asks **why** it chose that item. The money moves either way.

And something else broke at the same time. When the agent completes checkout *in-chat* (Perplexity, PayPal, Meta Poppy), the affiliate cookie that would have paid the honest reviewer who actually swayed it is gone. Honest influence does the work and gets nothing. Honey — PayPal-owned — lost about 7,000 merchants over this exact kind of broken attribution at checkout.

Sway fixes both problems with the **same mechanism**.

## What it does
Sway sits between the agent's choice and PayPal taking the money.
1. **Hold.** The purchase is created as a PayPal order with `intent: AUTHORIZE`. The shopper's money is held, not taken.
2. **Re-run.** Sway re-runs the agent's decision several times, each time **without one of the pages it read** (counterfactual ablation), plus a few normal re-runs to measure how much the agent wobbles on its own.
3. **Judge with two keys.** A page is blocked only if **both** are true:
   - **it decided the purchase** (removing it changes the pick, beyond the agent's normal wobble), **and**
   - **it is dishonest**: hidden text, instructions aimed at AI agents, or a price or spec claim that contradicts the real **Channel3** catalog.
4. **Capture or void.** If the two keys don't both turn, PayPal **captures**. If they do, PayPal **voids** the authorization, and the shopper gets one calm sentence: *"A page I read was trying to steer me. Without it, I'd have picked X, $Y less. Switch?"* One tap places the honest order.
5. **Pay the honest influence.** If the deciding page passed the honesty test, Sway fires a **PayPal Payout** to that publisher after capture. The first per-sale creator rail for in-chat agent commerce. The attribution comes from the *same* ablation that would have voided a dishonest decider — one mechanism, both outcomes.

The shopper sees only that sentence. Builders and ops teams get the full **AG Grid** x-ray: every page the agent read, what it would have bought without it, agreement across re-runs, the signals found and the verdict. They also get an ops view of all purchases grouped by the site that decided them.

## Why two keys
Honest pages are *supposed* to change an agent's mind: that's what a good review is for. A check that blocks whenever one page decided the purchase (the approach in recent research such as AttriGuard and MELON) would also block honest reviews. We tested exactly that:

| On our benchmark (8 products, 5 conditions, Claude Haiku as the shopper) | Sway | "Decided it" alone |
|---|---|---|
| Manipulated purchases blocked | **19 / 19** | 19 / 19 |
| False alarms on honest purchases | **0 / 16** | 12 / 16 |
| False alarms when an honest expert review decided it | **0 / 8** | 8 / 8 |

Attacks steered the agent in 17 of 24 runs without Sway. Sway stopped all 17 before payment and named the planted page every time. The shopper kept an average of $18.58 per blocked purchase.

We then added three subtler, visible-only attacks modelled on StakeBench's attack families. A covert "final answer" page and a false rival price hike were both blocked 8 of 8, still with 0 false alarms on 16 honest purchases. Fake reviews were blocked 0 of 8: plain astroturf makes no claim the catalog can check, so there is no second key to turn.

*Honest limits:* one model; pages we planted ourselves; 5 re-runs each. Fake reviews get through. Plain persuasive copy with no hidden text and no false claim isn't flagged. That's by design, but it means a skilled liar who tells no checkable lie gets through. The full numbers and method are in the repo.

## How we built it
- **PayPal Orders v2:** `AUTHORIZE` → `/v2/payments/authorizations/{id}/capture` or `/void`, approved through PayPal's own JS SDK button. Orders are created and authorized on the server, so the price never comes from the browser. `custom_id` carries the task and pick into Transaction Search, and a local ledger feeds the ops view (PayPal has no list-orders call).
- **Next.js site:** the shopping assistant, a guided walkthrough, the x-ray and the ops view, all on live data.
- **Channel3:** the real product catalog the agent shops from, the trusted facts that page claims are checked against, and the source of the honest alternative.
- **AG Grid:** the ablation x-ray and the ops view.
- **Sway engine (Python, no dependencies):** noise baseline, single-page and group ablation (so two planted pages repeating each other can't hide behind each other), a deterministic dishonesty detector, and a benchmark harness with cached model calls.
- **Method credit:** ablation attribution comes from ContextCite (MIT), TracLLM (USENIX Security 2025) and AttriGuard (2026). AttriGuard's authors note that attribution alone can't verify content the user delegated to; shopping is that case. Sway adds the second key and wires it to the payment.

## AI tools used
- **Claude Haiku** (via the Claude CLI) plays the shopping agent under test and is re-run for each ablation.
- **[To confirm with the user]** Claude Code was used as a coding assistant to build the app and benchmark.

## Challenges
- **Noise:** the same agent, same pages, can still pick differently. We measure that first and only trust flips above it.
- **Honest influence:** separating "this page convinced it" from "this page tricked it" led to the two-key design.
- **Group attacks:** two planted pages repeating each other make each one look harmless alone, so we added group ablation.

## What's next
- Test more models and subtler, StakeBench-style attacks.
- Use PayPal Vault so agents can buy hands-free and Sway is the only brake.
- An open "why" receipt attached to each payment, so a disputed purchase comes with its own evidence.
- Integrate with the OpenAI Agentic Commerce Protocol, Perplexity, and Meta Poppy — the three in-chat checkouts where affiliate cookies currently break.
- Fake-review detection: a ratings-source triangulation layer that closes the known blind spot.
- A one-click badge publishers earn when their pages pass Sway's honesty test, so other agents weight them higher.

## PayPal surface

Six PayPal products on the critical path, each with a specific role:

| Product | Role |
|---|---|
| Orders v2 `AUTHORIZE` | Hold the pick while Sway runs |
| Orders v2 `CAPTURE` | Settle the honest buy |
| Orders v2 `VOID` | Kill the manipulated authorization |
| Payouts | Pay the publisher that causally swayed the agent (new rail) |
| Partner Referrals | Onboard publishers at `/publishers` so Payouts has a destination |
| Webhooks | Settle order state asynchronously (signature-verified, idempotent) |

A sandbox probe tests `AUTHORIZE` + `vault_id` for payer-not-present autonomy (experimental — PayPal docs cover vault_id for `intent: CAPTURE` only; fallback is capture then refund).

## Built with
paypal · paypal-orders-v2 · paypal-payouts · paypal-partner-referrals · paypal-webhooks · paypal-vault · channel3 · ag-grid · apimatic · render · postman · next.js · typescript · python · claude

---
*Draft notes:* main numbers are from `results/20261014-200907/summary.md`, subtle-attack numbers from `results/20261015-082558/summary.md`; recheck before submitting. Still open: the "AI tools used" line, and the demo video link. The StakeBench figure is from arXiv 2606.13385. Recheck the Wharton and Unit 42 wording against the sources in the brain note before publishing.
