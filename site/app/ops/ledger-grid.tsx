"use client";

// Operator audit ledger: AG Grid Community, infinite row model, backed by /api/ledger.
//
// NOTE on "server-side row model": that name is AG Grid Enterprise. Community's equivalent for
// server-paged data is the Infinite Row Model used here: the grid asks /api/ledger for one block
// of rows at a time with the sort and filter models, and the server does the sorting/filtering.
//
// Keyboard: arrow keys / Home / End / PageUp / PageDown move between cells (AG Grid built-in).
// On a focused row: A = Approve (capture), V = Void, R = Refund. Enter/F2 on the Actions cell moves
// focus into its buttons, Tab/Shift+Tab cycles them, Esc returns to the cell.

import { useCallback, useMemo, useRef, useState } from "react";
import {
  CellStyleModule,
  ColumnAutoSizeModule,
  InfiniteRowModelModule,
  TextFilterModule,
  themeQuartz,
  type CellKeyDownEvent,
  type ColDef,
  type FullWidthCellKeyDownEvent,
  type GridApi,
  type GridReadyEvent,
  type ICellRendererParams,
  type IDatasource,
} from "ag-grid-community";
import { AgGridProvider, AgGridReact } from "ag-grid-react";
import { money, request, type LedgerPage, type LedgerRow, type Outcome } from "@/lib/sway";

const modules = [InfiniteRowModelModule, TextFilterModule, CellStyleModule, ColumnAutoSizeModule];

// Colours come from the site tokens, so the grid follows light/dark (data-theme) automatically.
const theme = themeQuartz.withParams({
  fontFamily: "inherit",
  fontSize: 14,
  backgroundColor: "var(--color-background-100)",
  foregroundColor: "var(--color-foreground-100)",
  textColor: "var(--color-foreground-100)",
  accentColor: "var(--color-foreground-100)",
  borderColor: "var(--color-foreground-20)",
  headerBackgroundColor: "var(--color-background-100)",
  headerTextColor: "var(--color-foreground-80)",
  headerFontWeight: 600,
  rowHoverColor: "var(--color-foreground-5)",
  selectedRowBackgroundColor: "var(--color-foreground-10)",
  wrapperBorder: false,
  wrapperBorderRadius: 0,
  columnBorder: false,
  rowHeight: 56,
  headerHeight: 44,
  cellHorizontalPadding: 14,
  inputBackgroundColor: "var(--color-background-100)",
  inputTextColor: "var(--color-foreground-100)",
  inputBorder: { color: "var(--color-foreground-40)" },
  menuBackgroundColor: "var(--color-background-100)",
});

type Action = "approve" | "void" | "refund";
const ACTIONS: { id: Action; label: string; key: string; verb: string; endpoint: string; body: (id: string) => object; destructive: boolean }[] = [
  { id: "approve", label: "Approve", key: "a", verb: "Capture the held payment for", endpoint: "/api/shop/decide", body: (orderId) => ({ orderId, choice: "keep" }), destructive: false },
  { id: "void", label: "Void", key: "v", verb: "Void the held authorization for", endpoint: "/api/shop/decide", body: (orderId) => ({ orderId, choice: "switch" }), destructive: true },
  { id: "refund", label: "Refund", key: "r", verb: "Fully refund the captured payment for", endpoint: "/api/shop/refund", body: (orderId) => ({ orderId }), destructive: true },
];

/** Icon + text status. The icon is decorative (aria-hidden); the word carries the meaning. */
const STATUS: Record<Outcome, { label: string; tone: string; icon: string }> = {
  captured: { label: "Captured", tone: "ok", icon: "M5 12.5l4.2 4.2L19 7" },
  voided: { label: "Voided", tone: "warn", icon: "M6 6l12 12M18 6L6 18" },
  refunded: { label: "Refunded", tone: "info", icon: "M9 8L4 12l5 4M4 12h10a6 6 0 010 8" },
  held: { label: "On hold", tone: "amber", icon: "M9 6v12M15 6v12" },
  pending: { label: "Pending", tone: "muted", icon: "M12 7v5l3 2" },
};

function Mark({ d }: { d: string }) {
  return (
    <svg className="ops-ico" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={d} />
    </svg>
  );
}

function StatusCell({ value }: ICellRendererParams<LedgerRow, Outcome>) {
  if (!value) return null;
  const s = STATUS[value];
  return (
    <span className="ops-status" data-tone={s.tone}>
      <Mark d={s.icon} />
      {s.label}
    </span>
  );
}

