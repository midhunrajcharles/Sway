# Branding

## Identity

- **Name:** Sway
- **Tagline:** *The first causally-attributed payment rail for agent commerce.*
- **One-line description:** When an AI buys something, Sway pays whoever actually convinced it — and stops the pages that tried to trick it.
- **Visual direction:** Apple-feel. Deep black (`#0A0A0B`), warm off-white type, large Montserrat display, minimal chrome. Two-pill Sway mark (already in `site/`).
- **Voice:** matter-of-fact, measured, honest about limits. No marketing-speak. Numbers over adjectives (0/16, 19/19, $30 saved, $0.80 earned).
- **Not:** "AI-powered", "revolutionary", "seamless", "end-to-end". Any of these in copy = failure.

## Asset checklist

| Asset | Status |
|---|---|
| Repo README with badges and Proof of integration table | DRAFT ready (03-build/README.md); copy to repo root before pushing public |
| Devpost text (10 sections) | DRAFT ready (03-build/submission.md); paste into Devpost form |
| Devpost cover image | TO DO — hero screenshot of `/evidence` chart (0/16 vs 12/16) |
| YouTube thumbnail | TO DO — "AI bought shoes. One page lied." text + chart overlay |
| YouTube title | *"Sway — paying the sources that convinced the AI, stopping the ones that tried to trick it"* |
| YouTube description | 2-liner + repo + Devpost link + chapter timestamps |
| 3-min demo video (final MP4) | TO RE-RECORD after sandbox keys land |
| OG image on each site page | TO DO — one per page: `/`, `/shop`, `/xray`, `/ops`, `/evidence`, `/publishers` |
| Postman collection cover | TO DO |
| APIMatic portal cover | TO DO — generated from OpenAPI |

## Positioning line (verbatim, use everywhere)

> **Spend gates check WHAT. Release gates check WORK. Sway checks WHY — and pays the sources that got it right.**

Put this in: Devpost tagline, repo H1, YouTube title or description, pitch slide 1, demo video close.

## One-sentence pitch — alternatives

Candidates ranked by punch. The pick (A) replaces the current "When an AI
buys something, Sway pays whoever actually convinced it…" line in README H1,
`docs/devpost-story.md` tagline, and the pitch slide. The current line stays
as the secondary subtitle below the H1 because it is still the clearest
plain-English description.

**A. Pick.** _Agents don't need better payment limits. They need to know who they're listening to — and so does the money._
  Why: reframes the category (not payment-safety; attention-attribution), one short clause each, no verbs the audience has heard twenty times, implies the Payouts rail without naming it.

**B.** _When AI does the shopping, the open web becomes an attack surface and the creator economy loses its receipts. Sway is the fix for both — one check, before the money moves._
  Why: names the two-sided market, keeps "before the money moves" as the time-stamp. Longer; loses punch.

**C.** _The first payment rail that reads the agent's mind, pays the pages that earned the sale, and voids the ones that lied for it._
  Why: punchy, concrete three-verb cadence. "Reads the agent's mind" is dramatic but risks sounding like marketing fluff.

Chosen: **A** (shortest, worldview-shift, no feature words).
