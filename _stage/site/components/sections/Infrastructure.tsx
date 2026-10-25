import type { CSSProperties } from "react";
import { Fade, SectionLabel, Words } from "@/components/kit";
import { WipeButton } from "@/components/WipeButton";

/** Evidence: the benchmark numbers (switches the page to dark). */
export default function Infrastructure() {
  return (
    <section id="infrastructure" className="section-shell-module__wD-FXq__root">
      <div className="container-module__fR7GYG__root container-module__fR7GYG__full section-shell-module__wD-FXq__inner section-shell-module__wD-FXq__full infrastructure-module__q_XuuG__root">
        <div className="section-intro-module__A3g2Mq__root section-intro-module__A3g2Mq__center infrastructure-module__q_XuuG__intro">
          <Fade n={0}>
            <SectionLabel>Evidence</SectionLabel>
          </Fade>
          <div className="section-intro-module__A3g2Mq__text">
            <h2 className="text-module__DYGPWq__root text-module__DYGPWq__display-fluid text-module__DYGPWq__weight-medium section-intro-module__A3g2Mq__title">
              <Words text="17 steered purchases. 17 held before payment." from={1} />
            </h2>
            <p className="text-module__DYGPWq__root text-module__DYGPWq__body-large text-module__DYGPWq__color-foreground-50 section-intro-module__A3g2Mq__body">
              <span className="reveal-module__nuDBzW__root reveal-module__nuDBzW__fade" style={{ "--stagger": 5 } as CSSProperties}>
                Eight shopping tasks with real Channel3 products, every test repeated five times, one model (Claude Haiku). Planted pages steered the agent in 17 of 24
                runs. Sway held all 17, named the planted page every time, and raised no false alarm on 16 honest purchases. Blocking on attribution alone would have
                wrongly stopped 13 of those 16. Baseline agreement across repeats averaged 0.78 (worst task 0.40), so every effect is read against the agent's own noise.
              </span>
            </p>
            <Fade n={6} up>
              <div className="infrastructure-module__q_XuuG__actions">
                <WipeButton className="infrastructure-module__q_XuuG__cta" href="/evidence">
                  See the evidence
                </WipeButton>
                <WipeButton className="infrastructure-module__q_XuuG__cta" href="/try">
                  Try it yourself
                </WipeButton>
              </div>
            </Fade>
          </div>
        </div>
      </div>
    </section>
  );
}
