# Flaw close-out (2026-11-03)

Status per flaw from the pre-submission audit. Fatal items are the user's
to close; everything else was addressed in this session or is explicitly
flagged as "cannot fix because X".

## Fatal 5 — deferred to the user (do NOT touch)

| # | Flaw | Status |
|---|---|---|
| F1 | Flip repo visibility to public before Nov 5 09:00 PT | user |
| F2 | Add PayPal sandbox keys to env | user |
| F3 | Wire v2 code (Payouts, Partner Referrals, Webhooks logic, Vault probe) | user; the signature-verify scaffold at `site/app/api/webhooks/paypal/route.ts` is in place |
| F4 | Re-record the 2:50 demo on live sandbox | user |
| F5 | Publish the live site URL (Render blueprint + guide shipped — user clicks Deploy) | user |

## Code-level — closed

| # | Flaw | Resolution | Commit |
|---|---|---|---|
| 23 | GitHub Actions CI | `.github/workflows/ci.yml` runs unittest + Next tsc/build; badge in README | 9194713 |
| 25 | Webhook signature verification code | `site/app/api/webhooks/paypal/route.ts` with the full PayPal verify algorithm; TODOs for post-keys idempotency | 6c2f423 |
| 24 | Ledger design comment | Appended to `site/lib/server/sway-api.ts` with the production Postgres plan | 6c2f423 |
| 26 | One real end-to-end live-API test | `tests/test_live_integration.py` (skipped when server down) | 6c2f423 |
| 29 | One-click Render deploy | `render.yaml` + `docs/deploy-render.md` | daa9eee |

## Serious / prize-point losses — closed

| # | Flaw | Resolution | Commit |
|---|---|---|---|
| 9  | Benchmark scope naming | README + `docs/limits.md` — tasks listed, "not a wild-web survey; the number is on our templates" | 71c6dae |
| 10 | Stability stats surfaced | `/evidence` run header; homepage Infrastructure band gets the one-liner | 71c6dae |
| 11 | Relay rule labelled backstop | `docs/limits.md` reworded | 71c6dae |
| 12 | Cost-per-decision line | `/evidence` run header + Limits list (MELON attenuate-vs-delete as Phase 2) | 71c6dae |
| 14 | Replay check | Verified against `results/20261014-200907/summary.md`; numbers unchanged; dated note in `docs/limits.md` | 71c6dae |

## Rival-weak — closed or explicitly flagged

| # | Flaw | Resolution | Commit |
|---|---|---|---|
| 18 | APIMatic + Postman | `sway/openapi.py` generator; `docs/openapi.yaml`; `docs/sway.postman_collection.json`; `docs/apimatic-setup.md` | f9bbf1e |
| 19 | Render deploy | see #29 above | daa9eee |
| 20 | Public pre-submit chatter | **cannot fix** — staff rule forbids pre-submission chatter; left as-is |
| 21 | Peer-tests template | `docs/peer-tests.md` for user to fill by Nov 11 | f9bbf1e |
| 22 | v2 code | user's job; honesty note in `docs/limits.md` on 3-wired vs 3-designed | 71c6dae |
| 30 | Results-lock | `data/results-lock.json` + `sway/lock.py`; `/evidence` reads the pinned run | f9bbf1e |

## Narrative — closed

| # | Flaw | Resolution | Commit |
|---|---|---|---|
| 28 | Judge-strategy notes removed | `notes/paypal-psychological-analysis.md` + `docs/judging-strategy.md` deleted; `docs/next-actions.md` sanitised | 3fbc9ee |
| 31 | Novelty-claim scope | Dated zero-result GitHub queries in `docs/limits.md` | 71c6dae |
| 32 | Demo hook visualises "one mechanism, two outcomes" in 15s | `docs/demo-script.md` Act 1 + `demo-film/STORYBOARD.md` | 2cd1f4f |
| 33 | "Why PayPal, not a payment-agnostic gate" paragraph | `docs/deep-dive.md` | 2cd1f4f |
| 34 | Worldview-shift one-sentence pitch | `docs/branding.md` (3 candidates ranked); README H1 + Devpost tagline updated | 2cd1f4f |

## Economic / regulatory — closed

| # | Flaw | Resolution | Commit |
|---|---|---|---|
| 35 | For-publishers explainer | `docs/for-publishers.md` with quotes, Payout math, CTA | e9a1cea |
| 36 | For-merchants explainer | `docs/for-merchants.md` with redirect-not-new-spend + dispute-reduction angle | e9a1cea |
| 37 | FTC endorsement-guide cite in OB-10 | `docs/pitch.md` | e9a1cea |

## Known gaps — closed

| # | Flaw | Resolution |
|---|---|---|
| 38 | Judge list check (Olson removed?) | Could not fetch PayPal event page from this session; `docs/judging-strategy.md` no longer exists (deleted in #28), so there is nothing to update. If the user wants a per-judge list elsewhere, re-create one privately — do not re-add judge-strategy content to the public repo. |
| 39 | Multi-entry stacking note | Added to `docs/limits.md` | 71c6dae |
| 40 | v2 code | user; see F3 |

## Final SHAs

- Start of session: 1ce48c9
- End of session:  e9a1cea

See `git log --oneline 1ce48c9..HEAD` for the full chain.
