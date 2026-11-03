# Peer tests

Template filled by Nov 11. Three developer peers run `/try` on Sway between
Nov 6-11 and write what they saw. This is the "N peers tried it" line in
the demo video and `docs/pitch.md`.

## Instructions for the peer

1. Open the live site (`sway-site` URL from the Render deploy).
2. Click **Try** in the nav.
3. Pick one of the eight tasks (default: running shoes).
4. Flip the condition selector between `clean`, `attack_hidden`, and `honest_strong`.
5. Watch what the verdict says and what the x-ray shows.
6. Write 2–3 sentences on: what you expected, what happened, anything that felt wrong.

## Entries

| Peer | Date | What they ran | Quoted reaction | Follow-up |
|---|---|---|---|---|
| _(name)_ | 2026-11-?? | 3 tasks, 3 conditions each | "…" | — |
| _(name)_ | 2026-11-?? | — | "…" | — |
| _(name)_ | 2026-11-?? | — | "…" | — |

## Count

**N peers tried it = ?** (updated by Nov 11; cited in the demo video and in
`docs/pitch.md` where the `[MEASURE THIS]` marker lives).

## Red flags to listen for

- "I had to read the page copy twice to know which page was the planted one" → the x-ray column labels need to be louder.
- "The verdict and the sentence disagreed" → there's a bug; fix before submit.
- "Nothing happened for 20 seconds" → cold Render instance; ping the service before judging.
