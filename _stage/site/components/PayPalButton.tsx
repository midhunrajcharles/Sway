"use client";

import { useEffect, useRef, useState } from "react";

// PayPal's own checkout button (JS SDK, intent=authorize). The shopper approves in PayPal's window;
// the order is created and authorized on our server, never in the browser.

type Buttons = { render(el: HTMLElement): Promise<void>; close?(): Promise<void> };
type PayPalSdk = {
  Buttons(o: {
    style?: Record<string, string | number>;
    createOrder(): Promise<string>;
    onApprove(d: { orderID: string }): Promise<void>;
    onCancel?(): void;
    onError(e: unknown): void;
  }): Buttons;
};

const loading = new Map<string, Promise<PayPalSdk>>();

function loadSdk(clientId: string): Promise<PayPalSdk> {
  let p = loading.get(clientId);
  if (!p) {
    p = new Promise<PayPalSdk>((resolve, reject) => {
      const s = document.createElement("script");
      s.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&intent=authorize&currency=USD&components=buttons`;
      s.async = true;
      s.onload = () => {
        const sdk = (window as unknown as { paypal?: PayPalSdk }).paypal;
        if (sdk) resolve(sdk);
        else reject(new Error("PayPal did not load."));
      };
      s.onerror = () => {
        loading.delete(clientId);
        reject(new Error("PayPal could not be reached."));
      };
      document.head.appendChild(s);
    });
    loading.set(clientId, p);
  }
  return p;
}

export function PayPalButton({
  clientId,
  createOrder,
  onApprove,
  onError,
}: {
  clientId: string | null;
  createOrder: () => Promise<string>;
  onApprove: (orderId: string) => void;
  onError: (message: string) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const handlers = useRef({ createOrder, onApprove, onError });
  handlers.current = { createOrder, onApprove, onError };
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!clientId || !box.current) return;
    let buttons: Buttons | undefined;
    let alive = true;
    loadSdk(clientId)
      .then((paypal) => {
        if (!alive || !box.current) return;
        buttons = paypal.Buttons({
          style: { layout: "horizontal", color: "gold", shape: "pill", label: "paypal", tagline: 0, height: 44 },
          createOrder: () => handlers.current.createOrder(),
          onApprove: async (d) => handlers.current.onApprove(d.orderID),
          onError: (e) => handlers.current.onError(e instanceof Error ? e.message : "PayPal reported an error."),
        });
        return buttons.render(box.current).then(() => alive && setReady(true));
      })
      .catch((e: Error) => handlers.current.onError(e.message));
    return () => {
      alive = false;
      buttons?.close?.().catch(() => {});
    };
  }, [clientId]);

  if (!clientId) {
    return (
      <p className="sw-note" data-tone="amber">
        PayPal is not connected, so nothing can be paid. Add <code>PAYPAL_CLIENT_ID</code> and <code>PAYPAL_SECRET</code> to <code>site/.env.local</code>{" "}
        and restart the site.
      </p>
    );
  }
  return (
    <div className="sw-paypal-slot" aria-busy={!ready}>
      <div ref={box} />
      {!ready && <span className="sw-small sw-muted">Loading PayPal…</span>}
    </div>
  );
}
