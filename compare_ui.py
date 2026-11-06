"""Prompt 7: Sway (counterfactual ablation) vs a UI-driving baseline (Playwright), 3 tasks.

No live model calls: Sway's check() is replayed against the committed call cache (a cache miss aborts the run),
and the UI agent is a scripted Playwright click-through of a local mock shop built from the same catalog and pages.
Tokens and LLM latency are MODELLED, not measured (the cache stores model text only). See ASSUMPTIONS.
"""
import json
import math
import sys
import threading
import time
from datetime import datetime
from functools import partial
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from sway.catalog import TASKS, fetch_task
from sway.core import check
from sway.models import Model
from sway.scenarios import build, label_products

ROOT = Path(__file__).resolve().parent
PINNED = ROOT / "results" / "20261106-223707"
TASK_IDS = ["running-shoes", "office-chair", "backpack"]
WORKERS = 6

# Pinned run: 274 new model calls in 1328 s on 6 workers => about 29 s of wall-clock per call (claude CLI, Haiku).
PINNED_META = json.loads((PINNED / "summary.md").read_text(encoding="utf-8").split("`")[1])
LATENCY_S = round(PINNED_META["seconds"] * WORKERS / PINNED_META["new_calls"], 1)
ASSUMPTIONS = {
    "chars_per_token": 4,
    "price_per_mtok_in_usd": 1.00,
    "price_per_mtok_out_usd": 5.00,
    "price_note": "Haiku-class list price assumed for BOTH agents; change here and the absolute dollars scale, the ratios do not.",
    "llm_seconds_per_call": LATENCY_S,
    "latency_note": "derived from the pinned run (seconds * workers / new_calls); an upper-ish bound, includes CLI start-up",
    "ui_prompt_overhead_tokens": 400,
    "ui_output_tokens_per_step": 60,
    "ui_history_tokens_per_step": 30,
    "ui_note": "each UI step = one LLM call carrying the current page snapshot (visible text + clickable elements), "
               "a fixed instruction block, and a compact action history; one short action emitted",
}
A = ASSUMPTIONS


def tok(chars):
    return math.ceil(chars / A["chars_per_token"])


def usd(tin, tout):
    return tin / 1e6 * A["price_per_mtok_in_usd"] + tout / 1e6 * A["price_per_mtok_out_usd"]


# ---------- Sway side: replay from cache, count what it would have sent ----------
class ReplayModel(Model):
    def __init__(self, *a):
        super().__init__(*a)
        self.in_chars = self.out_chars = self.n = 0
        self._l = threading.Lock()

    def complete(self, system, user, sample=0):
        if not self._key(system, user, sample).exists():
            raise SystemExit("cache miss: refusing to make a live model call")
        text = super().complete(system, user, sample)
        with self._l:
            self.in_chars += len(system) + len(user)
            self.out_chars += len(text)
            self.n += 1
        return text


def run_sway(task_def):
    data = fetch_task(task_def)
    task, products = data["task"], label_products(data["products"][:5])
    pages, _ = build(task, products, "clean", seed=7)
    m = ReplayModel(PINNED_META["backend"], PINNED_META["model"], 1.0)
    r = check(m, task, products, pages, k=PINNED_META["k"], workers=WORKERS, extract_mode="naive")
    assert m.calls == 0 and m.n == r["calls"], "expected a pure cache replay"
    tin, tout = tok(m.in_chars), tok(m.out_chars)
    waves = math.ceil(r["calls"] / WORKERS)
    return {
        "chosen": r["chosen"], "verdict": r["verdict"], "steps": r["calls"], "sequential_waves": waves,
        "tokens_in": tin, "tokens_out": tout, "tokens": tin + tout,
        "wall_clock_s": round(waves * A["llm_seconds_per_call"], 1), "cost_usd": round(usd(tin, tout), 4),
    }, task, products, pages


# ---------- UI side: local mock shop + Playwright ----------
def make_site(task, products, pages):
    by_id = {p["id"]: p for p in products}

    def page(body, title="Shop"):
        return f"<!doctype html><html><head><title>{title}</title></head><body><nav><a href='/'>Home</a> <a href='/cart'>Cart</a></nav>{body}</body></html>"

    class H(BaseHTTPRequestHandler):
        def log_message(self, *a):
            pass

        def do_GET(self):
            u = urlparse(self.path)
            q = parse_qs(u.query)
            parts = [x for x in u.path.split("/") if x]
            if not parts:
                body = page("<h1>Store</h1><form action='/search'><input name='q' aria-label='Search'><button type='submit'>Search</button></form>")
            elif parts[0] == "search":
                rows = "".join(f"<li><a href='/product/{p['id']}'>{p['label']}</a> ${p['price']:.2f}</li>" for p in products)
                body = page(f"<h1>Results for {q.get('q', [''])[0]}</h1><ul>{rows}</ul><h2>Reviews and guides</h2><ul>"
                            + "".join(f"<li><a href='/web/{pg['id']}'>{pg['url']}</a></li>" for pg in pages) + "</ul>")
            elif parts[0] == "product" and parts[1] in by_id:
                p = by_id[parts[1]]
                body = page(f"<h1>{p['label']}</h1><p>${p['price']:.2f}</p><p>{p['description']}</p><a href='/cart?add={p['id']}'>Add to cart</a>")
            elif parts[0] == "web":
                pg = next(x for x in pages if x["id"] == parts[1])
                body = pg["html"]
            elif parts[0] == "cart":
                add = q.get("add", [None])[0]
                body = page(f"<h1>Cart</h1><p>{by_id[add]['label'] if add else 'empty'}</p><a href='/checkout?item={add}'>Checkout</a>")
            elif parts[0] == "checkout":
                body = page("<h1>Checkout</h1><form action='/confirm'><input name='ship' aria-label='Shipping address'><button type='submit'>Place order</button></form>")
            elif parts[0] == "confirm":
                body = page("<h1>Order placed</h1>")
            else:
                self.send_error(404)
                return
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            self.wfile.write(body.encode())

    srv = ThreadingHTTPServer(("127.0.0.1", 0), H)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv


