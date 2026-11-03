# Operator audit ledger (`/ops`)

AG Grid Community, infinite row model (the Enterprise "server-side row model" is not used). The grid pages,
sorts and filters through `GET /api/ledger`, which reads `data/orders.json`.

## `GET /api/ledger`

Query: `startRow`, `endRow` (page capped at 1000 rows), `sort` (JSON `[{"colId","sort"}]`, default newest first),
`filter` (JSON `{colId: {type: contains|equals|notEqual|startsWith|endsWith|notContains, filter}}`).
Returns `{ rows, lastRow, total }`. `lastRow` is the count after filtering. A row is a `LedgerRow` (`site/lib/sway.ts`):
missing facts are `null`, never invented. `can.{approve,void,refund}` says which actions are valid now.

## Row actions

| Action  | Route                                        | Allowed when                          |
|---------|----------------------------------------------|---------------------------------------|
| Approve | `POST /api/shop/decide {orderId, choice:"keep"}`   | held after a failed honesty check |
| Void    | `POST /api/shop/decide {orderId, choice:"switch"}` | same                              |
| Refund  | `POST /api/shop/refund {orderId}`                  | captured (or kept by shopper)     |

The routes re-check order state; the grid's `can` flags are only for display. Each action asks for confirmation.

## Keyboard

Arrow keys, Home/End, PageUp/PageDown move between cells. On a row: `A` approve, `V` void, `R` refund.
Enter or F2 on the Actions cell moves into its buttons; Esc leaves. Results are announced in a live region.

## Where the audit fields come from

| Column | Source |
|---|---|
| agent_id, human_id | sent by the shop flow when it creates the order (`sway-shopper-agent`, and a random anonymous per-browser id). Blank for older rows or other callers. |
| deciding_page_url, reason tag | recorded by `/api/shop/approve` from the Sway verdict. A pass has no reason from the engine, so it shows `no-signals`. |
| payout recipient / amount / batch | recorded when the publisher payout is sent. |
| currency | always USD (`createOrder`). |
| PayPal link | sandbox activity page for the capture id; none until a payment is captured, and none for `DEMO-` ids. The URL pattern has not been checked against a live sandbox account. |

## Demo mode

`SWAY_DEMO=1` answers every PayPal call with an in-process mock (`DEMO-` ids). `demo-film/seed-demo-ledger.py`
writes a sample `data/orders.json` for that mode. Delete the file afterwards.
