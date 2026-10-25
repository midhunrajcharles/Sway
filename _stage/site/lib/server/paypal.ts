// PayPal Orders v2 with intent AUTHORIZE: the shopper approves, we authorize (money is held),
// Sway checks why the agent chose the item, then we capture or void. Server-side only.
// There is no stand-in: without PAYPAL_CLIENT_ID / PAYPAL_SECRET every call fails and the page says so.

import { randomUUID } from "node:crypto";

const BASE_URL = process.env.PAYPAL_ENV === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

export const paypalClientId = () => (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_SECRET ? process.env.PAYPAL_CLIENT_ID : null);

export const NOT_CONNECTED = "PayPal is not connected. Add PAYPAL_CLIENT_ID and PAYPAL_SECRET to site/.env.local and restart the site.";

let cachedToken: { value: string; expiresAt: number } | undefined;

async function accessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.value;
  const { PAYPAL_CLIENT_ID: id, PAYPAL_SECRET: secret } = process.env;
  if (!id || !secret) throw new Error(NOT_CONNECTED);
  const res = await fetch(`${BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`PayPal ${res.status} on /v1/oauth2/token: ${(await res.text()).slice(0, 300)}`);
  const { access_token, expires_in } = (await res.json()) as { access_token: string; expires_in: number };
  // Refresh a minute early so an in-flight request never carries an expired token.
  cachedToken = { value: access_token, expiresAt: Date.now() + (expires_in - 60) * 1000 };
  return access_token;
}

async function call<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${await accessToken()}`,
      "Content-Type": "application/json",
      // Safe retries: PayPal de-duplicates POSTs that carry the same request id.
      "PayPal-Request-Id": randomUUID(),
      Prefer: "return=representation",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`PayPal ${res.status} on ${path}: ${(await res.text()).slice(0, 300)}`);
  return (res.status === 204 ? {} : await res.json()) as T;
}

export type OrderItem = { name: string; price: number; seller: string };

/** custom_id travels with the payment into Transaction Search, so it can be joined back to the ledger. */
export async function createOrder(item: OrderItem, customId: string): Promise<{ id: string }> {
  const value = item.price.toFixed(2);
  return call<{ id: string }>("/v2/checkout/orders", {
    intent: "AUTHORIZE",
    purchase_units: [
      {
        custom_id: customId.slice(0, 127),
        description: `${item.name} (${item.seller})`.slice(0, 127),
        amount: { currency_code: "USD", value, breakdown: { item_total: { currency_code: "USD", value } } },
        items: [{ name: item.name.slice(0, 127), quantity: "1", unit_amount: { currency_code: "USD", value } }],
      },
    ],
  });
}

type Authorized = { purchase_units: { payments: { authorizations: { id: string; status: string }[] } }[] };

export async function authorizeOrder(orderId: string): Promise<{ authorizationId: string; status: string }> {
  const r = await call<Authorized>(`/v2/checkout/orders/${orderId}/authorize`, {});
  const a = r.purchase_units[0].payments.authorizations[0];
  return { authorizationId: a.id, status: a.status };
}

export async function captureAuthorization(authorizationId: string): Promise<{ captureId: string; status: string }> {
  const r = await call<{ id: string; status: string }>(`/v2/payments/authorizations/${authorizationId}/capture`, { final_capture: true });
  return { captureId: r.id, status: r.status };
}

export async function voidAuthorization(authorizationId: string): Promise<{ status: string }> {
  const r = await call<{ status?: string }>(`/v2/payments/authorizations/${authorizationId}/void`);
  return { status: r.status ?? "VOIDED" };
}

// ---------- v2: Payouts, Partner Referrals, Webhooks, Vault ----------

export type PayoutResult = {
  batchId: string;
  senderBatchId: string;
  status: string;
  amount: string;
  receiver: string;
};

/**
 * Pay the publisher that causally decided the agent's honest buy.
 * Signed `sender_batch_id` so a judge can replay the batch in sandbox.
 */
