import { Fragment, type CSSProperties, type ReactNode } from "react";

// Small helpers that emit the design's own classes, so new copy keeps the original look and motion:
// headings rise one word at a time (`--stagger` increasing), labels and bodies fade.

const stagger = (n: number) => ({ "--stagger": n }) as CSSProperties;

/** One rising span per word, starting at stagger `from`. */
export function Words({ text, from = 0 }: { text: string; from?: number }) {
  const words = text.split(" ");
  return (
    <>
      {words.map((w, i) => (
        <Fragment key={i}>
          <span className="reveal-module__nuDBzW__root reveal-module__nuDBzW__rise reveal-module__nuDBzW__fine" style={stagger(from + i)}>
            {w}
          </span>
          {i < words.length - 1 && " "}
        </Fragment>
      ))}
    </>
  );
}

export function Fade({ n, up, className, children }: { n: number; up?: boolean; className?: string; children: ReactNode }) {
  return (
    <div className={`reveal-module__nuDBzW__root reveal-module__nuDBzW__${up ? "fade-up" : "fade"}${className ? ` ${className}` : ""}`} style={stagger(n)}>
      {children}
    </div>
  );
}

export function SectionLabel({ children, bold }: { children: ReactNode; bold?: boolean }) {
  return (
    <div className="section-label-module__mAQ0IG__root section-label-module__mAQ0IG__divider">
      <span className={`text-module__DYGPWq__root text-module__DYGPWq__label-medium text-module__DYGPWq__weight-${bold ? "bold" : "medium"} section-label-module__mAQ0IG__text`}>
        {children}
      </span>
    </div>
  );
}

export function IntroText({ title, body, from = 1, bodyAt }: { title: string; body?: ReactNode; from?: number; bodyAt?: number }) {
  return (
    <div className="section-intro-module__A3g2Mq__text">
      <h2 className="text-module__DYGPWq__root text-module__DYGPWq__display-fluid text-module__DYGPWq__weight-medium section-intro-module__A3g2Mq__title">
        <Words text={title} from={from} />
      </h2>
      {body && (
        <p className="text-module__DYGPWq__root text-module__DYGPWq__body-large text-module__DYGPWq__color-foreground-50 section-intro-module__A3g2Mq__body">
          <span className="reveal-module__nuDBzW__root reveal-module__nuDBzW__fade" style={stagger(bodyAt ?? from + title.split(" ").length)}>
            {body}
          </span>
        </p>
      )}
    </div>
  );
}

export function Card({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <div className="detail-card-module__oRuUjG__root ruled">
      <h3 className={`text-module__DYGPWq__root text-module__DYGPWq__headline-large text-module__DYGPWq__weight-medium detail-card-module__oRuUjG__title${note ? " detail-card-module__oRuUjG__hasNote" : ""}`}>
        {title}
        {note && (
          <span className="text-module__DYGPWq__root text-module__DYGPWq__label-medium text-module__DYGPWq__weight-medium detail-card-module__oRuUjG__note">{note}</span>
        )}
      </h3>
      <p className="text-module__DYGPWq__root text-module__DYGPWq__body-large text-module__DYGPWq__color-foreground-50 detail-card-module__oRuUjG__body">{children}</p>
    </div>
  );
}

/** Where the working app (shopper, x-ray, ops) runs. */
export const APP_URL = (process.env.NEXT_PUBLIC_SWAY_APP_URL ?? "http://localhost:3200").replace(/\/$/, "");
