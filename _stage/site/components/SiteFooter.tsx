import { Symbol } from "@/components/Logo";
import { WipeLink } from "@/components/WipeLink";


/** Site footer: navigation, legal line and the big wordmark. */
export default function SiteFooter() {
  return (
    <footer className="styles-module__a-jQEa__root" data-theme="light">
      <div className="container-module__fR7GYG__root container-module__fR7GYG__full styles-module__a-jQEa__inner">
        <nav className="styles-module__a-jQEa__nav" aria-label="Footer">
          <ul className="styles-module__a-jQEa__primary">
            <li className="text-module__DYGPWq__root text-module__DYGPWq__headline-large">
              <WipeLink className="styles-module__a-jQEa__link" href="/">
                Overview
              </WipeLink>
            </li>
            <li className="text-module__DYGPWq__root text-module__DYGPWq__headline-large">
              <WipeLink className="styles-module__a-jQEa__link" href="/how-it-works">
                How it works
              </WipeLink>
            </li>
            <li className="text-module__DYGPWq__root text-module__DYGPWq__headline-large">
              <WipeLink className="styles-module__a-jQEa__link" href="/evidence">
                Evidence
              </WipeLink>
            </li>
            <li className="text-module__DYGPWq__root text-module__DYGPWq__headline-large">
              <WipeLink className="styles-module__a-jQEa__link" href="/research">
                Research
              </WipeLink>
            </li>
            <li className="text-module__DYGPWq__root text-module__DYGPWq__headline-large">
              <WipeLink className="styles-module__a-jQEa__link" href="/try">
                Try it
              </WipeLink>
            </li>
          </ul>
          <div className="styles-module__a-jQEa__aside">
            <ul className="styles-module__a-jQEa__secondary">
              <li className="text-module__DYGPWq__root text-module__DYGPWq__body-large">
                <WipeLink className="styles-module__a-jQEa__link" href="/shop">
                  Shopping assistant
                </WipeLink>
              </li>
              <li className="text-module__DYGPWq__root text-module__DYGPWq__body-large">
                <WipeLink className="styles-module__a-jQEa__link" href="/xray">
                  Purchase x-ray
                </WipeLink>
              </li>
              <li className="text-module__DYGPWq__root text-module__DYGPWq__body-large">
                <WipeLink className="styles-module__a-jQEa__link" href="/ops">
                  Risk dashboard
                </WipeLink>
              </li>
            </ul>
          </div>
        </nav>
        <div className="styles-module__a-jQEa__legal">
          <p className="text-module__DYGPWq__root text-module__DYGPWq__label-medium">
            Sway checks why an AI agent chose a purchase before the payment is captured. Payments by PayPal; product data by Channel3. PayPal is a trademark of PayPal, Inc. Sway is an independent product and is not affiliated with PayPal.
          </p>
          <ul className="styles-module__a-jQEa__legalRow">
            <li className="text-module__DYGPWq__root text-module__DYGPWq__label-medium">
              © 2026 Sway
            </li>
            <li className="text-module__DYGPWq__root text-module__DYGPWq__label-medium">
              Made for safer agent checkout
            </li>
          </ul>
        </div>
      </div>
      <div className="container-module__fR7GYG__root container-module__fR7GYG__full styles-module__a-jQEa__wordmark">
        <span className="text-module__DYGPWq__root text-module__DYGPWq__display-fluid styles-module__a-jQEa__wordmarkWord">
          Check
        </span>
        <Symbol className="styles-module__a-jQEa__wordmarkSymbol" height="var(--wordmark-symbol-height)" />
        <span className="text-module__DYGPWq__root text-module__DYGPWq__display-fluid styles-module__a-jQEa__wordmarkWord">
          why
        </span>
      </div>
    </footer>
  );
}
