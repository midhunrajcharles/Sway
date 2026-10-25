// Coordination between the intro overlay (EntryOverlay) and the parts of the
// page that need time to get ready (e.g. the hero liquid). Each part "claims"
// readiness; the overlay waits for every claim (or a timeout) before lifting.

export const ENTRY_OVERLAY_ATTRIBUTE = "data-entry";
export const ENTRY_BRAND_ATTRIBUTE = "data-entry-brand";
export const ENTRY_LOCK_ATTRIBUTE = "data-entry-lock";
export const ENTRY_LOCK_FRAMES = 3;
export const ENTRY_OVERLAY_FAILSAFE = 14000;
export const ENTRY_SWAP_DURATION = 200;
export const PAGE_READY_TIMEOUT = 8000;

/** Runs in <head> before React on the home page; must stay a plain string. */
export const ENTRY_SCRIPT = `(function(){try{if(location.pathname.replace(/\\/+$/,'')!=='')return;document.documentElement.setAttribute('${ENTRY_OVERLAY_ATTRIBUTE}','');document.documentElement.setAttribute('${ENTRY_BRAND_ATTRIBUTE}','');}catch(e){}})()`;

const claims = new Set<Promise<void>>();
const liftListeners = new Set<() => void>();
let wake: (() => void) | null = null;
let readyPromise: Promise<void> | null = null;
let ready = false;
let lifted: boolean | null = null;

function wakeWaiter() {
  const fn = wake;
  wake = null;
  fn?.();
}

function addClaim(work: Promise<unknown> | (() => Promise<unknown>)) {
  if (ready) return () => {};
  const claim = Promise.resolve(typeof work === "function" ? work() : work).then(
    () => undefined,
    () => undefined,
  );
  claims.add(claim);
  claim.then(() => {
    if (claims.delete(claim)) wakeWaiter();
  });
  return () => {
    if (claims.delete(claim)) wakeWaiter();
  };
}

/** Wait until all claims are settled; re-checks when claims are added or dropped. */
async function settleClaims() {
  for (let round = 0; round < 64; round += 1) {
    const pending = [...claims];
    if (pending.length === 0) return;
    await Promise.race([
      Promise.all(pending),
      new Promise<void>((resolve) => {
        wake = resolve;
      }),
    ]);
  }
}

async function pageLoaded() {
  await Promise.all([
    typeof document === "undefined" || document.readyState === "complete"
      ? Promise.resolve()
      : new Promise<void>((resolve) => {
          window.addEventListener("load", () => resolve(), { once: true });
        }),
    typeof document === "undefined" || !document.fonts
      ? Promise.resolve()
      : document.fonts.ready.then(
          () => undefined,
          () => undefined,
        ),
  ]);
  await settleClaims();
}

/** Hold the intro until the returned function is called. */
export function claimReady() {
  let resolve = () => {};
  const release = addClaim(
    new Promise<void>((r) => {
      resolve = r;
    }),
  );
  return () => {
    resolve();
    release();
  };
}

export function whenPageReady() {
  if (ready) return Promise.resolve();
  if (!readyPromise) {
    readyPromise = Promise.race([
      pageLoaded(),
      new Promise<void>((resolve) => {
        setTimeout(resolve, PAGE_READY_TIMEOUT);
      }),
    ]).then(() => {
      ready = true;
      claims.clear();
    });
  }
  return readyPromise;
}

export function hasEntryOverlay() {
  return typeof document !== "undefined" && document.documentElement.hasAttribute(ENTRY_OVERLAY_ATTRIBUTE);
}

export function clearEntryOverlay() {
  if (typeof document !== "undefined") document.documentElement.removeAttribute(ENTRY_OVERLAY_ATTRIBUTE);
}

export function clearEntryBrand() {
  if (typeof document !== "undefined") document.documentElement.removeAttribute(ENTRY_BRAND_ATTRIBUTE);
}

export function isOverlayLifted() {
  if (lifted === null) lifted = !hasEntryOverlay();
  return lifted;
}

export function liftOverlay() {
  if (isOverlayLifted()) return;
  lifted = true;
  for (const listener of [...liftListeners]) listener();
  liftListeners.clear();
}

export function onOverlayLifted(callback: () => void) {
  if (isOverlayLifted()) return () => {};
  liftListeners.add(callback);
  return () => {
    liftListeners.delete(callback);
  };
}
