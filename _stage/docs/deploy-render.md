# Deploy to Render

Sway ships a Render Blueprint (`render.yaml`) with two services:
`sway-api` (Python) and `sway-site` (Next.js). One click reproduces the live demo.

1. Push the repo to GitHub (public is enough; private needs a connected GitHub account).
2. In Render, click **New → Blueprint** and point it at this repo.
3. Render reads `render.yaml` and proposes two services. Accept.
4. On the `sway-api` service, set `ANTHROPIC_API_KEY` (or swap `SWAY_BACKEND` to `claude` and leave the key out if the CLI is available on the plan).
5. On the `sway-site` service, set `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` from `docs/paypal-sandbox-setup.md`. `PAYPAL_ENV=sandbox` is pre-wired.
6. Deploy. First build is ~3 minutes (API) + ~4 minutes (site).
7. Open the `sway-site` URL. The `SWAY_API_URL` env var is wired from `sway-api` so no manual plumbing.
8. Smoke test: `/evidence` loads the benchmark; `/try` runs an agent against the demo shop.
9. For custom domains, add it under **Settings → Custom Domain** on `sway-site` and update DNS.
10. To redeploy on new commits, Render auto-builds `main` — no action needed.

Caveats:

- Starter plans sleep after inactivity. Spin them up with a ping before judging.
- The Python API loads the model-call cache from `data/cache` baked into the image, so the benchmarked products answer instantly without live model calls.
- Webhook signature verification is scaffolded in `site/app/api/webhooks/paypal/route.ts` and goes live when the PayPal sandbox webhook keys are set.
