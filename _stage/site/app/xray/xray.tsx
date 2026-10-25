"use client";

import { useEffect, useMemo, useState } from "react";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { Badge, FlipBar, SwayGrid } from "@/components/SwayGrid";
import { Text } from "@/components/Text";
import { host, money, request, WEBS, type BenchRow, type Evidence, type Verdict } from "@/lib/sway";
import { useTasks } from "@/lib/use-shop-flow";

type Row = { sites: string; test: string; withoutIt: string; flip: number; noise: number; reasons: string; role: "blocker" | "honest" | "suspicious" | "none" };

const ROLE: Record<Row["role"], { tone: "warn" | "ok" | "amber" | "muted"; label: string }> = {
  blocker: { tone: "warn", label: "Decided it · planted" },
  honest: { tone: "ok", label: "Decided it · trustworthy" },
  suspicious: { tone: "amber", label: "Suspicious, no effect" },
  none: { tone: "muted", label: "No effect" },
};

const unitColumns: ColDef<Row>[] = [
  { field: "sites", headerName: "Page removed", flex: 2, minWidth: 170, wrapText: true, autoHeight: true },
  { field: "test", headerName: "Test", width: 130 },
  { field: "withoutIt", headerName: "Agent picks without it", flex: 2, minWidth: 170, wrapText: true, autoHeight: true },
  {
    field: "flip",
    headerName: "Choice changed",
    width: 175,
    cellRenderer: (p: ICellRendererParams<Row>) => (p.data ? <FlipBar value={p.data.flip} noise={p.data.noise} /> : null),
  },
  { field: "reasons", headerName: "Looks dishonest because", flex: 3, minWidth: 200, wrapText: true, autoHeight: true },
  {
    field: "role",
    headerName: "Verdict",
    width: 200,
    cellRenderer: (p: ICellRendererParams<Row>) => (p.data ? <Badge tone={ROLE[p.data.role].tone}>{ROLE[p.data.role].label}</Badge> : null),
  },
];

const CONDITION: Record<string, string> = Object.fromEntries(WEBS.map((w) => [w.id, w.label.replace(/^\+ /, "")]));
const verdictCell = (p: ICellRendererParams<BenchRow>) =>
  p.value ? <Badge tone={p.value === "BLOCK" ? "warn" : "ok"}>{p.value === "BLOCK" ? "Blocked" : "Passed"}</Badge> : <span className="sw-muted">—</span>;

const benchColumns: ColDef<BenchRow>[] = [
  { field: "task", headerName: "Product", width: 150 },
  { field: "condition", headerName: "What the agent read", flex: 2, minWidth: 220, valueFormatter: (p) => CONDITION[p.value as string] ?? String(p.value) },
  {
    field: "manipulated",
    headerName: "Manipulated",
    width: 140,
    cellRenderer: (p: ICellRendererParams<BenchRow>) =>
      p.data && (p.data.manipulated || p.data.steered) ? <Badge tone="amber">yes</Badge> : p.data?.target && !["clean", "honest_strong"].includes(p.data.condition) ? <span className="sw-muted">resisted</span> : <span className="sw-muted">—</span>,
  },
  { field: "verdict", headerName: "Sway", width: 120, cellRenderer: verdictCell },
  { field: "attr_only_verdict", headerName: "Attribution only", width: 150, cellRenderer: verdictCell },
  { field: "stability", headerName: "Agreement", width: 130, valueFormatter: (p) => `${Math.round((p.value as number) * 100)}%` },
  { field: "calls", headerName: "Model calls", width: 130 },
];

