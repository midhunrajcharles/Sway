# APIMatic SDK portal — 5 steps

The Sway API ships an OpenAPI 3.1 spec at `docs/openapi.yaml`. APIMatic
reads that file and generates a developer portal with SDKs in Python,
TypeScript, Go, Java, PHP, and Ruby.

1. **Regenerate the spec from the Python server routes** if you've changed them:
   ```bash
   python -m sway.openapi
   ```
   This writes `docs/openapi.yaml` (the server routes themselves are in `sway/server.py`).

2. **Sign in to APIMatic Developer Experience Portal** at https://developers.apimatic.io.

3. **New API → Import from file**, pick `docs/openapi.yaml`. APIMatic validates the spec; it should pass without warnings. If it reports a `components.schemas` reference miss, re-run step 1.

4. **Create a portal**, give it the slug `sway`, pick the "Developer Portal" template. Attach the imported API. The portal URL will be `https://sway.apimatic.io` (or similar — the Portal Settings tab shows the exact URL).

5. **Publish**. From the portal, the SDK downloads and the Try-It console are available immediately. Paste the portal URL into the Devpost submission under "Try it out — SDK".

Notes:
- The spec names both the local Sway API (`http://127.0.0.1:8787`) and the Render-hosted service (`https://sway-api.onrender.com`) so testers can pick either from the portal's server selector.
- The two POST routes (`/api/pick`, `/api/verdict`) take the same body shape (`{task, condition}`). The condition enum is complete in the spec.
- Context-Matic (the APIMatic chat plug-in) can be pointed at this same spec to answer questions in natural language.
