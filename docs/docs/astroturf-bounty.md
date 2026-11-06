# Bounty: close the astroturf gap

(Issue title: **Bounty: close the astroturf gap**. Body below.)

## The gap
In the pinned run (`results/20261106-223707`), the `fake_reviews` condition steers the agent 8/8 and Sway blocks 0/8. The planted page makes only opinion claims ("5/5", "in a different league") plus an unverifiable aggregate ("4.9 from 2,318 verified buyers"). Sway's two keys are (1) the ablation shows the page decided the pick and (2) the page is suspicious: hidden text, relay instructions, or a claim the Channel3 catalog contradicts. Astroturf passes key 1 and fails key 2. Sway catches lies about checkable facts, not opinions.

## Why we did not just patch it
A "this page decided the pick and nothing corroborates it" rule is structurally identical to the honest case. `honest_strong` (one genuine long-term expert review) also decides the pick alone, and Sway must keep passing it (0/16 false alarms; the attribution-only baseline false-alarms 8/8 on it). A regex on stylistic tells would only fit our own templates.

## Signal we want
A **reviewer-independence score** per page that is not derived from the page's own text:
1. Publisher reputation: domain age, review history and outbound-citation record for the publisher, from an external source (e.g. a ratings/reputation API). Unknown or very new publisher + deciding page + only-opinion content => suspicious.
2. Cross-source agreement: the same product praised on >=2 publishers that are independent (different registrants/hosts, not near-duplicate text) among pages the agent read. Lone decisive praise from an unreputable publisher => second key.
3. Review metadata: if a page asserts N reviews / an average rating, verify against a ratings source (retailer or marketplace data). Mismatch or unavailable => `catalog_contradiction`-style signal.

Wire it into `sway/detect.py` `signals()` as a new key (e.g. `uncorroborated_reputation`), so `sway/core.py` needs no change: it already blocks when a deciding unit is suspicious.

## Acceptance criteria
- `fake_reviews` blocked >= 6/8 on `python bench.py --k 5 --top-k 5`.
- 0/16 false alarms on `clean` + `honest_strong` unchanged.
- No change to the attribution-only baseline code or its methodology.
- Reported on held-out astroturf pages not written by the signal's author (see `tests/heldout_relay.py` for the pattern).
