# Sway: step-by-step prompts for Claude Code (VS Code)

Paste **one step at a time** into the same Claude Code chat. Wait until the step's **Pass when** is true before you paste the next one.

Every expected result below was checked against the real code and the real saved model answers on 2026-11-03. The project already works, so if Claude's result matches, nothing should change. A mismatch is the only reason to touch code.

**Scope.** Steps 1–10 verify Sway **v1** (ablation → block/pass flow). The **v2** work — Payouts to honest influencers, Partner Referrals onboarding at `/publishers`, Webhooks with idempotency, Vault + `AUTHORIZE` sandbox probe — is in `docs/BUILD-PROMPT.md` section 14 and in `docs/next-actions.md` as days D1–D5. Those prompts will be added once the v2 wiring lands on `main`. Until then, this file is the v1 verification path only; nothing here depends on v2.

---

## Before you start (once)

1. **Save a restore point.** In a VS Code terminal, inside the `sway` folder:
   ```
   git add docs/BUILD-PROMPT.md docs/STEP-PROMPTS.md
   ```
   ```
   git commit -m "Add build and step prompts"
   ```
   Now Step 10 can show exactly what Claude changed, and you can always go back.
2. **Open the project:** File → Open Folder → `D:\project\Project 2026\Oct\sway`
3. **Open two terminals:** Terminal → New Terminal, twice. You run the two servers there yourself, so they stay up and you can see their logs.
4. **Start a new Claude Code chat** and use that same chat for every step.

**Who does what:** Claude reads code, runs test commands and fixes code. **You** run the two servers, click in the browser and log in to PayPal. Claude never sees your PayPal keys or passwords.

---

## Step 0: Ground rules

```
Ground rules for this whole chat. Follow them in every step.

1. Do only what the current step asks. Don't jump ahead.
2. This project already works. If a check passes, change nothing.
3. If a check fails: find the root cause, tell me in one line which file you'll change and why, then make the smallest fix that solves it.
4. No refactors, renames, new abstractions, new files, new features or "improvements" unless the step asks for them.
5. No new dependencies. The Python engine is stdlib only, and site/package.json stays as it is.
6. No mock data, fake fallbacks, hardcoded results or "demo mode". Every call goes to the real Sway API, the real Channel3 catalog data, the real model (saved answers in data/cache, or a live call) and the real PayPal sandbox. If a real call fails, show me the real error.
7. I run the two servers in my own VS Code terminals. Don't start, stop or restart them. When a restart is needed, tell me.
8. Never open, print or paste site/.env.local.
9. Don't run bench.py. It writes a new results/ folder, and the site's evidence pages read results/.
10. Don't commit or push. I do git myself.
11. Run curl commands with the Bash tool (Git Bash), not PowerShell.
12. End every step with: PASS or FAIL, the commands you ran, the files you changed (file:line, or "none"), and anything I need to do.

For context, read docs/BUILD-PROMPT.md sections 1 to 3 only. Then reply "Ready".
```

**Pass when:** Claude replies "Ready" and changed nothing.

> Tip: save rules 1 to 12 as `CLAUDE.md` in the `sway` folder. Claude Code reads that file automatically in every new chat, so the rules aren't lost in long chats.

---

## Step 1: Read the wiring (no changes)

```
Step 1. Read these files so you know how the app connects. Don't change anything.

Python: sway/server.py, sway/core.py, sway/detect.py, sway/catalog.py, sway/agent.py, sway/models.py, sway/explain.py, sway/scenarios.py, serve.py
Site: site/lib/sway.ts, site/lib/server/sway-api.ts, site/lib/server/paypal.ts, site/lib/use-shop-flow.ts, site/app/api/shop/pick/route.ts, site/app/api/shop/order/route.ts, site/app/api/shop/approve/route.ts, site/app/api/shop/decide/route.ts, site/app/api/xray/route.ts, site/app/api/ops/route.ts, site/components/PayPalButton.tsx, site/app/shop/shopper.tsx

Only report something that would stop the app from working: a broken import, a wrong URL or port, or a field name that differs between what the Python API returns and what the site reads. Don't review style and don't suggest improvements.

Expected answer: "No blocking issues."
```

