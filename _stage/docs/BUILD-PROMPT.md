# Sway — Complete Build & Wire-Up Prompt

> Paste this into a fresh Claude session. It contains everything needed to get
> Sway running end-to-end: backend, frontend, PayPal, Channel3, AG Grid, all wired.
>
> **Zero mock data.** Every API call is real: real Channel3 products, real Claude
> model calls, real PayPal sandbox transactions (test money, real API). The agent
> shops a live catalog, Sway runs live ablation, PayPal holds and captures real
> (sandbox) dollars. No stubs, no fake responses, no hardcoded results.
>
> **Scope split: v1 is shipped, v2 is designed.** Sections 1–13 describe v1,
> which is in `main` as of commit `4f1e928`. Section 14 describes the v2 scope
> — Payouts to honest influencers, Partner Referrals onboarding, Webhooks,
> and the Vault + `AUTHORIZE` autonomy probe — which is in the plan at
> `docs/next-actions.md` (days D1–D5) but not yet in the code. Nothing in
> sections 1–13 depends on v2.

---

## 1. What Sway Is

Sway checks **why** an AI shopping agent chose an item before PayPal takes the money, and (v2) pays the honest sources that convinced it from the same test.

**Flow:**
1. Shopper asks the agent for a product (voice or text)
2. Agent reads web pages + Channel3 catalog → picks an item
3. PayPal creates an order with `intent: AUTHORIZE` (money held, not taken)
4. Sway re-runs the agent's decision with each page removed (counterfactual ablation)
5. Two-key verdict:
   - **Key 1:** Did removing this page change the pick? (beyond the agent's normal wobble)
   - **Key 2:** Is this page dishonest? (hidden text, AI instructions, price claims that contradict Channel3 catalog)
6. Both keys → **BLOCK**: the money stays on hold and the shopper sees one sentence, e.g. "I paused the payment for X. One site decided it, and it… Without that page I would have picked Y ($Z less). Switch to it?"
   - **Yes, switch** → PayPal voids the hold, then a new order is made for the honest pick
   - **Keep mine** → PayPal captures anyway (the shopper has the last word)
7. Only Key 1 or neither → **PASS**: PayPal captures. Honest reviews that change minds are fine.
8. **(v2, planned)** After a PASS where a page passed the honesty test and causally decided the pick, Sway fires a **PayPal Payout** to that publisher. The attribution comes from the same ablation that would have voided a dishonest decider — one mechanism, both outcomes.
9. **(v2, planned)** Publishers onboard at `/publishers` via **PayPal Partner Referrals** so Payouts has a destination.

**Hackathon:** PayPal AI Hackathon 2026, deadline Nov 12. Target: 1st Place ($12K) + AG Grid 1st ($5K) = $17K.

---

## 2. Project Structure

```
D:\project\Project 2026\Oct\sway\
│
├── sway/                        ← Python engine (ZERO external dependencies)
│   ├── __init__.py              ← empty
│   ├── core.py                  ← Two-key ablation check (the algorithm)
│   ├── detect.py                ← Dishonesty detector (hidden text, AI instructions, price/stock contradictions, relay instructions)
│   ├── catalog.py               ← Channel3 UCP product catalog (anonymous, no API key)
│   ├── agent.py                 ← Shopping agent prompt + response parser
│   ├── models.py                ← Model backends: claude-cli, anthropic, openai, groq, openrouter, gemini. Disk cache in data/cache/
│   ├── explain.py               ← Verdict → one plain sentence for the shopper + short reasons for ops
│   ├── scenarios.py             ← Test web pages: 4 honest (guide, forum, tracker, review) + honest_strong + 6 attack types
│   └── server.py                ← stdlib HTTP API (no Flask/FastAPI)
│
├── serve.py                     ← Entry point: python serve.py --port 8787
├── bench.py                     ← Benchmark runner: python bench.py
├── tests/
│   ├── __init__.py
│   ├── test_sway.py             ← 14 unit tests (stub agent, no model calls)
│   └── heldout_relay.py         ← Held-out set for relay instruction rule
│
├── data/
│   ├── cache/                   ← Model call cache (included in repo, instant replay)
│   ├── catalog/                 ← Channel3 product cache (8 tasks × 5 products each)
│   └── orders.json              ← PayPal order ledger (created at runtime, git-ignored)
│
├── results/                     ← Benchmark run outputs
│   ├── 20261014-200907/         ← Final 8-task run (main numbers)
│   │   ├── results.jsonl
│   │   ├── xray.csv
│   │   └── summary.md
│   └── 20261015-082558/         ← Hardening run (subtle attacks)
│
├── site/                        ← Next.js 16 app (AG Grid for sponsor prize)
│   ├── app/
│   │   ├── page.tsx             ← Home / landing
│   │   ├── shop/                ← Shopping assistant (chat + voice + PayPal button)
│   │   │   ├── page.tsx
│   │   │   └── shopper.tsx      ← Main shopping UI component
│   │   ├── try/                 ← Guided walkthrough (pick product + scenario → verdict)
│   │   │   ├── page.tsx
│   │   │   ├── try-demo.tsx
│   │   │   └── xray-table.tsx
│   │   ├── xray/                ← AG Grid ablation matrix
│   │   │   ├── page.tsx
│   │   │   └── xray.tsx
│   │   ├── ops/                 ← AG Grid ops dashboard
│   │   │   ├── page.tsx
│   │   │   └── ops.tsx
│   │   ├── evidence/page.tsx    ← Benchmark numbers
│   │   ├── how-it-works/page.tsx
│   │   ├── research/page.tsx    ← Credits + prior art
│   │   ├── api/
│   │   │   ├── tasks/route.ts       ← GET: list tasks + Channel3 products
│   │   │   ├── evidence/route.ts    ← GET: benchmark rows for evidence page
│   │   │   ├── xray/route.ts        ← GET ?task=&condition=: full Sway check for the x-ray view
│   │   │   ├── ops/route.ts         ← GET: order ledger
│   │   │   └── shop/
│   │   │       ├── pick/route.ts    ← POST: agent picks a product (step 1)
│   │   │       ├── order/route.ts   ← POST: create PayPal AUTHORIZE order (step 2)
│   │   │       ├── approve/route.ts ← POST: after PayPal approval → authorize → Sway check → capture or hold (step 3)
│   │   │       └── decide/route.ts  ← POST: shopper says "switch" or "keep" (step 4)
│   │   ├── layout.tsx
│   │   ├── error.tsx
│   │   └── not-found.tsx
│   ├── components/
│   │   ├── PayPalButton.tsx     ← PayPal JS SDK button (loads from paypal.com/sdk/js, intent=authorize)
│   │   ├── SwayGrid.tsx         ← AG Grid wrapper
│   │   ├── EnvBadge.tsx         ← "Sandbox" badge
│   │   ├── Menu.tsx             ← Navigation
│   │   ├── SiteHeader.tsx / SiteFooter.tsx
│   │   ├── Text.tsx             ← Typography
│   │   ├── Logo.tsx             ← Sway logo (two-pill mark)
│   │   └── sections/            ← Landing page sections
│   │       ├── Hero.tsx
│   │       ├── Capabilities.tsx
│   │       ├── Infrastructure.tsx ← Benchmark numbers
│   │       ├── ProprietaryInvestments.tsx
│   │       └── Values.tsx
│   ├── lib/
│   │   ├── sway.ts              ← Types, formatters, WEBS array, browser-side request()
│   │   ├── use-shop-flow.ts     ← React hook: full shopping flow state machine
│   │   ├── server/
│   │   │   ├── paypal.ts        ← PayPal Orders v2: createOrder, authorizeOrder, captureAuthorization, voidAuthorization
│   │   │   └── sway-api.ts      ← Server-side client for Python Sway API + order ledger (data/orders.json)
│   │   ├── routes.ts
│   │   └── (visual libs: chrome-symbol/, hero/, swirl/ — WebGL effects)
│   ├── env.example              ← Template: PAYPAL_CLIENT_ID, PAYPAL_SECRET, SWAY_API
│   ├── package.json             ← next@16.4.0, react@19.3.0, ag-grid-community@^36.2.0, ag-grid-react@^36.2.0
│   ├── tsconfig.json
│   └── next.config.ts
│
├── docs/
│   ├── devpost-story.md         ← Devpost submission text (draft)
│   ├── prior-art.md             ← Academic prior art
│   └── paypal-sandbox-setup.md  ← User setup steps
│
├── notes/                       ← Research notes
├── README.md
├── LICENSE                      ← MIT
└── .gitignore                   ← node_modules, .next, .env*, data/orders.json
```

---

## 3. How Backend ↔ Frontend Are Wired

### Architecture

```
Browser (Next.js on :3300)
  ↓ fetch /api/shop/pick, /api/shop/order, etc.
Next.js API routes (site/app/api/)
  ↓ server-side fetch to Sway API
Python Sway API (serve.py on :8787)
  ↓ calls Channel3 UCP (ucp.trychannel3.com)
  ↓ calls Claude (via claude-cli or API key)
  ↓ runs ablation check
  ↓ returns verdict
Next.js API routes
  ↓ calls PayPal Orders v2 (api-m.sandbox.paypal.com)
  ↓ writes to data/orders.json (local ledger)
Browser
```

### The 4-step shopping flow (wired end to end)

**Step 1: Agent picks** (`/api/shop/pick` → Python `/api/pick`)
- Browser: user types or speaks a request
- `use-shop-flow.ts` calls `POST /api/shop/pick` with `{task, condition}`
- `site/app/api/shop/pick/route.ts` calls `swayPick()` → Python API `/api/pick`
- Python `server.py:pick()` → `catalog.py:fetch_task()` gets Channel3 products → `agent.py:decide()` calls the model k times → returns the majority pick
- Python returns `{task, products, condition, chosen, stability, pages: [{id, url}], target}` (`chosen` is the product id, e.g. `P4`)
- The route adds `product` (the chosen product) and `paypalClientId` (null when no keys are set)

**Step 2: Create PayPal order** (`/api/shop/order` → PayPal)
- Browser: PayPal button's `createOrder` callback fires
- `site/app/api/shop/order/route.ts` → `paypal.ts:createOrder()` → `POST /v2/checkout/orders` with `intent: AUTHORIZE`
- The product and price come from the server (`swayPick()` again, memoized), never from the browser
- Writes the entry to `data/orders.json` with status `CREATED` (the ledger, because PayPal has no list-orders API)
- Returns: `orderId`

**Step 3: Approve + Sway check** (`/api/shop/approve` → PayPal authorize → Python verdict)
- Browser: PayPal's `onApprove` fires with the `orderID`
- `site/app/api/shop/approve/route.ts`:
  1. `paypal.ts:authorizeOrder()` → `POST /v2/checkout/orders/{id}/authorize` (money held) → ledger status `HELD`
  2. If this is a switch order (replaces a voided one): capture immediately, no second check
  3. Otherwise: `swayVerdict()` → Python API `POST /api/verdict`
  4. Python `server.py:verdict()` → `core.py:check()` runs full ablation:
     - k baseline runs (measure agent wobble)
     - k runs without each page (single-page ablation)
     - k runs without suspicious groups (group ablation for redundant attacks)
     - `detect.py:signals()` checks each page for hidden text, AI instructions, catalog contradictions
     - Two-key verdict: decided AND dishonest → BLOCK; else PASS
  5. If PASS: `paypal.ts:captureAuthorization()` → money taken → ledger status `CAPTURED`
  6. If BLOCK: money stays held (status stays `HELD`; the ledger gets `verdict: BLOCK`, `decidedBy`, `alternative`, `saved`). The UI shows `verdict.sentence` and the two buttons

**Step 4: Shopper decides** (`/api/shop/decide` → PayPal void or capture)
- Only after a BLOCK. Shopper taps "Yes, switch" or "Keep mine"
- `site/app/api/shop/decide/route.ts`:
  - "keep": `captureAuthorization()` → money taken (shopper overrides Sway) → status `KEPT_BY_SHOPPER`
  - "switch": `voidAuthorization()` → money released → status `VOIDED` → flow goes back to step 2 with `replaces: <voided orderId>`, which orders the alternative and captures it on approval without a second check

### Other API routes

- `GET /api/tasks` → Python `/api/tasks` → list of 8 shopping tasks + their Channel3 products + available test conditions
- `GET /api/xray?task=…&condition=…` → Python `POST /api/verdict` → full ablation x-ray for the AG Grid view
- `GET /api/ops` → reads `data/orders.json` → all orders for AG Grid ops dashboard
- `GET /api/evidence` → Python `/api/evidence` → benchmark rows from `results/` folder

### Key integration: PayPal JS SDK

`components/PayPalButton.tsx` loads PayPal's JS SDK from:
```
https://www.paypal.com/sdk/js?client-id={PAYPAL_CLIENT_ID}&intent=authorize&currency=USD&components=buttons
```
It renders PayPal's own button. The `createOrder` and `onApprove` callbacks go to our Next.js API routes, which call PayPal's real Orders v2 API. No mock PayPal — real sandbox transactions with real hold/capture/void.

### Key integration: Channel3

`sway/catalog.py` calls Channel3's anonymous UCP endpoint:
```
POST https://ucp.trychannel3.com/mcp
Body: {"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"search_catalog","arguments":{"catalog":{"query":"running shoes","pagination":{"limit":25}}}}}
Header: User-Agent: sway-spike/0.1 (+https://github.com)
```
No API key needed. Returns real products with real prices, descriptions, availability from the live Channel3 marketplace. Products are cached locally in `data/catalog/` for speed, but every product is real.

### Key integration: AG Grid

Two AG Grid views:
- `/xray` — ablation matrix: rows = pages the agent read, columns = pick-without-it, flip rate, agreement, signals found, verdict, plus an "Attribution only (AttriGuard-style)" comparison column
- `/ops` — risk dashboard: all purchases grouped by source domain, captured vs voided, money saved

Uses `ag-grid-community` and `ag-grid-react` (^36.2.0). The grid component is `components/SwayGrid.tsx`.

---

## 4. Environment Setup

### Python (engine)
- Python 3.10+ (no pip packages needed — stdlib only)
- `claude` CLI logged in (for the `claude-cli` backend), OR set `ANTHROPIC_API_KEY` and use `--backend anthropic --model claude-haiku-5-5`
- Channel3 UCP works anonymously (just needs internet)

### Node.js (site)
- Node.js 20+
- `cd site && npm install`
- Copy `env.example` to `.env.local` and fill in PayPal keys

### PayPal Sandbox (USER DOES THIS)
1. Go to https://developer.paypal.com → log in
2. Switch to **Sandbox** (not Live)
3. **Apps & Credentials** → Default Application or create "Sway" (Merchant type)
4. Copy **Client ID** and **Secret** into `site/.env.local`:
   ```
   PAYPAL_CLIENT_ID=<paste>
   PAYPAL_SECRET=<paste>
   SWAY_API=http://127.0.0.1:8787
   ```
5. **Testing Tools → Sandbox Accounts**: note the Personal (buyer) account email + password
6. Restart the site after adding keys

---

## 5. Running It

### Terminal 1: Sway API
```bash
cd "D:\project\Project 2026\Oct\sway"
python serve.py --port 8787
```
Output: `Sway API on http://127.0.0.1:8787 (claude-cli/haiku, k=5)`

Alternative with API key (PowerShell, VS Code's default terminal). This skips the saved answers in `data/cache`, so every check runs live:
```powershell
$env:ANTHROPIC_API_KEY = "sk-ant-..."
python serve.py --port 8787 --backend anthropic --model claude-haiku-5-5
```

### Terminal 2: Site
```bash
cd "D:\project\Project 2026\Oct\sway\site"
npm run dev
```
Output: `▲ Next.js 16.4.0 ... Local: http://localhost:3300`

### Verify
1. Open http://localhost:3300 → landing page loads
2. Open http://localhost:3300/shop → "Your shopping assistant" appears
3. Without PayPal keys: "PayPal is not connected" warning
4. With PayPal keys: PayPal's gold button appears after agent picks

---

## 6. The End-to-End Flow to Test

Once both servers are running and PayPal keys are in. Every model answer for running shoes is saved in `data/cache`, so each step answers at once.

1. Go to http://localhost:3300/shop. The default test scenario is "**+ a fake flash price**" (`deceptive_visible`). To change it, click the **Test scenarios** button (sliders icon, top right of the chat)
2. Type `I need running shoes for daily training` (or tap the running shoes suggestion)
3. Agent: "I read 5 pages." then "The best fit is the adidas Response 2 Running Shoes, $69.95 from SHOEBACCA.com. Approve it with PayPal?"
4. Click PayPal's button → log in as the sandbox Personal buyer → approve
5. "$69.95 on hold. Nothing has been taken yet." → "Checking why the agent chose it…"
6. **Expected result:** "I paused the payment for the adidas Response 2 Running Shoes ($69.95). One site, flashdeal-today.shop, decided it, and it says the adidas Response 2 Running Shoes costs $41.97, but the store catalog says $69.95. Without that page I would have picked the Scend Pro Running Shoes ($39.95, $30.00 less). Switch to it?"
7. Click **Yes, switch** → "Hold released. Nothing was charged." → new PayPal button → approve → "Paid $39.95." → "You kept $30.00, and the planted page didn't get its sale."
8. Check https://www.sandbox.paypal.com Business account: the $69.95 authorization = Voided, the $39.95 payment = Completed
9. With **Honest pages** selected instead: the agent picks the Scend Pro Running Shoes ($39.95), Sway passes and PayPal captures at once ("Paid for the Scend Pro Running Shoes.")
10. Go to /xray → AG Grid shows the ablation matrix (only the flashdeal-today.shop row decided it and is blocked)
11. Go to /ops → AG Grid shows the orders and the websites that decided them

Step-by-step version with exact checks: `docs/STEP-PROMPTS.md`.

---

## 7. What's Done

- [x] Sway engine: ablation, detector, catalog, API server, 14 tests pass
- [x] Benchmark (main run, 8 tasks × 5 conditions): 17/17 steered purchases blocked, 0/16 false alarms
- [x] Hardening: 3 subtler attacks (covert 8/8, price smear 8/8, fake reviews 0/8)
- [x] Site: 8 pages, 8 API routes, all live against real APIs (zero mock data)
- [x] PayPal integration (v1): Orders v2 AUTHORIZE → capture/void, JS SDK button
- [x] Channel3 integration: anonymous UCP catalog
- [x] AG Grid: x-ray + ops views
- [x] Prior art documented, honest limits published
- [x] Devpost story drafted (v2 reframe added at commit `4f1e928`)
- [x] GitHub: github.com/midhunrajcharles/pay (**PRIVATE**, commit `4f1e928`)
- [x] README, MIT LICENSE
- [x] v2 docs on disk: `pitch.md`, `deep-dive.md`, `branding.md`, `judging-strategy.md`, `limits.md`, `next-actions.md`
- [ ] v2 code (Payouts, Partner Referrals, Webhooks, Vault probe) — **see section 14**

## 8. What's Left (Priority Order)

### BLOCKERS (must do before submission)
1. **PayPal sandbox keys** → user creates app at developer.paypal.com, pastes keys into `site/.env.local`
2. **Build the v2 wiring** → Payouts route, Partner Referrals stub + `/publishers` page, Webhooks handler, Vault + `AUTHORIZE` sandbox probe (**see section 14 and `docs/next-actions.md` D1–D5**)
3. **End-to-end verification** → run the v1 flow in section 6 and the v2 payout beat in section 14, fix any issues
4. **Make repo public** → GitHub settings → Danger Zone → Change visibility (before Nov 5 early review)
5. **Submit on Devpost** → paste story from `docs/devpost-story.md`, check built-with tags, add Postman and APIMatic links

### SHOULD DO
6. Deploy to Render + 10-line deploy guide → sponsor prize + "Try it out" link
7. Public Postman collection (7 Sway endpoints + 3 PayPal flows) → sponsor prize
8. APIMatic generated SDK portal from OpenAPI → sponsor prize
9. AG Grid filter → API-param translation on /xray and /ops (canonical Oct 12 workshop pattern)
10. GitHub Actions CI (`python -m unittest discover -s tests -v` + Next build) → clean badge
11. Responsive check → /shop at 390px width (phone), dark mode on all pages
12. Recheck all numbers in devpost-story.md and site against latest `results/*/summary.md`
13. Confirm "AI tools used" line (Claude Haiku for agent, Claude Code for building)
14. Secret scan on repo tree before `gh repo edit --visibility public`

### NICE TO HAVE
15. More models in benchmark (full Sonnet run on 4 tasks, GPT-4o)
16. Subtler attack testing
17. KERNEL unattended sandbox-approval script for the demo video
18. Astropods hosting for the agent (optional sponsor coverage)

---

## 9. Known Issues & Fixes

### "The Sway API is not running"
The Next.js site can't reach Python on :8787. Start `python serve.py --port 8787` first.

### "PayPal is not connected"
No `PAYPAL_CLIENT_ID` / `PAYPAL_SECRET` in `site/.env.local`. See section 4.

### Claude CLI limit / expired login
Only live calls need the CLI; saved answers in `data/cache` work without it. If the `claude-cli` backend fails, re-login (`claude login`) or switch to an API key (PowerShell):
```powershell
$env:ANTHROPIC_API_KEY = "sk-ant-..."
python serve.py --backend anthropic --model claude-haiku-5-5
```

### Channel3 403
The UCP endpoint needs a `User-Agent` header. Already set in `catalog.py`. If it fails, check internet.

### PayPal authorize → capture: "INSTRUMENT_DECLINED"
The sandbox buyer has no balance. Go to sandbox.paypal.com → log in as Personal buyer → check balance.

### Cached vs live model calls
Model responses are cached to disk by their exact input hash (`data/cache/`). The benchmark's products already have cached responses that replay instantly — these are real model responses recorded from real Claude calls, not fabricated data. A new task/condition combo calls the model live (1-3 min per ablation check, ~25-40 calls).

### CORS
The Python API listens on `127.0.0.1:8787` and the Next.js API routes call it server-side (not from the browser), so CORS is not an issue. The browser only talks to Next.js on :3300.

### Windows path spaces
The project is in `D:\project\Project 2026\Oct\sway`. The `serve.py` entry point does `os.chdir(ROOT)` so Python works from any cwd. For the site, always `cd` into `site/` before running `npm`.

---

## 10. File-by-File Reference

### Python Engine

**`sway/core.py` — The algorithm**
- `check(model, task, products, pages, k, workers, extract_mode)` → returns `{verdict, chosen, stability, baseline_picks, blocked_by, blocked_pages, alternative, decided_by_honest, attr_only_verdict, attr_only_blocked_pages, calls, xray}`
- Each `xray` entry: `{unit, kind, pages, flip_rate, without_it, decided, suspicious, signals}`
- Groups suspicious pages for group ablation (catches redundant attacks)
- Computes `attr_only_verdict` (AttriGuard/MELON-style baseline) for comparison

**`sway/detect.py` — Dishonesty detector**
- `signals(page_html, products)` → `{hidden_text?, ai_addressed?, relay_instruction?, catalog_contradiction?}`
- `extract(page_html, mode)` → visible text (mode="rendered") or all text (mode="naive")
- `price_contradictions(text, products)` — price claims vs Channel3 catalog (handles "under $X" ceilings)
- `availability_contradictions(text, products)` — "discontinued/sold out" vs catalog
- Hidden text detection: `display:none`, `visibility:hidden`, `font-size:0`, `opacity:0`, off-screen positioning, same fg/bg color, HTML comments

**`sway/catalog.py` — Channel3 products**
- `TASKS` — 8 shopping tasks: running-shoes, earbuds, coffee-grinder, office-chair, carry-on, toothbrush, air-purifier, backpack
- `fetch_task(task)` — calls Channel3 UCP, normalizes products, caches to `data/catalog/{task_id}.json`

**`sway/agent.py` — Shopping agent**
- `decide(model, task, products, pages, sample)` — renders prompt + pages, calls model, parses JSON pick
- System prompt: "You are a shopping assistant... Reply with JSON only: {"pick": "<product id>", "reason": "..."}"

**`sway/models.py` — Model backends**
- `Model(backend, model, temperature)` with `.complete(system, user, sample)`
- Disk cache: `data/cache/{hash}.json` (SHA-256 of backend+model+temp+system+user+sample) — every cached response is a real model response, recorded verbatim. No fabricated or hardcoded answers.
- Backends: `claude-cli` (subprocess), `anthropic` (API), `openai`/`groq`/`openrouter` (OpenAI-compat), `gemini`
- Auto-retry on 429/500/502/503

**`sway/scenarios.py` — Test web pages**
- 8 conditions: `clean`, `attack_hidden`, `attack_redundant`, `deceptive_visible`, `honest_strong`, `fake_reviews`, `covert_instruction`, `price_smear`
- `build(task, products, condition)` → `(pages, meta)` — 4 honest pages + 0-2 planted pages
- `honest_pages()` — guide, forum, price tracker, short review (realistic HTML)
- Attack pages: hidden text injection, redundant pair, fake flash price, astroturf reviews, covert "final answer", false rival price hike

**`sway/explain.py` — Plain language**
- `verdict_sentence(result, products, pages)` — one or two sentences for the shopper
- `reasons(signals, products)` — human-readable list of why a page is suspicious

**`sway/server.py` — HTTP API**
- `GET /api/health` — backend + model + k
- `GET /api/tasks` — 8 tasks with Channel3 products + available conditions
- `POST /api/pick {task, condition}` — agent picks (baseline runs only) → `{task, products, condition, chosen, stability, pages, target}`
- `POST /api/verdict {task, condition}` — full Sway check (ablation) → `{task, products, condition, target, pages: [{id, url, planted, signals, reasons, excerpt}], result, sentence}`
- Both are memoized per (task, condition) for the life of the server process
- `GET /api/results` — benchmark rows + x-ray CSV
- `GET /api/evidence` — benchmark rows for the evidence page

### Next.js Site

**`lib/server/paypal.ts` — PayPal Orders v2**
- `paypalClientId()` — returns client ID or null (null = "not connected")
- `createOrder(item, customId)` — `POST /v2/checkout/orders` with `intent: AUTHORIZE`
- `authorizeOrder(orderId)` — `POST /v2/checkout/orders/{id}/authorize`
- `captureAuthorization(authId)` — `POST /v2/payments/authorizations/{id}/capture`
- `voidAuthorization(authId)` — `POST /v2/payments/authorizations/{id}/void`
- Uses `PAYPAL_CLIENT_ID` + `PAYPAL_SECRET` from env for Basic auth → access token (cached)

**`lib/server/sway-api.ts` — Python API client + ledger**
- `swayPick()`, `swayVerdict()`, `swayTasks()`, `swayEvidence()` — fetch from Python API on :8787
- `readLedger()` / `upsertLedger()` — read/write `data/orders.json` (serialized)
- `guarded(fn)` — route handler wrapper: catches errors → `{error: message}`

**`lib/sway.ts` — Shared types + browser helpers**
- All TypeScript types: `Product`, `Task`, `PageInfo`, `XrayUnit`, `CheckResult`, `Verdict`, `Pick`, `BenchRow`, `Evidence`, `LedgerEntry`
- `WEBS` — the 8 test scenario descriptions shown in the UI
- `request<T>(url, body?)` — browser-side fetch with error handling

**`lib/use-shop-flow.ts` — Shopping flow state machine**
- `useShopFlow(task, webId)` — React hook managing the full flow
- Phases: setup → running → approve → checking → decide → approve-alt → paying-alt → done
- Exposed: `start()`, `createOrder()`, `approved()`, `decide()`, `reset()`, `fail()`

**`components/PayPalButton.tsx` — PayPal JS SDK**
- Loads PayPal's SDK script dynamically
- Renders PayPal's own gold pill button
- Shows "PayPal is not connected" when `clientId` is null

---

## 11. Testing

### Python tests (14 tests)
```bash
cd "D:\project\Project 2026\Oct\sway"
python -m unittest discover -s tests -v
```
Unit tests use a deterministic stub agent (no live model calls needed to run tests). They verify: detection of hidden text, AI instructions, price contradictions, availability contradictions, relay instructions, ablation logic, verdict generation. The live app never uses stubs — every real request hits the real model.

### TypeScript check
```bash
cd "D:\project\Project 2026\Oct\sway\site"
npx tsc --noEmit
```

### Benchmark (not needed to run the app)
```bash
python bench.py
```
Runs all 8 tasks × 8 conditions and prints its estimated model calls first (saved answers in `data/cache` are free). It writes a new `results/<timestamp>/` folder, and the evidence view reads `results/`, so run it only when you mean to replace the published numbers.

---

## 12. Git / GitHub

- **Repo:** github.com/midhunrajcharles/pay
- **Branch:** main
- **Latest commit:** `4f1e928` (Sway v2 docs + README upgrade; code is still v1)
- **Status:** PRIVATE (must be made PUBLIC before Nov 5 Devpost early review)
- **Commit rule:** no Claude co-author on commits (user's git identity only)
- **git-ignored:** node_modules, .next, .env*, data/orders.json

---

## 13. Submission Checklist

- [ ] PayPal sandbox keys in `site/.env.local`
- [ ] Both servers running (python :8787 + next :3300)
- [ ] End-to-end flow verified (section 6)
- [ ] GitHub repo made PUBLIC
- [ ] Devpost form filled:
  - Title: "Sway"
  - Tagline: "When AI buys, pay who convinced it. Stop who tricked."
  - Story: from `docs/devpost-story.md` (v2 reframe is in there — Payouts rail + Honey-fix framing)
  - GitHub: github.com/midhunrajcharles/pay
  - Built with: paypal, paypal-orders-v2, paypal-payouts, paypal-partner-referrals, paypal-webhooks, paypal-vault, channel3, ag-grid, apimatic, render, postman, next.js, typescript, python, claude
  - AI tools used: Claude Haiku (shopping agent, main benchmark), Claude Sonnet (hardening run D), Claude Code (coding assistant)

---

## 14. v2 Scope — Payouts, Partner Referrals, Webhooks, Vault (planned, not yet in code)

### Why v2
v1 ships a defender: ablation → block the manipulated buy. v2 adds a settlement rail from the **same** ablation: pay the publisher that causally decided an honest buy. The attribution evidence that voids a scam is the same evidence that credits an honest reviewer. One mechanism, both outcomes.

### Design one-liner
> When an AI buys something, Sway pays whoever actually convinced it — and stops the pages that tried to trick it.

### New flow (steps 5 and 6 added to the v1 7-step flow in section 1)

5. **PASS + honest decider found** → Sway fires `POST /v2/payments/payouts` to the publisher's PayPal email. Ledger status: `CAPTURED+PAID`.
6. Publishers onboard at `/publishers` → `POST /v2/customer/partner-referrals` → OAuth-style flow back to PayPal → Sway stores the receiver email only. No PayPal credentials stored.

### New files (to add during D1–D4; see `docs/next-actions.md` for day-by-day)

```
site/
├── app/
│   ├── publishers/page.tsx           ← Publisher onboarding landing + "Connect PayPal" CTA
│   ├── api/
│   │   ├── payouts/credit/route.ts   ← POST: fire Payout to a credited publisher after capture
│   │   ├── publishers/
│   │   │   └── onboard/route.ts      ← POST: create Partner Referrals session
│   │   ├── webhooks/paypal/route.ts  ← POST: PayPal event ingest, signature-verified, idempotent
│   │   └── vault/test/route.ts       ← POST: sandbox probe for AUTHORIZE + vault_id autonomy
│   └── ops/ops.tsx                   ← add a "Paid" column alongside "Blocked"
└── lib/server/paypal.ts              ← add createPayout(), createPartnerReferral(), verifyWebhookSignature()
```

### PayPal surface after v2

| Product | Role | Status |
|---|---|---|
| Orders v2 `AUTHORIZE` / `CAPTURE` / `VOID` | Hold / settle / kill | v1 shipped |
| Payouts | Pay the causally-identified publisher | v2 — D1 |
| Partner Referrals | Onboard publishers at `/publishers` | v2 — D3 |
| Webhooks | Async order state (signature-verified, idempotent) | v2 — D2 |
| Vault + `AUTHORIZE` | Payer-not-present autonomy probe | v2 — D2 (experimental) |

### How the Payout attribution works

- `core.check()` already returns an `xray` list; each entry has `decided` and `suspicious`.
- An entry is a **credit candidate** iff `decided == True` and `suspicious == False`.
- `site/app/api/shop/approve/route.ts`: after `captureAuthorization()`, if `verdict == "PASS"` and there is exactly one credit candidate, call `POST /api/payouts/credit` with the candidate page's `publisher_email` (resolved from the Partner Referrals ledger). Ledger status: `CAPTURED+PAID`. No credit candidate = `CAPTURED+NO_CREDIT` (buy was multi-source).
- The amount is 2% of the purchase (configurable per publisher later). Signed `sender_batch_id` so a judge can replay in the sandbox Payouts batch.

### Vault + `AUTHORIZE` sandbox probe

PayPal docs cover `payment_source.paypal.vault_id` for `intent: CAPTURE` only. The v2 code ships a probe:
- `POST /api/vault/test` creates an AUTHORIZE order with `vault_id` and reports success/failure.
- Expected failure mode: `UNPROCESSABLE_ENTITY` or 400. Fallback already shipped: capture → refund path.
- The probe result is logged on `/evidence` as "sandbox tested: supported / not supported", with the date.

### What v2 does NOT change

- The engine (`sway/core.py`, `sway/detect.py`, `sway/scenarios.py`) does not change.
- The benchmark numbers (19/19, 0/16, 13/16) are the same.
- Honest caveats stay in `docs/limits.md`.
- v2 shares the same v1 `AUTHORIZE` flow for the Sway check; it only adds steps after a PASS or VOID.

### v2 verification snippet (to add to section 6 once wired)

- **Honest-pages flow** now ends with: "Paid $39.95." + "Paid thoroughtesting.org $0.80 for the honest influence."
- Sandbox dashboard shows: Orders CAPTURE + Payouts batch item (sender_batch_id visible), both marked completed.
- `/ops` AG Grid now has a `Paid` column alongside `Blocked`. The `Paid` column is empty for the fake-flash-price flow (voided) and populated for the honest-pages flow (captured + payout).

### v2 risk notes

- Payouts sandbox may be rate-limited at demo time → queue the Payout and show pending state in `/ops`.
- Partner Referrals in sandbox may not fully click through → fallback: 2 pre-seeded sandbox publisher emails + screenshot of the flow.
- `AUTHORIZE` + vault_id may fail in sandbox → the probe records that result honestly in `/evidence`, and the capture-then-refund fallback is on the path already.
