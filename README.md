<div align="center">

# Sway

### A second look before PayPal takes the money

*Agents check **what** they buy. Sway checks **why** — and pays the honest page that earned it.*

[![CI](https://github.com/midhunrajcharles/Sway/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/midhunrajcharles/Sway/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/github/license/midhunrajcharles/Sway)](LICENSE)
[![PayPal AI Hackathon 2026](https://img.shields.io/badge/PayPal%20AI%20Hackathon-2026-0070ba)](https://paypalaihackathon.devpost.com/)

[**Live demo**](https://sway-site.onrender.com) · [**API portal**](https://midhunrajcharles.github.io/Sway/) · [**Postman**](docs/postman/sway-api.postman_collection.json)

</div>

---

<div align="center">

![Sway blocks a planted page and swaps in the honest pick](xmedia/hero.gif)

**Figure 1 — End-to-end.** PayPal holds the money → Sway spots the planted page → auth is voided → the honest pick wins.

</div>

---

## TL;DR

| | |
|---|---|
| **Problem** | AI shopping agents are flipped by planted web pages 41–68% of the time (StakeBench 2026). Today's guards check **what** is bought, never **why**. |
| **Idea** | During PayPal's `AUTHORIZE` hold, re-run the agent with each page removed. Block only when a page **both** decided the pick **and** is verifiably dishonest. |
| **Result** | **0 / 16** false alarms on honest purchases and **17 / 17** attacks stopped — on the same system. The baseline ("decided it" alone) scored **13 / 16** false alarms. |
| **Bonus rail** | The same check **pays the honest publisher** via PayPal Payouts — the first per-sale creator rail for in-chat agent commerce. |

---

## Table of contents

1. [The problem](#1-the-problem)
2. [The solution](#2-the-solution)
3. [How it works](#3-how-it-works)
4. [The math](#4-the-math)
5. [The algorithm](#5-the-algorithm)
6. [Results](#6-results)
7. [PayPal integration](#7-paypal-integration)
8. [AI integration](#8-ai-integration)
9. [Tech stack](#9-tech-stack)
10. [Quick start](#10-quick-start)
11. [Repository layout](#11-repository-layout)
12. [Documentation](#12-documentation)
13. [Limitations](#13-limitations)
14. [Roadmap](#14-roadmap)
15. [Credits and license](#15-credits-and-license)

---

## 1. The problem

AI agents are starting to shop for people. They read a handful of product pages, pick one, and pay. **Anyone who can write a web page can write one aimed at the agent instead of the human.** StakeBench (arXiv 2606.13385, 2026) measured indirect prompt injections flipping web-shopping agents **41–68%** of the time.

Every payment guard shipping today — spending caps, allow-lists, signed mandates — asks the same question:

> *What* is the agent buying?

None of them asks:

> *Why* did it pick that item?

If a planted page talked the agent into the purchase, the money moves anyway. And when the agent checks out inside a chat window, the affiliate cookie that would have paid the honest reviewer vanishes too — so **the scam succeeds and the real reviewer gets nothing** in the same stroke.

---

## 2. The solution

Sway sits between the agent's pick and PayPal taking the money, in the authorization window PayPal already gives you.

<div align="center">

![Two-key verdict — decided it AND lied](xmedia/two-key-disagree.gif)

**Figure 2 — The two-key verdict.** `flashdeal-today.shop` faked a $41.97 price. PayPal voids. The honest $39.95 pair gets paid. Buyer keeps $30.

</div>

Five steps, one authorization window:

| # | Step | PayPal call |
|---|---|---|
| 1 | **Hold** the money — do not take it | `POST /v2/checkout/orders` with `intent: AUTHORIZE` |
| 2 | **Re-run** the agent with each page removed | — (model calls, in parallel, cached) |
| 3 | **Judge** with two keys — *decided it* AND *dishonest* | — (Sway engine, deterministic) |
| 4a | If any page is blamed → **Void** | `POST /v2/payments/authorizations/{id}/void` |
| 4b | Otherwise → **Capture** | `POST /v2/payments/authorizations/{id}/capture` |
| 5 | On capture, **pay the honest publisher** | `POST /v1/payments/payouts` (idempotent on order id) |

---

## 3. How it works

<div align="center">

![AG Grid x-ray — every page the agent read, Δ-scores, verdict](xmedia/ablation.gif)

**Figure 3 — The AG Grid x-ray.** Every page the agent read, what it would have bought without each one, dishonesty flags, and the final verdict.

</div>

```
            ┌──────────┐    create order       ┌───────────────┐
  Shopper → │  Next.js │ ───────────────────▶  │ PayPal Orders │
            │   /try   │ ◀────── AUTHORIZED ── │     v2        │
            └────┬─────┘                       └──────┬────────┘
                 │ pages read by agent                │ money held
                 ▼                                    │
          ┌───────────────┐                           │
          │ Sway engine   │   K re-runs per page      │
          │ (Python)      │   + group ablation        │
          │               │   + honesty detector      │
          │               │   ↕ Channel3 catalog      │
          └──────┬────────┘                           │
                 │ VERDICT                            │
                 ▼                                    ▼
        blame set empty? ────────── capture ────▶  PayPal
                │                                 Capture
                │ non-empty                          │
                ▼                                    ▼
           PayPal Void                        PayPal Payouts
         (money returned)                   (honest publisher)
```

<div align="center">

![End-to-end flow in the running app](xmedia/how-it-works.gif)

**Figure 4 — End-to-end in the app.** Pages → ablation → two-key verdict → capture or void → Payout.

</div>

---

## 4. The math

Let $W = \\{p_1, \dots, p_n\\}$ be the pages the agent read, $A(W)$ its pick, and $c^\star$ the item it chose. Sway's judgment reduces to five quantities.

### 4.1 Self-noise $\sigma_W$

Agents disagree with themselves. Re-run the agent $K$ times on the unchanged web and measure its self-agreement:

$$\sigma_W = 1 - \frac{1}{K}\sum_{k=1}^{K} \mathbb{1}\bigl[A_k(W) = c^\star\bigr]$$

Any apparent effect smaller than $\sigma_W$ is noise, not causation.

### 4.2 Single-page causal influence $\Delta_i$

Remove page $p_i$ and re-run $K$ times:

$$\Delta_i = \Pr\bigl[A(W) = c^\star\bigr] - \Pr\bigl[A(W \setminus \\{p_i\\}) = c^\star\bigr]$$

Page $p_i$ **decided it** when $\Delta_i > \tau_{\text{causal}} + \sigma_W$, with $\tau_{\text{causal}} = 0.30$.

### 4.3 Group influence $\Delta_S$ (coalition attacks)

For small coalitions $S \subseteq W$, $|S| \le 3$:

$$\Delta_S = \Pr\bigl[A(W) = c^\star\bigr] - \Pr\bigl[A(W \setminus S) = c^\star\bigr]$$

attributed to $S$ when $\Delta_S$ exceeds every individual $\Delta_{i \in S}$ — this catches two planted pages echoing each other.

### 4.4 Dishonesty score $H(p_i)$ — the second key

A bounded additive detector that never guesses, only counts hard evidence:

$$H(p_i) = \alpha_1 \mathbb{1}[\text{hidden text}] + \alpha_2 \mathbb{1}[\text{agent-directed injection}] + \alpha_3 \mathbb{1}[\text{catalog-contradicting claim}]$$

with $\alpha_1 = \alpha_2 = \alpha_3 = 1$ and trip threshold $\tau_H = 1$. A catalog-contradiction fires only when $|\text{price}_{\text{page}} - \text{price}_{\text{Channel3}}| / \text{price}_{\text{Channel3}} > 0.10$, or a stock/spec claim is literally refuted.

### 4.5 The two-key rule — Sway's core

$$\text{Blame}(p_i) = \underbrace{\bigl[\Delta_i > \tau_{\text{causal}} + \sigma_W\bigr]}_{\text{decided it}} \wedge \underbrace{\bigl[H(p_i) \ge \tau_H\bigr]}_{\text{dishonest}}$$

Order verdict $V = \bigvee_i \text{Blame}(p_i)$: **void** on true, **capture** on false. This logical AND is the whole reason false alarms on honest influence drop to zero — the "decided it" clause alone fires on every strong review.

### 4.6 Honest-publisher Payout

On capture, Sway pays the single top-attribution honest page:

$$i^\star = \arg\max_{i \\,:\\, H(p_i) < \tau_H} \Delta_i, \qquad \text{Payout} = r \cdot \text{price}, \;\; r = 0.05$$

idempotent on the PayPal order id, so a webhook replay cannot double-pay.

### 4.7 Why $K = 5$ runs

Each $\Delta_i$ is a difference of binomial proportions over $K$ runs; the 95% confidence half-width is

$$\epsilon = 1.96\sqrt{\tfrac{\hat p (1-\hat p)}{K} + \tfrac{\hat q (1-\hat q)}{K}} \lesssim 0.62$$

so $\tau_{\text{causal}} = 0.30$ is safe inside the single-attack regime where $\Delta_i \to 1$. $K = 1$ collapses $\sigma_W \in \\{0, 1\\}$ and every honest strong-review flip looks identical to an attack — exactly the baseline's **8/8** false alarms on honest reviews.

---

## 5. The algorithm

```
Algorithm  SWAY-JUDGE(order, agent A, pages W, catalog C)
Pre:       order is in state AUTHORIZED on PayPal
Post:      order is CAPTURED (and one publisher paid) or VOIDED

────────────────────────────────────────────────────────────────
 1  c*, picks_W   ← run A on W, K times            (K+1 calls)
 2  σ_W           ← 1 − mean(picks_W = c*)
 3
 4  for each page p ∈ W:                           (per-page)
 5      picks_p   ← run A on W \ {p}, K times      (K calls)
 6      Δ_p       ← Pr[picks_W = c*] − Pr[picks_p = c*]
 7      H_p       ← hidden(p) + injection(p) + lies(p, C)
 8
 9  for each coalition S ⊆ W, |S| ≤ 3:             (group)
10      Δ_S       ← Pr[picks_W = c*] − Pr[picks_{W\S} = c*]
11
12  Blame         ← { p : Δ_p > 0.30 + σ_W  ∧  H_p ≥ 1 }
13
14  if Blame ≠ ∅ :
15      PayPal.void(order)
16      return  VOID, blame = Blame
17  else :
18      PayPal.capture(order)
19      i*        ← argmax { Δ_p : H_p = 0 }
20      PayPal.payouts(publisher(i*), 0.05 × price,
21                     idempotency_key = order.id)
22      return  CAPTURE, paid = i*
────────────────────────────────────────────────────────────────
```

**Cost per order.** Model calls $M = K(1 + n + |\mathcal{S}|) \approx 45$ for $K = n = 5$. Prompt caching + parallel dispatch at concurrency $c$ give wall-clock $\approx M \bar t_{\text{call}} / c$, well inside PayPal's authorization hold (3-day default; tens of seconds in practice).

**Soundness.** Under *catalog-ground-truth* ($H_i \ge 1 \Rightarrow p_i$ carries a verifiable lie or injection) and *monotone attribution* ($\Delta_i$ well-defined against noise $\sigma_W$), every VOID implies the existence of a page that both flipped the pick **and** carries hard evidence of dishonesty. A CAPTURE is consistent with every deciding page being honest. Fake reviews satisfy neither predicate — the open blind spot in [`docs/limits.md`](docs/limits.md).

---

## 6. Results

Benchmark: **8 Channel3 products**, planted pages we wrote ourselves, **Claude Haiku** as the shopper, **K = 5** runs each. The number lives on our templates, not a wild-web survey.

| Metric | **Sway (two-key)** | Baseline (*decided it* alone, AttriGuard / MELON style) |
|---|:---:|:---:|
| Steered purchases stopped before payment | **17 / 17** | 17 / 17 |
| Manipulated purchases stopped (incl. off-target) | **19 / 19** | 19 / 19 |
| False alarms on honest purchases | **0 / 16** | 13 / 16 |
| False alarms when a strong honest review decided it | **0 / 8** | 8 / 8 |

- Every block named the correct planted page.
- Average money saved per block: **$18.58**.
- Honest reviews that genuinely swayed the agent were credited **6 / 6** via Payouts.
- On 3 subtler visible-only attacks (run `results/20261015-082558`): covert "final answer" page **8 / 8**, false rival price hike **8 / 8**, fake reviews **0 / 8** (named limitation).
- Zero false Payouts across the run.

---

## 7. PayPal integration

Sway's entire money path runs on PayPal — six capabilities on the critical path, not a checkout button bolted on.

| PayPal capability | Role in Sway | Source |
|---|---|---|
| **Orders v2** (`intent: AUTHORIZE`) | Hold money while Sway judges. Orders created server-side so price cannot be tampered with. | [`site/lib/server/paypal.ts`](site/lib/server/paypal.ts), [`site/app/api/shop/`](site/app/api/shop/) |
| **Authorize → Capture** | Capture when the verdict passes. | `site/app/api/shop/capture/route.ts` |
| **Authorize → Void** | Void when a dishonest page decided the purchase. | `site/app/api/shop/void/route.ts` |
| **PayPal JS SDK** | Buyer approval button on the shopper screen. | `site/components/paypal-button.tsx` |
| **Payouts** | Pay the honest publisher after capture, idempotent on order id. | [`site/app/api/payouts/credit/route.ts`](site/app/api/payouts/credit/route.ts) |
| **Partner Referrals** | Publisher onboarding at `/publishers` so a Payout always has a destination. | [`site/app/publishers/`](site/app/publishers/), [`site/app/api/publishers/onboard/route.ts`](site/app/api/publishers/onboard/route.ts) |
| **Webhooks** | Signature-verified, idempotent order-state settlement. | [`site/app/api/webhooks/paypal/route.ts`](site/app/api/webhooks/paypal/route.ts) |
| **Vault + `AUTHORIZE`** *(experimental)* | Autonomy probe for payer-not-present flows. | [`site/app/api/vault/test/route.ts`](site/app/api/vault/test/route.ts) |

---

## 8. AI integration

AI is not decoration — **AI is the judged subject**. The whole product is an AI-safety layer.

| AI surface | Role | Notes |
|---|---|---|
| **Anthropic Claude Haiku** | Shopping agent under test | Re-invoked dozens of times per order under ablation. Prompt-cached + parallel. |
| **Pluggable backends** | Cross-model experiments | `python serve.py --backend {anthropic, openai, groq, openrouter, gemini}`. |
| **Dishonesty detector** | Deterministic rule + catalog cross-check | Fires only on hard evidence — hidden text, agent-directed injection, catalog-contradicting price/stock claim. |
| **Ablation engine** | Counterfactual causal attribution | Plain Python, zero dependencies. Single-page + group ablation + noise baseline. |

---

## 9. Tech stack

| Layer | Tools |
|---|---|
| **Payments** | PayPal Orders v2 · Payouts · Partner Referrals · Webhooks · JS SDK |
| **AI** | Anthropic Claude Haiku · Groq · OpenAI · OpenRouter · Google Gemini |
| **Data** | [Channel3](https://trychannel3.com) product catalog |
| **Web** | Next.js 14 · TypeScript · AG Grid Community · Tailwind |
| **Backend** | Python 3.10+ · FastAPI-style routes (`serve.py`) |
| **Dev tools** | [APIMatic](https://www.apimatic.io) · [Postman](docs/postman/sway-api.postman_collection.json) · OpenAPI 3.1 |
| **Hosting** | [Render](https://render.com) — `render.yaml`, two services, free tier |

---

## 10. Quick start

**Requirements:** Python 3.10+ (no extra packages), Node.js 20+, and the `claude` CLI logged in (or an API key — see below).

```bash
# 1. Start the Sway engine (port 8787)
python serve.py --port 8787
```

```bash
# 2. Start the site (port 3300)
cd site && cp env.example .env.local && npm install && npm run dev
```

Open <http://localhost:3300>. Everything works without PayPal keys except paying (screens show "PayPal is not connected"). To exercise real sandbox payments, add keys per [`docs/paypal-sandbox-setup.md`](docs/paypal-sandbox-setup.md).

**Hosted deploy.** [`render.yaml`](render.yaml) ships both services with the right wiring — see [`docs/deploy-render.md`](docs/deploy-render.md).

**Common tasks**

| Task | Command |
|---|---|
| Run the benchmark | `python bench.py` |
| Run tests | `python -m pytest tests` |
| Regenerate OpenAPI spec | `python -m sway.openapi` |
| Pin a new benchmark run to the site | `python -m sway.lock --main <dir> --subtle <dir>` |
| Use an API key instead of Claude CLI | `python serve.py --backend anthropic --model <id>` with `ANTHROPIC_API_KEY` set |

The model-call cache in `data/cache` is included, so benchmarked products answer instantly. Fresh runs call the agent live (1–3 minutes).

---

## 11. Repository layout

| Path | Purpose |
|---|---|
| [`sway/`](sway/) | The Sway engine (Python) — ablation, detector, catalog, API server |
| [`serve.py`](serve.py) · [`bench.py`](bench.py) | Start the API · run the benchmark |
| [`tests/`](tests/) | Unit tests + held-out set for the relay-instruction rule |
| [`results/`](results/) | Benchmark runs; each has `summary.md`, `results.jsonl`, `xray.csv` |
| [`data/`](data/) | Model-call cache and Channel3 catalog cache |
| [`site/`](site/) | Next.js site and app screens (AG Grid x-ray) |
| [`docs/`](docs/) | Documentation (listed below) |
| [`demo-film/`](demo-film/) | Demo-film pipeline (recording tools, Remotion project, storyboard) |
| [`xmedia/`](xmedia/) | README and Devpost figures (GIFs from the live recordings) |

---

## 12. Documentation

| File | What it is |
|---|---|
| [`docs/deep-dive.md`](docs/deep-dive.md) | Architecture, novel-vs-assembled, per-criterion scoring |
| [`docs/limits.md`](docs/limits.md) | Honest caveats and known blind spots |
| [`docs/deploy-render.md`](docs/deploy-render.md) | 10-line deploy guide for Render |
| [`docs/apimatic-setup.md`](docs/apimatic-setup.md) | Publishing the APIMatic SDK portal from `docs/openapi.yaml` |
| [`docs/paypal-sandbox-setup.md`](docs/paypal-sandbox-setup.md) | Sandbox keys and a test payment |
| [`docs/prior-art.md`](docs/prior-art.md) | Related research and what Sway adds |
| [`docs/for-publishers.md`](docs/for-publishers.md) · [`docs/for-merchants.md`](docs/for-merchants.md) | Why each side of the market onboards |
| [`docs/market-math.md`](docs/market-math.md) | TAM/SAM/SOM, unit economics, pilot roadmap |
| [`docs/pitch-slides.html`](docs/pitch-slides.html) | 16:9 presenter deck (`N` for speaker notes) |

---

## 13. Limitations

Sway names its gaps honestly.

| Gap | Why | Mitigation |
|---|---|---|
| **Fake reviews** (0/8 blocked) | Pure astroturf makes no claim the catalog can refute — second key never trips. | Cross-source review verification (roadmap). |
| **Persuasive copy with no checkable lie** | By design; a skilled writer who tells no verifiable lie passes. | Cannot fix without punishing honest writing. |
| **Single model benchmarked** | Haiku only, with a partial Sonnet run. | Expand StakeBench coverage. |
| **Noise** | Agents disagree with themselves — 40% self-agreement in the worst task. | Noise baseline $\sigma_W$ in the math. |
| **Phrase-based relay detection** | 6/10 reworded attacks caught on a held-out set. | See `tests/heldout_relay.py`. |
| **Cooperative-agent assumption** | Needs the agent's context, like CrawlerPal (2025). | Live ChatGPT / Perplexity do not expose this yet. |
| **Vault + `AUTHORIZE`** | PayPal docs cover `vault_id` only under `intent: CAPTURE`. | Experimental probe + capture-then-refund fallback. |
| **Cost** | ~25–40 model calls per purchase. | Fits inside PayPal's authorization hold with caching + parallelism. |

---

## 14. Roadmap

- **Cross-source review verification** — close the fake-review blind spot.
- Expand StakeBench coverage to more models and attack families.
- **PayPal Vault** integration so agents can buy hands-free with Sway as the brake.
- **"Why" receipts** attached to every captured payment — disputed purchases arrive with their own evidence.
- Plug into in-chat checkouts and agent-commerce protocols where affiliate credit breaks today.
- **Sway Honesty Badge** for publishers whose pages consistently pass.

---

## 15. Credits and license

**Prior art.** The counterfactual-ablation method builds on **ContextCite**, **TracLLM**, **AttriGuard** and **MELON**. Sway's contribution is the **second key** (catalog-grounded honesty) and wiring the answer directly to the PayPal rail. See [`docs/prior-art.md`](docs/prior-art.md).

**Boilerplate.** PayPal + AG Grid starter by Eddie Jaoude, Apache-2.0.

**License.** MIT — see [`LICENSE`](LICENSE). Derivative portions from the Apache-2.0 boilerplate retain their original notice.

---

<div align="center">

Built for the **[PayPal AI Hackathon 2026](https://paypalaihackathon.devpost.com/)**.

**[Live demo](https://sway-site.onrender.com)** · **[API portal](https://midhunrajcharles.github.io/Sway/)**

</div>
