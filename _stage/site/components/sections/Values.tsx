import type { CSSProperties, ReactNode } from "react";
import { Card, Fade, IntroText, SectionLabel } from "@/components/kit";
import { RevealGroup } from "@/components/RevealGroup";

const ICONS: { w: number; d: string }[] = [
  // A speech bubble: one plain sentence.
  { w: 100, d: "M10 8H90A10 10 0 0 1 100 18V68A10 10 0 0 1 90 78H42L18 98V78H10A10 10 0 0 1 0 68V18A10 10 0 0 1 10 8Z" },
  // A shield: two keys before anything is stopped.
  {
    w: 89.9766,
    d: "M44.99 0C46.03 0.36 47.11 0.73 48.23 1.08C49.36 1.43 50.52 1.78 51.73 2.11C58.98 4.12 67.7 5.68 77.59 5.77C82.04 5.81 86.18 5.54 89.98 5.1V36.78C89.98 53.29 82.61 68.93 69.88 79.44L44.99 100L20.1 79.44C7.37 68.93 8.78e-05 53.29 0 36.78V5.1C3.79 5.54 7.94 5.81 12.39 5.77C25.57 5.66 36.69 2.91 44.99 0Z",
  },
  // Three bars: measured, with the limits shown.
  { w: 100, d: "M0 58H24V100H0Z M38 28H62V100H38Z M76 0H100V100H76Z" },
];

function Cell({ i, title, children }: { i: number; title: string; children: ReactNode }) {
  return (
    <li className="values-module__Eh0jOW__cell">
      <RevealGroup className="values-module__Eh0jOW__cellContent">
        <div className="reveal-module__nuDBzW__root reveal-module__nuDBzW__fade-up values-module__Eh0jOW__iconFrame" style={{ "--stagger": i } as CSSProperties}>
          <svg className="values-module__Eh0jOW__icon" width={ICONS[i].w} height={100} viewBox={`0 0 ${ICONS[i].w} 100`} fill="none" aria-hidden="true">
            <path d={ICONS[i].d} fill="currentColor" />
          </svg>
        </div>
        <Fade n={i + 1} up>
          <Card title={title}>{children}</Card>
        </Fade>
      </RevealGroup>
    </li>
  );
}

/** Principles: calm, two keys, honest numbers. */
export default function Values() {
  return (
    <section id="values" className="section-shell-module__wD-FXq__root">
      <div className="container-module__fR7GYG__root container-module__fR7GYG__full section-shell-module__wD-FXq__inner section-shell-module__wD-FXq__full values-module__Eh0jOW__root">
        <RevealGroup>
          <div className="section-intro-module__A3g2Mq__root">
            <Fade n={0}>
              <SectionLabel bold>Principles</SectionLabel>
            </Fade>
            <IntroText title="Quiet when it’s fine. Clear when it’s not." />
          </div>
        </RevealGroup>
        <ul className="values-module__Eh0jOW__grid">
          <Cell i={0} title="Calm for shoppers">
            No dashboards for the person buying. When something is wrong they get one plain sentence and a choice: switch, or keep their pick.
          </Cell>
          <Cell i={1} title="Two keys, not one">
            A page has to decide the purchase and look dishonest. An honest review is allowed to change the agent’s mind, and Sway lets it.
          </Cell>
          <Cell i={2} title="Honest numbers">
            Built on ContextCite, TracLLM and AttriGuard, and credited. Plain fake reviews still get through, and we say so.
          </Cell>
        </ul>
      </div>
    </section>
  );
}
