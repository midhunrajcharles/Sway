// Fire a PayPal Payout to the publisher that causally decided an honest
// agent purchase. Triggered by site/app/api/shop/approve/route.ts after a
// PASS verdict when exactly one credit candidate exists on the x-ray.
//
// Idempotent: sender_batch_id = `sway-${orderId}` so retrying the same
// order never double-pays. If no credit candidate (multi-source buy),
// the caller passes nothing here and the ledger status stays
// CAPTURED+NO_CREDIT.

import { createPayout, NOT_CONNECTED, paypalClientId } from "@/lib/server/paypal";
import { resolvePublisher } from "@/lib/server/publishers";
import { guarded, readLedger, upsertLedger } from "@/lib/server/sway-api";

type Body = { orderId: string };

export async function POST(request: Request) {
  const { orderId } = (await request.json()) as Body;
  const entry = (await readLedger()).find((r) => r.orderId === orderId);
  if (!entry) return Response.json({ error: "Unknown order." }, { status: 400 });
  if (entry.status !== "CAPTURED") return Response.json({ error: "Order is not CAPTURED; cannot pay out." }, { status: 400 });
  if (entry.verdict !== "PASS") return Response.json({ error: "Only PASS verdicts earn a payout." }, { status: 400 });

  return guarded(async () => {
    if (!paypalClientId()) throw new Error(NOT_CONNECTED);

    const match = await resolvePublisher(entry.decidedBy ?? []);
    if (!match) {
      await upsertLedger(orderId, { status: "CAPTURED", sentence: `${entry.sentence ?? ""} No credited publisher on file.` });
      return { paid: false, reason: "no publisher match" };
    }

    const amount = Math.round(entry.price * match.publisher.payoutRate * 100) / 100;
    const payout = await createPayout({
      receiverEmail: match.publisher.paypalEmail,
      amount,
      note: `Honest-influence payout for ${entry.productName} (order ${orderId}).`,
      senderBatchId: `sway-${orderId}`.slice(0, 30),
    });

    const row = await upsertLedger(orderId, {
      sentence: `${entry.sentence ?? ""} Paid ${match.host} $${amount.toFixed(2)}.`.trim(),
    });

    return { paid: true, publisher: match.host, amount, payout, entry: row };
  });
}
