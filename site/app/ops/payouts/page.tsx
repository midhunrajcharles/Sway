import type { Metadata } from "next";
import { InnerPage } from "@/components/InnerPage";
import { PayoutsView } from "./payouts-view";

export const metadata: Metadata = { title: "Payout schedule" };

// Bryntum Scheduler is commercial. It is off unless NEXT_PUBLIC_SWAY_BRYNTUM=1; see docs/bryntum.md.
const ENABLED = process.env.NEXT_PUBLIC_SWAY_BRYNTUM === "1";

export default function PayoutsPage() {
  return (
    <InnerPage eyebrow="Payout schedule" title="Who got paid, and when." lede="Payout batches by publisher over time, from the same ledger as the audit grid.">
      <div className="sw-section">
        {ENABLED ? (
          <PayoutsView />
        ) : (
          <p className="sw-note" role="status">
            The payout scheduler is turned off. It uses Bryntum Scheduler, which needs a licence for public hosting. To switch it on for a local or trial
            demo, set <code>NEXT_PUBLIC_SWAY_BRYNTUM=1</code> and rebuild. Setup is in <code>docs/bryntum.md</code>. The payout batches are still listed in the{" "}
            <a className="ops-link" href="/ops">
              audit ledger
            </a>
            .
          </p>
        )}
      </div>
    </InnerPage>
  );
}
