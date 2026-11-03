"""Write a demo order ledger (data/orders.json) with DEMO- ids, for filming /ops with SWAY_DEMO=1 (mock PayPal).
Run from the repo root: python demo-film/seed-demo-ledger.py. It overwrites data/orders.json."""
import datetime as dt
import json

now = dt.datetime.now(dt.timezone.utc).replace(microsecond=0, tzinfo=None)
ago = lambda h: (now - dt.timedelta(hours=h)).isoformat() + "Z"


def row(i, h, prod, name, price, status, verdict, urls, tags, agent="shopper-agent-01", human="user-4821", payout=None):
    r = dict(orderId=f"DEMO-ORDER-{i:04d}", task="earbuds", ask="best earbuds under $200", condition="attack_hidden" if verdict == "BLOCK" else "clean",
             product=prod, productName=name, price=price, seller="Channel3", sites=[], decidedBy=[u.split("/")[2] for u in urls], status=status,
             createdAt=ago(h), updatedAt=ago(h), agentId=agent, humanId=human, verdict=verdict, decidingUrls=urls, reasonTags=tags,
             authorizationId=f"DEMO-AUTH-{i:04d}")
    if status in ("CAPTURED", "KEPT_BY_SHOPPER", "REFUNDED"):
        r["captureId"] = f"DEMO-CAPTURE-{i:04d}"
    if payout:
        r.update(payoutRecipient=payout[0], payoutAmount=payout[1], payoutBatchId=f"DEMO-PAYOUT-{i:04d}")
    return r


rows = [
    row(1, 50, "c3-earbuds-aurora", "Aurora ANC Earbuds", 129.0, "CAPTURED", "PASS", ["https://thoroughtesting.org/earbuds-review"], [], payout=("thoroughtesting.org", 2.58)),
    row(2, 44, "c3-earbuds-pulse", "Pulse Pro Earbuds", 89.0, "HELD", "BLOCK", ["https://dealzone-picks.example/best-earbuds"], ["hidden-text", "relay-instruction"], "shopper-agent-02", "user-1177"),
    row(3, 30, "c3-chair-ergo", "ErgoMesh Office Chair", 349.0, "CAPTURED", "PASS", ["https://longformreviews.net/chairs-2026"], [], "shopper-agent-02", "user-0932", ("longformreviews.net", 6.98)),
    row(4, 26, "c3-shoes-stride", "Stride Running Shoes", 119.0, "HELD", "BLOCK", ["https://flashprice.example/shoes-today-only"], ["catalog-contradiction"], human="user-2210"),
    row(5, 20, "c3-grinder-burr", "Burr Coffee Grinder", 79.0, "VOIDED", "BLOCK", ["https://dealzone-picks.example/grinders"], ["hidden-text"], "shopper-agent-03", "user-3305"),
    row(6, 14, "c3-pack-trail", "Trail 30L Backpack", 99.0, "REFUNDED", "PASS", ["https://thoroughtesting.org/backpacks"], [], payout=("thoroughtesting.org", 1.98)),
    row(7, 8, "c3-purifier-air", "AirPure Purifier", 199.0, "KEPT_BY_SHOPPER", "BLOCK", ["https://dealzone-picks.example/air"], ["relay-instruction"], "shopper-agent-03", "user-0932"),
    row(8, 3, "c3-earbuds-aurora", "Aurora ANC Earbuds", 129.0, "HELD", "BLOCK", ["https://hiddenpush.example/audio"], ["hidden-text", "relay-instruction"], human="user-5150"),
]
json.dump(rows, open("data/orders.json", "w"), indent=2)
print(f"wrote {len(rows)} demo orders to data/orders.json")
