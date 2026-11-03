// Run: node --experimental-strip-types --test lib/server/ledger-view.test.ts   (from site/, Node 22.6+)
import assert from "node:assert/strict";
import { test } from "node:test";
import { pageOf, toRow } from "./ledger-view.ts";
import type { LedgerEntry } from "../sway.ts";

const entry = (i: number, over: Partial<LedgerEntry> = {}): LedgerEntry => ({
  orderId: `DEMO-ORDER-${i}`,
  task: "t",
  ask: "a",
  condition: "clean",
  product: `p${i}`,
  productName: `Product ${i}`,
  price: i * 10,
  seller: "s",
  sites: [],
  decidedBy: [],
  status: "CAPTURED",
  captureId: `DEMO-CAPTURE-${i}`,
  createdAt: `2026-11-0${i}T00:00:00Z`,
  updatedAt: `2026-11-0${i}T00:00:00Z`,
  ...over,
});

test("held BLOCK order can be approved or voided, not refunded", () => {
  const r = toRow(entry(1, { status: "HELD", verdict: "BLOCK", captureId: undefined, reasonTags: ["hidden-text"] }));
  assert.deepEqual(r.can, { approve: true, void: true, refund: false });
  assert.equal(r.outcome, "held");
  assert.equal(r.verdict, "fail");
  assert.equal(r.reasonTag, "hidden-text");
});

test("captured order can only be refunded; kept-by-shopper counts as captured", () => {
  assert.deepEqual(toRow(entry(1)).can, { approve: false, void: false, refund: true });
  assert.equal(toRow(entry(2, { status: "KEPT_BY_SHOPPER" })).outcome, "captured");
});

test("voided and refunded orders allow no actions", () => {
  for (const status of ["VOIDED", "REFUNDED"] as const) {
    assert.deepEqual(toRow(entry(1, { status })).can, { approve: false, void: false, refund: false });
  }
});

test("missing audit fields are null, never invented; demo ids get no sandbox link", () => {
  const r = toRow(entry(1));
  assert.equal(r.agentId, null);
  assert.equal(r.humanId, null);
  assert.equal(r.payoutRecipient, null);
  assert.equal(r.sandboxUrl, null);
  assert.match(toRow(entry(1, { orderId: "5O190127", captureId: "3C679366" })).sandboxUrl ?? "", /sandbox\.paypal\.com.*3C679366/);
});

test("paging, default sort (newest first), sort by amount, filter", () => {
  const all = [1, 2, 3, 4].map((i) => entry(i, i === 2 ? { status: "VOIDED" } : {}));
  const page = pageOf(all, { start: 0, end: 2, sort: [], filter: {} });
  assert.deepEqual(page.rows.map((r) => r.orderId), ["DEMO-ORDER-4", "DEMO-ORDER-3"]);
  assert.equal(page.lastRow, 4);

  const byAmount = pageOf(all, { start: 0, end: 10, sort: [{ colId: "amount", sort: "asc" }], filter: {} });
  assert.deepEqual(byAmount.rows.map((r) => r.amount), [10, 20, 30, 40]);

  const voided = pageOf(all, { start: 0, end: 10, sort: [], filter: { outcome: { type: "equals", filter: "voided" } } });
  assert.equal(voided.lastRow, 1);
  assert.equal(voided.total, 4);

  const second = pageOf(all, { start: 2, end: 4, sort: [], filter: {} });
  assert.deepEqual(second.rows.map((r) => r.orderId), ["DEMO-ORDER-2", "DEMO-ORDER-1"]);
});
