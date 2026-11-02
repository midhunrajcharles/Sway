"use client";

// The /try walkthrough: a live agent purchase step by step, with the x-ray underneath.
// The steps live in lib/use-shop-flow.ts (shared with /shop).

import { useEffect, useRef, useState } from "react";
import { PayPalButton } from "@/components/PayPalButton";
import { Text } from "@/components/Text";
import { host, WEBS } from "@/lib/sway";
import { useShopFlow, useTasks, type FlowEvent } from "@/lib/use-shop-flow";
import { XrayTable } from "./xray-table";

const WHO_DOT: Record<FlowEvent["who"], string> = { you: "You", agent: "AI", paypal: "P", sway: "S" };
const WHO_NAME: Record<FlowEvent["who"], string> = { you: "You", agent: "Shopping assistant", paypal: "PayPal", sway: "Sway" };

export function TryDemo() {
  const { tasks, error: tasksError } = useTasks();
  const [taskId, setTaskId] = useState<string | null>(null);
  const [webId, setWebId] = useState("deceptive_visible");
  const task = tasks?.find((t) => t.id === taskId) ?? tasks?.[0];
  const web = webId;
  const f = useShopFlow(task, web);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (f.events.length) endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [f.events]);

  return (
    <div className="sw-try">
      <div className="sw-try-sticky">
        <div className="sw-card">
          <div className="sw-field">
            <Text as="span" variant="label-medium" weight="medium" className="sw-field-label">
              1 · What do you need?
            </Text>
            <div className="sw-chips">
              {!tasks && !tasksError && <span className="sw-small sw-muted">Loading products from the catalog…</span>}
              {tasksError && (
                <span className="sw-note" data-tone="amber">
                  {tasksError}
                </span>
              )}
              {(tasks ?? []).map((t) => (
                <button key={t.id} className="sw-chip" aria-pressed={t.id === task?.id} disabled={f.busy} onClick={() => setTaskId(t.id)}>
                  {t.ask}
                </button>
              ))}
            </div>
          </div>
          <div className="sw-field">
            <Text as="span" variant="label-medium" weight="medium" className="sw-field-label">
              2 · What does the agent read on the web?
            </Text>
            <div className="sw-chips">
              {WEBS.map((w) => (
                <button
                  key={w.id}
                  className="sw-chip"
                  data-kind={w.kind}
                  aria-pressed={w.id === web}
                  disabled={f.busy}
                  title={w.detail}
                  onClick={() => setWebId(w.id)}
                >
                  {w.label}
                </button>
              ))}
            </div>
            <Text as="p" variant="body-medium" className="sw-muted" style={{ marginTop: "0.75rem" }}>
              {WEBS.find((w) => w.id === web)?.detail}
            </Text>
          </div>
          <div className="sw-field sw-actions">
            <button className="sw-btn" onClick={() => f.start()} disabled={f.busy || !task}>
              {f.phase === "setup" ? "Send the agent shopping" : "Run again"}
            </button>
            {f.phase !== "setup" && (
              <button className="sw-btn sw-btn-ghost" onClick={f.reset}>
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="sw-card-soft" aria-live="polite">
        {f.events.length === 0 ? (
          <div style={{ padding: "2rem 0.25rem" }}>
            <Text as="p" variant="headline-small" weight="medium">
              Your agent is waiting.
            </Text>
            <Text as="p" variant="body-large" className="sw-muted" style={{ marginTop: "0.5rem" }}>
              Choose a product and a web, then send it shopping. Red dots mark webs with a planted page.
            </Text>
          </div>
        ) : (
          <div className="sw-timeline">
            {f.events.map((e) => (
              <div key={e.id} className="sw-event">
                <span className="sw-dot" data-tone={e.tone} aria-hidden="true">
                  {e.tone === "busy" ? "" : WHO_DOT[e.who]}
                </span>
                <div>
                  <Text as="span" variant="label-small" className="sw-muted">
                    {WHO_NAME[e.who]}
                  </Text>
                  <div className="sw-bubble" data-tone={e.who === "sway" && e.tone !== "busy" ? e.tone : undefined} style={{ marginTop: "0.3rem" }}>
                    {e.text}
                    {e.progress && (
                      <div className="sw-progress" aria-label="Sway progress">
                        <span style={{ width: `${f.progress * 100}%` }} />
                      </div>
                    )}
                    {e.pages && (
                      <div className="sw-pages">
                        {e.pages.map((p) => (
                          <div key={p.id} className="sw-pageitem">
                            <span>{host(p.url)}</span>
                            {f.revealed && p.planted && (
                              <span className="sw-badge" data-tone="warn">
                                planted
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {(f.phase === "approve" || f.phase === "approve-alt") && (
              <div className="sw-event">
                <span />
                <div className="sw-actions">
                  <PayPalButton clientId={f.paypalClientId} createOrder={f.createOrder} onApprove={f.approved} onError={f.fail} />
                </div>
              </div>
            )}
            {f.phase === "decide" && (
              <div className="sw-event">
                <span />
                <div className="sw-actions">
                  {f.alt && (
                    <button className="sw-btn" onClick={() => f.decide("switch")}>
                      Yes, switch
                    </button>
                  )}
                  <button className="sw-btn sw-btn-ghost" onClick={() => f.decide("keep")}>
                    Keep mine
                  </button>
                </div>
              </div>
            )}
            {f.note && (
              <div className="sw-event">
                <span />
                <span className="sw-note" data-tone={f.note.tone}>
                  {f.note.text}
                </span>
              </div>
            )}
            <div ref={endRef} />
          </div>
        )}
      </div>

      {f.revealed && f.verdict && (
        <div style={{ gridColumn: "1 / -1" }} className="sw-section">
          <XrayTable verdict={f.verdict} />
        </div>
      )}
    </div>
  );
}
