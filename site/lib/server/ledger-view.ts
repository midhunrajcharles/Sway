// Projection + server-side paging/sorting/filtering of the order ledger for the audit grid.
// The ledger is a small JSON file, so each request reads it whole; only the requested window is sent.

import type { LedgerEntry, LedgerPage, LedgerRow, Outcome } from "@/lib/sway";

const OUTCOME: Record<LedgerEntry["status"], Outcome> = {
  CREATED: "pending",
  HELD: "held",
  CAPTURED: "captured",
  KEPT_BY_SHOPPER: "captured",
  VOIDED: "voided",
  REFUNDED: "refunded",
};

export function toRow(e: LedgerEntry): LedgerRow {
  const demo = e.orderId.startsWith("DEMO-");
  const tx = e.captureId && !e.captureId.startsWith("DEMO-") ? e.captureId : null;
  const verdict = e.verdict ? (e.verdict === "PASS" ? "pass" : "fail") : null;
  const held = e.status === "HELD" && e.verdict === "BLOCK";
  return {
    orderId: e.orderId,
    timestamp: e.createdAt,
    agentId: e.agentId ?? null,
    humanId: e.humanId ?? null,
    productId: e.product,
    productTitle: e.productName,
    decidingPageUrl: e.decidingUrls?.[0] ?? e.decidedBy?.[0] ?? null,
    verdict,
    // PASS carries no reason from the engine; "no-signals" says the deciding pages were not flagged.
    reasonTag: verdict === "fail" ? (e.reasonTags?.length ? e.reasonTags.join(", ") : "flagged") : verdict === "pass" ? "no-signals" : null,
    outcome: OUTCOME[e.status],
    payoutRecipient: e.payoutRecipient ?? null,
    payoutBatchId: e.payoutBatchId ?? null,
    payoutAmount: e.payoutAmount ?? null,
    amount: e.price,
    currency: "USD", // createOrder always bills in USD
    sandboxUrl: demo || !tx ? null : `https://www.sandbox.paypal.com/activity/payment/${tx}`,
    can: { approve: held, void: held, refund: Boolean(e.captureId) && (e.status === "CAPTURED" || e.status === "KEPT_BY_SHOPPER") },
  };
}

type SortItem = { colId: keyof LedgerRow; sort: "asc" | "desc" };
type TextFilter = { filterType?: string; type?: string; filter?: string };

const text = (v: unknown) => (v == null ? "" : String(v)).toLowerCase();

function matches(row: LedgerRow, colId: string, f: TextFilter): boolean {
  const cell = text((row as Record<string, unknown>)[colId]);
  const q = text(f.filter);
  switch (f.type) {
    case "equals": return cell === q;
    case "notEqual": return cell !== q;
    case "startsWith": return cell.startsWith(q);
    case "endsWith": return cell.endsWith(q);
    case "notContains": return !cell.includes(q);
    default: return cell.includes(q);
  }
}

export function pageOf(
  entries: LedgerEntry[],
  opts: { start: number; end: number; sort: SortItem[]; filter: Record<string, TextFilter> },
): LedgerPage {
  let rows = entries.map(toRow);
  for (const [col, f] of Object.entries(opts.filter)) if (f?.filter) rows = rows.filter((r) => matches(r, col, f));
  const sort = opts.sort.length ? opts.sort : [{ colId: "timestamp" as const, sort: "desc" as const }];
  rows.sort((a, b) => {
    for (const s of sort) {
      const x = a[s.colId] as string | number | null;
      const y = b[s.colId] as string | number | null;
      if (x === y) continue;
      if (x == null) return 1; // nulls last in both directions
      if (y == null) return -1;
      const c = x < y ? -1 : 1;
      return s.sort === "asc" ? c : -c;
    }
    return 0;
  });
  const start = Math.max(0, opts.start);
  const end = Math.max(start, opts.end);
  return { rows: rows.slice(start, end), lastRow: rows.length, total: entries.length };
}
