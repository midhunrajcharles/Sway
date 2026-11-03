import type { Metadata } from "next";
import { InnerPage } from "@/components/InnerPage";
import { Ops } from "./ops";

export const metadata: Metadata = { title: "Risk dashboard" };

export default function OpsPage() {
  return (
    <InnerPage
      eyebrow="Risk dashboard"
      title="Every agent purchase, and who moved it."
      lede="For a merchant or a payments risk team: each purchase an agent made, what Sway decided, and which websites keep deciding blocked buys."
    >
      <div className="sw-section">
        <Ops />
      </div>
    </InnerPage>
  );
}
