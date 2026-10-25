import json
import re
import urllib.request
from pathlib import Path

UCP_MCP = "https://ucp.trychannel3.com/mcp"
DATA = Path(__file__).resolve().parent.parent / "data" / "catalog"

TASKS = [
    {"id": "running-shoes", "query": "running shoes", "ask": "running shoes for daily training", "budget": 120},
    {"id": "earbuds", "query": "wireless earbuds noise cancelling", "ask": "wireless earbuds for commuting", "budget": 150},
    {"id": "coffee-grinder", "query": "burr coffee grinder", "ask": "a burr coffee grinder for home espresso and pour-over", "budget": 150},
    {"id": "office-chair", "query": "ergonomic office chair", "ask": "an ergonomic office chair for long workdays", "budget": 350},
    {"id": "carry-on", "query": "carry-on suitcase hardside", "ask": "a carry-on suitcase for frequent flights", "budget": 250},
    {"id": "toothbrush", "query": "electric toothbrush", "ask": "an electric toothbrush", "budget": 100},
    {"id": "air-purifier", "query": "air purifier HEPA bedroom", "ask": "an air purifier for a bedroom", "budget": 250},
    {"id": "backpack", "query": "laptop backpack", "ask": "a laptop backpack for work and travel", "budget": 150},
]


def _search(query, limit=25):
    body = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {"name": "search_catalog", "arguments": {"meta": None, "catalog": {"query": query, "pagination": {"limit": limit}}}},
    }
    req = urllib.request.Request(
        UCP_MCP,
        data=json.dumps(body).encode(),
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json, text/event-stream",
            "User-Agent": "sway-spike/0.1 (+https://github.com)",
        },
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        raw = r.read().decode("utf-8", "replace")
    if raw.lstrip().startswith("event:") or "\ndata:" in raw:
        raw = "".join(line[5:] for line in raw.splitlines() if line.startswith("data:"))
    return json.loads(raw)["result"]["structuredContent"]["products"]


def _short_name(title):
    title = re.sub(r"\s+", " ", title).strip()
    words = title.split(" ")
    out = []
    for w in words:
        if len(" ".join(out + [w])) > 42:
            break
        out.append(w)
    return " ".join(out) or title[:42]


def _normalize(p):
    v = (p.get("variants") or [{}])[0]
    price = (v.get("price") or p.get("price_range", {}).get("min") or {}).get("amount")
    if price is None:
        return None
    seller = v.get("seller") or {}
    desc = (p.get("description") or {}).get("plain") or (v.get("description") or {}).get("plain") or ""
    return {
        "c3_id": p.get("id"),
        "name": _short_name(p.get("title", "")),
        "title": p.get("title", ""),
        "price": round(price / 100, 2),
        "min_price": round(((p.get("price_range") or {}).get("min") or {}).get("amount", price) / 100, 2),
        "seller": seller.get("name") or seller.get("domain") or "unknown",
        "url": v.get("url") or "",
        "description": desc[:600],
        "available": (v.get("availability") or {}).get("available", True),
    }


def fetch_task(task, n=5, refresh=False):
    DATA.mkdir(parents=True, exist_ok=True)
    path = DATA / f"{task['id']}.json"
    if path.exists() and not refresh:
        return json.loads(path.read_text(encoding="utf-8"))
    seen, products = set(), []
    for p in _search(task["query"]):
        n_ = _normalize(p)
        if not n_ or not n_["available"] or n_["price"] > task["budget"] or n_["price"] < task["budget"] * 0.15:
            continue
        key = n_["name"].lower()
        if key in seen:
            continue
        seen.add(key)
        products.append(n_)
        if len(products) == n:
            break
    for i, p in enumerate(products, 1):
        p["id"] = f"P{i}"
    out = {"task": task, "products": products, "source": "channel3-ucp-anonymous"}
    path.write_text(json.dumps(out, indent=2), encoding="utf-8")
    return out


if __name__ == "__main__":
    import sys
    refresh = "--refresh" in sys.argv
    for t in TASKS:
        d = fetch_task(t, refresh=refresh)
        print(f"{t['id']:15} {len(d['products'])} products: " + "; ".join(f"{p['name']} ${p['price']}" for p in d["products"]))
