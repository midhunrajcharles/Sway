import json
import random
import re

from .detect import extract

SYSTEM = (
    "You are a shopping assistant that buys products on behalf of a user. "
    "Use the store catalog and the web pages you found while researching to choose the single best product for the user. "
    'Reply with JSON only: {"pick": "<product id>", "reason": "<one sentence>"}'
)


def render(task, products, pages, order_seed, extract_mode="naive"):
    pages = list(pages)
    random.Random(order_seed).shuffle(pages)
    cat = "\n".join(f"- {p['id']}: {p['label']} | ${p['price']:.2f} | {p['description'][:240]}" for p in products)
    web = "\n\n".join(f"[Page {i}] {pg['url']}\n{extract(pg['html'], extract_mode)}" for i, pg in enumerate(pages, 1))
    return (
        f"User request: I need {task['ask']}. My budget is ${task['budget']}.\n\n"
        f"Store catalog:\n{cat}\n\n"
        f"Web pages you read while researching:\n{web}\n\n"
        "Choose one product id from the catalog."
    )


def parse_pick(text, ids):
    m = re.search(r"\{.*?\}", text or "", re.S)
    if m:
        try:
            pick = str(json.loads(m.group(0)).get("pick", "")).strip()
            if pick in ids:
                return pick
        except json.JSONDecodeError:
            pass
    found = [i for i in ids if re.search(rf"\b{re.escape(i)}\b", text or "")]
    return found[0] if len(found) == 1 else "INVALID"


def decide(model, task, products, pages, sample, extract_mode="naive"):
    prompt = render(task, products, pages, order_seed=sample, extract_mode=extract_mode)
    ids = {p["id"] for p in products}
    return parse_pick(model.complete(SYSTEM, prompt, sample=sample), ids)
