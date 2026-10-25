// Publisher directory: hostname → PayPal receiver email + per-publisher payout rate.
// Seeded with two sandbox entries so Payouts can run end-to-end without
// a Partner Referrals round-trip; /api/publishers/onboard appends rows
// after the callback.

import { promises as fs } from "node:fs";
import path from "node:path";

const PUBLISHERS = path.join(process.cwd(), "..", "data", "publishers.json");

export type Publisher = {
  paypalEmail: string;
  payoutRate: number;
  onboardedAt: string;
  source: "seed" | "partner-referrals";
  referralId?: string;
};

export type PublisherDirectory = {
  notes?: string;
  publishers: Record<string, Publisher>;
};

let queue = Promise.resolve<PublisherDirectory>({ publishers: {} });

async function readDirect(): Promise<PublisherDirectory> {
  try {
    const text = await fs.readFile(PUBLISHERS, "utf8");
    const parsed = JSON.parse(text) as PublisherDirectory;
    return parsed.publishers ? parsed : { publishers: {} };
  } catch {
    return { publishers: {} };
  }
}

export const readPublishers = () => queue.then(() => readDirect());

/** Insert or update a publisher row, serialised like the ledger upsert. */
export function upsertPublisher(host: string, patch: Partial<Publisher>): Promise<Publisher> {
  const run = queue.then(async () => {
    const dir = await readDirect();
    const existing = dir.publishers[host];
    const next: Publisher = {
      paypalEmail: patch.paypalEmail ?? existing?.paypalEmail ?? "",
      payoutRate: patch.payoutRate ?? existing?.payoutRate ?? 0.02,
      onboardedAt: patch.onboardedAt ?? existing?.onboardedAt ?? new Date().toISOString().slice(0, 10),
      source: patch.source ?? existing?.source ?? "partner-referrals",
      referralId: patch.referralId ?? existing?.referralId,
    };
    dir.publishers[host] = next;
    await fs.mkdir(path.dirname(PUBLISHERS), { recursive: true });
    await fs.writeFile(PUBLISHERS, JSON.stringify(dir, null, 2));
    return next;
  });
  queue = run.then(
    (p) => ({ publishers: { [host]: p } }),
    () => ({ publishers: {} }),
  );
  return run;
}

export async function resolvePublisher(hosts: string[]): Promise<{ host: string; publisher: Publisher } | null> {
  const dir = await readPublishers();
  for (const h of hosts) {
    const p = dir.publishers[h];
    if (p && p.paypalEmail) return { host: h, publisher: p };
  }
  return null;
}
