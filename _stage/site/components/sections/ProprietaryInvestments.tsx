import { Card, Fade, IntroText, SectionLabel } from "@/components/kit";
import { RevealGroup } from "@/components/RevealGroup";

/** The threat: one page can steer what a shopping agent buys. */
export default function ProprietaryInvestments() {
  return (
    <section id="proprietary-investments" className="section-shell-module__wD-FXq__root">
      <div className="container-module__fR7GYG__root container-module__fR7GYG__full section-shell-module__wD-FXq__inner section-shell-module__wD-FXq__full proprietary-investments-module__ku_iAW__root">
        <RevealGroup className="proprietary-investments-module__ku_iAW__intro">
          <div className="section-intro-module__A3g2Mq__root">
            <Fade n={0}>
              <SectionLabel>The threat</SectionLabel>
            </Fade>
            <IntroText
              title="Agents can be talked into buying"
              body="One web page can change what an AI shopping agent buys, and the shopper never sees that page. The payment still looks perfectly normal."
            />
          </div>
        </RevealGroup>
        <RevealGroup className="proprietary-investments-module__ku_iAW__grid">
          <Fade n={0} up>
            <Card title="41–68% of attacks land">
              StakeBench (arXiv 2606.13385) found that injected seller content steers web shopping agents in 41.67–68.59% of cases. It tested no defences.
            </Card>
          </Fade>
          <Fade n={1} up>
            <Card title="Signed mandates don’t see it">
              A payment mandate proves who approved the amount, not why the agent chose the item. Research on AP2 shows ranking injections pass straight through.
            </Card>
          </Fade>
        </RevealGroup>
      </div>
    </section>
  );
}
