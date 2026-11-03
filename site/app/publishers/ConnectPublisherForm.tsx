"use client";

import { useState } from "react";
import { Text } from "@/components/Text";
import { WipeButton } from "@/components/WipeButton";
import { request } from "@/lib/sway";

type Response = { actionUrl: string; referralId: string };

export function ConnectPublisherForm() {
  const [host, setHost] = useState("");
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Response | null>(null);

  async function submit() {
    if (pending) return;
    setPending(true);
    setError(null);
    setResult(null);
    try {
      const r = await request<Response>("/api/publishers/onboard", {
        host: host.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, ""),
        publisherEmail: email.trim() || undefined,
      });
      setResult(r);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
className="sw-card" style={{ display: "grid", gap: "1rem" }}>
      <label className="sw-small">
        <Text as="span" variant="body-large" weight="medium">Your site (host only)</Text>
        <input
          required
          placeholder="longformreviews.net"
          value={host}
          onChange={(e) => setHost(e.target.value)}
          style={{ width: "100%", padding: "0.6rem 0.8rem", marginTop: "0.4rem", borderRadius: 8, border: "1px solid #333", background: "transparent", color: "inherit" }}
        />
      </label>
      <label className="sw-small">
        <Text as="span" variant="body-large" weight="medium">PayPal receiver email</Text>
        <input
          type="email"
          placeholder="payouts@yourdomain.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", padding: "0.6rem 0.8rem", marginTop: "0.4rem", borderRadius: 8, border: "1px solid #333", background: "transparent", color: "inherit" }}
        />
      </label>
      <div className="sw-actions">
        <WipeButton onClick={() => void submit()}>
          {pending ? "Creating referral…" : "Connect PayPal"}
        </WipeButton>
      </div>
      {error && (
        <p className="sw-note" data-tone="amber">
          {error}
        </p>
      )}
      {result && (
        <p className="sw-small sw-muted">
          Referral created ({result.referralId}). <a href={result.actionUrl}>Open PayPal to approve →</a>
        </p>
      )}
    </form>
  );
}
