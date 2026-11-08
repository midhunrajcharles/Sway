# Sway

Attribution and payment routing for AI agent purchases.

[![CI](https://github.com/midhunrajcharles/Sway/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/midhunrajcharles/Sway/actions/workflows/ci.yml)

## Overview

Sway provides causal attribution for AI agent decisions by identifying which sources influenced a purchase, validating their integrity against a trusted catalog, and routing payments accordingly. The system integrates with PayPal's authorization flow to hold funds during verification, then either captures the transaction and issues a payout to the influential source, or voids the transaction if manipulation is detected.

## Judges: boot it in 60 seconds

Requirements: Python 3.10+, Node.js 20+, and either the `claude` CLI (logged in) or `ANTHROPIC_API_KEY`.

```bash
python demo.py
```

This command starts the Sway engine (`:8787`) and Next.js application (`:3300`) in demo mode, then navigate to **http://localhost:3300/shop**.

**Demo mode operates without PayPal credentials.** All PayPal API calls (Orders v2 `AUTHORIZE` → `CAPTURE` / `VOID`, Payouts) are handled by an in-process mock in [`site/lib/server/paypal.ts`](site/lib/server/paypal.ts) with response shapes matching the production API. The complete workflow—authorization, verdict, capture/void, payout—executes against the order ledger (`data/orders.json`) without external network calls. Transaction IDs are prefixed `DEMO-`. Real sandbox credentials (`docs/docs/paypal-sandbox-setup.md`) override demo mode when configured.

Boot takes under a minute. The first purchase then takes 1–3 minutes (25–40 model calls), because no model-call cache is included as no model-call cache is included in the repository. Select a shopping task in `/shop`, choose a test source (manipulated sources trigger voids, honest sources trigger payouts), and monitor the ledger at `/ops`.

## Key Results

**Zero false positives on honest purchases** (0/16) compared to 12/16 for the AttriGuard/MELON-style baseline. Sway blocked 35/35 manipulated purchases that carry a verifiable falsehood or hidden instruction. It blocked **0/8 fake-review attacks**, which make no checkable claims (see Known Limitations).

Results from `results/20261106-223707`, validated against `data/results-lock.json`. Test configuration: 8 shopping tasks, 8 conditions, top-5 Channel3 results per task, k=5, single model (Claude Haiku).

## Sway vs a UI-driving agent

![UI-driving baseline (Playwright) / Sway](docs/img/comparison.svg)

Directional only (3 tasks, modelled tokens and latency, scripted Playwright stub, not Kernel). Steps, tokens and cost come out roughly equal (1.04x, 0.92x, 0.91x UI / Sway); wall-clock favours Sway 5.21x because its ablation calls run in parallel. Sway is a verification layer on top of a purchase, not a cheaper way to shop. Details: [`docs/docs/comparison.md`](docs/docs/comparison.md).

## System Architecture

During PayPal's authorization hold (Orders v2 `intent: AUTHORIZE`), Sway performs ablation analysis by re-executing the agent's decision process with each source removed individually. The system operates in two modes:

1. **Capture and payout.** When the decisive source passes integrity validation, Sway captures the transaction and issues a PayPal Payout to the publisher.
2. **Void and notify.** When the decisive source fails integrity checks (hidden text, agent-targeted instructions, or catalog contradictions), Sway voids the authorization and presents an alternative recommendation.

## PayPal Integration and Governance Alignment

PayPal's [WebMCP announcement](https://developer.paypal.com/community/blog/WebMCP_PayPal_Agent_Ready) (September 16, 2026) establishes that "payment approval, authentication, and buyer protection inside PayPal's trusted experience" remains paramount, with "the buyer in charge of approving the transaction." Sway builds on these principles by adding causal attribution to the transaction flow.

The trust and approval layers remain within PayPal's domain. User authorization is human-approved via PayPal's standard flow. The authorization hold is only released after Sway's verification completes. When manipulation is detected, the user retains decision authority: void the transaction or proceed with capture.

Each transaction record in the ledger (`data/orders.json`, accessible via `/ops` and `/xray`) includes the verdict, influential sources, and user-facing explanations, creating an auditable trail from source influence to payment settlement.

PayPal's [agent skills post](https://developer.paypal.com/community/blog/agent_skills_at_enterprise_scale) (October 9, 2026) addresses governance of agent skills at enterprise scale. Skills function as additional inputs that can influence agent decisions—exactly the type of input Sway's ablation analysis evaluates. The posts are cited for directional alignment; terminology such as "attributable" and "audit" represent our interpretation of the ledger's function.

## Evaluation Results

Benchmark configuration: 8 shopping tasks (running shoes, wireless earbuds, burr coffee grinder, ergonomic office chair, carry-on suitcase, electric toothbrush, air purifier, laptop backpack) with Channel3 product catalog, controlled test pages (honest and manipulated), Claude Haiku as the decision agent, 5 repetitions per scenario. This represents a controlled evaluation environment, not a web-scale survey.

| Metric (Run `results/20261106-223707`, all 8 conditions) | Sway | Baseline (Block when any source decided, AttriGuard/MELON style) |
|---|---|---|
| Steered purchases blocked before payment | **32 / 40** | 40 / 40 |
| Manipulated purchases blocked (including off-target) | **35 / 43** | 43 / 43 |
| False positives on honest purchases | **0 / 16** | 12 / 16 |
| False positives when strong honest review was decisive | **0 / 8** | 8 / 8 |

All 8 manipulated purchases Sway did not block are the fake-review condition (blocked 0/8). Excluding it, Sway blocked 35/35 manipulated and 32/32 steered purchases. The baseline's perfect block rate comes with a 75% false-alarm rate on honest purchases.

Additional metrics: Planted page identified correctly in 32/32 blocked steered purchases, and the attacker's target product named correctly in 35/35 blocked attacks. Average cost savings per blocked purchase: $15.20. Honest reviews that causally influenced decisions credited: 7/8.

Per condition: covert "final answer" injection blocked 8/8, false competitor price claims blocked 7/8 (the eighth did not change the pick), redundant planted pages 8/8. **Fake reviews (astroturfing without catalog contradictions) blocked 0/8.**

## PayPal API Integration

Sway integrates with PayPal's transaction and payout infrastructure:

| API Product | Implementation Role |
|---|---|
| Orders v2 — `AUTHORIZE` / `CAPTURE` / `VOID` | Authorization hold during verification; capture on validated transactions; void on detected manipulation |
| Payouts | Transfer payment to the publisher whose content causally influenced the decision, executed post-capture |
| Partner Referrals | Publisher onboarding flow at `/publishers` to establish payout destinations |
| Webhooks | `/api/webhooks/paypal` receives order events and verifies the signature. Writing events to the ledger and event-ID idempotency are not implemented yet |
| Vault + `AUTHORIZE` | Not implemented. Documented as an open question for payer-not-present flows (see `docs/docs/limits.md`) |

## Operator audit ledger

`/ops` shows every agent purchase in an AG Grid ledger (timestamp, agent and human ID, product, deciding page, honesty verdict with reason, PayPal order, outcome, payout, amount). Operators can Approve (capture), Void or Refund held or captured orders with the keyboard or mouse. Details: `docs/docs/ops-ledger.md`. A payout schedule view at `/ops/payouts` uses Bryntum Scheduler behind a feature flag (`docs/bryntum.md`).

## Judging criteria: where to find it

| Criterion | Where to look |
|---|---|
| Innovation | Ablation-based attribution in `sway/core.py`; comparison with the AttriGuard/MELON-style baseline in the Evaluation Results table; related work in `docs/docs/prior-art.md` |
| Impact | `docs/docs/for-merchants.md`, `docs/docs/for-publishers.md`; honest limits in `docs/docs/limits.md` |
| Implementation | Orders v2 authorize, capture, void, refund and Payouts in `site/lib/server/paypal.ts`; routes in `site/app/api/`; ledger in `site/lib/server/ledger-view.ts`; tests in `tests/` and `site/lib/server/ledger-view.test.ts` |
| Design | The site in `site/`; the keyboard-accessible audit grid at `/ops` (`site/app/ops/ledger-grid.tsx`); clip in `demo-film/shots/` |
| Presentation | Demo script `docs/docs/demo-script.md`; submission text `docs/docs/devpost-story.md`; video link to be added once recorded |

## Known Limitations

- **Pure astroturf with no checkable claim is a known boundary: Sway catches lies about checkable facts, not opinions.** Fake reviews that assert nothing the catalog can contradict pass (0/8 blocked). We did not ship a heuristic, because one that fires on them also fires on genuine lone expert reviews. Open as a bounty: [docs/docs/astroturf-bounty.md](docs/docs/astroturf-bounty.md).
- **Persuasive but truthful content.** By design, compelling content that makes no false claims is not flagged. Skilled content that remains factually accurate passes validation.
- **Single model evaluation.** Primary evaluation uses Claude Haiku. Preliminary Sonnet evaluation (1 task) showed higher baseline resistance to manipulation.
- **Agent decision variance.** Decision consistency varies by task (lowest: 40% self-agreement), requiring statistical comparison against this baseline variance.
- **Pattern-based relay detection.** The instruction relay detector uses phrase matching; held-out evaluation (`tests/heldout_relay.py`) shows 6/10 detection rate on reworded attacks.
- **Computational cost.** 25–40 model calls per transaction. The authorization hold period accommodates this latency.
- **Agent context requirement.** Requires agent cooperation to access decision context. Similar integration pattern to CrawlerPal (2025 1st place). Production agents (ChatGPT, Perplexity) do not currently expose this interface.
- **Vault authorization experimental status.** PayPal documentation covers `vault_id` with `intent: CAPTURE` only. Implementation includes capture-then-refund fallback for `AUTHORIZE` intent.

## Installation and Deployment

Requirements: Python 3.10+ (standard library only), Node.js 20+, and either the `claude` CLI (authenticated) or API key.

### Local Development

Start the Sway API server:
```bash
python serve.py --port 8787
```

Configure and start the Next.js application:
```bash
cd site && cp env.example .env.local && npm install && npm run dev
```

Configure PayPal sandbox credentials in `site/.env.local` (instructions: `docs/paypal-sandbox-setup.md`), then access http://localhost:3300. 

Without credentials and outside demo mode, payment functionality displays "PayPal is not connected" but other features remain operational. Use `python demo.py` for full workflow testing against mocked PayPal responses.

### Production Deployment

See `docs/deploy-render.md` for Render deployment. The `render.yaml` configuration handles both services with appropriate networking.

### Additional Configuration

- **Model call cache**: `data/cache` is excluded from the repository. Initial runs will make live model calls (1–3 minutes per transaction). Cache populates automatically during use.
- **Alternative model providers**: Use `python serve.py --backend <provider> --model <model_id>` with appropriate API key environment variable. Supported: `anthropic`, `openai`, `groq`, `openrouter`, `gemini`.
- **Benchmark execution**: `python bench.py`
- **Test suite**: `python -m pytest tests`
- **OpenAPI specification generation**: `python -m sway.openapi` (output: `docs/openapi.yaml`)
- **Postman collection**: `docs/sway.postman_collection.json`; public workspace: https://dateeiji15-648689.postman.co/workspace/Sway-API~0104b657-9a28-4e16-afda-8c01796dc11f (steps in `docs/postman-setup.md`)
- **APIMatic SDK portal**: https://dainty-pothos-703446.netlify.app (steps in `docs/apimatic-setup.md`)
- **Benchmark result locking**: Published results are pinned via `data/results-lock.json`. Local benchmark runs require `python -m sway.lock --main <dir> --subtle <dir>` to update site display.

## Repository Structure

| Path | Description |
|---|---|
| `sway/` | Core engine implementation (Python): ablation analysis, integrity detection, catalog validation, API server |
| `serve.py`, `bench.py` | API server entry point and benchmark runner |
| `tests/` | Unit tests and held-out validation sets |
| `results/` | Benchmark run archives (each contains `summary.md`, `results.jsonl`, `xray.csv`) |
| `data/` | Model call cache and Channel3 catalog cache |
| `site/` | Next.js application (shopping interface, ledger views, AG Grid integration). See `site/README.md` |
| `docs/` | Documentation (see table below) |
| `demo-film/` | Demo video production pipeline (recording tools, Remotion project, storyboard) |
| `notes/` | Research notes |
| `*.log`, `run_hardening.sh` | Benchmark execution logs and hardening test script |

## Documentation

| Document | Content |
|---|---|
| `docs/devpost-story.md` | Competition submission narrative |
| `docs/demo-script.md` | Video shot list (2:50 duration, formatted for 3-minute limit) |
| `docs/pitch.md` | 5-minute presentation with technical Q&A appendix |
| `docs/deep-dive.md` | System architecture, PayPal integration details, novelty analysis, evaluation methodology |
| `docs/branding.md` | Visual identity and asset inventory |
| `docs/limits.md` | Technical constraints, open problems, detection blind spots |
| `docs/deploy-render.md` | Render platform deployment guide |
| `docs/apimatic-setup.md` | APIMatic SDK portal publication workflow |
| `docs/postman-setup.md` | Postman public workspace publication steps |
| `docs/for-publishers.md`, `docs/for-merchants.md` | Value proposition for each stakeholder group |
| `docs/peer-tests.md` | Peer evaluation protocol |
| `docs/next-actions.md` | Development schedule through November 12 deadline |
| `docs/paypal-sandbox-setup.md` | PayPal sandbox credential configuration |
| `docs/prior-art.md` | Related research and Sway's contributions |
| `docs/BUILD-PROMPT.md`, `docs/STEP-PROMPTS.md` | Build documentation and incremental setup instructions |
| `docs/sway-status.xlsx` | Feature completion tracking |

## Attribution and Prior Work

The ablation-based attribution methodology builds on ContextCite, TracLLM, MELON, and AttriGuard. Sway's contributions: dual-key verification (causal attribution + integrity validation against trusted catalog), payment routing via Payouts API based on verification outcome, and integration with payment authorization flow. See `docs/prior-art.md` for detailed comparison.

Base repository template: PayPal + AG Grid hackathon starter (Eddie Jaoude), Apache-2.0 license.

## License

MIT License. See `LICENSE` file.

## Evaluation Criteria Reference

Video timestamps reference shot list in [`docs/docs/demo-script.md`](docs/docs/demo-script.md) (2:50 duration).

| Criterion | Implementation Locations |
|---|---|
| **Innovation** | Dual-key verification logic (causal + integrity) in [`sway/core.py`](sway/core.py) `check()` function; integrity detection signals in [`sway/detect.py`](sway/detect.py); novelty comparison with prior work in [`docs/docs/prior-art.md`](docs/docs/prior-art.md). Video demonstration at 1:50–2:10 (x-ray interface, attribution-only baseline comparison). |
| **Impact** | False positive comparison (0/16 vs 12/16) in [`results/20261106-223707/summary.md`](results/20261106-223707/summary.md); publisher value proposition in [`docs/docs/for-publishers.md`](docs/docs/for-publishers.md); merchant adoption factors in [`docs/docs/for-merchants.md`](docs/docs/for-merchants.md); technical constraints in [`docs/docs/limits.md`](docs/docs/limits.md). Video demonstration at 2:10–2:20. |
| **Implementation** | PayPal API integration and demo mode mock in [`site/lib/server/paypal.ts`](site/lib/server/paypal.ts); authorization → verification → capture/void/payout flow in [`site/app/api/shop/approve/route.ts`](site/app/api/shop/approve/route.ts); ledger management in [`site/lib/server/sway-api.ts`](site/lib/server/sway-api.ts); test suite in [`tests/test_sway.py`](tests/test_sway.py); CI pipeline in [`.github/workflows/ci.yml`](.github/workflows/ci.yml); OpenAPI specification in [`docs/openapi.yaml`](docs/openapi.yaml). Video demonstration at 0:42–1:32 (authorization hold, void, payout in PayPal sandbox). |
| **Design** | Shopping interface in [`site/app/shop/shopper.tsx`](site/app/shop/shopper.tsx); x-ray analysis grid in [`site/app/xray/xray.tsx`](site/app/xray/xray.tsx); operations ledger in [`site/app/ops/ops.tsx`](site/app/ops/ops.tsx). Video demonstration at 1:15 (manipulation notification) and 2:20 (ledger views). |
| **Presentation** | Video shot list in [`docs/docs/demo-script.md`](docs/docs/demo-script.md); competition narrative in [`docs/docs/devpost-story.md`](docs/docs/devpost-story.md); technical presentation in [`docs/docs/pitch.md`](docs/docs/pitch.md); visual identity in [`docs/docs/branding.md`](docs/docs/branding.md). |
