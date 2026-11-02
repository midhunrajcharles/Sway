import { paypalClientId } from "@/lib/server/paypal";
import { guarded, swayPick } from "@/lib/server/sway-api";

// Step 1: the shopping agent reads the web and picks a product (no Sway check yet).
// The PayPal client id goes back with it so the page can load PayPal's own checkout button.
export async function POST(request: Request) {
  const { task, condition } = (await request.json()) as { task: string; condition: string };
  return guarded(async () => {
    const pick = await swayPick(task, condition);
    const product = pick.products.find((p) => p.id === pick.chosen) ?? null;
    return { ...pick, product, paypalClientId: paypalClientId() };
  });
}
