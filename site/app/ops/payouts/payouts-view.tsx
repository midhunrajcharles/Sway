"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { money, request, type LedgerPage, type LedgerRow } from "@/lib/sway";

// Loaded only in the browser and only when the flag page renders it, so Bryntum never reaches other routes.
const Timeline = dynamic(() => import("./timeline"), { ssr: false, loading: () => <p className="sw-small sw-muted">Loading scheduler…</p> });

export type Batch = { id: string; publisher: string; start: Date; end: Date; amount: number; orderId: string };

const HOUR = 3_600_000;

/** One payout batch per ledger row that paid a publisher. The ledger records the order time, which is when the payout fires. */
export function toBatches(rows: LedgerRow[]): Batch[] {
  return rows
    .filter((r) => r.payoutRecipient && r.payoutBatchId)
    .map((r) => {
      const start = new Date(r.timestamp);
      return { id: r.payoutBatchId!, publisher: r.payoutRecipient!, start, end: new Date(start.getTime() + 12 * HOUR), amount: r.payoutAmount ?? 0, orderId: r.orderId };
    });
}

export function PayoutsView() {
  const [batches, setBatches] = useState<Batch[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    request<LedgerPage>("/api/ledger?startRow=0&endRow=1000")
      .then((r) => setBatches(toBatches(r.rows)))
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) return <p className="sw-note" data-tone="amber" role="alert">{error}</p>;
  if (!batches) return <p className="sw-small sw-muted">Loading payouts…</p>;
  if (!batches.length) return <p className="sw-small sw-muted">No payout batches yet. A payout is sent when an honest purchase is captured and one publisher decided it.</p>;
  return (
    <>
      <Timeline batches={batches} />
      <table className="ops-table">
        <caption className="ops-h">Payout batches (same data as the timeline)</caption>
        <thead>
          <tr>
            <th scope="col">Publisher</th>
            <th scope="col">Batch</th>
            <th scope="col">Order</th>
            <th scope="col">Time</th>
            <th scope="col">Amount</th>
          </tr>
        </thead>
        <tbody>
          {batches.map((b) => (
            <tr key={b.id}>
              <th scope="row">{b.publisher}</th>
              <td className="ops-mono">{b.id}</td>
              <td className="ops-mono">{b.orderId}</td>
              <td>{b.start.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</td>
              <td>{money(b.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
