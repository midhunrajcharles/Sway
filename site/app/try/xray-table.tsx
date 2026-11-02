import { Text } from "@/components/Text";
import { host, money, type Verdict } from "@/lib/sway";

/** Why the agent bought it: each page removed in turn, what it picks without it, and the verdict. */
export function XrayTable({ verdict: v }: { verdict: Verdict }) {
  const sc = v.result;
  const byId = Object.fromEntries(v.products.map((p) => [p.id, p]));
  const pageById = Object.fromEntries(v.pages.map((p) => [p.id, p]));
  const noise = 1 - sc.stability;
  const name = (id: string) => (byId[id] ? `${byId[id].name} · ${money(byId[id].price)}` : id);
  const rows = sc.xray.map((u) => {
    const pages = u.pages.map((id) => pageById[id]).filter(Boolean);
    const reasons = [...new Set(pages.flatMap((p) => p.reasons))];
    const role = u.decided && u.suspicious ? "blocker" : u.decided && !reasons.length ? "honest" : reasons.length ? "suspicious" : "none";
    return { u, pages, reasons, role };
  });

  return (
    <div>
      <div className="sw-section-head">
        <Text as="span" variant="label-medium" weight="medium" className="sw-muted">
          The x-ray
        </Text>
        <Text as="h2" variant="headline-large" weight="medium">
          Why the agent bought it
        </Text>
        <Text as="p" variant="body-large" className="sw-muted">
          Sway removed each page and asked the agent again, {Math.round(sc.calls / (sc.xray.length + 1))} times each. The bar shows how often the choice changed;
          the orange tick is the agent&apos;s normal run-to-run wobble ({Math.round(noise * 100)}%). Only a page that clearly decided it <em>and</em> looks
          dishonest is blocked.
        </Text>
      </div>

      <div className="sw-grid-3" style={{ marginBottom: "1rem" }}>
        <div className="sw-card">
          <Text as="span" variant="label-medium" className="sw-muted">
            Agent picked
          </Text>
          <Text as="p" variant="title-medium" weight="medium" style={{ marginTop: "0.4rem" }}>
            {name(sc.chosen)}
          </Text>
        </div>
        <div className="sw-card">
          <Text as="span" variant="label-medium" className="sw-muted">
            Sway
          </Text>
          <p style={{ marginTop: "0.5rem" }}>
            <span className="sw-badge" data-tone={sc.verdict === "BLOCK" ? "warn" : "ok"}>
              {sc.verdict === "BLOCK" ? "Held: planted page decided it" : "Captured"}
            </span>
          </p>
        </div>
        <div className="sw-card">
          <Text as="span" variant="label-medium" className="sw-muted">
            Attribution alone would have
          </Text>
          <p style={{ marginTop: "0.5rem" }}>
            <span className="sw-badge" data-tone={sc.attr_only_verdict === sc.verdict ? "muted" : "amber"}>
              {sc.attr_only_verdict === "BLOCK" ? "blocked it" : "let it through"}
              {sc.attr_only_verdict !== sc.verdict && sc.verdict === "PASS" ? " (a false alarm)" : ""}
            </span>
          </p>
        </div>
      </div>

      <div className="sw-table-wrap">
        <table className="sw-table">
          <thead>
            <tr>
              <th>Page(s) removed</th>
              <th>Agent picks without it</th>
              <th>Choice changed</th>
              <th>Looks dishonest because</th>
              <th>Verdict</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ u, pages, reasons, role }) => (
              <tr key={u.unit} data-role={role}>
                <td>
                  {pages.map((p) => host(p.url)).join(" + ")}
                  {u.kind !== "page" && (
                    <div className="sw-small sw-muted">{u.kind === "suspicious-group" ? "tested together" : "near-duplicates, tested together"}</div>
                  )}
                </td>
                <td>{u.without_it === sc.chosen ? <span className="sw-muted">no change</span> : name(u.without_it)}</td>
                <td>
                  <div className="sw-flip">
                    <div className="sw-flip-track">
                      <div className="sw-flip-fill" style={{ width: `${u.flip_rate * 100}%` }} />
                      <div className="sw-flip-noise" style={{ left: `${noise * 100}%` }} />
                    </div>
                    <span className="sw-num">{Math.round(u.flip_rate * 100)}%</span>
                  </div>
                </td>
                <td>{reasons.length ? reasons.join("; ") : <span className="sw-muted">—</span>}</td>
                <td>
                  {role === "blocker" && <span className="sw-badge" data-tone="warn">decided it · planted</span>}
                  {role === "honest" && <span className="sw-badge" data-tone="ok">decided it · trustworthy</span>}
                  {role === "suspicious" && <span className="sw-badge" data-tone="amber">suspicious, no effect</span>}
                  {role === "none" && <span className="sw-badge" data-tone="muted">no effect</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <details className="sw-card-soft" style={{ marginTop: "1rem" }}>
        <summary style={{ cursor: "pointer" }}>
          <Text as="span" variant="body-large" weight="medium">
            Read the pages the agent saw
          </Text>
          <span className="sw-small sw-muted"> · as the agent reads them, hidden text included</span>
        </summary>
        <div className="sw-grid-2" style={{ marginTop: "1rem" }}>
          {v.pages.map((p) => (
            <div key={p.id} className="sw-card">
              <div className="sw-actions" style={{ justifyContent: "space-between" }}>
                <Text as="span" variant="label-large" weight="medium">
                  {host(p.url)}
                </Text>
                {p.planted && <span className="sw-badge" data-tone="warn">planted</span>}
              </div>
              <p className="sw-small sw-muted" style={{ marginTop: "0.6rem" }}>
                {p.excerpt}
                {p.excerpt.length >= 420 ? "…" : ""}
              </p>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
