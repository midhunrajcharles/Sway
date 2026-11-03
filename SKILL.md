---
name: sway
description: >-
  Honesty gate for AI-agent purchases on PayPal. Authorizes an order, re-runs the
  agent's decision with each web page it read removed, then captures (and pays the
  deciding publisher) if the deciding page is honest, or voids the authorization if not.
version: 0.1.0
license: MIT
maintainer: midhunrajcharles
source: https://github.com/midhunrajcharles/Sway
metadata:
  status: hackathon-prototype          # see "Implementation status"; contract below is the target
  paypal:
    environment: sandbox               # live use requires re-review (new version)
    scopes_used:
      - orders_v2_create               # POST /v2/checkout/orders (intent AUTHORIZE)
      - orders_v2_authorize            # POST /v2/checkout/orders/{id}/authorize
      - payments_v2_capture            # POST /v2/payments/authorizations/{id}/capture
      - payments_v2_void               # POST /v2/payments/authorizations/{id}/void
      - payouts_create                 # POST /v1/payments/payouts
      - partner_referrals_read         # POST /v2/customer/partner-referrals (publisher onboarding, no credentials stored)
      - webhooks_verify                # POST /v1/notifications/verify-webhook-signature
    scopes_never_used:
      - vault_write_without_approval
      - refunds_unprompted
      - account_or_balance_read
      - subscriptions
  never:
    - hold_user_or_publisher_credentials
    - move_money_without_human_approval
    - exceed_spend_cap
    - capture_after_block_verdict_without_explicit_shopper_override
    - trust_unsigned_webhooks
  spend_caps:                          # all configurable via env, defaults shown
    per_order_usd: 250                 # SWAY_CAP_ORDER_USD
    per_human_per_day_usd: 500         # SWAY_CAP_DAY_USD
    per_agent_per_day_usd: 500         # SWAY_CAP_AGENT_DAY_USD
    payout_per_order_usd: 25           # SWAY_CAP_PAYOUT_USD
    payout_rate_max: 0.10              # share of order price per publisher
  approval_thresholds:
    human_approval_required_above_usd: 0   # every authorization needs the shopper's PayPal approval
    second_confirmation_above_usd: 100     # SWAY_CONFIRM_ABOVE_USD: explicit re-confirm before capture
    block_override_requires: human         # keep-after-BLOCK is a human click, never the agent
  audit_ledger_fields:
    - human_id
    - agent_id
    - deciding_page_url
    - honesty_verdict                  # PASS | BLOCK
    - paypal_order_id
    - outcome                          # CAPTURED | VOIDED | KEPT_BY_SHOPPER | FAILED
  failure_modes:
    verdict_unavailable: void_and_explain
    block_verdict: void_and_explain
    capture_fails: void_and_explain
    payout_fails: keep_capture_and_retry_payout
    vault_authorize_unsupported: capture_then_refund
    webhook_signature_invalid: reject_and_log
---

# Sway

Sway sits between an AI shopping agent and PayPal. It never decides *what* to buy;
it decides whether the pages that drove the agent's pick can be trusted, and only then
lets the money move.

## 1. Identity

| Field | Value |
|---|---|
| Name | `sway` |
| Version | `0.1.0` (semver; every change re-enters review, see §8) |
| Maintainer | midhunrajcharles |
| Source | https://github.com/midhunrajcharles/Sway |
| License | MIT (`LICENSE`) |
| Environment | PayPal **sandbox** only until a reviewed version says otherwise |

## 2. How it works (one paragraph)

1. Create an Orders v2 order with `intent: AUTHORIZE`; the shopper approves in PayPal's window.
2. Authorize it. Funds are **held, not taken**.
3. Re-run the agent's decision with each page it read removed (counterfactual ablation).
   A page "decided" the pick if removing it flips the decision beyond noise. Verdict is
   `BLOCK` only if a deciding page is also suspicious (hidden text, instructions aimed at
   AI agents, claims contradicting the catalog).
4. `PASS` → capture, then pay the single deciding publisher via Payouts.
   `BLOCK` → keep holding; the shopper chooses *switch* (void + new order for the
   alternative) or *keep* (human override, captured and logged as `KEPT_BY_SHOPPER`).

## 3. Declared permissions (least privilege)

PayPal operations Sway calls, and nothing else:

| Operation | Endpoint | Why |
|---|---|---|
| Orders v2 create | `POST /v2/checkout/orders` | Open an AUTHORIZE order |
| Orders v2 authorize | `POST /v2/checkout/orders/{id}/authorize` | Hold funds after shopper approval |
| Capture | `POST /v2/payments/authorizations/{id}/capture` | Take held funds on `PASS` or human override |
| Void | `POST /v2/payments/authorizations/{id}/void` | Release held funds on `BLOCK`/failure |
| Payouts | `POST /v1/payments/payouts` | Credit the honest deciding publisher |
| Partner Referrals (read/onboard) | `POST /v2/customer/partner-referrals` | Publisher grants receiver relationship; Sway stores only the referral id and the publisher's PayPal email |
| Webhooks | `POST /v1/notifications/verify-webhook-signature` | Verify every inbound event; idempotent on event id |

