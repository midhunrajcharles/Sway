import { refundCapture } from "@/lib/server/paypal";
import { guarded, readLedger, upsertLedger } from "@/lib/server/sway-api";

// Operator action from the audit ledger: fully refund a payment that was already captured
// (a PASS capture, or a BLOCK the shopper chose to keep). Re-checks state server-side, like /decide.
export async function POST(request: Request) {
  const { orderId } = (await request.json()) as { orderId: string };
  const entry = (await readLedger()).find((r) => r.orderId === orderId);
  if (!entry?.captureId || (entry.status !== "CAPTURED" && entry.status !== "KEPT_BY_SHOPPER")) {
    return Response.json({ error: "Only a captured payment can be refunded." }, { status: 400 });
  }
  const captureId = entry.captureId;
  return guarded(async () => {
    const { refundId } = await refundCapture(captureId);
    return { entry: await upsertLedger(orderId, { refundId, status: "REFUNDED" }) };
  });
}
