import type { Metadata } from "next";
import { InnerPage } from "@/components/InnerPage";
import { XRay } from "./xray";

export const metadata: Metadata = { title: "Purchase x-ray" };

export default function XRayPage() {
  return (
    <InnerPage
      eyebrow="Purchase x-ray"
      title="Why did the agent buy it?"
      lede="Sway removes each page the agent read and asks again. If the choice changes beyond the agent's normal wobble, that page decided the purchase. It's blocked only if that page also looks dishonest. An honest page is allowed to change the agent's mind."
    >
      <div className="sw-section">
        <XRay />
      </div>
    </InnerPage>
  );
}
