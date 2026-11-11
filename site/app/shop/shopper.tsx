"use client";

// The shopper's screen: one quiet conversation. Ask (type or speak), approve once in PayPal,
// and Sway only speaks when a planted page decided the purchase.
// "Test scenario" picks which test web the Sway API puts in front of the agent; every run is live.

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { EnvBadge } from "@/components/EnvBadge";
import { PayPalButton } from "@/components/PayPalButton";
import { Text } from "@/components/Text";
import { host, request, WEBS, type Resolved, type Task } from "@/lib/sway";
import { useShopFlow, useTasks } from "@/lib/use-shop-flow";

const SUGGESTIONS = ["running-shoes", "earbuds", "coffee-grinder", "carry-on"];

/** Fallback when the Sway API predates /api/resolve: map the words onto a benchmark task. */

function matchTask(tasks: Task[], text: string): Task | undefined {
  const words = new Set(text.toLowerCase().match(/[a-z]+/g) ?? []);
  let best: Task | undefined;
  let score = 0;
  for (const t of tasks) {
    const s = `${t.ask} ${t.id.replace("-", " ")}`.toLowerCase().match(/[a-z]+/g)!.filter((w) => w.length > 3 && words.has(w)).length;
    if (s > score) [best, score] = [t, s];
  }
  return best;
}

// Web Speech API, where the browser has it.
type Recognition = { lang: string; start(): void; onresult: (e: { results: { 0: { transcript: string } }[] }) => void; onend: () => void };
const recognitionCtor = (): (new () => Recognition) | undefined =>
  typeof window === "undefined"
    ? undefined
    : (((window as unknown as Record<string, unknown>).SpeechRecognition ?? (window as unknown as Record<string, unknown>).webkitSpeechRecognition) as
        | (new () => Recognition)
        | undefined);
const noSubscribe = () => () => {};

