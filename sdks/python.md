# Python SDK (/sdks/python)

[Download SDK](/__downloads/sdk/python.zip)

## Intro [#intro]

The Sway API SDK provides access to the Sway API REST APIs.

Sway runs the agent's shopping decision with each page it read ablated, scores each page's causal weight, and asks a second key — the Channel3 catalog — whether the deciding page tells the truth. The result is a pre-capture verdict ('allow' or 'block') and, when honest, a Payout destination.

## Installation [#installation]

Add the SDK to your project from its folder, with whichever package manager your project uses. Give each tool a path containing a slash, such as `../sway-api` — a bare folder name is looked up on PyPI instead, and resolves to whatever project holds that name there:

```bash
pip install <path-to-sdk>
```

```bash
uv add <path-to-sdk>
```

```bash
poetry add <path-to-sdk>
```

## Quick Start [#quick-start]

### Synchronous client [#synchronous-client]

Construct `SwayApiClient` with keyword arguments, and call `close()` when you are done. Every argument is optional.

```python
from sway_api import SwayApiClient

client = SwayApiClient(environment="production")

client.close()
```

Alternatively, scope it — `with SwayApiClient(...) as client:` closes the pool on exit.

### Asynchronous client [#asynchronous-client]

`AsyncSwayApiClient` mirrors `SwayApiClient` with **identical method names**, and every endpoint method is a coroutine. It takes the same arguments, with some differences — for example, the transport argument is `custom_async_http_client`.

```python
from asyncio import run

from sway_api import AsyncSwayApiClient

async def main() -> None:
    client = AsyncSwayApiClient(environment="production")
    await client.aclose()

run(main())
```

Alternatively, scope it — `async with AsyncSwayApiClient(...) as client:` closes the pool on exit.