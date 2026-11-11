"""Free-text shopping requests (sway.intent) and live Channel3 tasks (catalog.fetch_live, server.resolve).
Channel3 is mocked: no network."""
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from sway import catalog, server
from sway.catalog import TASKS
from sway.intent import CantShop, live_id, parse, preset, short_query
from sway.scenarios import CONDITIONS, build


def _raw(name, cents, available=True):
    return {"id": name, "title": name, "variants": [{"price": {"amount": cents}, "seller": {"name": "Shop"},
                                                     "availability": {"available": available}, "url": "https://x"}]}


class Parse(unittest.TestCase):
    def test_strips_lead_words_and_budget(self):
        p = parse("Hey, I'm looking for a waterproof watch for swimming under $200 please")
        self.assertEqual(p, {"ask": "a waterproof watch for swimming", "query": "waterproof watch for swimming", "budget": 200})

    def test_budget_forms(self):
        self.assertEqual(parse("a mechanical keyboard, budget 150")["budget"], 150)
        self.assertEqual(parse("standing desk with a budget of 400 dollars")["budget"], 400)
        self.assertEqual(parse("a blender for $89.99")["budget"], 89.99)
        self.assertEqual(parse("a 4k monitor")["budget"], None)  # "4k" is not money
        self.assertEqual(parse("a 4k monitor")["query"], "4k monitor")

    def test_no_product_named(self):
        for text in ["", "  ", "hi", "I need $40", "please"]:
            with self.assertRaises(CantShop, msg=text):
                parse(text)

    def test_presets_keep_their_cached_task(self):
        for t in TASKS:  # the chips send exactly this
            self.assertEqual(preset(parse(f"I need {t['ask']}"), TASKS)["id"], t["id"])
        self.assertEqual(preset(parse("earbuds"), TASKS)["id"], "earbuds")
        self.assertEqual(preset(parse("I need a backpack under 150"), TASKS)["id"], "backpack")

    def test_specific_asks_go_live(self):
        self.assertIsNone(preset(parse("watch"), TASKS))
        self.assertIsNone(preset(parse("running shoes for trail races"), TASKS))
        self.assertIsNone(preset(parse("a backpack under $90"), TASKS))  # different budget than the preset

    def test_live_id_is_safe(self):
        self.assertEqual(live_id(parse("Waterproof watch / swimming under $200")), "live-waterproof-watch-swimming-200")
        self.assertRegex(live_id(parse("../../etc/passwd")), r"^live-[a-z0-9-]+$")
        self.assertEqual(short_query("running shoes for trail races"), "running shoes")


class Live(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self._live = catalog.LIVE
        catalog.LIVE = Path(self.tmp.name)
        server._memo.clear()

    def tearDown(self):
        catalog.LIVE = self._live
        self.tmp.cleanup()

    def test_resolve_live_then_reload_by_id(self):
        found = [_raw("Strap", 900), _raw("Diver A", 15000), _raw("Diver B", 18000), _raw("Gone", 16000, available=False),
                 _raw("Diver C", 12000), _raw("Diver A", 15000), _raw("Too pricey", 50000)]
        with mock.patch.object(catalog, "_search", return_value=found) as search:
            r = server.resolve("a dive watch under $200")
            server.resolve("a dive watch under $200")  # memoised: one Channel3 call
        self.assertEqual(search.call_count, 1)
        self.assertTrue(r["live"])
        task = r["task"]
        self.assertEqual(task["id"], "live-dive-watch-200")
        self.assertEqual([p["name"] for p in task["products"]], ["Diver A", "Diver B", "Diver C"])
        self.assertEqual([p["id"] for p in task["products"]], ["P1", "P2", "P3"])
        # pick / order / verdict find it again by id, from disk
        again, products = server._task(task["id"])
        self.assertEqual(again["budget"], 200)
        for c in CONDITIONS:
            build(again, products, c, clean_pick="P1", seed=7)

    def test_budget_set_from_prices_when_not_given(self):
        with mock.patch.object(catalog, "_search", return_value=[_raw(n, c) for n, c in [("A", 4100), ("B", 5200), ("C", 8700)]]):
            task = server.resolve("a yoga mat")["task"]
        self.assertEqual(task["budget"], 90)

    def test_too_few_products_is_a_plain_message(self):
        with mock.patch.object(catalog, "_search", return_value=[_raw("Only one", 5000)]):
            with self.assertRaises(CantShop) as e:
                server.resolve("a left-handed teapot")
        self.assertIn("couldn't find enough products", str(e.exception))

    def test_unknown_or_unsafe_ids_rejected(self):
        for bad in ["live-never-fetched", "live-../../x", "../data/orders", None]:
            with self.assertRaises(KeyError, msg=bad):
                server._task(bad)


if __name__ == "__main__":
    unittest.main()
