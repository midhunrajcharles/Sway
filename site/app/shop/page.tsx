import type { Metadata } from "next";
import { HeaderTone } from "@/components/HeaderTone";
import { Shopper } from "./shopper";

export const metadata: Metadata = { title: "Shop" };

export default function ShopPage() {
  return (
    <main className="page-shell-module__L3Btcq__root">
      <HeaderTone />
      <Shopper />
    </main>
  );
}
