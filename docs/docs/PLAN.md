# Sway project plan (source of truth)

Saved 2026-11-04 from the owner's prompt pack. Work proceeds from this file only.
Notes for whoever runs these prompts:
- The repo lives at `C:\Users\Jenith\Desktop\GEORGE\PROJECTS\paypal\Sway`, not `D:\project\Project 2026\Oct\sway` as the pack says.
- Docs sit in `docs/docs/`, so the `docs/<file>.md` links below are one level off (same gotcha as the README).
- PROMPT 8 was empty in the original pack.

## Progress

| Prompt | Status |
|---|---|
| 1 README hero | done (README has the 60-second run block and judging table) |
| 2 SKILL.md | done (`SKILL.md` at repo root) |
| 3 Rules stacking | done (`docs/docs/rules-stacking.md`) |
| 4 AG Grid ledger + Bryntum | done (`/ops`, `/ops/payouts`, `docs/docs/ops-ledger.md`, `docs/bryntum.md`) |
| 5 Channel3 depth | done: top-5 Channel3 results per task, chosen and attacker-target logged, "Attacker's target named correctly" column, benchmark rerun `results/20261106-223707`, `data/results-lock.json` re-pinned to it |
| 6 Fake-reviews gap | done, option B (honest reframe): limit renamed in README + `docs/docs/limits.md`, issue text in `docs/docs/astroturf-bounty.md` (GitHub issue not yet filed: `gh` not installed). No code or benchmark change; lock untouched |
| 7 UI-agent comparison | done, directional: Playwright stub (not Kernel), 3 tasks, `results/20261106-233223/comparison.json`, `docs/docs/comparison.md`, README chart. Steps/tokens/cost about equal; wall-clock 5.2x in Sway's favour (parallelism). Tokens and latency modelled, no live model calls |
| 8 API publishing | done: APIMatic portal at https://dainty-pothos-703446.netlify.app, Postman workspace at https://dateeiji15-648689.postman.co/workspace/Sway-API~0104b657-9a28-4e16-afda-8c01796dc11f, both URLs added to README |
| 9–10 | not started |

---

Short list, in order. Everything else is already in the repo waiting on him.

## 1. Make it visible (2 min)
```bash
gh repo edit midhunrajcharles/pay --visibility public
```
Before that, scan for leaked secrets:
```bash
git log -p | grep -iE "sk-|pk_|secret|password|client_secret"
```
If anything hits, rotate those keys before flipping.

## 2. PayPal sandbox keys (10 min)
Follow [docs/paypal-sandbox-setup.md](docs/paypal-sandbox-setup.md). Create a sandbox app, grab Client ID + Secret, and drop them into `site/.env.local`:
```
PAYPAL_CLIENT_ID=...
PAYPAL_SECRET=...
PAYPAL_ENV=sandbox
PAYPAL_WEBHOOK_ID=... # from the webhook you create below
```

## 3. Register the webhook (5 min)
In the PayPal sandbox dashboard → **My Apps** → the Sway app → **Webhooks** → add one:
- URL: `https://<your-render-url>/api/webhooks/paypal` (or an ngrok tunnel for local)
- Events: `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.AUTHORIZATION.VOIDED`, `CHECKOUT.ORDER.APPROVED`
Copy the webhook id into `PAYPAL_WEBHOOK_ID`.

## 4. Deploy on Render (one click + 7 min build)
Render dashboard → **New → Blueprint** → point at `midhunrajcharles/pay`. Guide: [docs/deploy-render.md](docs/deploy-render.md). `render.yaml` already wires `sway-api` → `sway-site`. He'll just paste in `PAYPAL_CLIENT_ID`, `PAYPAL_SECRET`, `PAYPAL_WEBHOOK_ID`, and `ANTHROPIC_API_KEY`.

## 5. Smoke-test the live flow (5 min)
On the deployed URL:
- `/try` → run the running-shoes task with `attack_hidden` → should VOID.
- `/try` → run with `clean` → should CAPTURE and (if the decider matches a seeded publisher) fire a Payout.
- `/publishers` → connect one real sandbox publisher via Partner Referrals.
- Hit `/api/vault/test` once with a sandbox vault id to log the probe result.

## 6. Re-record the 2:50 demo (Nov 9–11)
Script: [docs/demo-script.md](docs/demo-script.md). Storyboard: [demo-film/STORYBOARD.md](demo-film/STORYBOARD.md). Tooling in `demo-film/tools/`. The new split-screen hook (Act 1) is in both files already.

