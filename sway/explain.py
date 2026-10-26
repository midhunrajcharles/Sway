"""Turn a Sway check into the one calm sentence a shopper reads, plus short reasons for the ops view."""
from urllib.parse import urlparse


def _site(url):
    return urlparse(url).netloc or url


def reasons(sig, products):
    """Plain-words reasons for one page's signals."""
    by_id = {p["id"]: p for p in products}
    out = []
    if "hidden_text" in sig:
        out.append("it hides text from people that only an AI would read")
    if "ai_addressed" in sig:
        out.append("it gives orders to AI shopping assistants")
    if "relay_instruction" in sig:
        out.append("it tells whoever summarises it what answer to give")
    for c in sig.get("catalog_contradiction", []):
        name = by_id.get(c["product"], {}).get("name", c["product"])
        if isinstance(c["claimed"], (int, float)):
            out.append(f"it says the {name} costs ${c['claimed']:.2f}, but the store catalog says ${c['catalog']:.2f}")
        else:
            out.append(f"it says the {name} is {c['claimed']}, but the store catalog says it is in stock")
    return out


def verdict_sentence(result, products, pages):
    """One or two sentences for the shopper. PASS stays quiet; BLOCK says what, why, and the alternative."""
    by_id = {p["id"]: p for p in products}
    chosen = by_id.get(result["chosen"])
    if result["verdict"] == "PASS":
        honest = result.get("decided_by_honest") or []
        if honest and chosen:
            url = next((pg["url"] for pg in pages if pg["id"] == honest[0]), "")
            return f"Paid for the {chosen['name']}. A trustworthy page ({_site(url)}) made the case, and nothing looked planted."
        return f"Paid for the {chosen['name']}." if chosen else "Paid."
    page_by_id = {pg["id"]: pg for pg in pages}
    blocked = [page_by_id[i] for i in result["blocked_pages"] if i in page_by_id]
    sites = " and ".join(sorted({_site(pg["url"]) for pg in blocked}))
    sig = {}
    for x in result["xray"]:
        if x["unit"] == result["blocked_by"]:
            for s in x["signals"].values():
                for k, v in s.items():
                    sig.setdefault(k, v if isinstance(v, list) else [v])
    why = reasons(sig, products)
    alt = by_id.get(result["alternative"])
    first = f"I paused the payment for the {chosen['name']} (${chosen['price']:.2f})." if chosen else "I paused the payment."
    second = f" One site, {sites}, decided it" if len(blocked) == 1 else f" Planted pages ({sites}) decided it"
    second += f", and {why[0]}." if why else "."
    third = ""
    if alt and chosen:
        diff = chosen["price"] - alt["price"]
        money = f", ${diff:.2f} less" if diff > 0.005 else (f", ${-diff:.2f} more" if diff < -0.005 else "")
        third = f" Without {'that page' if len(blocked) == 1 else 'those pages'} I would have picked the {alt['name']} (${alt['price']:.2f}{money}). Switch to it?"
    return first + second + third
