# Deep-Dive

## What it does

Sway sits between an AI shopping agent and PayPal. When the agent is about to buy, Sway puts the order on AUTHORIZE, re-runs the agent's decision with each source removed, and uses the result to do two things from the same ablation: pay the pages that actually convinced the agent via PayPal Payouts, and void the authorization if a dishonest page decided the buy.

## Architecture

### Runtime flow
1. Shopper (or shopper's agent) asks for a product.
2. Sway's agent (sway/scenarios.py) reads a candidate set from Channel3's UCP catalog and open-web sources.
3. Sway creates a PayPal **Orders v2 AUTHORIZE** on the agent's pick (held, not captured).
4. **sway/core.py** runs k=5 counterfactual ablation: re-executes the pick with each source removed; records flip + baseline flip rate (per-task).
5. **sway/detect.py** runs the second key: catalog-grounded honesty test against Channel3 (price claim vs available, hidden text, relay instructions, false "discontinued").
6. Verdict:
   - **Clean + honest influence named** → **CAPTURE**, then **Payouts** to the credited publisher.
   - **Clean + no single page decided** → CAPTURE, no payout (buy was multi-source).
   - **Planted page decided** → **VOID**, show cheaper alt from catalog, record the attempt.
7. All of it goes through **Webhooks** → `/api/webhooks/paypal` → ledger (`sway/data/orders.json`).

### Components
- `sway/core.py` — ablation engine (built, 14 tests pass)
- `sway/detect.py` — honesty detector (built, 56/64 planted pages flagged, 0 honest false flags)
- `sway/scenarios.py` — agent + planted/honest pages (built)
- `sway/serve.py` — HTTP API (built)
- `sway/site/` — Next.js 16 app, Apple-feel, pages: `/`, `/shop`, `/try`, `/xray`, `/ops`, `/evidence`, `/publishers`, `/how-it-works`, `/research` (built, needs sandbox keys)
- `sway/site/app/api/payouts/credit` — NEW, ~0.5 day
- `sway/site/app/api/publishers/onboard` — NEW, Partner Referrals stub, ~0.5 day
- `sway/site/app/api/webhooks/paypal` — NEW, signature + idempotency, ~0.5 day
- `sway/site/app/api/vault/test` — NEW, AUTHORIZE+vault_id probe, ~0.5 day

### PayPal APIs used
| API | Role | Status |
|---|---|---|
| Orders v2 — AUTHORIZE | hold on agent's pick | built, awaits sandbox keys |
| Orders v2 — CAPTURE | settle after Sway OK | built |
| Orders v2 — VOID | kill a manipulated buy | built |
| Payouts | pay the causally-identified publisher | NEW |
| Partner Referrals | onboard publishers at /publishers | NEW |
| Webhooks | asynchronous order state + idempotency | NEW |
| Vault | AUTHORIZE+vault_id autonomy test | NEW probe |

Six on critical path; Acquit uses four. Deepest PayPal integration in the visible field.

### Why PayPal, not a payment-agnostic gate

Sway could, in theory, run before any PSP's capture. In practice the pieces that make it a *rail* and not just a filter are PayPal-shaped:

- **`AUTHORIZE` / `CAPTURE` / `VOID` with no fee penalty.** PayPal's Orders v2 gives us a free hold window to run the ablation in. Several other PSPs charge for authorizations that don't capture, which makes a pre-capture check an operational tax instead of a feature.
- **Payouts.** Per-sale micro-payments to a publisher — $0.80 on a $40 basket — only pencils out when the rail has first-class recipient onboarding (Partner Referrals) and settlement (Payouts) that work internationally without surcharges on each hit. Rebuilding that elsewhere is months of surface, not weeks.
- **Vault + `AUTHORIZE`.** The payer-not-present autonomy probe we're exercising only exists end-to-end in PayPal's sandbox; equivalent tokenization on other providers is tied to CAPTURE, which defeats the point of a pre-capture gate.
- **Honey precedent.** PayPal already owns the honest-attribution-at-checkout problem (Honey lost ~7,000 merchants over it). The Payouts rail is the home for the fix.

A payment-agnostic version is a research project. The commerce rail is the thing judges can wire to a real sandbox today, and it is PayPal.

### Sponsor stack
- **AG Grid 1st prize ($5K target):** `/xray` ablation matrix + `/ops` by-domain + "Paid" column, async data source wired to Sway API, filter/paging translated to API params (canonical Oct 12 workshop pattern).
- **Channel3 ($1.5K):** UCP catalog is the trusted baseline for the second key (honesty test). Not decoration — load-bearing.
- **APIMatic ($1K):** generate Sway API docs portal from OpenAPI (`/api/*` endpoints).
- **Render (credits):** deploy site/ with 10-line guide.
- **Postman ($1K):** export 7 Sway endpoints + 3 PayPal flows as public collection.
- **Astropods (hosting + $10 AI credit):** optional, host the Sway agent.
- **KERNEL:** optional, unattended "Approve" click in the demo so no human hand on screen.

## Novel vs assembled

| Component | Source | License / Credit |
|---|---|---|
| Counterfactual ablation primitive | ContextCite (Madry Lab, MIT), TracLLM (USENIX Sec 2025), MELON (ICML 2025), AttriGuard (arXiv 2603.10749) | credited openly in README; MIT compatible |
| Attenuate-vs-delete ablation mode | MELON idea borrowed | credited |
| Attribution-before-detection order | AttnTrace framing | credited |
| **Second-key catalog honesty test** | **novel** — AttriGuard Sec. 7 named the gap, Sway fills it with Channel3-grounded rules | — |
| **Payouts settlement from the same ablation** | **novel** — no existing project does this | — |
| **Pre-capture commerce gate on AUTHORIZE** | **novel** — academic method, first commerce use | — |
| Site design | user's own Cypher Capital Next port (user confirmed ownership) | — |
| Boilerplate | PayPal + AG Grid hackathon boilerplate (Eddie Jaoude) | Apache-2.0 |

## Evidence plan

| Metric | How measured | By when |
|---|---|---|
| Manipulated buys blocked | `results/20261014-200907` 8 tasks × k=5 | DONE (19/19 blocked) |
| False alarms on honest buys | same run | DONE (0/16; attribution-only baseline: 12/16) |
| Honest sources credited | same run | DONE (6/6 strong honest reviews credited) |
| Average savings per blocked buy | same run | DONE ($18.58) |
| Known blind spot (fake reviews) | hardening run B | DONE (0/8; stated as known limit) |
| Visible-only attacks (rendered extract) | hardening run C | DONE (hidden 1/8, redundant 0/8 — expected) |
| Second-model (Sonnet) stability | hardening run D | PARTIAL (1 task done; Sonnet resisted most attacks) |
| Sandbox PayPal roundtrip success | sandbox test after keys land | [MEASURE THIS] |
| 3-5 real target users try the demo | peer test | [MEASURE THIS] |

## Per-criterion optimization

| Criterion | Sway score source |
|---|---|
| Technological implementation | 6 PayPal APIs on critical path; ablation engine with pass/fail numbers; MIT-compatible prior-art credits |
| Design | Apple-feel site; AG Grid matrix on `/xray` + `/ops` + "Paid" column; PayPal JS SDK button |
| Potential impact | Honey-fix framing; publisher economy for in-chat agent commerce; sits above every agent framework (platform-agnostic) |
| Innovation | GitHub 0 results and YC 0 for causal-pay-at-checkout; first defense number on StakeBench-family attacks |
| Presentation | 2:50 video; pitch chart 0/16 vs 12/16; Honest caveats upfront |

## Failure modes

1. **Vault + AUTHORIZE unsupported in sandbox.** Fallback: capture → refund path. Mention in README caveats.
2. **Payouts sandbox rate-limited.** Fallback: queue the Payout and show pending state in `/ops`.
3. **Publisher onboarding (Partner Referrals) not fully clickable in sandbox.** Fallback: 2 pre-seeded sandbox publisher emails + screenshot of the flow.
4. **Fake-review attacks remain a blind spot.** Fallback: name it in Honest caveats; it's a known limit of the honesty rail (Channel3 has no ratings).
5. **Noise flip > planted flip on edge tasks.** Fallback: baseline stability avg 0.78 is in the data; two-key verdict (not flip alone) blocks a false alarm.
6. **Agent context access limits.** Only works with cooperating agents; shown as "integration surface" not a bug.