**Pass when:** "No blocking issues" and no files changed.

---

## Step 2: Unit tests and the Python API

**You do:** in terminal 1, run:
```
python serve.py --port 8787
```
It prints `Sway API on http://127.0.0.1:8787 (claude-cli/haiku, k=5)`. Leave it running.

**Paste to Claude:**
```
Step 2. The Python Sway API is running on port 8787 in my terminal.

1. Run the unit tests: python -m unittest discover -s tests -v
   Expected: "Ran 14 tests" and "OK".
2. curl -s http://127.0.0.1:8787/api/health
   Expected: {"ok": true, "backend": "claude-cli", "model": "haiku", "k": 5}
3. curl -s http://127.0.0.1:8787/api/tasks
   Don't print the whole JSON. Report the number of tasks (expected 8), products per task (expected 5 each, real Channel3 products) and the conditions (expected these 8: clean, attack_hidden, attack_redundant, deceptive_visible, honest_strong, fake_reviews, covert_instruction, price_smear).
```

**Pass when:** 14 tests OK, health matches, 8 tasks with 5 products each, 8 conditions.

---

## Step 3: The agent's pick and the Sway check

```
Step 3. Test the two POST endpoints of the Python API. Every model answer for running shoes is already saved in data/cache, so both calls answer in seconds without live model calls.

1. The agent's pick on honest pages:
curl -s -X POST http://127.0.0.1:8787/api/pick -H 'Content-Type: application/json' -d '{"task":"running-shoes","condition":"clean"}' | python -c "import sys,json; d=json.load(sys.stdin); print(d['chosen'], d['stability'], len(d['pages']))"
   Expected: P4 1.0 4
   (P4 is the Scend Pro Running Shoes, $39.95.)

2. The full Sway check with a planted fake flash price:
curl -s -X POST http://127.0.0.1:8787/api/verdict -H 'Content-Type: application/json' -d '{"task":"running-shoes","condition":"deceptive_visible"}' | python -c "import sys,json; d=json.load(sys.stdin); r=d['result']; print(r['verdict'], r['chosen'], r['blocked_pages'], r['alternative']); print(d['sentence'])"
   Expected:
   BLOCK P3 ['planted'] P4
   I paused the payment for the adidas Response 2 Running Shoes ($69.95). One site, flashdeal-today.shop, decided it, and it says the adidas Response 2 Running Shoes costs $41.97, but the store catalog says $69.95. Without that page I would have picked the Scend Pro Running Shoes ($39.95, $30.00 less). Switch to it?

If both outputs match, change nothing.
```

**Pass when:** both outputs match exactly.

---

## Step 4: The site and its API routes

**You do:** in terminal 2, run these two commands:
```
cd site
```
```
npm run dev
```
It prints `Local: http://localhost:3300`. Leave it running.

**Paste to Claude:**
```
Step 4. The site is running on port 3300 in my terminal, and the Python API is still on 8787. PayPal keys are not added yet, so paypalClientId should be null for now.

Check the site's API routes (they call the Python API server-side). Print only the fields asked for.
1. curl -s http://localhost:3300/api/tasks → number of tasks. Expected: 8
2. curl -s -X POST http://localhost:3300/api/shop/pick -H 'Content-Type: application/json' -d '{"task":"running-shoes","condition":"clean"}' → chosen, product.name, product.price, paypalClientId. Expected: P4, Scend Pro Running Shoes, 39.95, null
3. curl -s "http://localhost:3300/api/xray?task=running-shoes&condition=deceptive_visible" → result.verdict, and the url of the page whose id is "planted". Expected: BLOCK, https://flashdeal-today.shop/limited
4. curl -s http://localhost:3300/api/evidence → main_run, number of main rows, number of subtle rows. Expected: 20261014-200907, 40, 24
5. curl -s http://localhost:3300/api/ops → number of orders. Expected: 0 (no purchases yet)

If everything matches, change nothing.
```

**You check in the browser:** each of these loads without an error screen: http://localhost:3300 · /shop · /try · /xray · /ops · /evidence · /how-it-works · /research

On /shop, type `I need running shoes for daily training` and send. The default test scenario is "+ a fake flash price", so the agent picks the **adidas Response 2 Running Shoes, $69.95**, then a PayPal message says it is not connected. That is correct for now.