Sway will **NEVER**:

- **Hold credentials.** No shopper or publisher PayPal passwords, tokens, or card data.
  Only the operator's own REST client id/secret live in server env; they are never
  logged, returned by an API, or sent to a model.
- **Move money without human approval.** No order is authorized without the shopper's
  approval in PayPal's window; a `BLOCK` can only be overridden by a human click.
- **Exceed a spend cap** (§4). A cap breach voids/refuses the order rather than capping silently.
- Capture a `BLOCK`ed order on the agent's say-so, trust an unsigned webhook, or
  send page content, order data, or ledger rows to any service other than the
  configured model backend and PayPal.

## 4. Spend caps and approval thresholds

Defaults below apply when no override is set. All are enforced server-side before
`authorize`, independent of anything the agent says.

| Setting | Env var | Default |
|---|---|---|
| Max per order | `SWAY_CAP_ORDER_USD` | 250 |
| Max per human per UTC day | `SWAY_CAP_DAY_USD` | 500 |
| Max per agent per UTC day | `SWAY_CAP_AGENT_DAY_USD` | 500 |
| Max payout per order | `SWAY_CAP_PAYOUT_USD` | 25 |
| Max publisher payout rate | (publisher record) | 10% of order price |
| Second human confirmation above | `SWAY_CONFIRM_ABOVE_USD` | 100 |

Human approval is required for **every** authorization (threshold 0). Raising any cap
or lowering the approval threshold is a configuration change and must be recorded in
the ledger as a `config_change` row with the approving human.

## 5. Audit contract

Every money action (authorize, capture, void, payout, refund) writes one ledger row
**before** the call returns to the caller:

| Field | Meaning |
|---|---|
| `human_id` | The approving shopper (stable pseudonymous id, not an email) |
| `agent_id` | The shopping agent that proposed the purchase |
| `deciding_page_url` | URL of the page(s) that decided the pick (blocked page on `BLOCK`, credited page on `PASS`) |
| `honesty_verdict` | `PASS` or `BLOCK` (plus the attribution-only baseline verdict for comparison) |
| `paypal_order_id` | Orders v2 id; authorization/capture/payout batch ids are stored alongside |
| `outcome` | `CAPTURED`, `VOIDED`, `KEPT_BY_SHOPPER`, or `FAILED` |

Rows are append-only in intent: a later state change adds a row or an explicit
`updatedAt` revision; it never deletes history. `custom_id` on the PayPal order carries
the ledger key so rows join to Transaction Search.

## 6. Failure modes and fallbacks

| Failure | Fallback |
|---|---|
| Honesty verdict unavailable (model/API error, timeout) | **Void-and-explain**: void the authorization, tell the shopper no money moved and why |
| `BLOCK` verdict | **Void-and-explain**: hold, show the plain-language reason and the alternative; void on *switch*, capture only on explicit human *keep* |
| Capture fails after `PASS` | Void-and-explain; never retry a capture without a fresh authorization |
| Payout fails after capture | Keep the capture, log `FAILED` payout row, retry with the same `sender_batch_id` (idempotent) |
| Vault + AUTHORIZE not supported (docs cover `vault_id` for `intent: CAPTURE` only; probe returns 400/422) | **Capture-then-refund**: capture, run the check, refund on `BLOCK`; ledger records both rows |
| Webhook signature invalid / webhook id missing in production | Reject (fail closed) and log |
| Spend cap exceeded | Refuse before authorize; no PayPal call is made |

## 7. Implementation status (honest gaps)

This file is the reviewable contract. As of this version the code in `site/` does **not** yet fully meet it:

- Implemented: AUTHORIZE → verdict → CAPTURE/VOID flow, Payouts to a unique deciding
  publisher, Partner Referrals onboarding, signature-verified idempotent webhooks,
  vault probe with capture-then-refund as the documented fallback.
- **Not yet implemented:** the spend caps and confirmation threshold in §4; the
  `human_id` and `agent_id` ledger fields (current `LedgerEntry` in `site/lib/sway.ts`
  has `orderId`, `decidedBy` host names, `verdict`, `status`, not full page URLs);
  an explicit `FAILED` outcome; the `config_change` row.
- Payout currently follows automatically after a `PASS` capture, with the shopper's
  approval covering the purchase but not the payout amount; the payout cap above
  bounds it once enforced.
- A verdict-service failure currently surfaces as an error while the authorization
  stays held; void-and-explain on that path is not yet automatic.
- Known detection gap: fake reviews that the catalog does not contradict are not
  caught (`docs/docs/limits.md`).

A reviewer should treat §3–§6 as the commitments to be verified and §7 as the delta.

## 8. Versioning and review

Any change to this file, scopes, caps, or the code it describes is a new version and
must pass the same review: structure, sensitive data, harmful-instruction, and prompt-
injection checks, then human approval. Approved versions are not silently replaced.
