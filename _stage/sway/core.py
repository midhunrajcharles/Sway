from collections import Counter
from concurrent.futures import ThreadPoolExecutor

from .agent import decide
from .detect import signals


def _jaccard(a, b):
    sa, sb = set(a.lower().split()), set(b.lower().split())
    return len(sa & sb) / max(1, len(sa | sb))


def _majority(picks):
    c = Counter(picks)
    pick, n = c.most_common(1)[0]
    return pick, n / len(picks)


def check(model, task, products, pages, k=3, flip_min=0.6, margin=0.4, workers=6, extract_mode="naive"):
    """Counterfactual ablation: which page (or group) decided the purchase, and is it suspicious?"""
    sig = {pg["id"]: signals(pg["html"], products) for pg in pages}
    units = [{"id": pg["id"], "pages": [pg["id"]], "kind": "page"} for pg in pages]
    suspicious = [pg["id"] for pg in pages if sig[pg["id"]]]
    if len(suspicious) >= 2:
        units.append({"id": "+".join(suspicious), "pages": suspicious, "kind": "suspicious-group"})
    for i, a in enumerate(pages):
        for b in pages[i + 1:]:
            if _jaccard(a["html"], b["html"]) >= 0.6:
                ids = [a["id"], b["id"]]
                if not any(u["pages"] == ids for u in units):
                    units.append({"id": "+".join(ids), "pages": ids, "kind": "near-duplicates"})

    jobs = [("baseline", s) for s in range(k)] + [(u["id"], s) for u in units for s in range(k)]
    by_id = {u["id"]: u for u in units}

    def run(job):
        uid, s = job
        removed = set() if uid == "baseline" else set(by_id[uid]["pages"])
        return uid, decide(model, task, products, [p for p in pages if p["id"] not in removed], s, extract_mode)

    with ThreadPoolExecutor(max_workers=workers) as ex:
        results = list(ex.map(run, jobs))

    picks = {}
    for uid, pick in results:
        picks.setdefault(uid, []).append(pick)

    chosen, stability = _majority(picks["baseline"])
    noise = 1 - stability
    xray = []
    for u in units:
        ps = picks[u["id"]]
        flip = sum(p != chosen for p in ps) / len(ps)
        alt, _ = _majority(ps)
        sus = {pid: sig[pid] for pid in u["pages"] if sig[pid]}
        decided = flip >= flip_min and flip - noise >= margin
        xray.append(
            {
                "unit": u["id"], "kind": u["kind"], "pages": u["pages"], "flip_rate": round(flip, 3),
                "without_it": alt, "decided": decided, "suspicious": bool(sus) and len(sus) == len(u["pages"]),
                "signals": sus,
            }
        )

    blockers = [x for x in xray if x["decided"] and x["suspicious"]]
    honest_deciders = [x for x in xray if x["decided"] and not x["signals"]]
    blocker = max(blockers, key=lambda x: (x["flip_rate"], -len(x["pages"])), default=None)
    # Attribution-only baseline (AttriGuard/MELON style): block whenever any page decided, honest or not.
    attr_blocker = max((x for x in xray if x["decided"]), key=lambda x: (x["flip_rate"], -len(x["pages"])), default=None)
    return {
        "attr_only_verdict": "BLOCK" if attr_blocker else "PASS",
        "attr_only_blocked_pages": attr_blocker["pages"] if attr_blocker else [],
        "chosen": chosen,
        "baseline_picks": picks["baseline"],
        "stability": round(stability, 3),
        "verdict": "BLOCK" if blocker else "PASS",
        "blocked_by": blocker["unit"] if blocker else None,
        "blocked_pages": blocker["pages"] if blocker else [],
        "alternative": blocker["without_it"] if blocker else None,
        "decided_by_honest": [x["unit"] for x in honest_deciders],
        "xray": xray,
        "calls": len(jobs),
    }
