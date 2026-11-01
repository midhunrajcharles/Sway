import { EntryOverlay } from "@/components/EntryOverlay";
import { HeaderTone } from "@/components/HeaderTone";
import Capabilities from "@/components/sections/Capabilities";
import Hero from "@/components/sections/Hero";
import Infrastructure from "@/components/sections/Infrastructure";
import ProprietaryInvestments from "@/components/sections/ProprietaryInvestments";
import Values from "@/components/sections/Values";
import { SwirlBackdrop } from "@/components/SwirlBackdrop";
import { ThemeScroll } from "@/components/ThemeScroll";
import { homeAnchors } from "@/lib/routes";
import { organizationJsonLd, websiteJsonLd } from "@/lib/structured-data";

export default function Home() {
  return (
    <>
      <main className="page-shell-module__L3Btcq__root page-shell-module__L3Btcq__bleed">
        <HeaderTone />
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <Hero />
        {/* One swirl canvas sits behind these three sections and morphs as you scroll. */}
        <div className="styles-module__8sPksG__swirlBand" data-swirl-band>
          <div className="styles-module__8sPksG__swirlLayer" aria-hidden="true">
            <SwirlBackdrop />
          </div>
          <Capabilities />
          <ProprietaryInvestments />
          <Infrastructure />
        </div>
        <Values />
        <ThemeScroll targetId={homeAnchors.infrastructure} />
      </main>
      <EntryOverlay />
    </>
  );
}
