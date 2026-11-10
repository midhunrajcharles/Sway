# Sway — complete raw footage shot list

Record every shot below ONCE at 1080p (or higher), save each as its own file, and keep the cursor + browser chrome visible (judges want to see a real browser). You can re-edit freely later.

**Tool for recording:** ScreenToGif (Windows, free, https://www.screentogif.com — records both .gif and .mp4). Alternative: OBS Studio, or Loom (browser-based, zero install, https://loom.com).

**File-naming convention:** `S<group>-<shot>-<slug>.mp4` (e.g. `S1-01-try-page-cold.mp4`). Save everything into `D:/project/Project 2026/Oct/sway/xmedia/raw/`.

**Before recording anything:**
1. In Chrome, Cmd/Ctrl+Shift+N for a fresh incognito window (clean, no bookmarks bar clutter).
2. Zoom to 100% (`Ctrl+0`).
3. Resize window to 1280×800 or 1536×960 (consistent across all shots).
4. Close every other tab.
5. Have `https://sway-site.onrender.com` warmed up (visit once, let it wake, then start recording).
6. Have the PayPal **sandbox buyer** email + password in your clipboard (from https://developer.paypal.com/dashboard/accounts).
7. Mute system notifications (Windows Focus Assist → Alarms only).
8. Have `https://www.sandbox.paypal.com/activity` open in a 2nd tab (for shots that show the PayPal sandbox dashboard).

---

## GROUP 1 — The product in use (the "hero" shots)

These are what judges see first. Each should feel inevitable — like watching a real user.

### S1-01 — Try page, cold open
- **Action:** Navigate to `https://sway-site.onrender.com/try`
- **What's on screen:** The `Watch Sway catch a planted page` hero + the form
- **Duration:** 5 s
- **Why:** Opening frame for the video; also the Devpost hero screenshot

### S1-02 — Scroll from hero to form
- **Action:** Slow smooth scroll from the top of `/try` down to the "Send the agent shopping" button
- **Duration:** 4 s
- **Why:** Establishes layout in a single eye-sweep

### S1-03 — Pick the task
- **Action:** Click **"running shoes for daily training"** (if not already selected)
- **Duration:** 2 s
- **Why:** Shows the input vocabulary — real tasks with budgets

### S1-04 — Pick the planted web
- **Action:** Hover over **"+ a fake flash price"** (lets the tooltip "A visible 'today only' price the store catalog says is false." show), then click it
- **Duration:** 3 s
- **Why:** This is the attack the video will catch — must be legible on screen

### S1-05 — Click Send
- **Action:** Click **"Send the agent shopping"**
- **Duration:** 1 s
- **Why:** The moment the money-at-risk clock starts

### S1-06 — Agent reads the web (streaming)
- **Action:** Nothing — just let the right panel stream: "I read 5 pages." + the 5 domain chips (homegearnotes.com, forum.example-community.org, pricewatchlist.net, quickreviews.blog, **flashdeal-today.shop**)
- **Duration:** 6–10 s (whatever real time it takes)
- **Why:** This is the b-roll that proves the agent is live, not a slide. The planted `flashdeal-today.shop` appearing in that list is the key visual.

### S1-07 — Agent commits a pick
- **Action:** Nothing — let the "Shopping assistant" message appear: *"The best fit is the adidas Response 2 Running Shoes, $69.95 from SHOEBACCA.com. Approve it with PayPal?"*
- **Duration:** 4 s (hold on the frame)
- **Why:** The money shot for "agent decided" — the yellow PayPal button underneath

### S1-08 — Zoom-in on the PayPal button (optional close-up)
- **Action:** `Ctrl + +` twice to zoom to 125%, hover the PayPal button
- **Duration:** 2 s
- **Why:** For an insert shot in the video

### S1-09 — Reset the zoom
- **Action:** `Ctrl + 0`
- **Duration:** 1 s

---

## GROUP 2 — PayPal (the hold)

This is where the thesis shows: PayPal **authorizes** but does not capture.

### S2-01 — Click PayPal, popup appears
- **Action:** Click the PayPal button; PayPal popup opens in a new window
- **Capture mode:** Use ScreenToGif's **Window** mode or free-hand region to include BOTH the Sway window and the PayPal popup side-by-side
- **Duration:** 3 s
- **Why:** Proves real integration, not a mock

### S2-02 — Sandbox buyer login
- **Action:** Type sandbox buyer email → Next → type password → Log In
- **Duration:** 8 s (fine to trim later)
- **Why:** Optional — can be edited out to shorten video. **Hide the password field if visible.**

### S2-03 — PayPal "Pay $69.95" review screen
- **Action:** PayPal shows the review page with the item + amount
- **Duration:** 3 s
- **Why:** Proves the order amount and item match what the agent said

### S2-04 — Click "Pay Now"
- **Action:** Click PayPal's **Pay Now** / **Continue** button
- **Duration:** 1 s
- **Why:** The gesture that authorizes the payment

### S2-05 — Return to Sway, order AUTHORIZED
- **Action:** Nothing — popup closes, Sway shows "PayPal held $69.95" or similar
- **Duration:** 3 s
- **Why:** This is the moment that proves "hold, not capture" — critical for the Karthik/Himraj pitch

### S2-06 — PayPal sandbox dashboard — Order in AUTHORIZED state
- **Action:** Switch to the 2nd tab (`https://www.sandbox.paypal.com/activity`), reload, point at the order row — status should read **Authorized** (not Completed/Captured)
- **Duration:** 5 s
- **Why:** Third-party proof the money is held, not moved. **This alone sells the thesis.**

---

## GROUP 3 — The two-key verdict (the Sway moment)

### S3-01 — Sway re-runs on honest-only web
- **Action:** Switch back to Sway tab; the right panel is running Sway's second key
- **Duration:** 4 s (or until it finishes)
- **Why:** Shows the verification step happening, not instant

### S3-02 — Disagreement panel appears
- **Action:** Nothing — let Sway render the two-key disagreement UI with the sentence like: *"I paused the payment for the adidas Response 2 Running Shoes ($69.95). One site, flashdeal-today.shop, decided it, and it says $41.97, but the store catalog says $69.95. Without that page I would have picked the Scend Pro Running Shoes ($39.95, $30.00 less). Switch to it?"*
- **Duration:** 8 s (hold — judges need to read this)
- **Why:** THE money frame. The entire pitch is this sentence.

### S3-03 — Point cursor at `flashdeal-today.shop`
- **Action:** Slowly move cursor to highlight the named planted page in the sentence
- **Duration:** 3 s
- **Why:** Draws judge's eye to the specific page caught

### S3-04 — Point cursor at the alternative ("Scend Pro, $30 less")
- **Action:** Move cursor to the alternative recommendation
- **Duration:** 3 s
- **Why:** Shows the user is OFFERED a better choice, not just blocked

### S3-05 — Click Void / Switch
- **Action:** Click the Void button (or "Switch to it?" if that's the action)
- **Duration:** 1 s
- **Why:** The 1-click remediation

### S3-06 — Confirmation state
- **Action:** Nothing — let Sway show "Voided. No capture." or similar
- **Duration:** 3 s

### S3-07 — PayPal sandbox dashboard — order now VOIDED
- **Action:** Switch to PayPal sandbox tab, reload, point at the row — status now **Voided** / **Cancelled**
- **Duration:** 5 s
- **Why:** Independent proof no money moved

---

## GROUP 4 — The happy path (honest web, agreement, capture + payout)

Record this AFTER the void demo. Same task, honest-only web.

### S4-01 — Reset + pick Honest pages
- **Action:** Click **Reset** → pick same task "running shoes for daily training" → click **"Honest pages"** (no red dot) → **Send the agent shopping**
- **Duration:** 4 s
- **Why:** Sets up the agreement scenario

### S4-02 — Agent reads honest pages
- **Action:** Wait — the 5 domain chips appear WITHOUT `flashdeal-today.shop`
- **Duration:** 5 s
- **Why:** Visual contrast with the planted web

### S4-03 — Agent picks a different product (probably Scend Pro at $39.95)
- **Action:** Wait for the "The best fit is..." sentence
- **Duration:** 4 s

### S4-04 — Click PayPal, approve, authorize
- **Action:** Same as S2-01 through S2-04 but for the honest pick
- **Duration:** 10–15 s (trimmable)

### S4-05 — Two-key AGREEMENT
- **Action:** Sway's second key runs, verdict is PASS, both keys agree
- **Duration:** 4 s
- **Why:** The PASS case — shows Sway isn't just a blocker

### S4-06 — PayPal CAPTURES
- **Action:** Nothing — let Sway show "Captured $39.95" / "Paid"
- **Duration:** 3 s

### S4-07 — Payout to publisher confirmation
- **Action:** Let Sway show "Payout sent to <honest publisher>" (the quickreviews.blog or whoever decided it)
- **Duration:** 4 s
- **Why:** The novel bit — the publisher that honestly swayed the agent gets paid. Nathaniel + Marco care about this.

### S4-08 — PayPal sandbox dashboard — row shows CAPTURED
- **Action:** Switch to PayPal sandbox tab, reload, point at the new row — status **Completed**
- **Duration:** 5 s

### S4-09 — PayPal sandbox dashboard — Payouts tab shows the publisher payout
- **Action:** Navigate to Payouts tab in sandbox, point at the row
- **Duration:** 5 s

---

## GROUP 5 — Evidence / benchmark (the proof page)

### S5-01 — Evidence page, headline
- **Action:** Navigate to `https://sway-site.onrender.com/evidence`, let the hero "Measured, not promised." render
- **Duration:** 4 s

### S5-02 — Metrics row (83% / 32/40 / 0/16 / $15.20)
- **Action:** Scroll down to the four stat tiles
- **Duration:** 5 s
- **Why:** Numeric proof — fast to read

### S5-03 — Two-key comparison bars (Sway vs Attribution-alone)
- **Action:** Scroll further to the "Attribution alone stops honest purchases too" section — the two red/black bar charts (Sway 0/16 vs Attribution 12/16 false alarms)
- **Duration:** 6 s (hold — judges need to read both columns)
- **Why:** THE comparative proof. This bar chart alone wins "Innovation" criterion.

### S5-04 — Attack-by-attack table
- **Action:** Scroll to the "What got through, and what didn't" table
- **Duration:** 6 s
- **Why:** Granular evidence per attack type

---

## GROUP 6 — Code / infrastructure (the "it's real" shots)

### S6-01 — GitHub repo home
- **Action:** Navigate to `https://github.com/midhunrajcharles/Sway`
- **Duration:** 4 s
- **Why:** Eddie Jaoude / open-source judges want to see the repo

### S6-02 — Scroll README showing badges + plain-English opener + Try it links
- **Duration:** 5 s

### S6-03 — Open `render.yaml` on GitHub
- **Action:** Click into `render.yaml`
- **Duration:** 4 s
- **Why:** Shifra (Render) sees her product referenced

### S6-04 — Open `sway/server.py` or `site/lib/server/paypal.ts`
- **Action:** Scroll briefly through the file
- **Duration:** 4 s
- **Why:** Shows real code, not pseudocode

### S6-05 — APIMatic portal
- **Action:** Open `https://midhunrajcharles.github.io/Sway/`
- **Duration:** 6 s (scroll once to show the API Reference + SDK sections)
- **Why:** Ameer (APIMatic) sees his product used

### S6-06 — Postman collection
- **Action:** Open `https://github.com/midhunrajcharles/Sway/blob/main/docs/postman/sway-api.postman_collection.json`
- **Duration:** 4 s
- **Why:** Pooja (Postman) sees her product used

### S6-07 — The ledger file (`data/orders.json`)
- **Action:** Open `https://github.com/midhunrajcharles/Sway/blob/main/data/orders.json`; scroll through showing CREATE → AUTHORIZE → VOID / CAPTURE / PAYOUT transitions
- **Duration:** 5 s
- **Why:** The grep-able audit trail

### S6-08 — Render dashboard — both services DEPLOYED
- **Action:** Open Render dashboard → Blueprints → Sway; show sway-api + sway-site both green/Deployed
- **Duration:** 4 s
- **Why:** Proves "runs in prod, not just localhost"

---

## GROUP 7 — The "catch everything" wide shots

Short, b-roll quality. For transitions, title cards, chart cutaways.

### S7-01 — Very slow pan down the full `/try` page (one long shot)
- **Duration:** 10 s
- **Why:** Perfect for intro/outro voice-over

### S7-02 — Very slow pan down the full `/evidence` page
- **Duration:** 12 s

### S7-03 — Very slow pan down the full `/how-it-works` page
- **Duration:** 12 s

### S7-04 — Quick cuts through every condition chip (click each)
- **Action:** On `/try`, click each web condition chip in turn: Honest pages → +strong honest review → +hidden AI instructions → +two planted pages → +fake flash price → +covert "final answer" → +false rival price hike → +fake reviews
- **Duration:** 10 s (1 s per click)
- **Why:** Shows the breadth of attacks the system handles

### S7-05 — Quick cuts through every task chip
- **Action:** Click each task chip in turn
- **Duration:** 10 s (1 s per click)
- **Why:** Shows the breadth of shopping tasks

---

## GROUP 8 — Insert shots / cutaways / optional B-roll

### S8-01 — The agent's picked product on the real Channel3 URL
- **Action:** Right-click the item name in the agent's response, "Copy link" (or let Sway render it as a link), open in new tab → shows real `buy.trychannel3.com/...` page
- **Duration:** 4 s
- **Why:** Proves Channel3 URLs are live — bonus for Ignacio

### S8-02 — The PayPal developer dashboard app page
- **Action:** Open `https://developer.paypal.com/dashboard/applications/sandbox` → show the Sway app with the API credentials (**blur the Client ID / Secret!**)
- **Duration:** 3 s
- **Why:** Proves PayPal integration is set up properly

### S8-03 — A terminal running the benchmark
- **Action:** Terminal, type `python bench.py --tasks running-shoes --conditions deceptive_visible`, let it start
- **Duration:** 6 s
- **Why:** Shows reproducibility — Himraj's priority

### S8-04 — A terminal reading the ledger
- **Action:** Terminal, type `cat data/orders.json | jq '.[-3:]'` to show the last 3 entries
- **Duration:** 4 s
- **Why:** Alternate way to show the ledger

### S8-05 — Side-by-side agent vs honest-only output
- **Action:** Use browser DevTools "Device toolbar" to split 2 tabs side-by-side (one with planted web result, one with honest web result) showing different picks
- **Duration:** 5 s
- **Why:** Visual proof of the two-key divergence

### S8-06 — The repo's commit graph showing hackathon-window commits
- **Action:** Open `https://github.com/midhunrajcharles/Sway/commits/main`
- **Duration:** 4 s
- **Why:** Proves "significantly updated during submission period" rule

---

## Audio to record separately (optional)

Record each line as its own `.mp3` or `.wav` so you can re-cut the video without re-recording. Use the same mic in a quiet room.

| File | Script |
|---|---|
| `V-01-hook.wav` | "An AI agent shops with your card. One planted page — a fake 'today only' price — and it picks the wrong product. PayPal captures. You find out at the chargeback." |
| `V-02-send.wav` | "Pick what you want, pick what the agent reads, and send it shopping." |
| `V-03-agent-pick.wav` | "The agent reads five pages — including a planted flash-deal page — and picks the adidas Response 2, $69.95." |
| `V-04-paypal-hold.wav` | "PayPal authorizes. It does not capture. The money is held." |
| `V-05-sway-rerun.wav` | "Sway re-runs the same agent on an honest-only version of the web." |
| `V-06-disagreement.wav` | "The two agents disagree. One planted page moved the choice. Without it, the agent would have picked the Scend Pro — thirty dollars less." |
| `V-07-void.wav` | "One click. The payment is voided. No capture. In PayPal's own dashboard, the order status reads 'Voided'." |
| `V-08-honest-path.wav` | "Run the same task on honest pages only. The two agents agree. PayPal captures. And the honest publisher who actually swayed the agent — gets paid." |
| `V-09-evidence.wav` | "Across eight shopping tasks and six planted-web conditions: zero false alarms on honest purchases. The attribution-only baseline — twelve false alarms out of sixteen." |
| `V-10-close.wav` | "Zero-trust gatekeeping for agentic commerce on PayPal. Authorize, verify, capture. No pass — no capture. Sway." |

---

## Shot-to-deliverable mapping

Which raw shots you combine for each final output:

| Deliverable | Raw shots used |
|---|---|
| **3-min YouTube video** | S1-01, S1-02 (intro) · S1-03→S1-07 (agent run) · S2-01, S2-03→S2-06 (PayPal hold) · S3-02→S3-07 (disagreement + void) · S4-01→S4-09 trimmed (happy path) · S5-01→S5-03 (evidence) · S6-01, S6-05 (repo + portal) · S7-02 or S7-03 under closing V/O |
| **hero.gif** | S1-05 → S1-06 → S1-07 (6 s loop) |
| **two-key-disagree.gif** | S3-02 → S3-03 → S3-04 (5 s loop) |
| **paypal-authorize.gif** | S2-01 → S2-05 → S2-06 (5 s loop) |
| **ablation.gif** | S5-02 → S5-03 (4 s loop) |
| **ledger.gif** | S6-07 (slow pan, 3 s loop) |
| **hero.png** | Still frame from S1-07 |
| **verdict-pass.png** | Still frame from S4-06 or S4-07 |
| **verdict-block.png** | Still frame from S3-02 |
| **ablation-matrix.png** | Still frame from S5-03 |

---

## Summary of raw files to produce

### Video clips (37 total)
Group 1: 9 clips · Group 2: 6 · Group 3: 7 · Group 4: 9 · Group 5: 4 · Group 6: 8 · Group 7: 5 · Group 8: 6

### Audio clips (10 narration files)
V-01 through V-10

### Approximate total raw footage length
~4 minutes of raw video (each clip is short). Plenty of material to cut a 3-min video and still have b-roll for a 15-s teaser if wanted.

---

## Storage + naming

Save under `D:/project/Project 2026/Oct/sway/xmedia/raw/` with the naming pattern `S<group>-<shot>-<slug>.mp4` or `.webm`. Audio under `D:/project/Project 2026/Oct/sway/xmedia/raw/audio/` as `V-<nn>-<slug>.wav`.

When you tell me how you want the final cut, I'll give you the exact edit list (which clips in what order, where each V/O line sits, where each cut lands).
