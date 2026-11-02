import { captureAuthorization, voidAuthorization } from "@/lib/server/paypal";
import { guarded, readLedger, upsertLedger } from "@/lib/server/sway-api";

// Step 4, only after a Sway block: the shopper answers "Yes, switch" (void the held money) or
// "Keep mine" (capture it anyway; the shopper always has the last word).
export async function POST(request: Request) {
  const { orderId, choice } = (await request.json()) as { orderId: string; choice: "switch" | "keep" };
  const entry = (await readLedger()).find((r) => r.orderId === orderId);
  if (!entry?.authorizationId || entry.status !== "HELD" || entry.verdict !== "BLOCK") {
    return Response.json({ error: "That order is not waiting for a decision." }, { status: 400 });
  }
  const authorizationId = entry.authorizationId;
  return guarded(async () => {
    if (choice === "keep") {
      const { captureId } = await captureAuthorization(authorizationId);
      return { entry: await upsertLedger(orderId, { captureId, status: "KEPT_BY_SHOPPER" }) };
    }
    await voidAuthorization(authorizationId);
    return { entry: await upsertLedger(orderId, { status: "VOIDED" }) };
  });
}
