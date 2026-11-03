import { connection } from "next/server";
import { pageOf } from "@/lib/server/ledger-view";
import { readLedger } from "@/lib/server/sway-api";

// Paged, sorted, filtered view of the order ledger for the AG Grid infinite row model.
//   GET /api/ledger?startRow=0&endRow=100&sort=[{"colId":"amount","sort":"desc"}]&filter={"agentId":{"type":"contains","filter":"x"}}
// Response: { rows, lastRow, total }. lastRow is the row count after filtering (what the grid needs).
export async function GET(request: Request) {
  await connection();
  const q = new URL(request.url).searchParams;
  const json = <T,>(name: string, fallback: T): T => {
    try {
      return JSON.parse(q.get(name) ?? "") as T;
    } catch {
      return fallback;
    }
  };
  const num = (name: string, fallback: number) => {
    const n = Number(q.get(name));
    return Number.isFinite(n) && q.get(name) !== null ? n : fallback;
  };
  const start = num("startRow", 0);
  const end = Math.min(num("endRow", start + 100), start + 1000); // cap a page at 1000 rows
  return Response.json(pageOf(await readLedger(), { start, end, sort: json("sort", []), filter: json("filter", {}) }));
}
