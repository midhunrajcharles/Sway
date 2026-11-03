# Bryntum Scheduler (payout schedule)

`/ops/payouts` shows payout batches by publisher over time using Bryntum Scheduler. It reads the same
`/api/ledger` data as the audit grid on `/ops`. It is **off by default**.

## Why it is behind a flag

Bryntum Scheduler is commercial software. The npm package used here, `@bryntum/scheduler-trial`, is the
evaluation build. A trial is meant for evaluation, so do not leave it running on a public deployment. Check
Bryntum's licence terms (`node_modules/@bryntum/scheduler-react/licenses.md`) before hosting it publicly; a
public deployment needs a purchased licence and the licensed `@bryntum/scheduler` package.

With the flag off, `/ops/payouts` renders a short notice and the Bryntum code is never loaded by any other route.

## Turn it on (local / trial)

```bash
cd site
npm install            # pulls @bryntum/scheduler (aliased to the trial build) and @bryntum/scheduler-react
echo NEXT_PUBLIC_SWAY_BRYNTUM=1 >> .env.local
npm run dev            # then open http://localhost:3300/ops/payouts
```

`NEXT_PUBLIC_*` values are inlined at build time, so rebuild (`npm run build`) after changing it.
When the flag is on, `/ops` also shows a "Payout schedule" link.

## How the trial is wired

`site/package.json` aliases the trial build to the name the React wrapper imports:

```json
"@bryntum/scheduler": "npm:@bryntum/scheduler-trial@^7.3.8",
"@bryntum/scheduler-react": "^7.3.8"
```

No key is needed for the trial build; it carries Bryntum's trial notice. It is a public npm package, so no
registry login is involved.

## Moving to a paid licence

1. Buy a licence, then log in to Bryntum's private registry (`npm config set @bryntum:registry https://npm.bryntum.com`, credentials from your Bryntum account).
2. Replace the alias with the licensed package: `npm uninstall @bryntum/scheduler && npm install @bryntum/scheduler@<version>`.
3. Keep `@bryntum/scheduler-react`. No code change is needed: the app imports `@bryntum/scheduler` either way.
4. Set the flag in the deployment environment. On Render, add `NEXT_PUBLIC_SWAY_BRYNTUM=1` to `sway-site` and redeploy. Do not commit registry credentials.

## Behaviour notes

- Read-only: no dragging or editing of batches.
- One row per publisher (`payoutRecipient`), one bar per payout batch (`payoutBatchId`). The ledger stores the
  order time, not a separate payout time, so a bar starts at the order time and is drawn twelve hours wide, labelled with the amount (batch ids are in the table below it).
- Only batches created after the audit fields were added appear (older ledger rows have no payout fields).
- Light or dark Bryntum theme (Svalbard) is chosen once at load from `data-theme` or the OS setting.
- Accessibility: the scheduler is labelled, and a plain table with the same batches follows it for screen readers.
