# TypeScript SDK (/sdks/typescript)

[Download SDK](/__downloads/sdk/typescript.zip)

## Intro [#intro]

The Sway API SDK provides access to the Sway API REST APIs.

Sway runs the agent's shopping decision with each page it read ablated, scores each page's causal weight, and asks a second key — the Channel3 catalog — whether the deciding page tells the truth. The result is a pre-capture verdict ('allow' or 'block') and, when honest, a Payout destination.

## Installation [#installation]

The SDK compiles to `dist/` before it can be referenced — run its `build` script once in the SDK folder, then add it to your project by path:

```bash
npm install <path-to-sdk>
```

## Quick Start [#quick-start]

Create one client and reuse it. Configure its behaviour through `ClientOptions`.

```ts
import { ServerEnvironment, SwayApiClient } from "sway-api";

const client = new SwayApiClient({ serverEnvironment: ServerEnvironment.Production });
```

Nothing in `ClientOptions` is required — `new SwayApiClient()` compiles — and each option left out falls back to its default. `serverEnvironment` is spelled out above so the environment a call reaches is visible where the client is built rather than inherited silently.

### From CommonJS [#from-commonjs]

The package ships both dialects from a single entry, so `require` works with full types. In a TypeScript CommonJS file use the `import ... = require(...)` form — a plain destructuring `require` runs fine but gives you `any`.

```ts
import sdk = require("sway-api");

const client = new sdk.SwayApiClient({ serverEnvironment: sdk.ServerEnvironment.Production });
```