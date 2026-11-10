"""Generate docs/openapi.yaml from the Sway Python API routes.

The routes live in `sway/server.py`. This file mirrors them explicitly
(rather than reflecting on the handler) so the spec is reviewable and
stable under refactors. Keep this in sync with `do_GET` / `do_POST`.

Usage:

    python -m sway.openapi > docs/openapi.yaml
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

try:
    import yaml  # type: ignore
except Exception:  # pragma: no cover - keep stdlib-only when PyYAML is absent
    yaml = None  # type: ignore


SPEC = {
    "openapi": "3.1.0",
    "info": {
        "title": "Sway API",
        "version": "0.2.0",
        "summary": "Causal ablation + two-key verdict before PayPal captures.",
        "description": (
            "Sway runs the agent's shopping decision with each page it read ablated, "
            "scores each page's causal weight, and asks a second key — the Channel3 "
            "catalog — whether the deciding page tells the truth. The result is a "
            "pre-capture verdict ('allow' or 'block') and, when honest, a Payout "
            "destination."
        ),
        "contact": {"name": "Sway", "url": "https://github.com/midhunrajcharles/Sway"},
        "license": {"name": "MIT"},
    },
    "servers": [
        {"url": "http://127.0.0.1:8787", "description": "Local Sway API"},
        {"url": "https://sway-api-utg2.onrender.com", "description": "Render blueprint (sway-api service, live)"},
    ],
    "paths": {
        "/api/health": {
            "get": {
                "summary": "Service health",
                "operationId": "getHealth",
                "responses": {
                    "200": {
                        "description": "ok",
                        "content": {"application/json": {"schema": {"$ref": "#/components/schemas/Health"}}},
                    }
                },
            }
        },
        "/api/tasks": {
            "get": {
                "summary": "Benchmark tasks with real Channel3 products",
                "operationId": "getTasks",
                "responses": {
                    "200": {
                        "description": "tasks + conditions",
                        "content": {"application/json": {"schema": {"$ref": "#/components/schemas/TasksEnvelope"}}},
                    }
                },
            }
        },
        "/api/results": {
            "get": {
                "summary": "Latest benchmark rows for the AG Grid views",
                "operationId": "getResults",
                "parameters": [
                    {
                        "name": "run",
                        "in": "query",
                        "required": False,
                        "schema": {"type": "string"},
                        "description": "Specific results directory (defaults to the latest in results/).",
                    }
                ],
                "responses": {
                    "200": {
                        "description": "results rows + xray",
                        "content": {"application/json": {"schema": {"type": "object"}}},
                    }
                },
            }
        },
        "/api/evidence": {
            "get": {
                "summary": "Headline numbers for the /evidence page",
                "operationId": "getEvidence",
                "responses": {
                    "200": {
                        "description": "evidence payload",
                        "content": {"application/json": {"schema": {"$ref": "#/components/schemas/Evidence"}}},
                    }
                },
            }
        },
        "/api/pick": {
            "post": {
                "summary": "What the shopping agent would buy (baseline, no Sway check)",
                "operationId": "postPick",
                "requestBody": {
                    "required": True,
                    "content": {"application/json": {"schema": {"$ref": "#/components/schemas/TaskConditionBody"}}},
                },
                "responses": {
                    "200": {
                        "description": "agent pick + stability",
                        "content": {"application/json": {"schema": {"$ref": "#/components/schemas/Pick"}}},
                    }
                },
            }
        },
        "/api/verdict": {
            "post": {
                "summary": "Full Sway verdict before PayPal captures",
                "operationId": "postVerdict",
                "requestBody": {
                    "required": True,
                    "content": {"application/json": {"schema": {"$ref": "#/components/schemas/TaskConditionBody"}}},
                },
                "responses": {
                    "200": {
                        "description": "verdict + x-ray + one-sentence explanation",
                        "content": {"application/json": {"schema": {"$ref": "#/components/schemas/Verdict"}}},
                    }
                },
            }
        },
        "/api/payouts/credit": {
            "post": {
                "summary": "Pay the publisher that causally decided an honest buy",
                "operationId": "postPayoutsCredit",
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/json": {
                            "schema": {"type": "object", "properties": {"orderId": {"type": "string"}}, "required": ["orderId"]}
                        }
                    },
                },
                "responses": {
                    "200": {
                        "description": "payout result",
                        "content": {"application/json": {"schema": {"type": "object"}}},
                    }
                },
            }
        },
        "/api/publishers/onboard": {
            "post": {
                "summary": "Create a PayPal Partner Referrals session for a publisher",
                "operationId": "postPublishersOnboard",
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "properties": {
                                    "host": {"type": "string"},
                                    "publisherEmail": {"type": "string", "format": "email"},
                                    "returnUrl": {"type": "string", "format": "uri"},
                                },
                                "required": ["host"],
                            }
                        }
                    },
                },
                "responses": {
                    "200": {
                        "description": "referral session",
                        "content": {"application/json": {"schema": {"type": "object"}}},
                    }
                },
            }
        },
        "/api/webhooks/paypal": {
            "post": {
                "summary": "PayPal webhook ingest (signature-verified, idempotent by event id)",
                "operationId": "postWebhooksPaypal",
                "requestBody": {
                    "required": True,
                    "content": {"application/json": {"schema": {"type": "object"}}},
                },
                "responses": {
                    "200": {
                        "description": "received",
                        "content": {"application/json": {"schema": {"type": "object"}}},
                    },
                    "401": {"description": "signature verification failed"},
                },
            }
        },
        "/api/vault/test": {
            "post": {
                "summary": "Sandbox probe: AUTHORIZE + payment_source.paypal.vault_id",
                "operationId": "postVaultTest",
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "properties": {"vaultId": {"type": "string"}, "amount": {"type": "number"}},
                                "required": ["vaultId"],
                            }
                        }
                    },
                },
                "responses": {
                    "200": {
                        "description": "probe result",
                        "content": {"application/json": {"schema": {"type": "object"}}},
                    }
                },
            }
        },
    },
    "components": {
        "schemas": {
            "Health": {
                "type": "object",
                "properties": {
                    "ok": {"type": "boolean"},
                    "backend": {"type": "string"},
                    "model": {"type": "string"},
                    "k": {"type": "integer"},
                },
                "required": ["ok"],
            },
            "TaskConditionBody": {
                "type": "object",
                "properties": {
                    "task": {"type": "string", "example": "running-shoes"},
                    "condition": {
                        "type": "string",
                        "enum": [
                            "clean",
                            "honest_strong",
                            "attack_hidden",
                            "attack_redundant",
                            "deceptive_visible",
                            "covert_instruction",
                            "price_smear",
                            "fake_reviews",
                        ],
                    },
                },
                "required": ["task", "condition"],
            },
            "Product": {
                "type": "object",
                "properties": {
                    "id": {"type": "string"},
                    "name": {"type": "string"},
                    "price": {"type": "number"},
                    "seller": {"type": "string"},
                },
            },
            "Page": {
                "type": "object",
                "properties": {"id": {"type": "string"}, "url": {"type": "string", "format": "uri"}},
            },
            "Pick": {
                "type": "object",
                "properties": {
                    "task": {"type": "object"},
                    "products": {"type": "array", "items": {"$ref": "#/components/schemas/Product"}},
                    "condition": {"type": "string"},
                    "chosen": {"type": "string"},
                    "stability": {"type": "number", "format": "float"},
                    "pages": {"type": "array", "items": {"$ref": "#/components/schemas/Page"}},
                    "target": {"type": "string", "nullable": True},
                },
            },
            "Verdict": {
                "type": "object",
                "properties": {
                    "verdict": {"type": "string", "enum": ["allow", "block"]},
                    "sentence": {"type": "string"},
                    "chosen": {"type": "string"},
                    "stability": {"type": "number", "format": "float"},
                    "xray": {"type": "array", "items": {"type": "object"}},
                    "decider": {"type": "string", "nullable": True},
                    "payout_eligible": {"type": "boolean"},
                },
            },
            "Evidence": {
                "type": "object",
                "properties": {
                    "main_run": {"type": "string"},
                    "main": {"type": "array", "items": {"type": "object"}},
                    "subtle": {"type": "array", "items": {"type": "object"}},
                    "model": {"type": "string"},
                    "k": {"type": "integer"},
                },
            },
            "TasksEnvelope": {
                "type": "object",
                "properties": {
                    "conditions": {"type": "array", "items": {"type": "string"}},
                    "tasks": {"type": "array", "items": {"type": "object"}},
                },
            },
        }
    },
    "tags": [{"name": "Sway", "description": "The two-key verdict API."}],
}


def to_yaml(spec: dict) -> str:
    if yaml is not None:
        return yaml.safe_dump(spec, sort_keys=False, width=100)
    # Minimal JSON-in-YAML fallback: JSON is valid YAML 1.2.
    return json.dumps(spec, indent=2)


def main() -> int:
    out = Path(__file__).resolve().parent.parent / "docs" / "openapi.yaml"
    text = to_yaml(SPEC)
    if "--stdout" in sys.argv:
        sys.stdout.write(text)
    else:
        out.write_text(text, encoding="utf-8")
        print(f"wrote {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
