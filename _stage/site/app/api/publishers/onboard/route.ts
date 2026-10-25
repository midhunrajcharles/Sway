// Create a PayPal Partner Referrals session for a publisher.
// POST { host, publisherEmail?, returnUrl? } -> { actionUrl, referralId }
// On success the publisher opens actionUrl in PayPal, approves, and
// PayPal calls returnUrl with ?merchantId=... — the GET below records
// the row in data/publishers.json.

import { createPartnerReferral, NOT_CONNECTED, paypalClientId } from "@/lib/server/paypal";
import { upsertPublisher } from "@/lib/server/publishers";
import { guarded } from "@/lib/server/sway-api";

type Body = { host: string; publisherEmail?: string; returnUrl?: string };

function trackingIdFor(host: string): string {
  return `sway-pub-${host.replace(/[^a-z0-9]/gi, "-")}-${Date.now()}`.slice(0, 127);
}

export async function POST(request: Request) {
  const { host, publisherEmail, returnUrl } = (await request.json()) as Body;
  if (!host) return Response.json({ error: "host is required" }, { status: 400 });
  return guarded(async () => {
    if (!paypalClientId()) throw new Error(NOT_CONNECTED);
    const base = new URL(request.url);
    const callback = returnUrl ?? `${base.origin}/api/publishers/onboard?host=${encodeURIComponent(host)}`;
    const trackingId = trackingIdFor(host);
    const r = await createPartnerReferral({ trackingId, returnUrl: callback, publisherEmail });
    // Record the host immediately so a later callback can reconcile
    // (email is not final until PayPal confirms). payoutRate defaults to 0.02.
    await upsertPublisher(host, {
      paypalEmail: publisherEmail ?? "",
      source: "partner-referrals",
      referralId: r.referralId,
    });
    return r;
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const host = url.searchParams.get("host");
  const email = url.searchParams.get("merchantId") ?? url.searchParams.get("email");
  if (!host) return Response.json({ error: "host is required" }, { status: 400 });
  if (email) await upsertPublisher(host, { paypalEmail: email, source: "partner-referrals" });
  // Human-friendly landing after the PayPal callback.
  return new Response(
    `<!doctype html><meta charset="utf-8"><title>Publisher connected</title>
     <style>body{font:16px system-ui;max-width:40rem;margin:4rem auto;padding:0 1rem;color:#111}</style>
     <h1>${host} is connected</h1>
     <p>Sway will send PayPal Payouts to your account for every honest-influence credit on this host.</p>
     <p><a href="/publishers">Back to publishers</a></p>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}
