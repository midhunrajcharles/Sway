# APIMatic SDK portal — 5 steps

The Sway API ships an OpenAPI 3.1 spec at [`docs/openapi.yaml`](openapi.yaml). APIMatic reads that file and generates a developer portal with SDKs in Python, TypeScript, Go, Java, PHP, Ruby, C#, Swift, and Kotlin.

**Portal URL once published:** `https://sway.apimatic.io` (paste into Devpost under "Try it out → SDK").

---

## 1. Regenerate the spec from the Python server routes (optional)

If you've changed routes in `sway/server.py`:

```bash
python -m sway.openapi
```

This writes `docs/openapi.yaml`. The spec currently covers 10 endpoints across the Python API (`/api/pick`, `/api/verdict`, etc.) and the Next.js route handlers (`/api/payouts/credit`, `/api/webhooks/paypal`, etc.). The servers block names both the local dev server (`http://127.0.0.1:8787`) and the live Render deployment (`https://sway-api-utg2.onrender.com`).

## 2. Sign in to APIMatic

Go to https://developers.apimatic.io and sign in (GitHub login is fine for a hackathon).

## 3. Import the spec

- Click **APIs** → **Add API** → **Import**
- Select **OpenAPI 3.x**
- Upload `docs/openapi.yaml` from this repo (or paste the GitHub raw URL: `https://raw.githubusercontent.com/midhunrajcharles/Sway/main/docs/openapi.yaml`)
- APIMatic validates on upload. It should pass without warnings. If it reports a `components.schemas` reference miss, re-run step 1.

## 4. Build the portal

- APIs → pick the imported Sway API → **Transform** → **Developer Experience Portal**
- Portal slug: `sway` (so the URL becomes `https://sway.apimatic.io`)
- Template: **Default Developer Portal**
- Click **Publish**

Everything is immediately live:
- **SDKs** — one click to download Python / TypeScript / Go / Java / PHP / Ruby / C# / Swift / Kotlin
- **Try-It console** — interactive request builder against the live Render API
- **Docs** — auto-generated from the OpenAPI descriptions
- **Code samples** — per-endpoint, per-language

## 5. Paste the portal URL into Devpost

In the submission form:

- **Try it out** section: add `https://sway.apimatic.io` as "SDK + Developer Portal (APIMatic)"
- **Built with** tags: add `APIMatic`
- "How I built it" section: mention APIMatic generated the SDKs from OpenAPI 3.1 — see [`notes/devpost-submission.md`](../notes/devpost-submission.md) for the exact wording

---

## Notes

- **Dual-server spec.** The spec lists both `http://127.0.0.1:8787` (local dev) and `https://sway-api-utg2.onrender.com` (production). The portal's server selector lets testers pick either.
- **Shared body shape.** The two main POST routes (`/api/pick`, `/api/verdict`) both take `{task, condition}`. The condition enum is complete in the spec: `clean`, `honest_strong`, `attack_hidden`, `attack_redundant`, `deceptive_visible`, `covert_instruction`, `price_smear`, `fake_reviews`.
- **Context-Matic.** APIMatic's chat plug-in can be pointed at this same spec to answer questions in natural language. Add it to the portal's **Add-ons** tab if time permits.
- **Why this matters for judging.** Ameer Hassan (APIMatic Co-Founder / CCO) is one of the hackathon judges. A published portal with working SDKs is a direct hit for his sponsor prize ($5k) and a credibility signal for every other judge who clicks it.

## Troubleshooting

- **"Invalid OpenAPI document"** → run `python -c "import yaml; yaml.safe_load(open('docs/openapi.yaml', encoding='utf-8'))"` to catch YAML errors. If that passes, the issue is schema-level; re-run `python -m sway.openapi` to regenerate from source.
- **"Portal slug taken"** → add a suffix: `sway-hackathon` or `sway-paypal-ai`.
- **"Rate limit on free plan"** → APIMatic free plan allows one portal; delete older portals in your account.
