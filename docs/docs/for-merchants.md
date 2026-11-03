# For merchants

Sway is not asking you to spend more. It redirects existing affiliate
spend to the pages that actually drove the sale — and cuts the losses
from manipulated agent purchases.

## It's a redirect, not new spend

- You already pay affiliates on human-decided checkouts. Your take rate
  (typically 2–8%) does not change.
- When an agent decides the sale, that budget is currently paid to
  nobody (if the agent checked out in-chat) or to a last-click URL that
  the agent never visited (if a cookie happened to carry through).
- Sway reroutes that same budget to the page the agent actually read and
  that actually changed its pick. The payment is a PayPal Payout from
  the merchant to the publisher after `CAPTURE`.
- If no page attributably decided it, nothing is paid out — attribution
  thresholds are configurable and honest-by-default.

## Fewer manipulated buys = fewer disputes

Sway's benchmark on 8 StakeBench-family tasks (`results/20261014-200907/`):

- **17 of 17 steered purchases** were held before PayPal captured.
- **0 of 16 honest purchases** were wrongly blocked.
- The money the shopper would otherwise have spent on an attacker's pick
  averaged **$18.58 per blocked buy**.

Translated to merchant risk: fewer chargebacks ("I didn't order this,"
"this isn't what the agent said it was"), fewer item-not-as-described
disputes, lower support cost per order. The two-key verdict (decided
*and* dishonest) keeps false positives at zero on our set, so honest
sales are not slowed.

## Where it fits in your stack

- **Checkout:** PayPal Orders v2 with `intent: AUTHORIZE`. Sway runs
  inside the authorize-to-capture window; no new payment surface.
- **Reconciliation:** webhook events are signed, deduped on event id,
  and recorded in the merchant ledger alongside the authorizing order.
- **Attribution rules:** per-merchant Payouts config (rate, publisher
  allow-list, minimum attribution weight). Default rate 2% of basket.
- **Settlement:** standard PayPal Payouts; no new recipient onboarding
  for the merchant.

## Call to action

**One pilot merchant with 100+ monthly agent-initiated orders.** We wire
Sway between your existing PayPal account and your catalog, measure the
dispute-reduction curve against the preceding 90 days, and share the
Payouts breakdown. Reach out via a GitHub issue on this repo.
