// PayPal webhook receiver for order lifecycle events.
//
// Scaffolded for the hackathon window: this route verifies the PayPal
// webhook signature against the configured webhook id, logs the event,
// and acknowledges with 200. Idempotency keys (event id) and ledger
// writes are TODOs that unlock as soon as the sandbox webhook id is set
// in the environment.
//
// PayPal webhook headers used for verification:
//   paypal-transmission-id, paypal-transmission-time,
//   paypal-transmission-sig, paypal-cert-url, paypal-auth-algo
//
// Reference:
// https://developer.paypal.com/api/rest/webhooks/rest/#link-verifywebhooksignature

import { NextRequest, NextResponse } from "next/server";

type PayPalWebhookEvent = {
  id: string;
  event_type: string;
  resource_type?: string;
  resource?: Record<string, unknown>;
  create_time?: string;
};

async function paypalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  const base =
    (process.env.PAYPAL_ENV ?? "sandbox") === "live"
      ? "https://api-m.paypal.com"
      : "https://api-m.sandbox.paypal.com";
  if (!clientId || !secret) throw new Error("PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET missing");
  const auth = Buffer.from(`${clientId}:${secret}`).toString("base64");
  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`PayPal token ${res.status}`);
  const json = (await res.json()) as { access_token: string };
  return json.access_token;
}

async function verifySignature(req: NextRequest, rawBody: string): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) {
    // TODO: enable after sandbox keys. Until a webhook id is configured we
    // cannot call PayPal's verify endpoint, so we fail closed in production.
    return process.env.NODE_ENV !== "production";
  }
  const base =
    (process.env.PAYPAL_ENV ?? "sandbox") === "live"
      ? "https://api-m.paypal.com"
      : "https://api-m.sandbox.paypal.com";
  const token = await paypalAccessToken();
  const body = {
    auth_algo: req.headers.get("paypal-auth-algo"),
    cert_url: req.headers.get("paypal-cert-url"),
    transmission_id: req.headers.get("paypal-transmission-id"),
    transmission_sig: req.headers.get("paypal-transmission-sig"),
    transmission_time: req.headers.get("paypal-transmission-time"),
    webhook_id: webhookId,
    webhook_event: JSON.parse(rawBody),
  };
  const res = await fetch(`${base}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) return false;
  const json = (await res.json()) as { verification_status?: string };
  return json.verification_status === "SUCCESS";
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  let ok = false;
  try {
    ok = await verifySignature(req, rawBody);
  } catch (err) {
    console.error("[paypal webhook] verify error", err);
    ok = false;
  }
  if (!ok) {
    return NextResponse.json({ error: "signature verification failed" }, { status: 401 });
  }

  let event: PayPalWebhookEvent;
  try {
    event = JSON.parse(rawBody) as PayPalWebhookEvent;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  // TODO: enable after sandbox keys.
  // 1. Dedupe on event.id (idempotency key) against data/webhook-events.json.
  // 2. Route by event.event_type:
  //    - PAYMENT.AUTHORIZATION.CREATED  -> no-op (Sway already holds the auth)
  //    - PAYMENT.CAPTURE.COMPLETED       -> trigger Payouts to the credited publisher
  //    - PAYMENT.AUTHORIZATION.VOIDED    -> close ledger entry
  //    - CHECKOUT.ORDER.APPROVED         -> no-op (Sway drives capture itself)
  // 3. Persist the raw event in data/webhook-events.jsonl for the risk dashboard.
  console.log("[paypal webhook] accepted", event.id, event.event_type);

  return NextResponse.json({ received: true, id: event.id });
}
