// Runs the chrome symbol session on an OffscreenCanvas off the main thread.
// (The original worker chunk wasn't in the scrape; this follows the message
// protocol the page side expects: hello -> init, then live / landed events.)
import { createSession, type ChromeSession } from "./session";

let session: ChromeSession | null = null;

self.onmessage = (event: MessageEvent) => {
  const msg = event.data;
  switch (msg.type) {
    case "init":
      session = createSession({
        canvas: msg.canvas,
        params: msg.params,
        intro: msg.intro,
        spin: msg.spin,
        width: msg.width,
        height: msg.height,
        shape: msg.shape,
        onLive: (live) => self.postMessage({ type: "live", live }),
        onLanded: () => self.postMessage({ type: "landed" }),
      });
      if (!session) self.postMessage({ type: "live", live: false });
      break;
    case "params":
      session?.setParams(msg.params);
      break;
    case "resize":
      session?.resize(msg.width, msg.height);
      break;
    case "visible":
      session?.setVisible(msg.visible);
      break;
    case "land":
      session?.land();
      break;
    case "replay":
      session?.replayIntro();
      break;
    case "dispose":
      session?.dispose();
      session = null;
      break;
  }
};

self.postMessage({ type: "hello" });