function VerdictCell({ data }: ICellRendererParams<LedgerRow>) {
  if (!data?.verdict) return <span className="sw-muted">—</span>;
  const fail = data.verdict === "fail";
  return (
    <span className="ops-status" data-tone={fail ? "warn" : "ok"}>
      <Mark d={fail ? "M6 6l12 12M18 6L6 18" : "M5 12.5l4.2 4.2L19 7"} />
      {fail ? "Fail" : "Pass"}
      <span className="ops-tag">{data.reasonTag}</span>
    </span>
  );
}

function OrderCell({ data }: ICellRendererParams<LedgerRow>) {
  if (!data) return null;
  if (!data.sandboxUrl) return <span className="ops-mono">{data.orderId}</span>;
  return (
    <a className="ops-link ops-mono" href={data.sandboxUrl} target="_blank" rel="noopener noreferrer" aria-label={`Open PayPal sandbox transaction for order ${data.orderId} (opens in a new tab)`}>
      {data.orderId}
    </a>
  );
}

const dash = (v: unknown) => (v == null || v === "" ? "—" : String(v));
const textCol = (field: keyof LedgerRow, headerName: string, extra: ColDef<LedgerRow> = {}): ColDef<LedgerRow> => ({
  field,
  headerName,
  filter: "agTextColumnFilter",
  floatingFilter: true,
  filterParams: { maxNumConditions: 1, debounceMs: 300, filterOptions: ["contains", "equals"] },
  valueFormatter: (p) => dash(p.value),
  minWidth: 130,
  ...extra,
});

