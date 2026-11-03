# PayPal sandbox setup (you do this; about 10 minutes)

**Why:** there is no mock mode any more. Until sandbox keys are set, the shopper screens show no PayPal button and nothing can be paid. With sandbox keys, the same screens create real (test-money) PayPal orders. The hold, capture and void then show up in PayPal's own sandbox, which is what the judges need to see.

The "sandbox" is PayPal's practice world: fake money and fake accounts, but the same API as the real thing.

## Steps

1. **Log in at https://developer.paypal.com.** Use your normal PayPal account, or create one there. (Claude can't create accounts or type passwords for you.)
2. **Stay on the Sandbox side.** Top of the dashboard, the toggle should say **Sandbox**, not Live.
3. **Get your keys.** Go to **Apps & Credentials**. Either use the ready-made **Default Application**, or click **Create App**, name it `Sway` and choose type *Merchant*. On the app's page, copy the **Client ID** and the **Secret**.
4. **Put the keys in a private file.** In `D:\project\Project 2026\Oct\sway\site\` (the app folder), create a file named **`.env.local`** containing:
   ```
   PAYPAL_CLIENT_ID=paste-client-id-here
   PAYPAL_SECRET=paste-secret-here
   ```
   - This file is git-ignored (`.env*` in `.gitignore`), so it never gets pushed to GitHub.
   - **Don't paste the secret into chat.** Just tell Claude "keys are in".
5. **Find your test buyer.** Go to **Testing Tools → Sandbox Accounts** (older layouts: *Sandbox → Accounts*). PayPal made two accounts for you:
   - **Business** = the shop that receives the money.
   - **Personal** = the shopper who pays.

   Open the Personal one's "…" menu to see its email and password. You'll log in as this test shopper when you click PayPal's button on the shopper screen. Type those details yourself; Claude won't.
6. **Restart the site.** Stop and start the dev server (localhost:3300). PayPal's own button should now appear on the shopper screens.
7. **Check it worked.**
   - Do one purchase in the app.
   - Log in at https://www.sandbox.paypal.com with the **Business** test account.
   - Activity should show the payment as authorized, then either completed (captured) or voided.

## Good to know (affects the demo)
- **Hold, then decide:** an `AUTHORIZE` order holds the shopper's money for up to **29 days**. Captures succeed most reliably in the first **3 days** (the *honor period*). Sway decides in seconds to minutes, well inside that window.
- **Void is final:** a voided authorization can't be captured later, and voids always cancel the full amount (no partial void). That fits Sway: it's all or nothing, then offer the honest alternative as a new order.
- **Void needs the authorization id, not the order id.** The app already does this (`site/lib/server/paypal.ts`).
- **Shopper tap:** in this demo, the shopper approves once in PayPal, then Sway decides capture or void. Full hands-free buying would need *Vault* (a saved payment method). That's a later, optional step, and it's still an open question to check in sandbox.

Sources: [PayPal: Apps, scopes and credentials](https://developer.paypal.com/apps-scopes-and-credentials) · [PayPal: Sandbox accounts](https://developer.paypal.com/tools/sandbox/accounts/) · [PayPal: Authorize now, capture later](https://developer.paypal.com/docs/checkout/standard/customize/authorization) · [Void an authorization](https://docs.paypal.ai/payments/methods/paypal/void-an-authorization)
