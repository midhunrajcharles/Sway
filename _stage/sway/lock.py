"""Pin the published benchmark run so stray bench.py runs can't change the site.

The /evidence page and `sway.server.evidence()` read `data/results-lock.json`
rather than scanning `results/` for the latest directory. Running
`python bench.py` writes a new timestamped folder but does NOT touch the
lock, so experiments stay off the site until this is regenerated
explicitly:

    python -m sway.lock --main 20261014-200907 --subtle 20261015-082558
"""
from __future__ import annotations

import argparse
import datetime
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LOCK = ROOT / "data" / "results-lock.json"
RESULTS = ROOT / "results"


def _sha256(path: Path) -> str | None:
    if not path.exists():
        return None
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load() -> dict:
    if not LOCK.exists():
        return {}
    try:
        return json.loads(LOCK.read_text(encoding="utf-8"))
    except ValueError:
        return {}


def write(main_run: str, subtle_run: str | None = None, notes: str = "") -> dict:
    main_dir = RESULTS / main_run
    sub_dir = RESULTS / subtle_run if subtle_run else None
    lock = {
        "main_run": main_run,
        "main_results_sha256": _sha256(main_dir / "results.jsonl"),
        "main_summary_sha256": _sha256(main_dir / "summary.md"),
        "subtle_run": subtle_run,
        "subtle_results_sha256": _sha256(sub_dir / "results.jsonl") if sub_dir else None,
        "locked_at": datetime.date.today().isoformat(),
        "notes": notes
        or "Headline numbers verified. Stray bench.py runs do not update this; regenerate with python -m sway.lock.",
    }
    LOCK.parent.mkdir(exist_ok=True)
    LOCK.write_text(json.dumps(lock, indent=2) + "\n", encoding="utf-8")
    return lock


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--main", required=False, help="Main benchmark run directory under results/.")
    ap.add_argument("--subtle", required=False, help="Subtle-attack benchmark run directory under results/.")
    ap.add_argument("--notes", default="")
    ap.add_argument("--show", action="store_true", help="Print the current lock and exit.")
    args = ap.parse_args()

    if args.show or not args.main:
        print(json.dumps(load(), indent=2))
        return 0

    lock = write(args.main, args.subtle, args.notes)
    print(json.dumps(lock, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
