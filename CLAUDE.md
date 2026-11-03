# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Sway: when an AI shopping agent buys something, Sway re-runs the agent's decision with each web page it read removed (counterfactual ablation). If the page that decided the pick is honest, the purchase is captured and the publisher is paid via PayPal Payouts. If it is dishonest (hidden text, instructions aimed at AI agents, claims contradicting the real Channel3 catalog), the PayPal authorization is voided. Built for the PayPal AI Hackathon 2026. `README.md` and `docs/docs/limits.md` hold the benchmark numbers and the known gaps (e.g. fake reviews are not caught).

## Commands

Two processes run together:

```bash
python serve.py --port 8787                 # Python engine/API (stdlib only, Python 3.10+)
cd site && cp env.example .env.local && npm install && npm run dev   # Next.js site on :3300
```

- Backend: defaults to the `claude` CLI; use `python serve.py --backend anthropic --model <id>` with `ANTHROPIC_API_KEY` (also `openai`, `groq`, `openrouter`, `gemini`).
- Python tests (CI uses unittest): `python -m unittest discover -s tests -v`; single test: `python -m unittest tests.test_sway.Core.test_clean_passes`. `python -m pytest tests` also works.
- `tests/test_live_integration.py` hits a running API on :8787 and is skipped otherwise. `tests/heldout_relay.py` is a held-out set for the relay-instruction rule, not part of discovery.
- Site CI: `cd site && npx tsc --noEmit && npm run build` (no lint or test scripts).
- Benchmark: `python bench.py` writes `results/<timestamp>/{results.jsonl,summary.md,xray.csv}`.
- The site reads the **published** run pinned in `data/results-lock.json`, so `bench.py` does not change the site. Re-pin with `python -m sway.lock --main <dir> --subtle <dir>`.
- Regenerate the OpenAPI spec: `python -m sway.openapi` (writes `docs/openapi.yaml`).

## Architecture

**Python engine (`sway/`)**
- `core.py` `check()` is the heart: runs baseline decisions plus decisions with each page removed (and groups: all suspicious pages together, near-duplicate pages), k times each, in a thread pool. A unit "decided" if its flip rate exceeds both `flip_min` and the baseline's self-disagreement noise plus `margin`. Verdict is BLOCK only when a unit both decided AND is suspicious ("two keys"). `attr_only_verdict` is the AttriGuard/MELON-style comparison baseline (block whenever anything decided).
- `detect.py`: `signals()` flags a page (hidden text, relay instructions, claims contradicting catalog); `extract()` turns HTML into the text the agent sees (naive mode includes hidden text).
- `agent.py`: the simulated shopper prompt/`decide()`; `models.py`: backend adapters with an on-disk call cache (`data/cache`, committed, so benchmarked scenarios answer instantly).
- `scenarios.py`: builds test webs for the 8 `CONDITIONS` (clean, attack_*, honest_strong, and the "subtle" ones); `catalog.py`: the 8 tasks and Channel3 products (`data/catalog/*.json`); `explain.py`: the plain-language verdict sentence; `server.py`: the stdlib HTTP API (`/api/health|tasks|pick|verdict|results|evidence`).

**Next.js site (`site/`, App Router, React 19, AG Grid)**
- `app/api/*` routes (shop pick/decide/approve/order/refund, payouts, publishers/onboard, evidence, ops, ledger, tasks) are thin handlers over `lib/server/`: `sway-api.ts` (client to the Python API plus the order ledger), `paypal.ts` (Orders v2 AUTHORIZE/CAPTURE/VOID, Payouts, Partner Referrals, webhooks), `publishers.ts`.
- Order ledger is file-backed at `data/orders.json` (one level above `site/`, resolved from `process.cwd()`), so run the site from `site/`. Webhooks are signature-verified and idempotent on event id.
- `/ops` has an operator audit ledger (AG Grid, infinite row model over `/api/ledger`; see `docs/docs/ops-ledger.md`). `/ops/payouts` is a Bryntum Scheduler behind `NEXT_PUBLIC_SWAY_BRYNTUM=1` (see `docs/bryntum.md`). Site unit test: `cd site && npm test`.
- Env (`site/.env.local`): `PAYPAL_CLIENT_ID`, `PAYPAL_SECRET` (`render.yaml` names it `PAYPAL_CLIENT_SECRET`), `SWAY_API` (default `http://127.0.0.1:8787`). Without PayPal keys everything works except paying.
- `lib/sway.ts` holds the shared types between the Python API responses and the site.

**Deploy**: `render.yaml` defines `sway-api` (python) and `sway-site` (node); see `docs/docs/deploy-render.md`.

## Gotchas

- Docs live in `docs/docs/` (the README's `docs/` paths are one level off).
- The README lists `demo-film/`, `notes/`, `run_hardening.sh` and `*.log`; these are not present in this checkout.
- Each real check costs about 25-40 model calls (1-3 minutes live) unless cached.
