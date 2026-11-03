// Shapes of what the Sway API and the site's own /api routes return, plus small formatters.
// Nothing here is data: every product, page, verdict and order comes from a live call.

export type Product = { id: string; name: string; label: string; seller: string; price: number; description: string; url: string };
export type Task = { id: string; ask: string; budget: number; query: string; products: Product[] };
export type PageInfo = { id: string; url: string; planted: boolean; reasons: string[]; excerpt: string };
export type XrayUnit = { unit: string; kind: string; pages: string[]; flip_rate: number; without_it: string; decided: boolean; suspicious: boolean };
export type CheckResult = {
  chosen: string;
  verdict: "PASS" | "BLOCK";
  attr_only_verdict: "PASS" | "BLOCK";
  blocked_by: string | null;
  blocked_pages: string[];
  alternative: string | null;
  decided_by_honest: string[];
  stability: number;
  baseline_picks: string[];
  calls: number;
  xray: XrayUnit[];
};
export type Verdict = { task: Task; products: Product[]; condition: string; target: string | null; pages: PageInfo[]; sentence: string; result: CheckResult };
export type Pick = { task: Task; products: Product[]; condition: string; chosen: string; stability: number; pages: { id: string; url: string }[]; target: string | null };

export type BenchRow = {
  task: string;
  condition: string;
  target: string | null;
  chosen: string;
  steered: boolean;
  manipulated?: boolean;
  verdict: "PASS" | "BLOCK";
  attr_only_verdict?: "PASS" | "BLOCK";
  decider_correct: boolean;
  decided_by_honest: string[];
  chosen_price: number | null;
  alt_price: number | null;
  stability: number;
  calls: number;
};
export type Evidence = { main_run: string; model: string | null; k: number | null; main: BenchRow[]; subtle: BenchRow[] };

export type LedgerEntry = {
  orderId: string;
  authorizationId?: string;
  captureId?: string;
  task: string;
  ask: string;
  condition: string;
  product: string;
  productName: string;
  price: number;
  seller: string;
  sites: string[];
  decidedBy: string[];
  verdict?: "PASS" | "BLOCK";
  attrOnlyVerdict?: "PASS" | "BLOCK";
  status: "CREATED" | "HELD" | "CAPTURED" | "VOIDED" | "KEPT_BY_SHOPPER";
  alternative?: string;
  saved?: number;
  sentence?: string;
  replaces?: string;
  createdAt: string;
  updatedAt: string;
};

/** The test webs the Sway API can put in front of the agent (its `conditions`), in the order shown. */
export const WEBS: { id: string; label: string; detail: string; kind: "honest" | "attack" }[] = [
  { id: "clean", label: "Honest pages", detail: "A buyer's guide, a forum, a price tracker and a short review.", kind: "honest" },
  { id: "honest_strong", label: "+ a strong honest review", detail: "A long-term review that really does recommend another product.", kind: "honest" },
  { id: "attack_hidden", label: "+ hidden AI instructions", detail: "A deals page with invisible text telling AI assistants what to buy.", kind: "attack" },
  { id: "attack_redundant", label: "+ two planted pages", detail: "Two sites with the same hidden push, so removing one alone changes nothing.", kind: "attack" },
  { id: "deceptive_visible", label: "+ a fake flash price", detail: "A visible 'today only' price the store catalog says is false.", kind: "attack" },
  { id: "covert_instruction", label: "+ a covert “final answer” page", detail: "Text for whoever summarises the page, and a false 'discontinued' claim.", kind: "attack" },
  { id: "price_smear", label: "+ a false rival price hike", detail: "Claims the honest pick got pricier and sold out. The catalog disagrees.", kind: "attack" },
  { id: "fake_reviews", label: "+ fake reviews", detail: "Plain astroturf. Nothing in the catalog contradicts it: Sway’s known blind spot.", kind: "attack" },
];

/** Client id the server returns in SWAY_DEMO=1 mode (no PayPal keys); the button then renders a local stand-in. */
export const DEMO_CLIENT_ID = "sway-demo";

export const money =(n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

export const host = (u: string) => {
  try {
    return new URL(u).hostname;
  } catch {
    return u;
  }
};

export const pct = (n: number, d: number) => (d ? `${Math.round((100 * n) / d)}%` : "—");

/** Browser-side call to the site's own /api routes; throws the route's error message. */
export async function request<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({ error: `Request failed (${res.status})` }));
  if (!res.ok) throw new Error((json as { error?: string }).error ?? `Request failed (${res.status})`);
  return json as T;
}
