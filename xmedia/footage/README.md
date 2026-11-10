# Raw footage — Sway demo video

29 MP4 clips captured from the live Sway deployment on 2026-11-10. Drop these into any video editor (DaVinci Resolve, Premiere, CapCut, iMovie) and cut your 3-minute demo together.

**Resolution:** 1920×1080 · **FPS:** 30 · **Codec:** H.264 · **Audio:** none (narrate over them)

## How to use

- **Static shots (S01–S23)**: 4-second clips, one per screen. Trim to taste.
- **Flow clips (FLOW_*)**: pre-cut sequences for a specific demo section. Use as-is or re-cut.
- **Source frames** are in [`frames/`](frames/) if you want to re-render differently.

## Static shots

| File | What it shows | Where to use |
|---|---|---|
| `S01_try_hero.mp4` | `/try` — title "Watch Sway catch a planted page" + intro copy | **Opening hook** |
| `S02_research.mp4` | `/research` — "The gap, in the authors' own words" + ContextCite/TracLLM/MELON refs | Credibility — show it's built on real research |
| `S03_xray_hero.mp4` | `/xray` — "Why did the agent buy it?" + One purchase / Benchmark toggle | Transition into evidence |
| `S04_xray_cards.mp4` | `/xray` — Agent picked / Agreement / Sway Held / Attribution Would block | **The core claim visualized** |
| `S05_xray_table_mid.mp4` | `/xray` — table of each page removed, Sway's verdict per page | Deep technical honesty |
| `S05b_xray_table_detail.mp4` | `/xray` — Decided it · planted row highlighted | Punch to specific planted page |
| `S06_shop_hero.mp4` | `/shop` — "What do you need?" chat-style interface with Sandbox badge | Product polish shot |
| `S07_ops_dashboard.mp4` | `/ops` — Risk dashboard with 0/0/$0/0 KPI cards + ledger | Shows the audit surface |
| `S08_home_hero.mp4` | `/` — "They check what. We check why." | **Alternative opening** |
| `S09_apimatic_home.mp4` | APIMatic portal — Sway API home | Prove the SDK portal is live |
| `S10_apimatic_sdks.mp4` | APIMatic portal — TypeScript / Python / C# SDK page | Show the generated SDKs |
| `S11_api_json.mp4` | `GET /api/tasks` — raw JSON response from the live backend | Prove it's actually working |
| `S12_github_home.mp4` | github.com/midhunrajcharles/Sway — repo overview, MIT, Code of conduct, Contributing | Open-source credibility |
| `S13_github_files.mp4` | github.com — scrolled file list showing CODE_OF_CONDUCT.md, CONTRIBUTING.md, LICENSE, Contributors (4 incl. Claude) | Repo hygiene for Eddie Jaoude |
| `S14_postman_json.mp4` | github.com — the Postman collection JSON file | For Pooja Mistry (Postman sponsor) |
| `S15_openapi_yaml.mp4` | github.com — openapi.yaml showing OpenAPI 3.1 spec | For Ameer Hassan (APIMatic) |
| `S16_try_scroll1.mp4` | `/try` — title + top of form visible | Pre-form shot |
| `S17_try_form.mp4` | `/try` — full form, `fake flash price` condition selected | **User picks planted web** |
| `S18_try_agent_run.mp4` | `/try` — Agent reads 5 pages incl. `flashdeal-today.shop` | **Agent reads planted web** |
| `S19_try_paypal_approve.mp4` | `/try` — "The best fit is adidas Response 2… Approve with PayPal?" + PayPal button | **PayPal button appears** |
| `S20_evidence_headline.mp4` | `/evidence` — "Measured, not promised." headline | Evidence section opener |
| `S21_evidence_metrics.mp4` | `/evidence` — 83% / 32/40 / 0/16 / $15.20 KPI cards | **Headline stats** |
| `S22_evidence_bars.mp4` | `/evidence` — Attribution 12/16 wrongly blocked vs Sway 0/16 bar chart | **The money shot** — Sway vs attribution |
| `S23_how_it_works.mp4` | `/how-it-works` — "Every other check asks what. Sway asks why." + 01 Hold 02 Re-run 03 Judge 04 Capture | Narrate the 4-step mechanism |

## Flow clips (pre-cut sequences)

| File | What's in it | Length | Use for |
|---|---|---|---|
| `FLOW_demo.mp4` | S16 → S17 → S18 → S19 | 16s | The main demo arc: picked planted web → agent ran → PayPal button |
| `FLOW_evidence.mp4` | S20 → S21 → S22 | 12s | Evidence section — headline, stats, Sway-vs-attribution |
| `FLOW_xray.mp4` | S03 → S04 → S05 | 12s | X-ray section — why did the agent pick it, per-page analysis |
| `FLOW_the_product.mp4` | S08 → S23 → S06 → S07 → S02 | 20s | Site tour — home → how-it-works → shop → ops → research |
| `FLOW_supporting.mp4` | S09 → S10 → S14 → S15 → S12 → S13 | 24s | Credibility stack — APIMatic portal + SDKs + Postman + OpenAPI + GitHub |

## Suggested 3-minute cut (recommended for Devpost)

```
0:00-0:10  S08 home hero                   "They check what. We check why."
0:10-0:20  S17 try form (zoomed)           "Pick what you need, pick what the agent reads."
0:20-0:40  S18 → S19 (FLOW_demo tail)      "The agent read a planted page and picked wrong."
0:40-0:50  S04 xray cards                  "PayPal authorized. Sway caught it."
0:50-1:10  S05 xray table                  "Here's exactly which page moved the choice."
1:10-1:30  FLOW_evidence                   "0 false alarms. Attribution-only tools would fail this."
1:30-1:50  S23 how-it-works                "Hold, re-run, judge, capture-or-void."
1:50-2:10  S07 ops dashboard               "Every state transition goes in the audit ledger."
2:10-2:30  FLOW_supporting (sped up 2x)    "Live API. Postman collection. SDKs. Public repo."
2:30-2:50  S09 apimatic + S12 github       "No slides. Real deploys."
2:50-3:00  S08 outro                       "Sway. No pass, no capture."
```

## Rendering tips

- **Add narration**: record a voiceover reading your script, then sync to these clips.
- **Add music**: free royalty-free music from YouTube Audio Library (search "corporate", "ambient").
- **Avoid copyrighted music** — Devpost rules.
- **Export at 1080p 30fps** for YouTube.
- **≤3 minutes total** — hackathon rule.

## Known limits

These are screen captures stitched into video, not real screen recordings. The cursor doesn't move, there's no PayPal popup, no sandbox login. For a hackathon submission these are more than enough; for a production marketing video you'd want to re-record with ScreenToGif or Loom.
