import { authorizeOrder, captureAuthorization, createPayout, paypalClientId } from "@/lib/server/paypal";
import { resolvePublisher } from "@/lib/server/publishers";
import { guarded, host, readLedger, swayVerdict, upsertLedger } from "@/lib/server/sway-api";

// Step 3, after the shopper approves in PayPal's window: authorize (the money is held, not taken),
// then ask Sway why the agent chose this item. PASS → capture now. BLOCK → keep holding and let
// the shopper choose (switch = void + new order for the alternative; keep = capture anyway).
// A switch order is the shopper's own choice, so it is captured without a second check.
export async function POST(request: Request) {
  const { orderId } = (await request.json()) as { orderId: string };
  const entry = (await readLedger()).find((r) => r.orderId === orderId);
  if (!entry || entry.status !== "CREATED") return Response.json({ error: "Unknown or already handled order." }, { status: 400 });
  return guarded(async () => {
    const { authorizationId } = await authorizeOrder(orderId);
    await upsertLedger(orderId, { authorizationId, status: "HELD" });

    if (entry.replaces) {
      const { captureId } = await captureAuthorization(authorizationId);
      return { entry: await upsertLedger(orderId, { captureId, status: "CAPTURED", verdict: "PASS", sentence: `Paid for the ${entry.productName}.` }) };
    }

    const v = await swayVerdict(entry.task, entry.condition);
    const r = v.result;
    const pageHost = (id: string) => host(v.pages.find((p) => p.id === id)?.url ?? id);
    const alt = v.products.find((p) => p.id === r.alternative);
    const common = {
      verdict: r.verdict,
      attrOnlyVerdict: r.attr_only_verdict,
      sentence: v.sentence,
      decidedBy: (r.verdict === "BLOCK" ? r.blocked_pages : r.decided_by_honest).map(pageHost),
    };
    if (r.verdict === "PASS") {
      const { captureId } = await captureAuthorization(authorizationId);
      let row = await upsertLedger(orderId, { ...common, captureId, status: "CAPTURED" });
      // v2: pay the publisher that causally decided the honest buy, when
      // exactly one credit candidate exists on the x-ray.
      const candidates = r.xray.filter((u) => u.decided && !u.suspicious).flatMap((u) => u.pages).map((id) => host(v.pages.find((p) => p.id === id)?.url ?? id));
      const unique = [...new Set(candidates)];
      if (paypalClientId() && unique.length === 1) {
        try {
          const match = await resolvePublisher(unique);
          if (match) {
            const amount = Math.round(entry.price * match.publisher.payoutRate * 100) / 100;
            const payout = await createPayout({
              receiverEmail: match.publisher.paypalEmail,
              amount,
              note: `Honest-influence payout for ${entry.productName} (order ${orderId}).`,
              senderBatchId: `sway-${orderId}`.slice(0, 30),
            });
            row = await upsertLedger(orderId, {
              sentence: `${v.sentence} Paid ${match.host} $${amount.toFixed(2)} (batch ${payout.batchId}).`,
            });
          }
        } catch (err) {
          // Payouts failure must not fail the capture.
          console.error("[payouts] credit failed", err);
        }
      }
      return { entry: row, verdict: v };
    }
    const row = await upsertLedger(orderId, {
      ...common,
      alternative: r.alternative ?? undefined,
      saved: alt ? Math.round((entry.price - alt.price) * 100) / 100 : undefined,
    });
    return { entry: row, verdict: v };
  });
}
