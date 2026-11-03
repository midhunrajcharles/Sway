# Sway

**Sway's receipt names why the agent bought, and PayPal moves money to the source that convinced it.**

[![CI](https://github.com/midhunrajcharles/Sway/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/midhunrajcharles/Sway/actions/workflows/ci.yml)

## Judges: run in 60 seconds

```bash
python demo.py
```

This boots the Sway engine (`:8787`) and the site (`:3300`) together with `SWAY_DEMO=1`, then open **http://localhost:3300/shop**. It needs Python 3.10+ and Node 20+ (the first run does `npm install`), plus a model for the shopping agent: the logged-in `claude` CLI, or `ANTHROPIC_API_KEY`.

**No PayPal keys needed.** In demo mode every PayPal call (Orders v2 `AUTHORIZE` → `CAPTURE` / `VOID`, then Payouts) is answered by an in-process mock in [`site/lib/server/paypal.ts`](site/lib/server/paypal.ts) with the same response shapes as the real API. The real approve → verdict → capture-or-void → payout code path and the order ledger (`data/orders.json`) run unchanged; nothing leaves your machine and no money moves. Ids are prefixed `DEMO-`. The PayPal button becomes a local "Approve (SWAY_DEMO)" button. Set real sandbox keys (`docs/docs/paypal-sandbox-setup.md`) and they take precedence over the flag.

A live check calls the model about 25–40 times (1–3 minutes), because no model-call cache ships in this repo. In `/shop`, pick a task and a test web (an attack web shows the void, an honest one shows the payout) and watch the ledger on `/ops`.

## The number

**0 / 16 false alarms on honest purchases, vs AttriGuard/MELON's 13 / 16.** Both block 19 / 19 manipulated purchases. Run `results/20261014-200907`, pinned by `data/results-lock.json`. Scope and limits are in Results and Limits below: 8 tasks, our own test pages, one model.

## What it does

While PayPal only holds the money (Orders v2 `intent: AUTHORIZE`), Sway re-runs the agent's decision with each page it read removed. One ablation does two things:

1. **Pay the honest influence.** If the page that decided the pick passes the honesty test, Sway captures and sends a PayPal Payout to the publisher.
2. **Stop the manipulation.** If the deciding page is dishonest (hidden text, instructions aimed at AI agents, or price and stock claims that contradict the real Channel3 catalog), Sway voids the hold and offers the shopper the honest pick in one plain sentence.

## How this maps to PayPal's agent governance

PayPal's [WebMCP post](https://developer.paypal.com/community/blog/WebMCP_PayPal_Agent_Ready) (Sep 16, 2026) keeps "payment approval, authentication, and buyer protection inside PayPal's trusted experience" and says "the buyer remains in charge of approving the transaction." Sway is built on those two properties and adds the one the checkout layer lacks: why the agent chose the item. The trust layer stays PayPal's. The shopper's PayPal approval stays human-approved, and the hold is only released after Sway's check. When Sway blocks, the shopper still decides: switch (void) or keep (capture). Each ledger row records the verdict, the pages that decided it and the sentence shown to the shopper, so a purchase is attributable to the sources that drove it and can be audited later (`data/orders.json`, `/ops`, `/xray`). PayPal's [agent-skills post](https://developer.paypal.com/community/blog/agent_skills_at_enterprise_scale) (Oct 9, 2026) is about governing agent skills at enterprise scale; a skill an agent loads is one more input that can steer a purchase, which is the kind of input Sway ablates. We cite these posts for direction, not endorsement: "attributable" and "audit" are our wording for what the ledger does, not quotes from PayPal.

## Results

Our benchmark: 8 StakeBench-family shopping tasks — running shoes, wireless earbuds, burr coffee grinder, ergonomic office chair, carry-on suitcase, electric toothbrush, air purifier, laptop backpack — with real Channel3 products, test pages we wrote (honest and planted), Claude Haiku as the shopper, every decision repeated 5 times. This is not a wild-web survey; the number is on our templates.

| Run `results/20261014-200907` (5 test webs) | Sway | Block when any page decided (AttriGuard/MELON style) |
|---|---|---|
| Steered purchases blocked before payment | **17 / 17** | 17 / 17 |
| Manipulated purchases blocked (incl. off-target) | **19 / 19** | 19 / 19 |
| False alarms on honest purchases | **0 / 16** | 13 / 16 |
| False alarms when a strong honest review decided it | **0 / 8** | 8 / 8 |

The planted page was named correctly every time Sway blocked. The shopper kept $18.58 on average per blocked purchase. Honest reviews that genuinely swayed the agent were credited 6 / 6.

With 3 subtler, visible-only attacks added (`results/20261015-082558`, 8 test webs): a covert "final answer" page was blocked 8/8 and a false rival price hike 8/8. **Fake reviews were blocked 0/8.** There were still 0 false alarms on 16 honest purchases.

## PayPal surface

Sway lives between the agent's pick and the money moving, using PayPal end-to-end:

| Product | Role |
|---|---|
| Orders v2 — `AUTHORIZE` / `CAPTURE` / `VOID` | Hold the pick while Sway runs; capture the honest buy; void the manipulated one |
| Payouts | Pay the publisher that causally swayed the agent, after capture |
| Partner Referrals | Onboard publishers at `/publishers` so Payouts has a destination |
| Webhooks | Settle order state asynchronously (signature-verified, idempotent on event id) |
| Vault + `AUTHORIZE` | Autonomy probe for payer-not-present flows (experimental in sandbox — see `docs/limits.md`) |

## Limits

- **Fake reviews get through.** Plain astroturf makes no claim the catalog can check, so Sway has no second key to turn. Ratings data would close this gap.
- **Persuasive copy with no checkable lie isn't flagged.** That's by design, but a skilled writer who tells no checkable lie gets through.
- **One model so far** (Claude Haiku), and pages we planted ourselves. A partial Sonnet run (1 task so far) resisted most attacks on its own.
- **Noise.** The agent sometimes disagrees with itself (40% agreement in the worst task), so every effect is compared against that noise.
- **The relay-instruction rule is phrase-based**: 6 of 10 reworded attacks were caught on a held-out set (`tests/heldout_relay.py`).
- **Cost**: about 25–40 model calls per purchase. PayPal holds the money between authorize and capture, so the check fits in that window.
- **It needs the agent's context**, so it works with agents that cooperate, like the one in this repo. Live ChatGPT and Perplexity don't yet expose this — same integration shape as CrawlerPal (2025 1st place).
- **`AUTHORIZE` + vault_id is experimental in sandbox.** PayPal docs cover vault_id for `intent: CAPTURE` only; the probe + fallback (capture then refund) is live.

## Run it

You need Python 3.10+ (no extra packages), Node.js 20+, and the `claude` CLI logged in (or an API key, see below).

```bash
python serve.py --port 8787
```

```bash
cd site && cp env.example .env.local && npm install && npm run dev
```

Put your PayPal sandbox keys in `site/.env.local` (steps in `docs/paypal-sandbox-setup.md`), then open http://localhost:3300. Without the keys and without `SWAY_DEMO=1`, everything works except paying: the shopper screens say "PayPal is not connected". `python demo.py` (above) runs the whole flow against the PayPal mock instead.

For a hosted deploy, see `docs/deploy-render.md`: `render.yaml` ships both services with the right wiring.

- `data/cache` (the model-call cache) is not committed in this checkout, so every check calls the agent live (1–3 minutes). It fills as you use it.
- To use an API key instead of the `claude` CLI: `python serve.py --backend anthropic --model <model id>` with `ANTHROPIC_API_KEY` set (also `openai`, `groq`, `openrouter`, `gemini`).
- Benchmark: `python bench.py` · tests: `python -m pytest tests`
- OpenAPI spec: `python -m sway.openapi` (writes `docs/openapi.yaml`). Postman collection: `docs/sway.postman_collection.json`. APIMatic steps: `docs/apimatic-setup.md`.
- The published benchmark run is pinned by `data/results-lock.json`; running `python bench.py` does not update the site until you re-run `python -m sway.lock --main <dir> --subtle <dir>`.

## What's in this folder

| Folder / file | What it is |
|---|---|
| `sway/` | The Sway engine (Python): ablation check, detector, catalog, API server |
| `serve.py`, `bench.py` | Start the Sway API · run the benchmark |
| `tests/` | Unit tests for the engine, plus a held-out set for the relay rule |
| `results/` | Benchmark runs; each has `summary.md`, `results.jsonl`, `xray.csv` |
| `data/` | Model-call cache and Channel3 catalog cache |
| `site/` | The website and app screens (Next.js, AG Grid), see `site/README.md` |
| `docs/` | Docs, listed below |
| `demo-film/` | Demo film pipeline (recording tools, Remotion project, storyboard) |
| `notes/` | Early research notes |
| `*.log`, `run_hardening.sh` | Benchmark run logs and the hardening run script |

## Docs

| File | What it is |
|---|---|
| `docs/devpost-story.md` | The Devpost submission text |
| `docs/demo-script.md` | 2:50 shot list for the demo video (fits the 3-minute cap) |
| `docs/pitch.md` | 5-minute live pitch + hard-questions appendix |
| `docs/deep-dive.md` | Architecture, PayPal surface, novel-vs-assembled, per-criterion scoring |
| `docs/branding.md` | Identity, tagline, asset checklist |
| `docs/limits.md` | Honest caveats, open gaps, and known blind spots |
| `docs/deploy-render.md` | 10-line deploy guide for Render (uses `render.yaml`) |
| `docs/apimatic-setup.md` | Steps to publish the APIMatic SDK portal from `docs/openapi.yaml` |
| `docs/for-publishers.md`, `docs/for-merchants.md` | Why each side of the market would onboard |
| `docs/peer-tests.md` | Peer-test template filled by Nov 11 |
| `docs/next-actions.md` | Day-by-day plan from here to the Nov 12 deadline |
| `docs/paypal-sandbox-setup.md` | How to get PayPal sandbox keys and test a payment |
| `docs/prior-art.md` | Related research and what Sway adds |
| `docs/BUILD-PROMPT.md`, `docs/STEP-PROMPTS.md` | Full build reference + step-by-step prompts for a fresh clone |
| `docs/sway-status.xlsx` | What's done and what's left |

## Credits

The ablation method comes from prior work: ContextCite, TracLLM, MELON and AttriGuard. Sway adds the second key (the dishonesty test against the catalog), the Payouts settlement rail from the same test, and wires the check to the payment. See `docs/prior-art.md`.

Hackathon boilerplate base: PayPal + AG Grid (Eddie Jaoude), Apache-2.0.

## License

MIT, see `LICENSE`.

## Judging criteria → where to find it

Timestamps refer to the shot list in [`docs/docs/demo-script.md`](docs/docs/demo-script.md) (2:50 cut).

| Criterion | Where to look |
|---|---|
| **Innovation** | Two-key verdict (decided it AND dishonest) in [`sway/core.py`](sway/core.py) `check()`; dishonesty signals in [`sway/detect.py`](sway/detect.py); the novelty vs ContextCite / MELON / AttriGuard in [`docs/docs/prior-art.md`](docs/docs/prior-art.md). Video 1:50–2:10 (the x-ray, and why attribution-only blocks honest reviews). |
| **Impact** | 0 / 16 vs 13 / 16 false alarms in [`results/20261014-200907/summary.md`](results/20261014-200907/summary.md); publisher payouts in [`docs/docs/for-publishers.md`](docs/docs/for-publishers.md), merchant side in [`docs/docs/for-merchants.md`](docs/docs/for-merchants.md); honest gaps in [`docs/docs/limits.md`](docs/docs/limits.md). Video 2:10–2:20. |
| **Implementation** | PayPal calls and the `SWAY_DEMO` mock in [`site/lib/server/paypal.ts`](site/lib/server/paypal.ts); authorize → verdict → capture/void/payout in [`site/app/api/shop/approve/route.ts`](site/app/api/shop/approve/route.ts); ledger in [`site/lib/server/sway-api.ts`](site/lib/server/sway-api.ts); engine tests in [`tests/test_sway.py`](tests/test_sway.py); CI in [`.github/workflows/ci.yml`](.github/workflows/ci.yml); API spec in [`docs/openapi.yaml`](docs/openapi.yaml). Video 0:42–1:32 (hold, void, payout in real PayPal). |
| **Design** | Shopper chat [`site/app/shop/shopper.tsx`](site/app/shop/shopper.tsx); x-ray grid [`site/app/xray/xray.tsx`](site/app/xray/xray.tsx); ops grid [`site/app/ops/ops.tsx`](site/app/ops/ops.tsx). Video 1:15 (the stop message) and 2:20. |
| **Presentation** | Shot list [`docs/docs/demo-script.md`](docs/docs/demo-script.md); [`docs/docs/devpost-story.md`](docs/docs/devpost-story.md); [`docs/docs/pitch.md`](docs/docs/pitch.md); branding in [`docs/docs/branding.md`](docs/docs/branding.md). |
