# Contributing to Sway

Sway is a payment-safety layer for agentic commerce: PayPal authorizes, Sway re-runs the agent on honest-only evidence, and PayPal captures only if both verdicts agree. Contributions that make that path stronger, cheaper, or easier to reason about are welcome.

## How to report a bug

1. Check `data/orders.json` and `results/` for the failing run — the full state transition is there.
2. Open an issue with:
   - Task + web condition (e.g. `running-shoes` + `deceptive_visible`)
   - The agent's pick (`chosen`), the honest-only pick (`decided_by_honest`), and the verdict
   - The PayPal order id (sandbox is fine) if the issue involves capture or void
   - Commit SHA

## How to propose a change

- **Small fix** (typo, bug, missing test case in the ablation): open a PR directly.
- **New condition** (another planted-page attack): add a fixture under `data/web/` and wire it through `sway/web.py`. The existing six conditions (`clean`, `attack_hidden`, `attack_redundant`, `deceptive_visible`, `honest_strong`, `fake_reviews`, `covert_instruction`, `price_smear`) are the pattern to copy.
- **New LLM backend**: add it to `OPENAI_COMPAT` in `sway/models.py` (OpenAI-compatible) or add a branch in `Model._call`. Keep the cache key deterministic.
- **Change to the two-key verdict logic**: open an issue first. The ablation benchmark in `bench.py` must still pass. Don't lower the bar.

## Development setup

```bash
# API
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python serve.py --port 8787

# Site
cd site
npm ci
npm run dev
```

Set `GROQ_API_KEY` (or any supported backend's key) in the environment. PayPal sandbox credentials go in `site/.env.local` as `PAYPAL_CLIENT_ID` + `PAYPAL_SECRET`.

## Running the ablation

```bash
python bench.py --tasks running-shoes earbuds --conditions clean deceptive_visible fake_reviews
```

Results land in `results/`. The committed cache under `data/cache/` lets a judge reproduce the paper without an API key.

## Code style

- Python: standard-library-first, no new deps unless they pay for themselves. Type hints encouraged, not required.
- TypeScript: server-only code under `site/lib/server/`; nothing that touches the LLM key runs in the browser.
- Keep comments explaining *why*, not *what*. Delete dead code; don't leave it commented out.

## Commits + PRs

- Imperative tense (`add`, `fix`, `switch`), present tense, lowercase first word.
- One concern per commit.
- PR description: what changed, why, how you verified.

## Code of conduct

See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
