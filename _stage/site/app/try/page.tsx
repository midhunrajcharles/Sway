import type { Metadata } from "next";
import { InnerPage } from "@/components/InnerPage";
import { TryDemo } from "./try-demo";

export const metadata: Metadata = { title: "Try Sway" };

export default function TryPage() {
  return (
    <InnerPage
      eyebrow="Try it"
      title="Watch Sway catch a planted page."
      lede="Pick what you need and what the agent reads on the web. Approve the payment once, then see whether Sway lets it through, and why. Every run is live: the agent shops real Channel3 products, PayPal holds the money, and Sway re-runs the agent before anything is captured."
    >
      <div className="sw-section">
        <TryDemo />
      </div>
    </InnerPage>
  );
}
