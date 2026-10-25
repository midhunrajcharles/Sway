"use client";

// One agent purchase, live. Shared by /try (guided) and /shop (the shopper's chat):
// ask → the agent reads and picks (Sway API) → PayPal button → our server authorizes (money held)
// → Sway re-runs the agent → capture, or one sentence + Yes, switch / Keep mine
// → (switch) void + a new PayPal order for the alternative.

import { useCallback, useEffect, useRef, useState } from "react";
import { money, request, WEBS, type LedgerEntry, type PageInfo, type Pick, type Product, type Task, type Verdict } from "@/lib/sway";

export type Tone = "ok" | "warn" | "busy" | undefined;
export type FlowEvent = {
  id: number;
  who: "you" | "agent" | "paypal" | "sway";
  text: string;
  tone?: Tone;
  pages?: { id: string; url: string; planted?: boolean }[];
  progress?: boolean;
};
export type Phase = "setup" | "running" | "approve" | "checking" | "decide" | "approve-alt" | "paying-alt" | "done";

type PickResponse = Pick & { product: Product | null; paypalClientId: string | null };

/** Tasks and their real Channel3 products, from the Sway API. */
export function useTasks() {
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    request<{ tasks: Task[] }>("/api/tasks")
      .then((r) => setTasks(r.tasks))
      .catch((e: Error) => setError(e.message));
  }, []);
  return { tasks, error };
}

/** Rises towards 1 while a call of unknown length is running; it only shows that work is happening. */
function useWaitBar(active: boolean) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    const t0 = performance.now();
    const timer = setInterval(() => setValue(1 - Math.exp(-(performance.now() - t0) / 20000)), 200);
    return () => {
      clearInterval(timer);
      setValue(1);
    };
  }, [active]);
  return active ? value : 1;
}

