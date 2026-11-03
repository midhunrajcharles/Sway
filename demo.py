"""One command for judges: python demo.py

Boots the Sway engine (:8787) and the site (:3300) together with SWAY_DEMO=1, so every PayPal call
(Orders v2 AUTHORIZE/CAPTURE/VOID, Payouts) is answered by the in-process mock in
site/lib/server/paypal.ts and the order ledger (data/orders.json) is written as normal.
No PayPal keys needed. The shopping agent still needs a model: the `claude` CLI, or ANTHROPIC_API_KEY.
Ctrl+C stops both.
"""
import os
import shutil
import subprocess
import sys
import time

ROOT = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.join(ROOT, "site")
IS_WIN = os.name == "nt"


def main():
    npm = shutil.which("npm")
    if not npm:
        sys.exit("Node.js 20+ (npm) is required: https://nodejs.org")

    api_args = []
    if not shutil.which("claude"):
        if os.environ.get("ANTHROPIC_API_KEY"):
            api_args = ["--backend", "anthropic", "--model", "claude-haiku-5-5"]
        else:
            sys.exit("The shopping agent needs a model: log in to the `claude` CLI, or set ANTHROPIC_API_KEY.")

    if not os.path.isdir(os.path.join(SITE, "node_modules")):
        print("Installing site dependencies (first run only)...", flush=True)
        subprocess.check_call([npm, "install"], cwd=SITE)

    env = {**os.environ, "SWAY_DEMO": "1"}
    procs = [
        subprocess.Popen([sys.executable, os.path.join(ROOT, "serve.py"), "--port", "8787", *api_args], env=env),
        subprocess.Popen([npm, "run", "dev"], cwd=SITE, env=env),
    ]
    print("\nSway demo mode (simulated PayPal). Open http://localhost:3300/shop\n", flush=True)
    try:
        while all(p.poll() is None for p in procs):
            time.sleep(1)
    except KeyboardInterrupt:
        pass
    finally:
        for p in procs:
            if p.poll() is None:
                if IS_WIN:
                    subprocess.call(["taskkill", "/F", "/T", "/PID", str(p.pid)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                else:
                    p.terminate()


if __name__ == "__main__":
    main()
