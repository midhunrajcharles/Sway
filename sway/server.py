"""Sway HTTP API (stdlib only) for the web app.

  python -m sway.server [--port 8787] [--backend claude-cli --model haiku --k 5]

GET  /api/health
GET  /api/tasks                         tasks + their real Channel3 products
POST /api/pick     {task, condition}    what the shopping agent would buy (baseline runs only)
POST /api/verdict  {task, condition}    full Sway check before capture: verdict, x-ray, sentence
GET  /api/results[?run=<dir>]           latest benchmark rows + x-ray, for the AG Grid views
GET  /api/evidence                      benchmark rows for the evidence page, read from results/ on each call

Model calls are cached on disk, so scenarios already in the benchmark answer instantly.
"""
import argparse
import csv
import json
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from .agent import decide
from .catalog import TASKS, fetch_task
from .core import _majority, check
from .detect import extract, signals
from .explain import reasons, verdict_sentence
from .models import Model
from .scenarios import CONDITIONS, build, label_products

ROOT = Path(__file__).resolve().parent.parent
RESULTS = ROOT / "results"
_locks = {}
_memo = {}
_guard = threading.Lock()


def _task(task_id):
    t = next((t for t in TASKS if t["id"] == task_id), None)
    if not t:
        raise KeyError(f"unknown task {task_id}")
    d = fetch_task(t)
    return d["task"], label_products(d["products"])


def _pages(cfg, task, products, condition):
    clean_pick = None
    if condition != "clean":
        clean_pick = pick(cfg, task["id"], "clean")["chosen"]
    return build(task, products, condition, clean_pick=clean_pick, seed=cfg.seed)


def _once(key, fn):
    with _guard:
        lock = _locks.setdefault(key, threading.Lock())
    with lock:
        if key not in _memo:
            _memo[key] = fn()
        return _memo[key]


def pick(cfg, task_id, condition):
    def run():
        task, products = _task(task_id)
        pages, meta = _pages(cfg, task, products, condition)
        picks = [decide(cfg.model, task, products, pages, s, cfg.extract) for s in range(cfg.k)]
        chosen, stability = _majority(picks)
        return {"task": task, "products": products, "condition": condition, "chosen": chosen, "stability": stability,
                "pages": [{"id": p["id"], "url": p["url"]} for p in pages], "target": meta["target"]}
    return _once(("pick", task_id, condition), run)


def verdict(cfg, task_id, condition):
    def run():
        task, products = _task(task_id)
        pages, meta = _pages(cfg, task, products, condition)
        r = check(cfg.model, task, products, pages, k=cfg.k, workers=cfg.workers, extract_mode=cfg.extract)
        page_info = []
        for p in pages:
            sig = signals(p["html"], products)
            page_info.append({"id": p["id"], "url": p["url"], "planted": bool(p.get("planted")), "signals": sig,
                              "reasons": reasons(sig, products), "excerpt": extract(p["html"], "naive")[:420]})
        return {"task": task, "products": products, "condition": condition, "target": meta["target"], "pages": page_info,
                "result": r, "sentence": verdict_sentence(r, products, pages)}
    return _once(("verdict", task_id, condition), run)


def results(run=None):
    dirs = sorted((d for d in RESULTS.iterdir() if (d / "results.jsonl").exists()), key=lambda d: d.name)
    if not dirs:
        return {"run": None, "rows": [], "xray": []}
    d = RESULTS / run if run else dirs[-1]
    rows = [json.loads(line) for line in (d / "results.jsonl").read_text(encoding="utf-8").splitlines() if line.strip()]
    with open(d / "xray.csv", encoding="utf-8") as f:
        xray = list(csv.DictReader(f))
    return {"run": d.name, "runs": [x.name for x in dirs], "rows": rows, "xray": xray}


def _lock():
    """Pinned run names from data/results-lock.json, so stray bench.py runs
    don't change what /evidence shows. Falls back to a hard default when
    the lock file is missing or malformed."""
    try:
        import json as _json
        p = ROOT / "data" / "results-lock.json"
        if p.exists():
            data = _json.loads(p.read_text(encoding="utf-8"))
            return data.get("main_run") or "20261014-200907", data.get("subtle_run")
    except Exception:
        pass
    return "20261014-200907", "20261015-082558"


