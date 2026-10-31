export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3300").replace(/\/$/, "");

export const routes = {
  home: "/",
  howItWorks: "/how-it-works",
  evidence: "/evidence",
  research: "/research",
  tryIt: "/try",
};

export const homeAnchors = {
  capabilities: "capabilities",
  proprietaryInvestments: "proprietary-investments",
  infrastructure: "infrastructure",
  values: "values",
};

export function siteUrl(path: string) {
  return /^https?:\/\//.test(path) ? path : `${SITE_URL}${path === "/" ? "" : path}`;
}
