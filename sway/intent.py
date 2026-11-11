"""Turn a shopper's free-text request into a shopping task.

  parse("I'm looking for a waterproof watch for swimming under $200")
    -> {"ask": "a waterproof watch for swimming", "query": "waterproof watch for swimming", "budget": 200.0}

preset() maps plain requests for one of the 8 benchmark tasks (a chip click, "earbuds",
"a backpack") onto that task, so they keep their cached, instant answers. Anything more
specific becomes a live task: real Channel3 products for exactly what was asked.
Deterministic and model-free, so it is fast, free and testable.
"""
import math
import re

MAX_LEN = 300


class CantShop(ValueError):
    """A request Sway can't turn into a shortlist. The message is shown to the shopper as is."""

# Words in front of the product itself: greetings, "can you", "I'm looking for", "find me".
_LEADS = [
    r"(?:hey|hi|hello|ok(?:ay)?|please|pls|so|yo|um+|hmm+)\b[\s,!.]*",
    r"(?:can|could|would|will) you\s+(?:please\s+)?",
    r"(?:please\s+)?help me\s+(?:to\s+)?",
    r"i\s*(?:'m|’m|\s+am)?\s*(?:really\s+|also\s+)?"
    r"(?:need|want|would like|'d like|’d like|looking for|shopping for|searching for|in the market for)\s+"
    r"(?:to\s+(?:buy|get|find|order)\s+)?",
    r"(?:find|get|buy|order|recommend|suggest|show|search for|look for|looking for|shopping for)\s+(?:me\s+)?",
]
_LEAD = re.compile(r"^(?:" + "|".join(_LEADS) + r")", re.I)
_TAIL = re.compile(r"[\s,;:.!?]*(?:\b(?:please|pls|thanks|thank you|thx)\b[\s,;:.!?]*)*$", re.I)

_AMOUNT = r"(\d[\d,]*(?:\.\d{1,2})?)\s*(k\b)?"
_MONEY = [
    re.compile(r"\$\s*" + _AMOUNT, re.I),
    re.compile(_AMOUNT + r"\s*(?:dollars|usd|bucks)\b", re.I),
    re.compile(r"\b(?:under|below|less than|no more than|max(?:imum)?|up to|budget(?:\s+(?:of|is))?)\s+" + _AMOUNT, re.I),
]
# Words that tie a budget to the sentence: "with a budget of", "for under", "and my budget is".
_MONEY_LEAD = re.compile(
    r"[\s,;.]*(?:\band\s+)?(?:\b(?:with|on)\s+(?:a\s+)?)?(?:\bmy\s+)?"
    r"(?:\b(?:budget(?:\s+(?:of|is))?|for\s+(?:under|below|less than|about|around)|under|below|less than|no more than|"
    r"not more than|at most|max(?:imum)?(?:\s+of)?|up to|within|around|about|for|price)\s*)*$",
    re.I,
)
_MONEY_TAIL = re.compile(r"^\s*(?:budget|max(?:imum)?|or less|tops)\b", re.I)

# Words that describe the request but are noise in a catalog search.
_FILLER = re.compile(r"\b(?:a|an|the|some|new|good|nice|decent|great|best|the best|quality|really)\b\s*", re.I)

# The 8 benchmark tasks, by the names a shopper would use for them.
PRESET_NAMES = {
    "running-shoes": ["running shoes", "running shoe", "running sneakers", "running trainers"],
    "earbuds": ["earbuds", "earbud", "wireless earbuds", "noise cancelling earbuds"],
    "coffee-grinder": ["coffee grinder", "burr grinder", "burr coffee grinder"],
    "office-chair": ["office chair", "ergonomic office chair", "ergonomic chair", "desk chair"],
    "carry-on": ["carry-on", "carry on", "carry-on suitcase", "carry on suitcase", "carry-on luggage"],
    "toothbrush": ["toothbrush", "electric toothbrush"],
    "air-purifier": ["air purifier"],
    "backpack": ["backpack", "laptop backpack"],
}


def _norm(s):
    return re.sub(r"\s+", " ", _FILLER.sub("", s.lower())).strip(" .,!?")


def _budget(text):
    """(budget or None, text with the budget phrase removed)."""
    for rx in _MONEY:
        m = rx.search(text)
        if not m:
            continue
        value = float(m.group(1).replace(",", "")) * (1000 if m.group(2) else 1)
        if not 1 <= value <= 100000:
            continue
        head = text[: m.start()]
        head = head[: _MONEY_LEAD.search(head).start()]  # always matches (every part is optional)
        tail = _MONEY_TAIL.sub("", text[m.end():])
        value = int(value) if value == int(value) else round(value, 2)
        return value, (head + " " + tail).strip()
    return None, text


def parse(text):
    """Free text -> {"ask", "query", "budget"}. Raises CantShop when no product is named."""
    text = re.sub(r"\s+", " ", str(text or "")).strip()[:MAX_LEN]

    def strip_leads(s):
        prev = None
        while prev != s:
            prev, s = s, _LEAD.sub("", s, count=1).strip()
        return s

    budget, rest = _budget(strip_leads(text))
    rest = strip_leads(_TAIL.sub("", rest))
    rest = _TAIL.sub("", rest).strip(" ,;:.!?\"'“”")
    ask = rest.lower()
    query = _norm(ask)
    if len(re.findall(r"[a-z]", query)) < 2:
        raise CantShop("Tell me which product you're looking for, for example: a waterproof watch for swimming.")
    return {"ask": ask[:120], "query": query[:120], "budget": budget}


def preset(parsed, tasks):
    """The benchmark task this request is a plain ask for, or None to shop live."""
    q = parsed["query"]
    for t in tasks:
        names = PRESET_NAMES.get(t["id"], []) + [_norm(t["ask"])]
        if q in names and parsed["budget"] in (None, t["budget"]):
            return t
    return None


def short_query(query):
    """The product alone, without what it is for: "running shoes for trail races" -> "running shoes"."""
    head = re.split(r"\s+(?:for|to|that|which|so|when|while|because)\s+", query, maxsplit=1)[0]
    return head if head != query and len(head) >= 3 else None


def live_id(parsed):
    slug = re.sub(r"[^a-z0-9]+", "-", parsed["query"]).strip("-")[:60].strip("-") or "item"
    return f"live-{slug}" + (f"-{int(parsed['budget'])}" if parsed["budget"] else "")


LIVE_ID = re.compile(r"^live-[a-z0-9-]{1,80}$")


def nice_budget(price):
    """A round budget at or just above the priciest product: 87 -> 90, 312 -> 325."""
    step = 10 if price < 100 else 25 if price < 500 else 50 if price < 2000 else 100
    return int(math.ceil(price / step) * step)
