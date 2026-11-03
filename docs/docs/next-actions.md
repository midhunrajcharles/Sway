# Next actions

## Next actions

Only user-only or external items beyond the auto-included WAITs and [MEASURE THIS] lines.

1. **(USER)** Flip repo visibility to public before Nov 5 09:00 PT. Why: Devpost early eligibility review (Nov 5) will DQ a private repo. Command: `gh repo edit midhunrajcharles/pay --visibility public`.
2. **(USER)** Add PayPal sandbox keys to `site/.env.local` and `frontend/.env.local`. Why: everything downstream (live demo, Payouts, Webhooks, Vault probe) is blocked. Template: `site/env.example`. Steps: `sway/docs/paypal-sandbox-setup.md`.
3. **(USER)** Ask 3 developer peers to run `/try` on Sway between Nov 6-11 and note the count. Why: closes 3.17 WAIT + the pitch.md [MEASURE THIS] marker. Report back honestly in the demo video, not as a number but as "N peers tried it".
4. **(USER)** Run `secret_scan.py` on the repo tree before `gh repo edit --visibility public`. Why: closes 4.11 WAIT. Any hit = rotate PayPal keys first.
5. **(USER)** Re-record the 2:50 demo video on live PayPal sandbox between Nov 9-11. Why: current `sway-demo-final.mp4` shows simulated PayPal (vault line 313 note). YouTube upload must have no third-party music (pipeline already synthesises audio locally).
6. **(USER)** Ask the three first-hours questions in #general-hackathon-question or workshop Q&A before Nov 7: (a) does AP2 stacking count toward "Best Use of Agentic Commerce"? (b) is AUTHORIZE + vault_id supported in sandbox? (c) does cross-sponsor coverage stack more than one sponsor prize?
7. **(OMEGA)** Build Payouts call (`/api/payouts/credit`), Partner Referrals stub (`/api/publishers/onboard` + `/publishers` page), Webhooks (`/api/webhooks/paypal` with signature + idempotency), and Vault probe (`/api/vault/test`). Target: finish by Nov 10. Why: 6 PayPal APIs on critical path = deepest integration + sponsor-prize eligibility.
8. **(OMEGA)** Add filter→API translation to `/xray` + `/ops` AG Grid pages. Why: canonical async-data pattern for the AG Grid sponsor track.
9. **(OMEGA)** Generate APIMatic portal from Sway OpenAPI; add Postman public collection; add `render.yaml` + deploy guide. Why: three sponsor prizes with low effort + the "Try it out" links in submission.
10. **(OMEGA)** Add a GitHub Actions workflow running `python -m unittest discover -s tests -v` + Next build. Why: visible OSS discipline + CI badge in README.
11. **(OMEGA)** On Nov 5 09:00 PT, submit a complete-but-polishable version to Devpost early review. Why: surfaces any DQ risks (license, video length) 7 days before the final deadline.

## Shortlist of specific commits for D1-D5

- D1: `/api/payouts/credit` route + sandbox test; ledger integration.
- D2: `/api/webhooks/paypal` route + signature verification + idempotency; `/api/vault/test` probe.
- D3: `/publishers` page + Partner Referrals stub route + CTA from `/evidence` and `/xray`.
- D4: AG Grid filter→API translation on `/xray` + `/ops`; "Paid" column; APIMatic portal + Postman collection + render.yaml.
- D5: GitHub Actions CI; README badges; secret scan; `gh repo edit --visibility public`.
- D6-7: 3 peer tests; final demo re-record on live sandbox; YouTube upload.
- D8: Nov 5 early submit (draft).
- D9-11: polish, final submit Nov 11 night.
