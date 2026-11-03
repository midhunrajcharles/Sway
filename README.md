# Sway

[![CI](https://github.com/midhunrajcharles/Sway/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/midhunrajcharles/Sway/actions/workflows/ci.yml)

**Agents don't need better payment limits. They need to know who they're listening to — and so does the money.**

_When an AI buys something, Sway pays whoever actually convinced it — and stops the pages that tried to trick it._

AI agents now shop for people, and any web page they read can be written to steer them. Payment checks look at *what* an agent buys: the amount, the payee, the limits. Sway checks *why* it chose that item — and from the same check, pays the honest sources that convinced it.

While PayPal only holds the money (Orders v2 `intent: AUTHORIZE`), Sway re-runs the agent's decision with each page it read removed. One ablation does two things:

1. **Pay the honest influence.** If the page that decided the pick passes the honesty test, Sway captures and sends a PayPal Payout to the publisher. The first per-sale creator rail for in-chat agent commerce.
2. **Stop the manipulation.** If the deciding page is dishonest — hidden text, instructions aimed at AI agents, or price and stock claims that contradict the real Channel3 catalog — Sway voids the hold and offers the shopper the honest pick in one plain sentence.

Built for the PayPal AI Hackathon 2026.

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

Put your PayPal sandbox keys in `site/.env.local` (steps in `docs/paypal-sandbox-setup.md`), then open http://localhost:3300. Without the keys, everything works except paying: the shopper screens say "PayPal is not connected".

For a hosted deploy, see `docs/deploy-render.md`: `render.yaml` ships both services with the right wiring.

- The model-call cache in `data/cache` is included, so the benchmarked products answer instantly. New runs call the agent live (1–3 minutes).
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