export function LedgerGrid() {
  const apiRef = useRef<GridApi<LedgerRow> | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<{ rowIndex: number; colKey: string } | null>(null);
  const [pending, setPending] = useState<{ action: (typeof ACTIONS)[number]; row: LedgerRow } | null>(null);
  const [busy, setBusy] = useState(false);
  const [announce, setAnnounce] = useState("");
  const [error, setError] = useState<string | null>(null);

  const ask = useCallback((action: Action, row: LedgerRow) => {
    const a = ACTIONS.find((x) => x.id === action)!;
    if (!row.can[action]) return setAnnounce(`${a.label} is not available for order ${row.orderId}: it is ${row.outcome}.`);
    const focus = apiRef.current?.getFocusedCell();
    returnFocus.current = focus ? { rowIndex: focus.rowIndex, colKey: focus.column.getColId() } : null;
    setError(null);
    setPending({ action: a, row });
    dialogRef.current?.showModal();
  }, []);

  const closeDialog = useCallback(() => {
    dialogRef.current?.close();
    setPending(null);
    const f = returnFocus.current;
    if (f) requestAnimationFrame(() => apiRef.current?.setFocusedCell(f.rowIndex, f.colKey));
  }, []);

  const confirm = useCallback(async () => {
    if (!pending) return;
    const { action, row } = pending;
    setBusy(true);
    setError(null);
    try {
      await request(action.endpoint, action.body(row.orderId));
      setAnnounce(`${action.label} done for ${row.productTitle}, order ${row.orderId}.`);
      closeDialog();
      apiRef.current?.refreshInfiniteCache();
    } catch (e) {
      const msg = (e as Error).message;
      setError(msg);
      setAnnounce(`${action.label} failed: ${msg}`);
    } finally {
      setBusy(false);
    }
  }, [pending, closeDialog]);

  const columns = useMemo<ColDef<LedgerRow>[]>(
    () => [
      {
        field: "timestamp",
        headerName: "Timestamp",
        width: 190,
        valueFormatter: (p) => (p.value ? new Date(p.value as string).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "medium" }) : "—"),
      },
      textCol("agentId", "Agent ID", { width: 150 }),
      textCol("humanId", "Human ID", { width: 150 }),
      textCol("productTitle", "Product (Channel3)", {
        minWidth: 260,
        cellRenderer: ({ data }: ICellRendererParams<LedgerRow>) =>
          data ? (
            <span className="ops-stack">
              <span>{data.productTitle}</span>
              <span className="ops-mono ops-sub">{data.productId}</span>
            </span>
          ) : null,
      }),
      textCol("decidingPageUrl", "Deciding page URL", { minWidth: 240, cellClass: "ops-mono" }),
      { ...textCol("verdict", "Honesty verdict", { minWidth: 300, cellRenderer: VerdictCell }) },
      textCol("orderId", "PayPal order", { minWidth: 200, cellRenderer: OrderCell }),
      textCol("outcome", "Outcome", { minWidth: 150, cellRenderer: StatusCell }),
      textCol("payoutRecipient", "Payout recipient", { minWidth: 190 }),
      {
        field: "amount",
        headerName: "Amount",
        width: 120,
        type: "rightAligned",
        valueFormatter: (p) => (p.value == null ? "—" : money(p.value as number)),
      },
      { field: "currency", headerName: "Currency", width: 110, sortable: false },
      {
        colId: "actions",
        headerName: "Actions",
        pinned: "right",
        width: 290,
        sortable: false,
        filter: false,
        suppressHeaderMenuButton: true,
        cellRenderer: ({ data }: ICellRendererParams<LedgerRow>) =>
          data ? (
            <span className="ops-actions" role="group" aria-label={`Actions for order ${data.orderId}`}>
              {ACTIONS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className="ops-act"
                  data-kind={a.id}
                  disabled={!data.can[a.id]}
                  aria-label={`${a.label} order ${data.orderId}, ${data.productTitle}`}
                  aria-keyshortcuts={a.key.toUpperCase()}
                  onClick={() => ask(a.id, data)}
                >
                  {a.label}
                </button>
              ))}
            </span>
          ) : null,
      },
    ],
    [ask],
  );

  const datasource = useMemo<IDatasource>(
    () => ({
      getRows: (p) => {
        const qs = new URLSearchParams({
          startRow: String(p.startRow),
          endRow: String(p.endRow),
          sort: JSON.stringify(p.sortModel),
          filter: JSON.stringify(p.filterModel),
        });
        request<LedgerPage>(`/api/ledger?${qs}`)
          .then((r) => {
            setError(null);
            p.successCallback(r.rows, r.lastRow);
          })
          .catch((e: Error) => {
            setError(e.message);
            p.failCallback();
          });
      },
    }),
    [],
  );

  const onReady = useCallback((e: GridReadyEvent<LedgerRow>) => {
    apiRef.current = e.api;
  }, []);

  const onKey = useCallback(
    (e: CellKeyDownEvent<LedgerRow> | FullWidthCellKeyDownEvent<LedgerRow>) => {
      const ev = e.event as KeyboardEvent | null;
      if (!ev || ev.ctrlKey || ev.metaKey || ev.altKey || (ev.target as HTMLElement).closest("button, input, a")) return;
      const a = ACTIONS.find((x) => x.key === ev.key.toLowerCase());
      if (a && e.data) {
        ev.preventDefault();
        ask(a.id, e.data);
      }
    },
    [ask],
  );

  return (
    <section aria-labelledby="ops-ledger-h">
      <h2 id="ops-ledger-h" className="ops-h">
        Audit ledger
      </h2>
      <p className="sw-small sw-muted" id="ops-ledger-help">
        Arrow keys move between cells. On a row, press <kbd>A</kbd> to approve (capture), <kbd>V</kbd> to void, <kbd>R</kbd> to refund. Enter on the Actions cell moves into its buttons.
      </p>
      {error && !pending && (
        <p className="sw-note" data-tone="amber" role="alert">
          {error}
        </p>
      )}
      <div className="sw-grid ops-grid" style={{ height: 640 }} role="region" aria-label="Audit ledger of agent purchases" aria-describedby="ops-ledger-help">
        <AgGridProvider modules={modules}>
          <AgGridReact<LedgerRow>
            theme={theme}
            columnDefs={columns}
            rowModelType="infinite"
            datasource={datasource}
            cacheBlockSize={100}
            getRowId={(p) => p.data.orderId}
            defaultColDef={{ sortable: true, resizable: true, suppressMovable: true }}
            onGridReady={onReady}
            onCellKeyDown={onKey}
            enableCellTextSelection
            ensureDomOrder
            overlayNoRowsTemplate="No agent purchases match. Every purchase made in the shopping assistant appears here."
          />
        </AgGridProvider>
      </div>

      <div className="ops-live" role="status" aria-live="polite">
        {announce}
      </div>

      <dialog
        ref={dialogRef}
        className="ops-dialog"
        aria-labelledby="ops-dlg-h"
        aria-describedby="ops-dlg-b"
        onCancel={(e) => {
          e.preventDefault();
          if (!busy) closeDialog();
        }}
      >
        {pending && (
          <form method="dialog" onSubmit={(e) => e.preventDefault()}>
            <h3 id="ops-dlg-h">{pending.action.label} this order?</h3>
            <p id="ops-dlg-b">
              {pending.action.verb} <strong>{pending.row.productTitle}</strong> ({money(pending.row.amount)} {pending.row.currency}, order <span className="ops-mono">{pending.row.orderId}</span>).
            </p>
            {error && (
              <p className="sw-note" data-tone="amber" role="alert">
                {error}
              </p>
            )}
            <div className="ops-dlg-actions">
              <button type="button" className="ops-act" onClick={closeDialog} disabled={busy} autoFocus={pending.action.destructive}>
                Cancel
              </button>
              <button type="button" className="ops-act" data-kind={pending.action.id} onClick={confirm} disabled={busy} autoFocus={!pending.action.destructive}>
                {busy ? "Working…" : `Confirm ${pending.action.label.toLowerCase()}`}
              </button>
            </div>
          </form>
        )}
      </dialog>
    </section>
  );
}