**Pass when:** all 5 results match and all 8 pages load.

---

## Step 5: Add your PayPal sandbox keys

**You do:**
1. Get your sandbox Client ID and Secret (steps in `docs/paypal-sandbox-setup.md`).
2. Copy `site/env.example` to `site/.env.local` and paste the two keys into it. **Don't paste them into the chat.**
3. Restart the site: in terminal 2 press Ctrl+C, then run `npm run dev` again.

**Paste to Claude:**
```
Step 5. I added my PayPal sandbox keys to site/.env.local and restarted the site. Don't open or print that file.

1. Confirm it is git-ignored: git check-ignore site/.env.local
   Expected: it prints site/.env.local
2. Confirm the site sees the keys, without printing them:
curl -s -X POST http://localhost:3300/api/shop/pick -H 'Content-Type: application/json' -d '{"task":"running-shoes","condition":"clean"}' | python -c "import sys,json; print('PayPal connected:', bool(json.load(sys.stdin).get('paypalClientId')))"
   Expected: PayPal connected: True
```

**Pass when:** both match, and on /shop PayPal's own gold button now appears after the agent's pick.

---

## Step 6: First real payment (honest pages, Sway passes, PayPal captures)

**You do, in the browser:**
1. Open http://localhost:3300/shop
2. Click the **Test scenarios** button (the sliders icon, top right of the chat) and choose **Honest pages**.
3. Type `I need running shoes for daily training` and send.
4. The agent says: "The best fit is the Scend Pro Running Shoes, $39.95 from SHOEBACCA.com. Approve it with PayPal?"
5. Click PayPal's button, log in as your sandbox **Personal** buyer and approve.
6. You see, in order:
   - "$39.95 on hold. Nothing has been taken yet."
   - "Checking why the agent chose it…"
   - "Paid for the Scend Pro Running Shoes."
   - "Paid $39.95."

**Paste to Claude:**
```
Step 6. I paid with the "Honest pages" scenario. Read data/orders.json (it holds no secrets) and check the newest entry.
Ignore entries with status CREATED in this and later steps: those are PayPal windows I closed without paying, not bugs.
Expected: task running-shoes, condition clean, product P4, price 39.95, verdict PASS, status CAPTURED, and both authorizationId and captureId are set.
If the chat showed an error instead, here it is: <paste the error, or delete this line>
```

**Pass when:** the entry matches.

---

## Step 7: Attack blocked, you switch (fake flash price)

**You do, in the browser:**
1. Click **New conversation** (the + icon, top right), then **Test scenarios** → **+ a fake flash price**.
2. Ask for running shoes again. The agent picks the **adidas Response 2 Running Shoes, $69.95** (the planted page pushed it).
3. PayPal button → approve. You see "$69.95 on hold. Nothing has been taken yet.", then the block sentence naming **flashdeal-today.shop**, then two buttons: **Yes, switch** and **Keep mine**.
4. Click **Yes, switch**. You see "Hold released. Nothing was charged." and "Approve the Scend Pro Running Shoes, $39.95 from SHOEBACCA.com?"
5. PayPal button → approve. You see "Paid $39.95." and "You kept $30.00, and the planted page didn't get its sale."
6. Log in at https://www.sandbox.paypal.com with your sandbox **Business** account. Activity shows the $69.95 authorization **voided** and the $39.95 payment **completed**.

**Paste to Claude:**
```
Step 7. I ran the fake flash price scenario and switched. Check the two newest entries in data/orders.json.
Expected:
- The blocked order: condition deceptive_visible, product P3, price 69.95, verdict BLOCK, decidedBy ["flashdeal-today.shop"], alternative P4, saved 30, status VOIDED.
- The switch order: product P4, price 39.95, replaces = the blocked order's orderId, status CAPTURED.
If the chat showed an error instead, here it is: <paste the error, or delete this line>
```

**Pass when:** both entries match, and the sandbox shows voided + completed.

---

## Step 8: Attack blocked, you keep it (hidden AI instructions)

