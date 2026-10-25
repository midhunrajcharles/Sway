# Pitch - 5:00 total

Spoken script only. The differentiation table, hard-questions appendix, and delivery notes are in `evidence/pitch-appendix.md`.

## Problem (0:45)

Three stakeholders hurt from the same missing primitive. Shoppers get manipulated: StakeBench measured forty-one to sixty-eight percent of injected product reviews redirect what agents buy. Wharton saw it in twenty-six thousand runs. Unit 42 found a page in the wild doing it this March.

Publishers also lose. When an agent completes checkout in chat, the affiliate cookie that would have paid the honest reviewer is gone. Rye and Make Influence said it on the record. Threads on r/Affiliate agree.

PayPal has a wound here. Honey, which PayPal owns, lost seven thousand merchants over broken attribution at checkout. The hackathon's thesis, Brian Peters joining Meta Poppy, is agentic commerce. The attribution hole is still open.

One missing primitive: when an AI buys, nobody knows which page caused it.

## Demo (1:45)

Let me show it. Shopper asks for cushioned running shoes under eighty dollars. The agent reads four pages. One is planted, lies about the price, holds a hidden instruction. The agent picks adidas at sixty-nine ninety-five. PayPal Orders v2 holds the authorization.

Sway runs the ablation. The AG Grid matrix fills live on x-ray. The planted page is the one that flipped the pick, and its price claim contradicts the Channel3 catalog. Verdict card: block the scam, credit the honest reviewer. Alternative is thirty dollars cheaper.

Shopper taps yes. Order voids. New authorization on the alternative. Capture. Payouts fires eighty cents to the honest reviewer. Ops shows blocked beside paid.

Live sandbox. No mock. Six PayPal APIs on the critical path.

## Why it's different (0:45)

Bursar checks what. Stood checks that work got done. Acquit verifies against frozen tests. All three check downstream of the decision. Sway checks the decision itself. The closest open-source project, ContextCite from MIT, does the attribution but has no commerce rail. Perplexity Comet Plus pays publishers but from a flat editorial pool, not per sale. AP2 signed mandates sign validity, not causation. Sway is the first that gates and pays from one causal test.

## Feasibility and impact (0:55)

[MEASURE THIS] 3-5 developer peers try /try between Nov 6 and Nov 11; count reported in demo video.

Fourteen unit tests pass. Benchmark: nineteen of nineteen manipulated buys blocked. Zero of sixteen false alarms on honest buys. The strict baseline false-alarms thirteen. First defense number on StakeBench-family seller review attacks.

Business: a small slice of each Payout cut. No new money from merchants; the existing affiliate budget redirects to who causally earned it. Scale: ablation runs on agent context only, not the catalog, so latency is agent-call bound. Channel3 serves fifty to a hundred million products at free tier.

## Close (0:30)

What is next: fake review detection, where Sway blind-spots today. ACP, Perplexity, and Meta Poppy integrations. AP2 mandate stitching so Sway's verdict rides as a credential.

The ask: Grand first plus AG Grid first. We built the primitive missing between agent and payment.

## Buffer (0:20)

Thank you. Open to hard questions.

## Hard questions

See evidence/pitch-appendix.md for OB-01 to OB-10 (hidden slides). Three from Reddit objections, one feasibility/scale, drawn from PN-02, PN-03, PN-05 in evidence/pains.md.

### OB-10 — "Isn't paying publishers after-the-fact an endorsement that needs disclosure?"

Short answer: no. The Sway Payout is **attribution of past influence,
not inducement of future recommendation.**

The FTC Endorsement Guides (16 C.F.R. § 255.5) require disclosure of a
*material connection* "that might affect the weight or credibility of
the endorsement" — i.e. a connection the endorser knows about *before
or while* making the recommendation. The Guides' commentary emphasizes
unexpected pre-existing relationships, not post-hoc attribution to
third parties the endorser never contracted with.

Three sentences for the slide:

1. The publisher wrote the review before Sway existed and does not know, at write-time, that any particular agent will attribute weight to their page.
2. The Payout is triggered by the agent's reading, measured by the ablation after the fact; the publisher has no ability to influence it toward themselves without changing the review's actual content (which is what we want).
3. Where a publisher *does* opt into Sway's publisher onboarding, standard affiliate-disclosure norms apply — the per-sale rate is published on `/publishers`, and merchants can require a disclosure tag on participating pages via Partner Referrals metadata.

## Delivery

One presenter. Run from your own laptop. Backup video queued and offline-capable (localhost engine + site; only PayPal sandbox needs network). Hidden Q&A appendix slides. See evidence/pitch-appendix.md for full delivery notes.
