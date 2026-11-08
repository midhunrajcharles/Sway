# Deploy to Render

Sway ships a Render Blueprint (`render.yaml`) with two services:

- `sway-api` (Python, **private service**, no public URL). Runs `serve.py` on the Anthropic backend.
- `sway-site` (Next.js, public). Calls `sway-api` over Render's private network.

`sway-api` is private on purpose: a public API URL would let anyone run model calls on your Anthropic key. Only `sway-site` can reach it. The cost is that you cannot open `sway-api` in a browser; test it through the site (`/api/tasks`) or the Render logs.

## Steps

1. Push the repo to GitHub (public is enough; private needs a connected GitHub account).
2. In Render, click **New → Blueprint** and point it at this repo.
3. Render reads `render.yaml` and proposes two services. Fill the prompted env vars:
   - `sway-api`: `ANTHROPIC_API_KEY`. **Set a monthly spend limit on that key in the Anthropic console first.**
   - `sway-site`: `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` (from `docs/docs/paypal-sandbox-setup.md`), `SWAY_SANDBOX_PAYOUT_EMAIL` (sandbox Personal account email). Leave `PAYPAL_WEBHOOK_ID` empty for now. `PAYPAL_ENV=sandbox` is pre-wired. `SWAY_API` is wired from `sway-api` (host:port; the site adds `http://`).
4. Deploy. First build is ~3 minutes (API) + ~5 minutes (site, built with `--webpack` because Turbopack hangs on this project).
5. Register the PayPal sandbox webhook (developer.paypal.com → your app → Webhooks → Add webhook):
   - URL: `https://<sway-site>.onrender.com/api/webhooks/paypal`
   - Events: `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.AUTHORIZATION.VOIDED`, `CHECKOUT.ORDER.APPROVED`
   - Copy the **Webhook ID** into `PAYPAL_WEBHOOK_ID` on `sway-site` and redeploy it. Without it, production returns 401 on every webhook.
6. Smoke test: `/evidence` loads the benchmark; `/api/tasks` returns 8 tasks; the `sway-api` logs show no crash.
7. For custom domains, add it under **Settings → Custom Domain** on `sway-site` and update DNS.
8. Render auto-builds `main` on each push.

## Caveats

- Starter plans sleep after inactivity. Open `sway-site` (and hit `/api/tasks`, which wakes `sway-api`) before judging.
- `sway-api` starts with `--cache-as claude-cli/haiku`, so the committed `data/cache` (recorded on the claude CLI with `haiku`) answers the benchmarked scenarios instantly even though the live backend is `anthropic`/`claude-haiku-5-5`. Cache misses call the Anthropic API. The alias is deliberate: the cache key includes backend and model, so without it nothing would hit.
- `data/orders.json` (the ledger) is on ephemeral disk and resets on every redeploy. If `/ops` looks empty, seed it with `python demo-film/seed-demo-ledger.py` locally and commit, or just make purchases.
- Webhook signature verification needs `PAYPAL_WEBHOOK_ID`.
