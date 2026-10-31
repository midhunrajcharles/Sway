import { SITE_URL } from "./routes";

export const SITE_DESCRIPTION =
  "Sway checks why an AI shopping agent chose what it is buying, before PayPal captures the payment. If a planted page decided the purchase, the payment is voided and the shopper is offered the honest pick.";

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "@id": `${SITE_URL}#app`,
  name: "Sway",
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  applicationCategory: "FinanceApplication",
};

export const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}#website`,
  name: "Sway",
  url: SITE_URL,
};
