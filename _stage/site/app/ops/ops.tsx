"use client";

import { useEffect, useMemo, useState } from "react";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { Badge, SwayGrid } from "@/components/SwayGrid";
import { EnvBadge } from "@/components/EnvBadge";
import { Text } from "@/components/Text";
import { money, request, type LedgerEntry } from "@/lib/sway";

type Order = {
  id: string;
  when: string;
  ask: string;
  product: string;
  price: number;
  decidedBy: string[];
  verdict: "PASS" | "BLOCK" | null;
  status: "Paid" | "Switched" | "Kept by shopper" | "On hold" | "Awaiting approval";
  kept: number;
};
type SiteRow = { site: string; read: number; decided: number; blocked: number; moved: number };

const STATUS_OF: Record<LedgerEntry["status"], Order["status"]> = {
  CAPTURED: "Paid",
  VOIDED: "Switched",
  KEPT_BY_SHOPPER: "Kept by shopper",
  HELD: "On hold",
  CREATED: "Awaiting approval",
};

/** One row per PayPal order in the ledger; a switch order is the shopper's own pick, so it carries no sites. */
function toOrders(ledger: LedgerEntry[]): Order[] {
  return ledger.map((e) => ({
    id: e.orderId,
    when: e.createdAt,
    ask: e.ask,
    product: e.replaces ? `${e.productName} (switched to)` : e.productName,
    price: e.price,
    decidedBy: e.decidedBy,
    verdict: e.verdict ?? null,
    status: STATUS_OF[e.status],
    kept: e.status === "VOIDED" && e.saved ? Math.max(0, e.saved) : 0,
  }));
}

function toSites(ledger: LedgerEntry[]): SiteRow[] {
  const by = new Map<string, SiteRow>();
  for (const e of ledger) {
    for (const s of new Set(e.sites)) {
      const row = by.get(s) ?? { site: s, read: 0, decided: 0, blocked: 0, moved: 0 };
      row.read++;
      if (e.decidedBy.includes(s)) {
        row.decided++;
        if (e.verdict === "BLOCK") {
          row.blocked++;
          row.moved += e.price;
        }
      }
      by.set(s, row);
    }
  }
  return [...by.values()].sort((a, b) => b.blocked - a.blocked || b.read - a.read);
}

const siteColumns: ColDef<SiteRow>[] = [
  {
    field: "site",
    headerName: "Website the agent read",
    flex: 2,
    minWidth: 220,
    cellRenderer: (p: ICellRendererParams<SiteRow>) => (
      <span>
        {p.value}
        {p.data && p.data.blocked > 0 && (
          <span style={{ marginLeft: "0.6rem" }}>
            <Badge tone="warn">flagged</Badge>
          </span>
        )}
      </span>
    ),
  },
  { field: "read", headerName: "Purchases that read it", width: 200 },
  { field: "decided", headerName: "It decided the buy", width: 180 },
  {
    field: "blocked",
    headerName: "Blocked as planted",
    width: 180,
    cellRenderer: (p: ICellRendererParams<SiteRow>) => (p.value ? <Badge tone="warn">{String(p.value)}</Badge> : <span className="sw-muted">0</span>),
  },
  { field: "moved", headerName: "Money it tried to move", width: 200, valueFormatter: (p) => (p.value ? money(p.value as number) : "—") },
];

const STATUS: Record<Order["status"], "ok" | "warn" | "muted" | "amber"> = {
  Paid: "ok",
  Switched: "warn",
  "Kept by shopper": "muted",
  "On hold": "amber",
  "Awaiting approval": "muted",
};

const orderColumns: ColDef<Order>[] = [
  {
    field: "when",
    headerName: "When",
    width: 170,
    valueFormatter: (p) => new Date(p.value as string).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }),
  },
  { field: "ask", headerName: "Shopper asked for", flex: 2, minWidth: 220 },
  { field: "product", headerName: "Agent picked", flex: 2, minWidth: 220 },
  { field: "price", headerName: "Price", width: 120, valueFormatter: (p) => money(p.value as number) },
  {
    field: "verdict",
    headerName: "Sway",
    width: 120,
    cellRenderer: (p: ICellRendererParams<Order>) =>
      p.value ? <Badge tone={p.value === "BLOCK" ? "warn" : "ok"}>{p.value === "BLOCK" ? "Held" : "Passed"}</Badge> : <span className="sw-muted">—</span>,
  },
  { field: "decidedBy", headerName: "Decided by", flex: 2, minWidth: 200, valueFormatter: (p) => (p.value as string[]).join(", ") || "—" },
  {
    field: "status",
    headerName: "PayPal",
    width: 170,
    cellRenderer: (p: ICellRendererParams<Order>) => <Badge tone={STATUS[p.value as Order["status"]]}>{String(p.value)}</Badge>,
  },
  { field: "kept", headerName: "Shopper kept", width: 140, valueFormatter: (p) => (p.value ? money(p.value as number) : "—") },
  { field: "id", headerName: "Order", width: 150 },
];

export function Ops() {
  const [view, setView] = useState<"sites" | "orders">("sites");
  const [search, setSearch] = useState("");
  const [ledger, setLedger] = useState<LedgerEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    request<{ orders: LedgerEntry[] }>("/api/ops")
      .then((r) => setLedger(r.orders))
      .catch((e: Error) => setError(e.message));
  }, []);
  const orders = useMemo(() => toOrders(ledger ?? []), [ledger]);
  const sites = useMemo(() => toSites(ledger ?? []), [ledger]);
  const held = orders.filter((o) => o.verdict === "BLOCK");
  const kept = orders.reduce((s, o) => s + o.kept, 0);
  const flagged = sites.filter((s) => s.blocked > 0).length;

  return (
    <div>
      <div className="sw-grid-4" style={{ marginBottom: "2rem" }}>
        {[
          [String(orders.length), "agent purchases"],
          [String(held.length), "held before capture"],
          [`$${Math.round(kept).toLocaleString("en-US")}`, "kept by shoppers who switched"],
          [String(flagged), "websites flagged"],
        ].map(([n, label]) => (
          <div key={label} className="sw-card sw-stat">
            <span className="sw-stat-figure">{n}</span>
            <Text as="p" variant="body-large" className="sw-muted">
              {label}
            </Text>
          </div>
        ))}
      </div>

      <div className="sw-toolbar">
        <div className="sw-seg" role="group" aria-label="View">
          <button aria-pressed={view === "sites"} onClick={() => setView("sites")}>
            By website
          </button>
          <button aria-pressed={view === "orders"} onClick={() => setView("orders")}>
            All orders
          </button>
        </div>
        <input className="sw-search" type="search" placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search" />
        <EnvBadge />
      </div>

      {error && <p className="sw-note" data-tone="amber">{error}</p>}
      {ledger && ledger.length === 0 && (
        <p className="sw-small sw-muted" style={{ marginBottom: "1rem" }}>
          No agent purchases yet. Every purchase made in the shopping assistant appears here with its PayPal order id.
        </p>
      )}
      {view === "sites" ? (
        <SwayGrid<SiteRow> rows={sites} columns={siteColumns} search={search} />
      ) : (
        <SwayGrid<Order> rows={orders} columns={orderColumns} search={search} height={680} />
      )}
    </div>
  );
}