**You do, in the browser:**
1. **New conversation** → **Test scenarios** → **+ hidden AI instructions**.
2. Ask for running shoes. The agent picks the **adidas Response 2 Running Shoes, $69.95**.
3. PayPal → approve. The block sentence names **best-deals-hub.xyz** and says it hides text from people that only an AI would read.
4. Click **Keep mine**. You see "Paid $69.95. Your call, so Sway steps aside."

**Paste to Claude:**
```
Step 8. I ran the hidden AI instructions scenario and chose "Keep mine". Check the newest entry in data/orders.json.
Expected: condition attack_hidden, product P3, price 69.95, verdict BLOCK, decidedBy ["best-deals-hub.xyz"], status KEPT_BY_SHOPPER, and captureId is set.
If the chat showed an error instead, here it is: <paste the error, or delete this line>
```

**Pass when:** the entry matches.

---

## Step 9: The two AG Grid views

**You do, in the browser:**
1. Open http://localhost:3300/xray. On the **One purchase** tab, set **Product** to "running shoes for daily training" and **What the agent read** to "With a fake flash price". The grid has 5 rows, one per page removed. Only the flashdeal-today.shop row changes the choice (to the Scend Pro) and is blocked. The 4 honest pages are not blocked.
2. Click the **Benchmark** tab. The grid lists the benchmark runs with a **Sway** column and an **Attribution only** column.
3. Open http://localhost:3300/ops. The orders grid shows your 4 orders, and its **PayPal** column reads "Paid", "Switched", "Paid" (the "Scend Pro Running Shoes (switched to)" row) and "Kept by shopper". In the websites grid, flashdeal-today.shop and best-deals-hub.xyz each have a **flagged** badge, "Blocked as planted" 1 and "Money it tried to move" $69.95. The 4 honest sites show 0 blocked.

**Paste to Claude:**
```
Step 9. Check the data behind the two AG Grid views.
1. curl -s http://localhost:3300/api/ops → count the orders by status, leaving out CREATED. Expected: CAPTURED 2, VOIDED 1, KEPT_BY_SHOPPER 1.
2. curl -s "http://localhost:3300/api/xray?task=running-shoes&condition=deceptive_visible" → for each entry in result.xray print unit, flip_rate, without_it, decided, suspicious.
   Expected 5 entries: guide, forum, tracker and review with decided False; planted with flip_rate 1.0, without_it P4, decided True, suspicious True.
Both views use AG Grid through site/components/SwayGrid.tsx. Don't change grid columns and don't replace AG Grid.
If a page showed an error instead, here it is: <paste the error, or delete this line>
```

**Pass when:** both match and both grids show the rows above.

---

## Step 10: Final check (no changes)

```
Step 10. Final check. Don't change anything in this step.
1. python -m unittest discover -s tests -v → expected: 14 tests OK
2. In site/, run: npx tsc --noEmit → expected: no errors
3. Run git status and git diff --stat. List every file changed during steps 1 to 9, with one line each on why. data/orders.json and site/.env.local are git-ignored, so they won't show. If nothing else changed, say "No files changed."
Don't commit.
```

**Pass when:** tests OK, no type errors, and every changed file has a reason you agree with.

---

## When a step fails

```
Step <N> failed. Here's what I saw: <paste the error, or describe it>.
Find the root cause. Tell me in one line which file you'll change and why, then make the smallest fix. Then re-run only this step's checks.
```

## When Claude starts doing too much

```
Stop. That's more than this step needs. Undo the changes you made in this step, except the one that fixes <the problem>. Don't touch any other file. Show me git diff --stat, then re-run this step's checks.
```

## Common snags

- **"The Sway API is not running"**: terminal 1 stopped. Run `python serve.py --port 8787` again.
- **No PayPal button**: the keys are missing from `site/.env.local`, or the site wasn't restarted after adding them.
- **"Port already in use"**: an old server is still running. Close its terminal, then start the server again.
- **PayPal says the account can't receive this payment (country or currency)**: in the PayPal developer dashboard, create a sandbox Business account with country United States, make a new sandbox app that uses it, and put that app's keys in `site/.env.local`.
- **Python code changed during a fix**: restart terminal 1 (Ctrl+C, then `python serve.py --port 8787`). The site reloads code by itself, but `.env.local` changes need a site restart.