export function Shopper() {
  const { tasks, error: tasksError } = useTasks();
  const [taskId, setTaskId] = useState<string | null>(null);
  // A task resolved from the shopper's own words, with real Channel3 products (not one of the presets).
  const [liveTask, setLiveTask] = useState<Task | null>(null);
  const task = liveTask ?? tasks?.find((t) => t.id === taskId) ?? tasks?.[0];
  const [resolving, setResolving] = useState<string | null>(null);
  const [webId, setWebId] = useState("deceptive_visible");
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [speakOn, setSpeakOn] = useState(false);
  const [settings, setSettings] = useState(false);
  const [miss, setMiss] = useState<{ text: string; reason?: string } | null>(null);
  const hasMic = useSyncExternalStore(noSubscribe, () => !!recognitionCtor(), () => false);
  const web = webId;
  const f = useShopFlow(task, web);
  const endRef = useRef<HTMLDivElement>(null);
  const spoken = useRef(0);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    const last = f.events[f.events.length - 1];
    if (speakOn && last && last.who !== "you" && last.tone !== "busy" && spoken.current !== last.id && window.speechSynthesis) {
      spoken.current = last.id;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(last.text));
    }
  }, [f.events, f.phase, speakOn]);

  async function ask(text: string) {
    if (!text.trim() || f.busy || resolving || !tasks) return;
    setInput("");
    setMiss(null);
    setResolving(text);
    try {
      const r = await request<Resolved>("/api/shop/resolve", { text });
      setLiveTask(r.live ? r.task : null);
      if (!r.live) setTaskId(r.task.id);
      setPending(text);
    } catch (e) {
      const reason = (e as Error).message;
      const t = reason === "not found" ? matchTask(tasks, text) : undefined;
      if (t) {
        setLiveTask(null);
        setTaskId(t.id);
        setPending(text);
      } else {
        setMiss({ text, reason: reason === "not found" ? undefined : reason });
      }
    } finally {
      setResolving(null);
    }
  }

  // Start once the chosen task is in place, so the agent shops for the right thing.
  const [pending, setPending] = useState<string | null>(null);
  const start = f.start;
  useEffect(() => {
    if (pending === null) return;
    setPending(null);
    start(pending);
  }, [pending, start]);

  function listen() {
    const Ctor = recognitionCtor();
    if (!Ctor) return;
    const r = new Ctor();
    r.lang = "en-US";
    r.onresult = (e) => ask(e.results[0][0].transcript);
    r.onend = () => setListening(false);
    setListening(true);
    setSpeakOn(true);
    r.start();
  }

  const empty = f.events.length === 0;

  return (
    <div className="sw-chat">
      <div className="sw-chat-head">
        <div>
          <div className="sw-title-row">
            <Text as="h1" variant="title-large" weight="medium">
              Your shopping assistant
            </Text>
            <EnvBadge />
          </div>
          <span className="sw-small sw-muted">Every purchase is checked by Sway before payment</span>
        </div>
        <div className="sw-actions">
          <button className="sw-icon-btn" aria-expanded={settings} onClick={() => setSettings((s) => !s)} aria-label="Test scenarios">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 7h10M18 7h2M4 17h4M12 17h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <circle cx="16" cy="7" r="2" stroke="currentColor" strokeWidth="1.8" />
              <circle cx="10" cy="17" r="2" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          </button>
          {!empty && (
            <button className="sw-icon-btn" onClick={f.reset} aria-label="New conversation">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {settings && (
        <div className="sw-popover">
          <Text as="p" variant="label-medium" weight="medium" className="sw-muted">
            Test scenario · what the assistant finds on the web
          </Text>
          <div className="sw-chips" style={{ marginTop: "0.75rem" }}>
            {WEBS.map((w) => (
              <button
                key={w.id}
                className="sw-chip"
                data-kind={w.kind}
                aria-pressed={w.id === web}
                disabled={f.busy}
                onClick={() => setWebId(w.id)}
              >
                {w.label}
              </button>
            ))}
          </div>
          <p className="sw-small sw-muted" style={{ marginTop: "0.75rem" }}>
            {WEBS.find((w) => w.id === web)?.detail}
          </p>
          <label className="sw-small sw-toggle">
            <input type="checkbox" checked={speakOn} onChange={(e) => setSpeakOn(e.target.checked)} /> Read replies aloud
          </label>
        </div>
      )}

      <div className="sw-chat-body" aria-live="polite">
        {empty ? (
          <div className="sw-chat-empty">
            <Text as="p" variant="display-small" weight="medium">
              What do you need?
            </Text>
            <Text as="p" variant="body-large" className="sw-muted" style={{ marginTop: "0.75rem" }}>
              Tell me what you're looking for. I'll find the best option, you approve once, and Sway makes sure nothing on the web tricked me into it.
            </Text>
            {tasksError && (
              <p className="sw-note" data-tone="amber" style={{ marginTop: "1rem" }}>
                {tasksError}
              </p>
            )}
            {resolving && (
              <p className="sw-small sw-muted" style={{ marginTop: "1rem" }} role="status">
                Searching the catalog for “{resolving}”…
              </p>
            )}
            {miss && (
              <p className="sw-small" style={{ marginTop: "1rem" }}>
                {miss.reason ?? `I can't shop for “${miss.text}” yet.`} Or try one of these:
              </p>
            )}
            <div className="sw-chips" style={{ justifyContent: "center", marginTop: "1.75rem" }}>
              {(tasks ?? []).filter((t) => miss || SUGGESTIONS.includes(t.id)).map((t) => (
                <button key={t.id} className="sw-chip" disabled={!!resolving} onClick={() => ask(`I need ${t.ask}`)}>
                  {t.ask}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="sw-thread">
            {f.events.map((e) =>
              e.who === "paypal" ? (
                <p key={e.id} className="sw-sys">
                  <span className="sw-pp">PayPal</span> {e.text}
                </p>
              ) : e.who === "sway" ? (
                <div key={e.id} className="sw-verdict" data-tone={e.tone}>
                  <span className="sw-verdict-mark" aria-hidden="true">
                    <svg viewBox="0 0 300 180" width="22" height="13">
                      <path d="M35 0H165A35 35 0 0 1 165 70H35A35 35 0 0 1 35 0Z M135 110H265A35 35 0 0 1 265 180H135A35 35 0 0 1 135 110Z" fill="currentColor" />
                    </svg>
                    Sway
                  </span>
                  <p>{e.text}</p>
                  {e.progress && (
                    <div className="sw-progress">
                      <span style={{ width: `${f.progress * 100}%` }} />
                    </div>
                  )}
                </div>
              ) : (
                <div key={e.id} className={e.who === "you" ? "sw-msg sw-msg-you" : "sw-msg sw-msg-agent"}>
                  {e.tone === "busy" ? (
                    <span className="sw-typing" aria-label={e.text}>
                      <i />
                      <i />
                      <i />
                    </span>
                  ) : (
                    <>
                      {e.text}
                      {e.pages && (
                        <span className="sw-sources">
                          {e.pages.map((p) => (
                            <span key={p.id} className="sw-source" data-planted={f.revealed && p.planted ? "" : undefined}>
                              {host(p.url)}
                            </span>
                          ))}
                        </span>
                      )}
                    </>
                  )}
                </div>
              ),
            )}
            {(f.phase === "approve" || f.phase === "approve-alt") && (
              <div className="sw-inline-actions">
                <PayPalButton clientId={f.paypalClientId} createOrder={f.createOrder} onApprove={f.approved} onError={f.fail} />
              </div>
            )}
            {f.phase === "decide" && (
              <div className="sw-inline-actions">
                {f.alt && (
                  <button className="sw-btn" onClick={() => f.decide("switch")}>
                    Yes, switch
                  </button>
                )}
                <button className="sw-btn sw-btn-ghost" onClick={() => f.decide("keep")}>
                  Keep mine
                </button>
              </div>
            )}
            {f.note && (
              <p className="sw-note" data-tone={f.note.tone}>
                {f.note.text}
              </p>
            )}
            {f.phase === "done" && f.revealed && !liveTask && (
              <div className="sw-inline-actions">
                <Link className="sw-link sw-small" href="/xray">
                  See why in the x-ray →
                </Link>
              </div>
            )}
            <div ref={endRef} className="sw-end" />
          </div>
        )}
      </div>

      <form
        className="sw-composer"
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={!tasks ? "Connecting to Sway…" : resolving ? "Searching the catalog…" : f.busy ? "Your agent is working…" : "I need running shoes for daily training"}
          aria-label="What do you need?"
          disabled={f.busy || !!resolving || !tasks}
        />
        {hasMic && (
          <button type="button" className="sw-icon-btn" data-active={listening || undefined} onClick={listen} aria-label="Speak your request" disabled={f.busy || !!resolving}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="9" y="3" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="1.8" />
              <path d="M5 11a7 7 0 0 0 14 0M12 18v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        )}
        <button className="sw-send" aria-label="Send" disabled={f.busy || !!resolving || !input.trim()}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 19V5M6 11l6-6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </form>
    </div>
  );
}
