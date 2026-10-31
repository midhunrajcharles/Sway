// The design shipped with a regional notice that could hold the home intro. Sway has no such gate,
// so these always report "open"; the intro and hero animations call them unchanged.

export function isGated() {
  return false;
}

export function whenGateReleased() {
  return Promise.resolve();
}

export function isGateSettled() {
  return true;
}

export function subscribeToGateSettled(callback: () => void) {
  void callback;
  return () => {};
}
