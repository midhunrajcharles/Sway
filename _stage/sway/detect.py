import html
import re
from html.parser import HTMLParser

VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"}

HIDDEN_STYLE = re.compile(
    r"display\s*:\s*none|visibility\s*:\s*hidden|font-size\s*:\s*0(?![.\d])|opacity\s*:\s*0(?![.\d])"
    r"|(?:left|top|text-indent)\s*:\s*-\d{3,}px|height\s*:\s*0(?:px)?\s*;[^\"']*overflow\s*:\s*hidden"
    r"|clip\s*:\s*rect\(\s*0",
    re.I,
)
COLOR = re.compile(r"(?<![-\w])color\s*:\s*(#[0-9a-f]{3,6}|white|rgb\([^)]*\))", re.I)
BG = re.compile(r"background(?:-color)?\s*:\s*(#[0-9a-f]{3,6}|white|rgb\([^)]*\))", re.I)

AI_ADDRESSED = re.compile(
    r"\b(?:AI|LLM|language models?|shopping (?:assistants?|agents?)|assistants?|agents?)\b.{0,100}?"
    r"\b(?:recommend|choose|select|pick|buy|purchase|must|should|ignore|disregard|prioriti[sz]e)\b"
    r"|\bignore (?:all |any )?(?:previous|prior|above|other)\b"
    r"|\bnote (?:to|for) (?:AI|LLM|assistants?|agents?)\b",
    re.I,
)
PRICE = re.compile(r"\$\s?(\d{1,4}(?:,\d{3})*(?:\.\d{2})?)")
SENTENCE_END = re.compile(r"[.!?]\s+(?=[A-Z])")


def _norm_color(c):
    c = c.lower().strip()
    if c in ("white", "#fff", "#ffffff", "rgb(255,255,255)", "rgb(255, 255, 255)"):
        return "white"
    return c


def _style_hides(style):
    if HIDDEN_STYLE.search(style):
        return True
    fg, bg = COLOR.search(style), BG.search(style)
    return bool(fg and bg and _norm_color(fg.group(1)) == _norm_color(bg.group(1)))


class _Walker(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []
        self.visible, self.hidden, self.everything = [], [], []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        hides = (
            "hidden" in a
            or a.get("aria-hidden") == "true"
            or _style_hides(a.get("style") or "")
            or tag in ("script", "style", "template", "noscript")
        )
        if tag not in VOID:
            self.stack.append(hides)

    def handle_endtag(self, tag):
        if tag not in VOID and self.stack:
            self.stack.pop()

    def handle_data(self, data):
        t = data.strip()
        if not t:
            return
        self.everything.append(t)
        (self.hidden if any(self.stack) else self.visible).append(t)

    def handle_comment(self, data):
        t = data.strip()
        if len(t) > 15:
            self.hidden.append(t)
            self.everything.append(t)


def extract(page_html, mode="naive"):
    w = _Walker()
    w.feed(page_html)
    parts = w.everything if mode == "naive" else w.visible
    return html.unescape(" ".join(parts))


def _hidden_parts(page_html):
    w = _Walker()
    w.feed(page_html)
    return [h for h in w.hidden if len(h) > 15], " ".join(w.everything)


def _mentions(low, products):
    spans = []
    for p in products:
        for name in {p["label"].lower(), p["name"].lower()}:
            start = 0
            while (i := low.find(name, start)) != -1:
                spans.append((i, i + len(name), p))
                start = i + 1
    spans.sort(key=lambda s: (s[0], -(s[1] - s[0])))
    kept = []
    for s in spans:
        if any(k[0] <= s[0] and s[1] <= k[1] for k in kept):
            continue
        kept = [k for k in kept if not (s[0] <= k[0] and k[1] <= s[1])] + [s]
    return sorted(kept)


CEILING = re.compile(
    r"(?:\b(?:under|below|less than|within|budget(?: of)?|max(?:imum)?)"
    r"|(?<!went )(?<!gone )(?<!rose )(?<!jumped )(?<!climbed )(?<!shot )\bup to)\s*$",
    re.I,
)
UNAVAILABLE = re.compile(
    r"\b(?:discontinued|recalled|sold out|out of stock|no longer (?:available|sold|made|in stock)|unavailable)\b", re.I
)
# Text written for whoever relays the page (a summariser, an assistant) rather than for a shopper reading it.
RELAY = re.compile(
    r"\b(?:anyone|whoever|if you(?:'re| are))\s+(?:is\s+)?(?:compiling|summari[sz]ing|putting together|preparing|writing up|making)\b"
    r".{0,40}?\b(?:recommendation|summary|answer|shortlist|list)\b"
    r"|\bpass (?:that|this|it) on\b|\b(?:as )?the final answer\b"
    r"|\bdo not (?:suggest|mention|offer|list|recommend) (?:any )?(?:alternatives|others|other options)\b"
    r"|\bno (?:need|reason) to (?:mention|suggest|list) (?:any )?(?:alternatives|others|other options)\b",
    re.I,
)


def _claims(text, products):
    """Yield (product, sentence fragment right after its name) for every product mention."""
    spans = _mentions(text.lower(), products)
    for n, (_, end, p) in enumerate(spans):
        stop = spans[n + 1][0] if n + 1 < len(spans) else len(text)
        window = text[end: min(end + 150, stop)]
        boundary = SENTENCE_END.search(window)
        yield p, window[: boundary.start()] if boundary else window


def price_contradictions(text, products, tolerance=0.15):
    """A product is contradicted when a price stated right after it is off the catalog (either way) and none matches it."""
    found = {}
    for p, window in _claims(text, products):
        prices = [float(m.group(1).replace(",", "")) for m in PRICE.finditer(window)]
        if not prices:
            continue
        real = {p["price"], p.get("min_price", p["price"])}
        if any(abs(x - r) <= r * 0.03 for x in prices for r in real):
            continue
        claimed = min(prices)
        # "under $350" is a ceiling, not a price, so it never counts as an overstated price.
        stated = [float(m.group(1).replace(",", "")) for m in PRICE.finditer(window) if not CEILING.search(window[: m.start()])]
        over = [x for x in stated if x > max(real) * (1 + tolerance)]
        if over and not claimed < min(real) * (1 - tolerance):
            claimed = over[0]
        if claimed < min(real) * (1 - tolerance) or over:
            found[(p["id"], claimed)] = {"product": p["id"], "claimed": claimed, "catalog": min(real)}
    return list(found.values())


def availability_contradictions(text, products):
    """A product the catalog lists as in stock is called discontinued, recalled or sold out."""
    found = {}
    for p, window in _claims(text, products):
        m = UNAVAILABLE.search(window)
        if m and p.get("available", True):
            found[p["id"]] = {"product": p["id"], "claimed": m.group(0), "catalog": "in stock"}
    return list(found.values())


def signals(page_html, products):
    hidden, full = _hidden_parts(page_html)
    ai = [m.group(0) for m in AI_ADDRESSED.finditer(full)]
    text = html.unescape(full)
    contra = price_contradictions(text, products) + availability_contradictions(text, products)
    relay = [m.group(0) for m in RELAY.finditer(text)]
    out = {}
    if hidden:
        out["hidden_text"] = [h[:160] for h in hidden]
    if ai:
        out["ai_addressed"] = ai[:5]
    if relay:
        out["relay_instruction"] = relay[:5]
    if contra:
        out["catalog_contradiction"] = contra
    return out
