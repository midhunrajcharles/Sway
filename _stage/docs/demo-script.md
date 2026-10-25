# Sway demo film: script + shot list (draft, updated 2026-10-30)

**Status:** not recorded yet. The first cut (Oct 15) showed the old mock flow (replayed runs, a pretend PayPal sheet) and was deleted. Record this on the live site once the PayPal sandbox keys are in `site/.env.local`. `demo-film/STORYBOARD.md` is the structure of that first cut and can be reused.

Target **2:50** (hard limit under 3:00). A silent film with captions, Apple-page style (see brain: *Judged demo video - master prompt* v4). One end-to-end take in the app is the core.

Numbers are from `results/20261014-200907/summary.md` (8 tasks, Haiku, k=5). **Recheck them against the newest summary before recording.**

## The three judge questions, answered
- **Problem / who / why (first 20 s):** AI agents now shop for people; web pages can be written to fool them; the shopper pays for an item the agent was steered into.
- **Working end to end:** spoken request → agent picks → PayPal holds the money → Sway re-runs without each page → void + honest switch → captured in the PayPal sandbox.
- **Easy to follow:** one idea per scene, ≤7-word captions, ≥2 s each.

## Act 1: Hook (0:00–0:20), plain tiles, big type

The visual job of Act 1 is **"one mechanism, two outcomes" landed in 15 seconds**: the viewer must see the same single ablation produce a Payout on one side and a Void on the other, before any voiceover explains it. Everything else in the film is proof of this frame.

| t | Caption | Visual |
|---|---|---|
| 0:00 | Your AI shops for you now. | black tile, slow fade-in |
| 0:05 | Some pages convinced it. Some tried to trick it. | **split-screen**: left half shows the ablation grid (one centred row with the "decider" column lit) → right half splits mid-shot into a top branch (green **Paid $0.80 → thoroughtesting.org**) and a bottom branch (amber **Voided — $42.50 held, nothing taken**). The lit decider row is literally the same row in both branches. |
| 0:11 | Same check. One pays. One blocks. | the split holds; the connecting line between the ablation and the two outcomes pulses once |
| 0:15 | **Sway.** They check what. We check why. | wordmark on light tile |

## Act 2: Proof (0:20–1:40), the real app, one continuous take
| t | Caption | Real moment (record it, never mock) |
|---|---|---|
| 0:20 | Ask out loud. | `/shop`: tap the mic: "I need running shoes for daily training" |
| 0:28 | The agent reads the web. | the "I read 5 pages" message with the source chips (set the test web first under "Test scenario"); one is the planted page |
| 0:36 | It picks a pair. | the agent's pick card (the attacker's target) |
| 0:42 | PayPal holds the money. | PayPal's button → sandbox approval window → "on hold. Nothing has been taken yet." |
| 0:52 | Before paying, Sway asks why. | "Re-running the agent without each page…" (cut the wait, keep the spinner 1 s) |
| 1:02 | One page decided it. | the planted page is highlighted |
| 1:08 | And that page is lying. | signals: hidden text · instructions aimed at AIs · price claim ≠ catalog |
| 1:15 | **Stopped. Nothing paid.** | the calm shopper message: "A page I read was trying to steer me. Without it I'd pick X, $Y less." |
| 1:24 | The honest pick, one tap. | "Yes, switch" → new order → captured |
| 1:28 | And the honest reviewer gets paid. | **Payouts** toast: $0.80 to `thoroughtesting.org` — from the same ablation that blocked the scam |
| 1:32 | Real PayPal. Voided, then paid, then shared. | sandbox.paypal.com Business activity: authorization **Voided** + new payment **Completed** + Payouts batch item |

**Peak = 1:15.** Give it room: hold 3 s, music dips, one soft chime.

## Act 3: Value (1:40–2:25)
| t | Caption | Visual |
|---|---|---|
| 1:40 | Here's why it stopped. | `/xray` AG Grid: rows = pages read; columns = pick without it · agreement across re-runs · signals · verdict |
| 1:50 | Removing one page flipped the choice. | highlight the row: "Decided it · planted → block" |
| 1:58 | Honest reviews are supposed to matter. | the strong honest review row: "Decided it · trustworthy" |
| 2:04 | "Decided it" alone would block those. | the "Attribution only (AttriGuard-style)" column shows block on the honest row |
| 2:10 | **17 of 17** manipulated buys stopped.¹ | stat block on light tile |
| 2:15 | **0** false alarms in 16 honest buys.¹ | stat block; small grey line: "attribution-only: 13 of 16" |
| 2:20 | Every purchase, grouped by site. | `/ops` AG Grid: purchases by source domain, captured vs voided, **and the Payouts column** |

¹ Footnote on screen, fine print: *Our benchmark: 8 products from the Channel3 catalog, planted pages we wrote, Claude Haiku as the shopper, 5 re-runs each, Oct 2026.*

## Act 4: Close (2:25–2:50)
| t | Caption | Visual |
|---|---|---|
| 2:25 | Agents will buy for us. | dark tile |
| 2:31 | Sway pays the ones that convinced them. | Payouts batch item on a light tile |
| 2:34 | Stops the ones that tried to trick them. | the voided authorization alongside |
| 2:38 | **Sway.** Pay the right source. Through PayPal. | wordmark + tag, bookend of 0:15 |
| 2:44 | Built with PayPal · Channel3 · AG Grid · Claude | small logos row (text only if logo rules unclear) |
| 2:50 | end | keep the last 10 s clear of key info for YouTube end cards |

## Honest labels (must appear)
- "Planted pages written by us for testing" (Act 2 corner tag).
- "PayPal sandbox (test money)" on every PayPal shot.
- Footnote on the stats, as above.

## Before recording (checklist)
```text
- PayPal sandbox keys in site/.env.local (docs/paypal-sandbox-setup.md); PayPal's own button shows on the shopper screens
- Seeded demo flow that reliably steers (pick a task + condition where Haiku was steered every repeat)
- The honest-switch order captures in sandbox; the Business account shows Voided + Completed
- Numbers re-read from the newest results/*/summary.md
- Hero device: desktop browser 1440x900 (phone 390x844 only if /shop is responsive)
- Music: royalty-free, 3 short tracks = 3 acts; credit in the YouTube description
```

## Open choices for the user
1. Silent with captions (default, as in past films) or with a voice-over?
2. Hero device: desktop, or phone if the shopper screen is built mobile-first?