export async function createPayout(opts: {
  receiverEmail: string;
  amount: number;
  note: string;
  senderBatchId: string;
}): Promise<PayoutResult> {
  const value = opts.amount.toFixed(2);
  const r = await call<{ batch_header: { payout_batch_id: string; batch_status: string; sender_batch_header: { sender_batch_id: string } } }>(
    "/v1/payments/payouts",
    {
      sender_batch_header: {
        sender_batch_id: opts.senderBatchId.slice(0, 30),
        email_subject: "Sway: honest-influence payout",
        email_message: opts.note.slice(0, 1000),
      },
      items: [
        {
          recipient_type: "EMAIL",
          amount: { value, currency: "USD" },
          receiver: opts.receiverEmail,
          note: opts.note.slice(0, 4000),
          sender_item_id: opts.senderBatchId.slice(0, 30),
        },
      ],
    },
  );
  return {
    batchId: r.batch_header.payout_batch_id,
    senderBatchId: r.batch_header.sender_batch_header.sender_batch_id,
    status: r.batch_header.batch_status,
    amount: value,
    receiver: opts.receiverEmail,
  };
}

/**
 * Create a Partner Referrals session: PayPal returns an action_url the
 * publisher opens to grant Sway the receiver-of-funds relationship. We
 * only ever persist the referral id and (post-callback) the publisher's
 * PayPal email — never credentials.
 */
export async function createPartnerReferral(opts: {
  trackingId: string;
  returnUrl: string;
  publisherEmail?: string;
}): Promise<{ referralId: string; actionUrl: string }> {
  const r = await call<{ links: { href: string; rel: string }[] }>(
    "/v2/customer/partner-referrals",
    {
      tracking_id: opts.trackingId.slice(0, 127),
      operations: [
        {
          operation: "API_INTEGRATION",
          api_integration_preference: {
            rest_api_integration: {
              integration_method: "PAYPAL",
              integration_type: "THIRD_PARTY",
              third_party_details: { features: ["PAYMENT", "REFUND"] },
            },
          },
        },
      ],
      products: ["EXPRESS_CHECKOUT"],
      legal_consents: [{ type: "SHARE_DATA_CONSENT", granted: true }],
      partner_config_override: { return_url: opts.returnUrl },
      ...(opts.publisherEmail
        ? { email: opts.publisherEmail, preferred_language_code: "en-US" }
        : {}),
    },
  );
  const action = r.links.find((l) => l.rel === "action_url") ?? r.links[0];
  return { referralId: opts.trackingId, actionUrl: action?.href ?? "" };
}

/** Verify a PayPal webhook with the five transmission headers. */
export async function verifyWebhookSignature(headers: Headers, rawBody: string): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) {
    // Fail closed in production until the sandbox webhook id is set; in
    // development, allow the request through so the demo can be driven
    // from the PayPal dashboard without a webhook id configured.
    return process.env.NODE_ENV !== "production";
  }
  const body = {
    auth_algo: headers.get("paypal-auth-algo"),
    cert_url: headers.get("paypal-cert-url"),
    transmission_id: headers.get("paypal-transmission-id"),
    transmission_sig: headers.get("paypal-transmission-sig"),
    transmission_time: headers.get("paypal-transmission-time"),
    webhook_id: webhookId,
    webhook_event: JSON.parse(rawBody),
  };
  const r = await call<{ verification_status?: string }>("/v1/notifications/verify-webhook-signature", body);
  return r.verification_status === "SUCCESS";
}

/**
 * Vault + AUTHORIZE probe. PayPal docs cover `payment_source.paypal.vault_id`
 * for intent: CAPTURE only. This creates an AUTHORIZE order with vault_id
 * and reports whether the sandbox accepts it. Expected failure modes:
 * UNPROCESSABLE_ENTITY / 400. Fallback (capture then refund) is the
 * existing path.
 */
export async function vaultAuthorizeProbe(opts: {
  vaultId: string;
  amount: number;
  customId: string;
}): Promise<{ supported: boolean; status: number; detail: string; orderId?: string }> {
  const value = opts.amount.toFixed(2);
  const url = `${BASE_URL}/v2/checkout/orders`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${await accessToken()}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": randomUUID(),
    },
    body: JSON.stringify({
      intent: "AUTHORIZE",
      purchase_units: [
        {
          custom_id: opts.customId.slice(0, 127),
          amount: { currency_code: "USD", value },
        },
      ],
      payment_source: { paypal: { vault_id: opts.vaultId } },
    }),
    cache: "no-store",
  });
  const text = await res.text();
  if (res.ok) {
    let orderId: string | undefined;
    try {
      orderId = (JSON.parse(text) as { id?: string }).id;
    } catch {}
    return { supported: true, status: res.status, detail: "sandbox accepted AUTHORIZE + vault_id", orderId };
  }
  return { supported: false, status: res.status, detail: text.slice(0, 500) };
}
