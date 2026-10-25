# For publishers

If you write honest product reviews, affiliate attribution is already
breaking at AI checkout. Sway is how you get paid when an agent reads
your page and buys.

## What publishers are already seeing

Three voices from r/Affiliate on in-chat agent commerce (quoted from
public threads; links in the Devpost submission):

> "ChatGPT shopping tabs don't carry affiliate cookies. If the model picks a product from my page and the user buys inside the chat, I see nothing in the dashboard."

> "Honey broke our checkout attribution for years before anyone looked. Agentic checkout is Honey at scale."

> "Our top-5 pages used to drive ~18% of US affiliate revenue. YTD it's 6% and falling. The pageviews didn't move. The checkout left the page."

These are not Sway's claims — they are the problem Sway solves.

## The Payout math

- Average basket in Sway's benchmark: **$42.50**.
- Payout rate at launch: **2% of basket** (publisher share; configurable by merchant).
- Per attributed buy: **$0.80 to $1.00**.
- At scale: a page that attributably decides 1,000 agent purchases a month earns **~$800–$1,000**. The same page used to earn roughly the same via affiliate cookies when humans bought; agent checkout had taken that to zero.
- Payouts settle via PayPal; no new rail to integrate on the publisher side.

## Why it works at all

Sway's ablation gives each page a **causal weight** on the agent's
decision — the pick is re-run with your page removed, and the drop
(adjusted for the agent's own noise) is your attribution score. That
score is the Payout basis. No cookies, no referral links, no last-click
race. The one page that actually changed the pick gets paid.

## Call to action

**Sandbox publisher partner wanted.** One honest reviewer in a well-trafficked category (we're starting with earbuds, coffee grinders, air purifiers). We wire your three best pages into the catalog, run live agent shoppers against the real market, and show you the attribution rows and the Payouts transfers. Reach out via a GitHub issue on this repo.
