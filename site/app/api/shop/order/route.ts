import { createOrder } from "@/lib/server/paypal";
import { guarded, host, readLedger, swayPick, upsertLedger } from "@/lib/server/sway-api";

// Step 2: create a PayPal order with intent AUTHORIZE for the agent's pick, or, after a Sway block,
// for the alternative (`replaces` = the voided order the shopper switched away from).
// The product and price always come from the server, never from the browser.
export async function POST(request: Request) {
  const { task, condition, replaces, agentId, humanId } = (await request.json()) as { task: string; condition: string; replaces?: string; agentId?: string; humanId?: string };
  return guarded(async () => {
    const pick = await swayPick(task, condition);
    let productId = pick.chosen;
    if (replaces) {
      const prev = (await readLedger()).find((r) => r.orderId === replaces);
      if (!prev?.alternative || prev.status !== "VOIDED") throw new Error("Nothing to switch to for that order.");
      productId = prev.alternative;
    }
    const product = pick.products.find((p) => p.id === productId);
    if (!product) throw new Error("The agent did not return a valid product.");
    const { id } = await createOrder(product, `sway|${task}|${condition}|${productId}`);
    await upsertLedger(id, {
      task,
      ask: pick.task.ask,
      condition,
      product: product.id,
      productName: product.name,
      price: product.price,
      seller: product.seller,
      // A switch is the shopper's own choice, so it is not credited to the pages the agent read.
      sites: replaces ? [] : pick.pages.map((p) => host(p.url)),
      decidedBy: [],
      status: "CREATED",
      replaces,
      // Who/what placed the order, when the caller says so. Never guessed.
      agentId: agentId?.slice(0, 80),
      humanId: humanId?.slice(0, 80),
    });
    return { orderId: id, product };
  });
}
