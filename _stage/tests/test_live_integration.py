"""End-to-end live integration test.

Hits the running Python API (`python serve.py --port 8787`) over HTTP and
checks the real response shapes. Skipped when the API is not running — so
`python -m unittest discover -s tests` stays green in CI without the
server up.

Run locally with the server already up:

    python serve.py --port 8787 &
    python -m unittest tests.test_live_integration -v
"""
from __future__ import annotations

import json
import os
import unittest
import urllib.error
import urllib.request

API = os.environ.get("SWAY_API", "http://127.0.0.1:8787")
TIMEOUT = 60  # cache-hit requests return in <1s; cold model calls can be slow.


def _get(path: str):
    with urllib.request.urlopen(f"{API}{path}", timeout=TIMEOUT) as r:
        return json.loads(r.read().decode("utf-8"))


def _post(path: str, body: dict):
    req = urllib.request.Request(
        f"{API}{path}",
        data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
        return json.loads(r.read().decode("utf-8"))


def _api_up() -> bool:
    try:
        _get("/api/health")
        return True
    except (urllib.error.URLError, ConnectionError, OSError):
        return False


@unittest.skipUnless(_api_up(), f"Sway API not running at {API}; start with `python serve.py`.")
class LiveIntegration(unittest.TestCase):
    def test_health(self):
        res = _get("/api/health")
        self.assertEqual(res.get("ok"), True)

    def test_tasks_list_has_products(self):
        tasks = _get("/api/tasks")
        self.assertIsInstance(tasks, list)
        self.assertGreater(len(tasks), 0)
        first = tasks[0]
        self.assertIn("id", first)
        self.assertIn("ask", first)
        self.assertIn("products", first)
        self.assertGreater(len(first["products"]), 0)

    def test_verdict_shape_on_cached_scenario(self):
        tasks = _get("/api/tasks")
        task_id = tasks[0]["id"]
        res = _post("/api/verdict", {"task": task_id, "condition": "clean"})
        for key in ("verdict", "sentence", "xray", "chosen", "stability"):
            self.assertIn(key, res, msg=f"missing key {key} in verdict response")
        self.assertIn(res["verdict"], {"allow", "block"})


if __name__ == "__main__":
    unittest.main()