def snapshot(pg):
    text = pg.inner_text("body")
    els = pg.eval_on_selector_all("a,button,input", "e=>e.map(x=>(x.tagName+' '+(x.innerText||x.getAttribute('aria-label')||'')).trim())")
    return text + "\n" + "\n".join(els)


def run_ui(task, products, pages, pick):
    from playwright.sync_api import sync_playwright
    srv = make_site(task, products, pages)
    base = f"http://127.0.0.1:{srv.server_address[1]}"
    steps, snap_chars, browser_s = 0, [], 0.0
    with sync_playwright() as pw:
        b = pw.chromium.launch(channel="msedge", headless=True)
        pg = b.new_page()

        def step(fn):
            nonlocal steps, browser_s
            t = time.perf_counter()
            fn()
            browser_s += time.perf_counter() - t
            steps += 1
            snap_chars.append(len(snapshot(pg)))

        step(lambda: pg.goto(base + "/"))
        step(lambda: pg.fill("input[name=q]", task["query"]))
        step(lambda: pg.click("text=Search"))
        for p in products:  # open each product page, go back
            step(lambda p=p: pg.click(f"a[href='/product/{p['id']}']"))
            step(lambda: pg.go_back())
        for w in pages:  # read each research page, go back
            step(lambda w=w: pg.click(f"a[href='/web/{w['id']}']"))
            step(lambda: pg.go_back())
        step(lambda: pg.click(f"a[href='/product/{pick}']"))
        step(lambda: pg.click("text=Add to cart"))
        step(lambda: pg.click("text=Checkout"))
        step(lambda: pg.fill("input[name=ship]", "1 Test St"))
        step(lambda: pg.click("text=Place order"))
        done = "Order placed" in pg.inner_text("body")
        b.close()
    srv.shutdown()
    tin = sum(tok(c) + A["ui_prompt_overhead_tokens"] + A["ui_history_tokens_per_step"] * i for i, c in enumerate(snap_chars))
    tout = A["ui_output_tokens_per_step"] * steps
    return {
        "completed_checkout": done, "steps": steps, "tokens_in": tin, "tokens_out": tout, "tokens": tin + tout,
        "wall_clock_s": round(steps * A["llm_seconds_per_call"] + browser_s, 1), "browser_s_measured": round(browser_s, 1),
        "cost_usd": round(usd(tin, tout), 4),
    }


def ratio(a, b):
    return round(a / b, 2) if b else None


def main():
    rows = []
    for tid in TASK_IDS:
        td = next(t for t in TASKS if t["id"] == tid)
        sway, task, products, pages = run_sway(td)
        ui = run_ui(task, products, pages, sway["chosen"])
        row = {"task": tid, "sway": sway, "ui_driving_baseline_playwright": ui,
               "ui_over_sway": {k: ratio(ui[k], sway[k]) for k in ("steps", "tokens", "wall_clock_s", "cost_usd")}}
        rows.append(row)
        print(tid, json.dumps(row["ui_over_sway"]), flush=True)
    agg = {}
    for who in ("sway", "ui_driving_baseline_playwright"):
        agg[who] = {k: round(sum(r[who][k] for r in rows), 4) for k in ("steps", "tokens", "wall_clock_s", "cost_usd")}
    agg["ui_over_sway"] = {k: ratio(agg["ui_driving_baseline_playwright"][k], agg["sway"][k]) for k in agg["sway"]}
    out = ROOT / "results" / datetime.now().strftime("%Y%m%d-%H%M%S")
    out.mkdir(parents=True)
    doc = {
        "label": "DIRECTIONAL: 3 tasks, 1 scenario each, single model; token counts and LLM latency are modelled, not measured",
        "agents": {"sway": "counterfactual ablation replay (clean condition, k=5, top-5), cached model calls",
                   "ui_driving_baseline_playwright": "UI-driving baseline (Playwright): scripted click-through of a local mock shop; STUB, not Kernel"},
        "pinned_run": PINNED.name, "assumptions": ASSUMPTIONS, "tasks": rows, "total": agg,
    }
    (out / "comparison.json").write_text(json.dumps(doc, indent=2), encoding="utf-8")
    print(json.dumps(agg, indent=1), "\nSaved", out)


if __name__ == "__main__":
    sys.path.insert(0, str(ROOT))
    main()
