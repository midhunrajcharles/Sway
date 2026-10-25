import { Card, Fade, IntroText, SectionLabel } from "@/components/kit";
import { RevealGroup } from "@/components/RevealGroup";

/** How it works: hold, re-run, judge, capture or void. */
export default function Capabilities() {
  return (
    <section id="capabilities" className="section-shell-module__wD-FXq__root">
      <div className="container-module__fR7GYG__root container-module__fR7GYG__full section-shell-module__wD-FXq__inner section-shell-module__wD-FXq__full capabilities-module__3LfQ_G__root">
        <RevealGroup>
          <Fade n={0}>
            <SectionLabel>How it works</SectionLabel>
          </Fade>
        </RevealGroup>
        <RevealGroup className="capabilities-module__3LfQ_G__intro">
          <div className="section-intro-module__A3g2Mq__root">
            <IntroText
              title="A second look before PayPal takes the money"
              body="When an AI agent shops for you, it reads reviews, guides and deal pages, and any of them can be planted. Sway asks which page actually made the choice, and whether that page can be trusted, while the payment is still only on hold."
            />
          </div>
        </RevealGroup>
        <div className="capabilities-module__3LfQ_G__grid">
          <RevealGroup className="capabilities-module__3LfQ_G__list">
            <Fade n={0} up>
              <Card title="Hold">PayPal authorizes the payment. The money is reserved, nothing is captured yet.</Card>
            </Fade>
            <Fade n={1} up>
              <Card title="Re-run">The agent makes its decision again without each page it read, five times each, so ordinary randomness can&apos;t pass for a cause.</Card>
            </Fade>
            <Fade n={2} up>
              <Card title="Judge">
                A page stops the purchase only if it decided it and it looks dishonest: hidden text, orders aimed at AI, or claims the Channel3 catalog says are false.
              </Card>
            </Fade>
            <Fade n={3} up>
              <Card title="Capture or void">Honest decision: PayPal captures. Planted one: the shopper gets one plain sentence and the pick they would have made without it.</Card>
            </Fade>
          </RevealGroup>
        </div>
      </div>
    </section>
  );
}
