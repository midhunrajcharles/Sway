# xmedia

GIFs and screenshots referenced from the Devpost submission and the main README.

GitHub serves files here at
`https://raw.githubusercontent.com/midhunrajcharles/Sway/main/xmedia/<filename>` —
Devpost's markdown renders them inline from that URL.

## What to record

Record each of these as a short loopable GIF (2–6 seconds, ≤ 2 MB each, ~400px wide):

| Filename | What to capture | Length |
|---|---|---|
| `hero.gif` | Full flow in one shot: pick planted web → click Send → agent picks → PayPal Approve → Sway voids → disagreement UI | 6 s |
| `two-key-disagree.gif` | The moment the two-key verdict disagrees: both agent picks side by side, the planted page highlighted red | 3 s |
| `paypal-authorize.gif` | PayPal sandbox popup appearing and the Order moving to AUTHORIZED state | 4 s |
| `ablation.gif` | `/compare` or `/evidence` page showing the full ablation matrix with Sway's bar at 0 false alarms | 3 s |
| `ledger.gif` | Scrolling through `data/orders.json` showing CREATE → AUTHORIZE → VOID → PAYOUT transitions | 3 s |

## How to record on Windows

Free tool: **ScreenToGif** — https://www.screentogif.com/

1. Download, install, open Recorder
2. Drag the capture rectangle over the browser area you want
3. Hit Record, do the action, Stop
4. Editor → Save As → GIF → set width 400, frame rate 15 FPS
5. Save to `xmedia/<filename>.gif` in this folder
6. `git add xmedia/*.gif && git commit -m "media: add demo gifs" && git push`

GIFs appear in the Devpost markdown after push (no cache delay on raw.githubusercontent.com).

## Static screenshots

| Filename | What to capture |
|---|---|
| `hero.png` | Clean screenshot of the `/try` page with results on the right |
| `verdict-pass.png` | The verdict panel when both agents agree (PayPal captures) |
| `verdict-block.png` | The verdict panel when the two keys disagree (Void shown) |
| `ablation-matrix.png` | `/evidence` page, the 6×7 ablation matrix |

Upload these to Devpost's "Add media" gallery during submission — they show at the top of the submission page.