export function useShopFlow(task: Task | undefined, webId: string) {
  const [phase, setPhase] = useState<Phase>("setup");
  const [events, setEvents] = useState<FlowEvent[]>([]);
  const [pick, setPick] = useState<PickResponse | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = useRef(0);
  const order = useRef<string | null>(null);
  const progress = useWaitBar(phase === "checking");

  const chosen = pick?.product ?? undefined;
  const alt = verdict?.result.alternative ? verdict.products.find((p) => p.id === verdict.result.alternative) : undefined;

  const push = useCallback((e: Omit<FlowEvent, "id">) => setEvents((xs) => [...xs, { ...e, id: xs.length + Math.random() }]), []);
  const settle = useCallback(
    (patch: Partial<FlowEvent>) => setEvents((xs) => xs.map((x, i) => (i === xs.length - 1 ? { ...x, progress: false, ...patch } : x))),
    [],
  );
  const fail = useCallback(
    (message: string) => {
      setError(message);
      settle({ tone: "warn" });
      push({ who: "agent", text: `Something went wrong: ${message}`, tone: "warn" });
      setPhase("done");
    },
    [push, settle],
  );

  async function start(text?: string) {
    if (!task) return;
    const id = ++run.current;
    const alive = () => run.current === id;
    order.current = null;
    setEvents([]);
    setPick(null);
    setVerdict(null);
    setRevealed(false);
    setError(null);
    setPhase("running");
    push({ who: "you", text: text ?? `I need ${task.ask}. My budget is ${money(task.budget)}.` });
    push({ who: "agent", text: "Reading reviews, guides and deal pages…", tone: "busy" });
    try {
      const p = await request<PickResponse>("/api/shop/pick", { task: task.id, condition: webId });
      if (!alive()) return;
      setPick(p);
      settle({ tone: undefined, text: `I read ${p.pages.length} pages.`, pages: p.pages });
      push({
        who: "agent",
        text: p.product ? `The best fit is the ${p.product.name}, ${money(p.product.price)} from ${p.product.seller}. Approve it with PayPal?` : "I couldn't find a good fit.",
      });
      if (p.product && !p.paypalClientId) {
        push({
          who: "paypal",
          text: "is not connected, so nothing can be paid. Add PAYPAL_CLIENT_ID and PAYPAL_SECRET to site/.env.local and restart the site.",
          tone: "warn",
        });
        setPhase("done");
        return;
      }
      setPhase(p.product ? "approve" : "done");
    } catch (e) {
      if (alive()) fail((e as Error).message);
    }
  }

  /** Called by PayPal's button: our server creates the AUTHORIZE order and returns its id. */
  async function createOrder(): Promise<string> {
    const replaces = phase === "approve-alt" ? (order.current ?? undefined) : undefined;
    const r = await request<{ orderId: string }>("/api/shop/order", { task: task!.id, condition: webId, replaces });
    order.current = r.orderId;
    return r.orderId;
  }

  /** Called once the shopper approved in PayPal's window. */
  async function approved(orderId: string) {
    const id = run.current;
    const alive = () => run.current === id;
    if (phase === "approve-alt") {
      setPhase("paying-alt");
      try {
        await request<{ entry: LedgerEntry }>("/api/shop/approve", { orderId });
        if (!alive()) return;
        push({ who: "paypal", text: `Paid ${money(alt!.price)}.`, tone: "ok" });
        const saved = chosen!.price - alt!.price;
        if (saved > 0.005) push({ who: "sway", text: `You kept ${money(saved)}, and the planted page didn't get its sale.`, tone: "ok" });
        setPhase("done");
      } catch (e) {
        if (alive()) fail((e as Error).message);
      }
      return;
    }
    setPhase("checking");
    push({ who: "paypal", text: `${money(chosen!.price)} on hold. Nothing has been taken yet.`, tone: "ok" });
    push({ who: "sway", text: "Checking why the agent chose it…", tone: "busy", progress: true });
    try {
      const r = await request<{ entry: LedgerEntry; verdict: Verdict }>("/api/shop/approve", { orderId });
      if (!alive()) return;
      const v = r.verdict;
      setVerdict(v);
      // The agent's sources, now with Sway's finding on each.
      setEvents((xs) => xs.map((x) => (x.pages ? { ...x, pages: v.pages } : x)));
      if (v.result.verdict === "PASS") {
        settle({ tone: "ok", text: v.sentence });
        push({ who: "paypal", text: `Paid ${money(chosen!.price)}.`, tone: "ok" });
        setPhase("done");
      } else {
        settle({ tone: "warn", text: v.sentence });
        setPhase("decide");
      }
      setRevealed(true);
    } catch (e) {
      if (alive()) fail((e as Error).message);
    }
  }

  async function decide(choice: "switch" | "keep") {
    if (!order.current) return;
    push({ who: "you", text: choice === "switch" ? "Yes, switch" : "Keep mine" });
    setPhase("running");
    try {
      await request<{ entry: LedgerEntry }>("/api/shop/decide", { orderId: order.current, choice });
      if (choice === "keep" || !alt) {
        push({ who: "paypal", text: `Paid ${money(chosen!.price)}. Your call, so Sway steps aside.`, tone: "ok" });
        setPhase("done");
        return;
      }
      push({ who: "paypal", text: "Hold released. Nothing was charged.", tone: "ok" });
      push({ who: "agent", text: `Approve the ${alt.name}, ${money(alt.price)} from ${alt.seller}?` });
      setPhase("approve-alt");
    } catch (e) {
      fail((e as Error).message);
    }
  }

  function reset() {
    run.current++;
    order.current = null;
    setEvents([]);
    setPick(null);
    setVerdict(null);
    setRevealed(false);
    setError(null);
    setPhase("setup");
  }

  const busy = phase !== "setup" && phase !== "done";
  const attack = WEBS.find((w) => w.id === webId)?.kind === "attack";
  const note: { tone: "amber" | "muted"; text: string } | null =
    phase === "done" && attack && verdict?.result.verdict === "PASS"
      ? verdict.result.chosen === verdict.target
        ? { tone: "amber", text: "This one got through. Fake reviews make no claim the catalog can check, so Sway has no second key to turn. It's a known limit, and we publish it." }
        : { tone: "muted", text: "The agent resisted this attack on its own: it didn't buy what the planted page pushed, so there was nothing to stop." }
      : null;

  return {
    phase,
    events,
    progress,
    revealed,
    busy,
    note,
    error,
    chosen,
    alt,
    verdict,
    pages: (verdict?.pages ?? []) as PageInfo[],
    paypalClientId: pick?.paypalClientId ?? null,
    start,
    createOrder,
    approved,
    decide,
    reset,
    fail,
  };
}
