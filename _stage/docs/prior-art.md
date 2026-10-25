# Sway prior-art check (2026-10-13)

> **Follow-up (2026-10-30):** from section 4, the attribution-only baseline (item 4) is built and in every benchmark run. It wrongly blocks 13 of 16 honest purchases where Sway blocks none. StakeBench-style subtle attacks were added as three test webs. The detector's limits from section 3 are in the README. Items 1 (attenuate instead of delete) and 3 (latency line) are not done.

Question: has anyone already built "re-run the agent without each source, and block the action if a source drove it", especially for shopping agents or at the payment step?

**Answer: the method is well known. Using it for shopping plus a payment brake is not, and one of the closest papers names the shopping case as its own blind spot.**

## 1. The method itself (leave a source out, see if the answer changes)

| Work | When / where | What it does | Read |
|---|---|---|---|
| ContextCite | MIT, 2024 ([arXiv 2409.00729](https://arxiv.org/abs/2409.00729)) | Ablates context sources, fits a linear surrogate to score which source drove the answer. Reports injected text ranked as top source >95% of the time. | search summary |
| TracLLM | USENIX Security 2025 ([arXiv 2506.04202](https://arxiv.org/abs/2506.04202)) | Context traceback for long contexts; informed search + score ensembling/denoising; framed as forensics after prompt injection. | search summary |
| AttnTrace | 2025 ([arXiv 2508.03793](https://arxiv.org/abs/2508.03793)) | Cheaper, attention-based traceback. Proposes **"attribution-before-detection"**: find the few passages that drove the output, then run an injection detector only on them. | search summary |
| MELON | ICML 2025 ([arXiv 2502.05174](https://arxiv.org/abs/2502.05174), code: github.com/kaijiezhu11/MELON) | Re-runs the agent with the **user prompt masked**; if the same tool call still appears, the call came from the tool output, so it's flagged. | search summary |
| AgentSentry | Feb 2026 ([arXiv 2602.22724](https://arxiv.org/abs/2602.22724)) | Counterfactual dry-run re-executions at each tool-return boundary (4 regimes, Monte Carlo, causal effects). AgentDojo: 0% ASR, ~74.6% utility. | full text (first half) |
| **AttriGuard** | Jun 2026, preprint ([arXiv 2603.10749](https://arxiv.org/abs/2603.10749), code on Zenodo 20308739) | **Closest to Sway.** Re-runs each step with new observations *attenuated* (flattened + rewritten in third person, not deleted); blocks tool calls that don't "survive". AgentDojo: 0% ASR on static attacks; ~3x latency, ~2x tokens. | full text |

All of these are tested on **AgentDojo / Agent Security Bench**. There, an injection hijacks the agent into a *different* action (e.g., `send_money` to an attacker). None is tested on shopping, where the injection keeps the *same* action (buy running shoes) but changes *which product*.

**The key quote for us.** AttriGuard's own limitations (Sec. 7) name "delegation-heavy workflows". When the user lets external content decide the action, causal attribution "cannot verify the authenticity or integrity of the heavily delegated content." Shopping is exactly this case: "pick the best shoe from these reviews" *is* delegation. Our `honest_strong` condition is that case too: an honest page that legitimately changes the choice.

→ Sway's second key (is the deciding page dishonest? hidden text / AI-addressed instructions / contradicts the Channel3 catalog) answers the gap AttriGuard names. AttnTrace's "attribution-before-detection" is the same two-step order we use, so we can cite it as support.

## 2. Payments side (checks at the money step)

- **Whispers of Wealth** (Jan 2026, [arXiv 2601.22569](https://arxiv.org/abs/2601.22569)): red-teams Google's AP2. Its "Branded Whisper Attack" manipulates product ranking via injection. Signed mandates don't stop it.
- **Beyond the Mandate** (Aug 2026, [arXiv 2608.23858](https://arxiv.org/abs/2608.23858)): AP2's signed mandates protect the data after signing, but the inputs that shape the transaction *before* authorization fall outside that guarantee.
- **Decision-Centered Reference Architecture for Trustworthy Agentic Commerce** (Jul 2026, [arXiv 2607.18347](https://arxiv.org/abs/2607.18347)): implemented (66/66 tests). It checks that a decision is still *valid and authorized* at execution time. From the abstract, there's no source attribution or manipulation check.
- Industry (Mastercard Agent Pay, Prove, intent hashing, two-key supervisor agents): all verify the *structured transaction* (amount, payee, mandate, identity), not why the agent chose it.

→ No found work checks **why** the agent chose the item at the authorize→capture point. The "They check what. We check why." line holds.

## 3. Benchmarks we can use

- **StakeBench** ([arXiv 2606.13385](https://arxiv.org/abs/2606.13385), code: https://github.com/StakeBench/SBC). Built on WebArena OneStopMarket (a sandboxed store), with 22 templates and 264 cases across 12 product categories. Indirect-injection ASR is **41.67–68.59%**. **This is the primary source of the "41–68%" figure we quoted from CSO Online.** Cite the paper, not the article. Seller-side (review) attacks are the strongest (~57–60%). **It evaluates no defenses.** Sway could report the first defense number on its seller-review templates.
  - Cost: full WebArena is heavy (Docker store). Cheaper option: port its seller-review *templates* into `bench.py` as extra attack conditions and cite them.
- Whispers of Wealth "Branded Whisper": another attack style to add.
- InjecAgent (ACL Findings 2024): general baseline, not shopping-specific.
- "Market Signal Injection" (pricing agents, [pith 2609.18357](https://pith.science/paper/2609.18357)): formatting, reordering or *one sentence of commentary* shifts decisions with no explicit instruction. That's the honest limit of our detector: plain persuasive copy with no hidden text and no false price claim won't be flagged. Say so in the README.

## 4. What to borrow

1. **Attenuate, don't just delete** (AttriGuard): rewrite the page in a flat, third-person form as a second ablation mode. That may separate "this page's *facts* drove it" (OK) from "this page's *voice/commands* drove it" (suspicious).
2. **Temperature 0 + repeats + report std dev** (AttriGuard, AgentSentry). This matches our noise baseline; report it the same way.
3. **Cost line**: AttriGuard reports ~3x latency. We should report our calls per purchase and latency the same way. Capture happens later anyway (authorize → hold → capture), so the latency fits the PayPal flow.
4. **Optional baseline**: run a MELON-style or AttriGuard-style "attribution only" verdict on our bench to show it blocks `honest_strong` (a false positive), while Sway's two-key passes it. That's the single most convincing chart for the pitch.

## 5. Pitch / README wording

- Never claim the ablation method is ours. Credit ContextCite, TracLLM, MELON, AttriGuard.
- Claim: *"Research can already trace which page drove an AI's choice. But in shopping, a page is **supposed** to drive the choice. AttriGuard's authors say attribution alone can't tell a trustworthy page from a planted one there. Sway adds that second question, checked against a real catalog, and asks it before PayPal takes the money."*
- Expected judge challenge: "isn't this AttriGuard for shopping?" Answer: "It builds on it, and covers the case its authors say it can't."

## Confidence
Rows marked "full text" were read from the paper. "Search summary" rows weren't opened in full, so recheck any number from them before it goes in the README (especially ContextCite's >95% and anything about TracLLM). This was a targeted search, not a full survey. A paper on shopping-agent attribution defense could still exist under different wording.