## 7. Three peer tests (anytime Nov 6–11)
Have three devs run `/try` and log 2–3 sentences each into [docs/peer-tests.md](docs/peer-tests.md). The "N peers tried it" line in `docs/pitch.md` needs that count.

## 8. Publish APIMatic + Postman (10 min each)
- APIMatic: five steps in [docs/apimatic-setup.md](docs/apimatic-setup.md) using `docs/openapi.yaml`.
- Postman: import `docs/sway.postman_collection.json`, publish as public workspace, paste the URL into the Devpost submission.

## 9. Submit to Devpost
- Nov 5 09:00 PT: early-review submission (polishable draft is fine).
- Nov 11 night: final submission. Text ready in [docs/devpost-story.md](docs/devpost-story.md).

**Full status index:** [docs/flaw-closeout.md](docs/flaw-closeout.md). If anything in steps 1–5 breaks, that file plus `docs/BUILD-PROMPT.md` §14 has the ground truth.

---

# Prompt pack

Each block is one session/task — paste one at a time into Claude Code (or send sequentially). They assume the repo root is cwd.

### PROMPT 1 — README hero + positioning rewrite (Day 1, ~1h)

```
Rewrite README.md's top section (lines 1–20) so a tired judge and an AI pre-screener grasp Sway in 10 seconds.

Rules:
- Line 1: title.
- Line 2: one sentence, max 20 words, naming the novel thing: "the agent's receipt names WHY it bought, and PayPal moves money to the source that convinced it."
- Then a "Judges: run in 60 seconds" block ABOVE everything else, with one copy-pasteable command that boots both services and a sandbox demo mode that works without PayPal keys (fallback to a dry-run that still exercises Orders v2 mocks and the ledger). If a dry-run doesn't exist yet, add it in site/lib/server/paypal.ts behind SWAY_DEMO=1.
- Then a single hero number: "0 / 16 false alarms on honest purchases vs AttriGuard/MELON's 13 / 16."
- Then a "How this maps to PayPal's agent governance" paragraph citing the WebMCP (Sep 16 2026) and agent-skills (Oct 9 2026) developer blog posts. Use PayPal's own vocabulary: trust layer, human-approved, attributable, audit, agent skill.
- Keep the existing Results, PayPal surface, Limits sections but move them below.
- Add a "Judging criteria → where to find it" table at the end mapping Innovation / Impact / Implementation / Design / Presentation to specific files or video timestamps.

Do NOT touch benchmark numbers. Verify every claim against the current repo before writing.
```

### PROMPT 2 — SKILL.md + GitHub About license (Day 1, ~2h)

```
Create SKILL.md at repo root declaring Sway as a reviewable PayPal agent skill, matching the governance model from https://developer.paypal.com/community/blog/agent_skills_at_enterprise_scale .

Include:
- Identity: name, version, maintainer, source URL, license.
- Declared permissions (least-privilege): PayPal scopes used (Orders v2 authorize/capture/void, Payouts, Partner Referrals read, Webhooks), and what Sway will NEVER do (hold credentials, move money without human approval, exceed spend cap).
- Spend caps and approval thresholds (configurable, with defaults).
- Audit contract: every money action produces a ledger row with human_id, agent_id, deciding_page_url, honesty_verdict, paypal_order_id, outcome.
- Failure modes and the fallback for each (void-and-explain, capture-then-refund for vault probe).
- A machine-readable front-matter block (YAML) at the top with the same fields so a reviewer tool can parse it.

Then verify the LICENSE is a real OSI license (MIT or Apache-2.0) and tell me the exact gh command to set the repo's About section license field, since that is set via GitHub web/API not the file.
```

### PROMPT 3 — Resolve the sponsor-prize stacking rule (Day 1, 15 min)

```
Fetch https://paypalaihackathon.devpost.com/rules and quote the exact clause(s) governing: (a) Grand Prize vs Honorable Mention exclusivity, (b) how many Sponsor Prizes one project can win, (c) any clause about one entrant winning in multiple sponsor categories.

Then tell me, in one paragraph, which of these three strategies the rules allow:
 A) 1 main prize + 1 total sponsor prize
 B) 1 main + 1 per sponsor category
 C) something else

Save the quoted clauses to docs/rules-stacking.md with the fetch date.
```

### PROMPT 4 — AG Grid ledger + Bryntum scheduler (Day 2–3, 1–1.5 days)

