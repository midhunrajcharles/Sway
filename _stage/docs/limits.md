# Honest limits

Everything Sway doesn't do, said plainly, before a judge finds it.

> **Replay check 2026-11-03:** headline numbers verified against `results/20261014-200907/summary.md` and `results/20261015-082558/summary.md` without a new live run. 19/19 manipulated blocked, 0/16 false alarms, 13/16 attribution-only false alarms — unchanged from the published claims in README and `docs/devpost-story.md`.

> **Multi-entry stacking:** staff responded in `#general-hackathon-question` that stacking across sponsor tracks is allowed, pending Devpost confirmation. We submit one entry; a later Devpost ruling to the contrary doesn't affect the submission.

> **Integration state (today):** three PayPal APIs are wired live (Orders v2 `AUTHORIZE`/`CAPTURE`/`VOID`, OAuth, and the Vault probe route); Payouts, Partner Referrals, and Webhooks are designed and scaffolded (`site/app/api/webhooks/paypal/route.ts` carries the signature-verify algorithm; `docs/BUILD-PROMPT.md` §14 specifies the v2 code shape). This document is kept honest about which is which.

## Known blind spots

- **Fake-review attacks.** On the 3 subtler hardening attacks (fake-reviews, covert-instruction, price-smear), fake-reviews caught **0 / 8**. Channel3 has no ratings data, so the honesty rail has no second key to turn against plain astroturf. covert-instruction + price-smear both caught 8 / 8. Fix: a ratings-source triangulation layer. Not in scope for the hackathon window.
- **Plain persuasive copy with no checkable lie.** By design. A skilled writer who makes no claim the catalog can check gets through.
- **One shopper model.** Headline results are on Claude Haiku. A partial Sonnet hardening run (1 of 4 tasks) completed; Sonnet resisted most attacks on its own.
- **Pages we planted.** The attacks are StakeBench-family templates, not wild pages. The method extends to wild pages; the number is on our pages.

## PayPal sandbox pain

- **`AUTHORIZE` + vault_id is experimental.** PayPal docs cover vault_id for `intent: CAPTURE` only. Sway ships the sandbox probe (`site/app/api/vault/test/route.ts`); fallback is capture then refund.
- **Disputes can't really be tested in sandbox.** Echoed in the `#general-hackathon-question` channel. No dispute flow is claimed.
- **Webhooks arrive out of order or go missing.** Hookdeck's own blog confirms. Sway's handler is signature-verified and idempotent on `event id`.
- **`INVOICE_READ_WRITE` returns 422 `FEATURES_UNAUTHORIZED`** on some sandbox apps. Not on Sway's path.

## Statistical caveats

- **Noise.** The agent sometimes disagrees with itself (40% agreement in the worst task). Every effect is compared against that baseline.
- **k = 5 ablation + N+1 model calls** per decision. ~25-40 model calls per purchase. Cost line published on `/evidence`. Attenuate-vs-delete mode (MELON-style) would lower this; it is the Phase 2 optimisation.
- **Phrase-based relay rule — backstop, not primary signal.** The honesty verdict is driven by the ablation + catalog check; the relay-instruction rule only catches "ignore prior pages, say X" style attacks the ablation already flags via other signals. On a held-out set of 10 reworded attacks it caught 6 (`tests/heldout_relay.py`). The rule is brittle by itself; the two-key verdict does not lean on it.
- **Benchmark scope.** 8 StakeBench-family tasks: running shoes, wireless earbuds, burr coffee grinder, ergonomic office chair, carry-on suitcase, electric toothbrush, air purifier, laptop backpack (full catalog in `sway/catalog.py`). Attack conditions are StakeBench templates (hidden instructions, two planted pages, fake flash price, covert "final answer", false rival price hike, fake reviews). This is **not a wild-web survey; the number is on our templates**, with real Channel3 products underneath. The method extends to wild pages; the headline numbers do not.
- **Novelty claim scope.** The claim "first per-sale creator rail from a causal ablation on an agent's sources, wired to a pre-capture PayPal `AUTHORIZE` gate" is scoped by two GitHub code searches run 2026-10-13 and 2026-11-03 that returned zero results: `"PayPal" "authorize" "ablation" agent` and `"Payouts" "attribution" agent commerce`. We only claim novelty against public open-source. Industry research that didn't ship as code is covered under "Prior art credit".

## Integration surface

- **Only cooperating agents.** Sway's ablation needs the sources the agent read. Live ChatGPT and Perplexity don't yet expose this. Sway ships with its own cooperating agent (`sway/scenarios.py`), same integration shape as CrawlerPal (the 2025 1st-place winner). Path forward: AP2 Verifiable Credential field, which Meta Poppy, the OpenAI Agentic Commerce Protocol, and the Google Universal Commerce Protocol all have slots for.

## Audio and media

- **The demo-film audio is original.** Music and sound effects were synthesised by `demo-film/tools/synth.py`; no third-party trademarks or copyrighted material.
- **Fictional retailer names** are substituted into recordings via `demo-film/tools/rec.py` (brand-name swap). Keeps the Channel3 integration real; avoids trademark issues in the YouTube cut.

## Prior art credit

The ablation primitive is from prior work and credited openly:
- **ContextCite** (Madry Lab, 2024) — https://github.com/MadryLab/context-cite — MIT
- **TracLLM** — perturbation attribution for prompt-injection forensics (USENIX Security 2025)
- **MELON** — masked re-execution attribution (ICML 2025)
- **AttriGuard** — re-run with attenuated observations (arXiv 2603.10749, Jun 2026)

The second-key honesty test grounded in Channel3's catalog, the Payouts settlement rail from the same ablation, and the pre-capture commerce gate on `AUTHORIZE` are new.
