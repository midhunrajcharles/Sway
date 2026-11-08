# Launch checklist (Prompt 9)

Status as of 2026-11-08: **pre-deploy work verified locally; nothing has been deployed or tested on Render yet.** Rows marked `NOT RUN` need the live URL and PayPal sandbox logins, which only the owner can supply. Do not read a blank Result as a pass.

Severity: P0 = flow cannot complete, money state wrong, or blank/error page. P1 = completes but confusing, over ~10 s with no feedback, or looks broken to a judge. P2 = cosmetic, log only.

## Pre-deploy (Steps A and B)

| # | Step | Result | Time | Error/notes | Severity | Fix |
|---|---|---|---|---|---|---|
| A1 | `serve.py --host` flag | PASS | n/a | Added `--host` (default `127.0.0.1`); bind address and startup line use it | n/a | `sway/server.py` |
| A2 | sway-api start command | PASS (config) | n/a | Backend was the missing `claude` CLI on Render and `SWAY_BACKEND` was never read. Now `--backend anthropic --model claude-haiku-5-5`. The benchmark ran on `claude-cli`/`haiku`, so no API model id existed; the cache key includes backend+model, so the new `--cache-as claude-cli/haiku` flag lets benchmarked scenarios hit the committed cache. Verified locally: a benchmarked `/api/verdict` returned in 0.34 s with a bogus API key (pure cache hit). Live cache misses use the Anthropic API and may differ slightly from the published run | P0 if left | `render.yaml`, `sway/models.py`, `sway/server.py` |
| A3 | `SWAY_API` wiring | PASS (config) | n/a | Site read `SWAY_API`, blueprint set `SWAY_API_URL`, and `hostport` has no scheme. Key renamed; `sway-api.ts` prepends `http://` when missing and trims trailing slashes. Local default unchanged | P0 if left | `render.yaml`, `site/lib/server/sway-api.ts` |
| A4 | Site build command | PASS | 99 s local | `npm ci && npm run build -- --webpack` | n/a | `render.yaml` |
| A5 | Site env vars | PASS (config) | n/a | Added `PAYPAL_WEBHOOK_ID`, `SWAY_SANDBOX_PAYOUT_EMAIL` (both `sync: false`). `SWAY_DEMO` not set: owner has PayPal keys. The site accepts both `PAYPAL_SECRET` and `PAYPAL_CLIENT_SECRET` | n/a | `render.yaml` |
| A6 | Protect the API from public use | PASS (config) | n/a | Chose a **private service** (`type: pserv`): no public URL, so no code path for an attacker, no shared secret to leak or rotate, and the browser never calls the API directly (checked: no client-side use of `SWAY_API`/8787). Trade-off: you cannot open sway-api in a browser; test through the site. **Set a spend limit on the Anthropic key** | P0 if left | `render.yaml` |
| A7 | Python tests | PASS | 0.2 s | 21 run, 3 skipped (live integration, need running API) | n/a | n/a |
| A7 | `tsc --noEmit` | PASS | n/a | no errors | n/a | n/a |
| A7 | Site build | PASS | 99 s | built with `--webpack`; plain `npm run build` (Turbopack) not re-run because it hangs | n/a | n/a |
| B1 | Leak scan | PASS | n/a | `git log -p --all` for `sk-ant`, `client_secret`, `PAYPAL_SECRET`: all hits are variable names or the `sk-ant-...` placeholder. A stricter scan for key-shaped values (`sk-ant-` + 20 chars, secret names followed by a 30-char value) found nothing. No `.env*` files are tracked | n/a | n/a |
| B2 | PayPal sandbox keys | OWNER | n/a | Steps in `docs/docs/paypal-sandbox-setup.md` (note: that file still has an old local path in step 4 and the webhook step is in `deploy-render.md`) | P2 | n/a |
| B3 | `python demo.py` | PASS | ~2 s to ready | Engine on :8787 and site on :3300 both started (`Ready in 1796ms`). Stopped after boot; no purchase run through it | n/a | n/a |
| B4 | Repo pushed | PASS | n/a | `origin` = `midhunrajcharles/Sway`, `main` is 0 ahead / 0 behind before this prompt's edits. The edits are uncommitted | n/a | commit and push (commands in the hand-off) |

## Live walkthrough (Step D) — NOT RUN

Use a fresh Chrome profile or Incognito. Ping both services first (starter plans sleep).

| # | Step | Result | Time | Error/notes | Severity | Fix |
|---|---|---|---|---|---|---|
| D1 | Open the Render URL | NOT RUN | | | | |
| D2 | README 60-second run block as written | NOT RUN | | The block is `python demo.py` (local, demo mode). Check on a machine without PayPal keys | | |
| D3 | Honest purchase: running-shoes, clean. Expect PASS, CAPTURED, payout row if the decider is a seeded publisher | NOT RUN | | Use a benchmarked task first | | |
| D4 | Manipulated purchase: attack_hidden or fake flash price. Expect BLOCK, VOIDED, sentence naming the planted site; then "Yes, switch" | NOT RUN | | | | |
| D5 | `/ops`: one in-grid Approve and one Void, keyboard and mouse | NOT RUN | | Ledger is ephemeral; `demo-film/seed-demo-ledger.py` exists in this checkout (CLAUDE.md is wrong on that) | | |
| D6 | `/publishers`: Partner Referrals onboarding to a sandbox email | NOT RUN | | | | |
| D7 | `/xray`, `/evidence`, `/how-it-works`, `/ops/payouts` ("flag off" notice expected), mobile width | NOT RUN | | | | |

## Final status

Open P0/P1: **unknown until Step D runs.** "Done" requires D3 to D6 to pass on the live URL.