```
Add an operator-facing audit ledger at site/app/ops/page.tsx using AG Grid Community (React).

Columns: timestamp, agent_id, human_id, product (Channel3 id + title), deciding_page_url, honesty_verdict (pass/fail + reason tag), paypal_order_id (link to sandbox), outcome (captured/voided/refunded), payout_recipient, amount, currency.

Requirements for AG Grid judge (Sylwia Vargas, accessibility focus):
- Full keyboard navigation, ARIA labels on all actions.
- In-grid row actions: Approve (capture), Void, Refund — call existing /api/shop and /api/payouts routes.
- Status cell with icon + text (not icon-only).
- Server-side row model backed by a new /api/ledger route reading from the existing ledger store.
- Dark-mode safe.

Then add a Bryntum Scheduler (community/trial key) at /ops/payouts showing payout batches by publisher over time, reusing the same /api/ledger data. If Bryntum requires a paid license for public hosting, document the trial-key setup in docs/bryntum.md and keep the component behind a feature flag.

Add a 20-second clip of this grid being used (keyboard + approve + void) to demo-film/shots/.
```

### PROMPT 5 — Channel3 depth (Day 3, ~4h)

```
Upgrade the agent to request 3–5 Channel3 results per task (not 1), present them to the shopper agent, and record which one it picked. When the ablation runs, the manipulated-page branch must also name which Channel3 product the attacker tried to misroute the agent toward (shift target).

Changes:
- bench.py or sway/agent.py: Channel3 query returns top-k; the chosen k is logged.
- The honesty check records (chosen_product_id, attacker_target_product_id, shift_detected: bool).
- Add a results column "Attacker's target named correctly" and run the benchmark again.
- Update data/results-lock.json via `python -m sway.lock`.

Explicitly: do not touch the AttriGuard/MELON baseline comparison methodology.
```

### PROMPT 6 — Close the fake-reviews gap honestly (Day 4, ~4h)

```
Our Limits section says fake reviews pass 0/8. Pick ONE of:

A) Fix it: add a reviewer-corroboration signal (cross-source agreement across >=2 independent publishers in the Channel3 catalog, or review-count/age heuristic from catalog metadata). Re-run the 8 fake-review tasks and update results.
B) Honestly reframe: rename the limit to "pure astroturf with no checkable claim is a known boundary — Sway catches lies about checkable facts, not opinions" and open a GitHub issue titled "Bounty: close the astroturf gap" with the exact signal we'd want to add.

Decide based on whether (A) is deliverable in 4 hours without breaking the current false-alarm rate of 0/16. If not, do (B). Report which you chose and why.
```

### PROMPT 7 — UI-clicking agent benchmark comparison (Day 5, ~6h)

```
Add a side-by-side comparison with a Kernel-style UI-driving agent on 3 of the 8 benchmark tasks. For each run record: steps taken, tokens used, wall-clock time, final cost. Report ours vs theirs the way PayPal's WebMCP post reports it (ratios + absolute numbers), and flag it as directional per our own sample size.

Save to results/<new-dir>/comparison.json and a Markdown summary at docs/comparison.md. Add one hero bar chart to the README.

If a real Kernel integration is >1 day, stub it with a Playwright click-through agent instead and label it clearly as "UI-driving baseline (Playwright)."
```

### PROMPT 8 — (empty in the original pack)

### PROMPT 9 — Render deploy + clean-browser test (Day 7, ~3h)

```
Deploy to Render via the existing render.yaml. Then from a clean Chrome profile (no cookies, no extensions) walk through:
1) Open the Render URL.
2) Follow the README's 60-second run block.
3) Complete one honest purchase and one manipulated-page purchase.
4) Open /ops and perform one in-grid Approve and one Void.
5) Open /publishers and complete Partner Referrals onboarding to a sandbox email.

Record every step, every error, every slow page. Write findings to docs/launch-checklist.md with pass/fail per step. Fix any P0/P1 found.
```

### PROMPT 10 — Final Stage-1 self-audit + submit (Day 8–9)

```
Run the Stage-1 checklist against the live Render deployment and the public repo:
- Theme fit: PayPal is central (not a payment button). Evidence file + lines.
- AI is meaningful. Evidence.
- Working end to end from the live URL. Evidence (screenshots).
- Public GitHub repo, OSI license in About, SKILL.md present.
- Public YouTube link, under 3:00, in my own voice.
- English throughout.
- OpenAPI + Postman + APIMatic generated SDK all linked from README.

Write the audit to docs/stage1-audit.md with a one-line verdict per row. Then draft the Devpost submission text (project tagline, built-with list, long description, video link, how-to-run) and save to docs/devpost-submission.md for me to paste.

Deadline target: Nov 12 2026 12:00 PT = Nov 13 01:30 IST. Submit 24h early.
```
