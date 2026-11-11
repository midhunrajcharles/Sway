import { guarded, swayResolve } from "@/lib/server/sway-api";

// Step 0: the shopper's own words → the task to shop. A plain ask for a benchmark task keeps
// its cached answers; anything else gets real Channel3 products for exactly what was asked.
export async function POST(request: Request) {
  const { text } = (await request.json()) as { text?: string };
  return guarded(() => swayResolve(String(text ?? "").slice(0, 300)));
}