MAIN_RUN, PINNED_SUBTLE = _lock()  # read from data/results-lock.json
SUBTLE = {"fake_reviews", "covert_instruction", "price_smear"}
BENCH_KEYS = ("task", "condition", "target", "chosen", "steered", "manipulated", "verdict", "attr_only_verdict",
              "decider_correct", "decided_by_honest", "chosen_price", "alt_price", "stability", "calls",
              "top_k", "chosen_c3_id", "attacker_target", "attacker_target_c3_id", "shift_detected", "target_named_correctly")


def _rows(d):
    f = d / "results.jsonl"
    return [json.loads(line) for line in f.read_text(encoding="utf-8").splitlines() if line.strip()] if f.exists() else []


def _config(d):
    """The run's settings, from the JSON block at the top of summary.md."""
    try:
        return json.loads((d / "summary.md").read_text(encoding="utf-8").split("`")[1])
    except (OSError, IndexError, ValueError):
        return {}


def evidence():
    """Pinned main run rows plus subtle-attack rows. Both runs are chosen by
    data/results-lock.json (see sway.lock) so stray bench.py runs stay off the
    site until the lock is regenerated."""
    main_dir = RESULTS / MAIN_RUN
    subtle = []
    pinned = RESULTS / PINNED_SUBTLE if PINNED_SUBTLE else None
    if pinned and pinned.exists():
        subtle = [r for r in _rows(pinned) if r["condition"] in SUBTLE]
    else:
        for d in sorted(p for p in RESULTS.iterdir() if p.is_dir()):
            if _config(d).get("extract") == "rendered":
                continue
            rows = [r for r in _rows(d) if r["condition"] in SUBTLE]
            if len(rows) >= len(subtle):
                subtle = rows
    cfg = _config(main_dir)
    pick = lambda r: {k: r.get(k) for k in BENCH_KEYS}
    return {"main_run": MAIN_RUN, "model": cfg.get("model"), "k": cfg.get("k"),
            "main": [pick(r) for r in _rows(main_dir)], "subtle": [pick(r) for r in subtle]}


class Handler(BaseHTTPRequestHandler):
    cfg = None

    def _send(self, code, body):
        data = json.dumps(body).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def _guarded(self, fn):
        try:
            self._send(200, fn())
        except KeyError as e:
            self._send(404, {"error": str(e)})
        except Exception as e:  # surfaced to the web app, which shows it
            self._send(500, {"error": f"{type(e).__name__}: {e}"})

    def do_GET(self):
        u = urlparse(self.path)
        q = {k: v[0] for k, v in parse_qs(u.query).items()}
        if u.path == "/api/health":
            return self._send(200, {"ok": True, "backend": self.cfg.model.backend, "model": self.cfg.model.model, "k": self.cfg.k})
        if u.path == "/api/tasks":
            return self._guarded(lambda: {"conditions": CONDITIONS, "tasks": [
                {**t, "products": _task(t["id"])[1]} for t in TASKS]})
        if u.path == "/api/results":
            return self._guarded(lambda: results(q.get("run")))
        if u.path == "/api/evidence":
            return self._guarded(evidence)
        self._send(404, {"error": "not found"})

    def do_POST(self):
        n = int(self.headers.get("Content-Length") or 0)
        body = json.loads(self.rfile.read(n) or b"{}")
        task, cond = body.get("task"), body.get("condition", "clean")
        if cond not in CONDITIONS:
            return self._send(400, {"error": f"unknown condition {cond}"})
        if self.path == "/api/pick":
            return self._guarded(lambda: pick(self.cfg, task, cond))
        if self.path == "/api/verdict":
            return self._guarded(lambda: verdict(self.cfg, task, cond))
        self._send(404, {"error": "not found"})

    def log_message(self, fmt, *args):
        print("  " + fmt % args, flush=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=8787)
    ap.add_argument("--backend", default="claude-cli")
    ap.add_argument("--model", default="haiku")
    ap.add_argument("--temperature", type=float, default=1.0)
    ap.add_argument("--k", type=int, default=5)
    ap.add_argument("--workers", type=int, default=6)
    ap.add_argument("--extract", default="naive", choices=["naive", "rendered"])
    ap.add_argument("--seed", type=int, default=7)
    cfg = ap.parse_args()
    cfg.model = Model(cfg.backend, cfg.model, cfg.temperature)
    Handler.cfg = cfg
    print(f"Sway API on http://127.0.0.1:{cfg.port} ({cfg.backend}/{cfg.model.model}, k={cfg.k})", flush=True)
    ThreadingHTTPServer(("127.0.0.1", cfg.port), Handler).serve_forever()


if __name__ == "__main__":
    main()