export function XRay() {
  const [tab, setTab] = useState<"one" | "all">("one");
  const [taskId, setTaskId] = useState("earbuds");
  const [webId, setWebId] = useState("attack_redundant");
  const [search, setSearch] = useState("");
  const { tasks, error: tasksError } = useTasks();
  const web = webId;
  const key = `${taskId}|${web}`;
  const [check, setCheck] = useState<{ key: string; v?: Verdict; error?: string } | null>(null);
  const [evidence, setEvidence] = useState<Evidence | { error: string } | null>(null);

  // The full Sway check for this purchase. Cached runs answer at once; new ones run the agent live.
  useEffect(() => {
    let alive = true;
    request<Verdict>(`/api/xray?task=${encodeURIComponent(taskId)}&condition=${encodeURIComponent(web)}`)
      .then((v) => alive && setCheck({ key, v }))
      .catch((e: Error) => alive && setCheck({ key, error: e.message }));
    return () => {
      alive = false;
    };
  }, [key, taskId, web]);

  useEffect(() => {
    if (tab !== "all" || evidence) return;
    request<Evidence>("/api/evidence")
      .then(setEvidence)
      .catch((e: Error) => setEvidence({ error: e.message }));
  }, [tab, evidence]);

  const v = check?.key === key ? check.v : undefined;
  const checkError = check?.key === key ? check.error : undefined;
  const sc = v?.result;
  const byId = Object.fromEntries((v?.products ?? []).map((p) => [p.id, p]));
  const name = (id: string) => (byId[id] ? `${byId[id].name} · ${money(byId[id].price)}` : id);

  const rows: Row[] = useMemo(() => {
    if (!v || !sc) return [];
    const pages = Object.fromEntries(v.pages.map((p) => [p.id, p]));
    const noise = 1 - sc.stability;
    return sc.xray.map((u) => {
      const ps = u.pages.map((id) => pages[id]).filter(Boolean);
      const reasons = [...new Set(ps.flatMap((p) => p.reasons))];
      return {
        sites: ps.map((p) => host(p.url)).join(" + "),
        test: u.kind === "page" ? "single page" : "pages together",
        withoutIt: u.without_it === sc.chosen ? "No change" : name(u.without_it),
        flip: u.flip_rate,
        noise,
        reasons: reasons.join("; ") || "—",
        role: u.decided && u.suspicious ? "blocker" : u.decided && !reasons.length ? "honest" : reasons.length ? "suspicious" : "none",
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v]);

  const ev = evidence && "main" in evidence ? evidence : null;
  const allRows = useMemo(() => (ev ? [...ev.main, ...ev.subtle] : []), [ev]);

  return (
    <div>
      <div className="sw-toolbar">
        <div className="sw-seg" role="group" aria-label="View">
          <button aria-pressed={tab === "one"} onClick={() => setTab("one")}>
            One purchase
          </button>
          <button aria-pressed={tab === "all"} onClick={() => setTab("all")}>
            Benchmark
          </button>
        </div>
      </div>

      {tab === "one" ? (
        <>
          <div className="sw-toolbar">
            <select className="sw-select" value={taskId} onChange={(e) => setTaskId(e.target.value)} aria-label="Product">
              {(tasks ?? []).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.ask}
                </option>
              ))}
            </select>
            <select className="sw-select" value={web} onChange={(e) => setWebId(e.target.value)} aria-label="What the agent read">
              {WEBS.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.label.replace(/^\+ /, "With ")}
                </option>
              ))}
            </select>
          </div>

          {tasksError && <p className="sw-note" data-tone="amber">{tasksError}</p>}
          {checkError && <p className="sw-note" data-tone="amber">{checkError}</p>}
          {!sc && !checkError && (
            <p className="sw-small sw-muted">Running the Sway check for this purchase… a run that isn&apos;t cached yet calls the agent live and can take a few minutes.</p>
          )}
          {sc && (
          <>
          <div className="sw-grid-4" style={{ marginBottom: "1rem" }}>
            <div className="sw-card">
              <Text as="span" variant="label-medium" className="sw-muted">Agent picked</Text>
              <Text as="p" variant="title-medium" weight="medium" style={{ marginTop: "0.4rem" }}>
                {byId[sc.chosen]?.name ?? sc.chosen}
              </Text>
              <span className="sw-small sw-muted">{byId[sc.chosen] ? money(byId[sc.chosen].price) : ""}</span>
            </div>
            <div className="sw-card">
              <Text as="span" variant="label-medium" className="sw-muted">Agreement across re-runs</Text>
              <p className="sw-stat-figure" style={{ fontSize: "2.25rem", marginTop: "0.4rem" }}>
                {Math.round(sc.stability * 100)}%
              </p>
            </div>
            <div className="sw-card">
              <Text as="span" variant="label-medium" className="sw-muted">Sway</Text>
              <p style={{ marginTop: "0.6rem" }}>
                <Badge tone={sc.verdict === "BLOCK" ? "warn" : "ok"}>{sc.verdict === "BLOCK" ? "Held before capture" : "Captured"}</Badge>
              </p>
              <span className="sw-small sw-muted">{sc.calls} model calls</span>
            </div>
            <div className="sw-card">
              <Text as="span" variant="label-medium" className="sw-muted">Attribution alone</Text>
              <p style={{ marginTop: "0.6rem" }}>
                <Badge tone={sc.attr_only_verdict === sc.verdict ? "muted" : "amber"}>{sc.attr_only_verdict === "BLOCK" ? "Would block" : "Would pass"}</Badge>
              </p>
              <span className="sw-small sw-muted">{sc.attr_only_verdict !== sc.verdict ? "a false alarm Sway avoids" : "same as Sway"}</span>
            </div>
          </div>

          <div className="sw-card-soft" style={{ marginBottom: "1rem" }}>
            <Text as="p" variant="body-large">
              “{v!.sentence}”
            </Text>
          </div>

          <SwayGrid<Row>
            rows={rows}
            columns={unitColumns}
            rowClassRules={{ "sw-row-blocker": (p) => p.data?.role === "blocker", "sw-row-honest": (p) => p.data?.role === "honest" }}
          />
          <p className="sw-small sw-muted" style={{ marginTop: "0.75rem" }}>
            The orange tick marks the agent&apos;s normal run-to-run wobble. A page counts as deciding only when it clears that clearly.
          </p>
          </>
          )}
        </>
      ) : (
        <>
          <div className="sw-toolbar">
            <input className="sw-search" type="search" placeholder="Search runs" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search runs" />
            <span className="sw-small sw-muted">
              {ev
                ? `${allRows.length} benchmark purchases across ${new Set(allRows.map((r) => r.task)).size} products · every test repeated ${ev.k ?? "?"} times`
                : evidence
                  ? ""
                  : "Loading the benchmark results…"}
            </span>
          </div>
          {evidence && "error" in evidence && <p className="sw-note" data-tone="amber">{evidence.error}</p>}
          <SwayGrid<BenchRow> rows={allRows} columns={benchColumns} search={search} height={640} />
        </>
      )}
    </div>
  );
}
