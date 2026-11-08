import hashlib
import json
import os
import subprocess
import threading
import time
import urllib.error
import urllib.request
from pathlib import Path

CACHE = Path(__file__).resolve().parent.parent / "data" / "cache"
_lock = threading.Lock()

OPENAI_COMPAT = {
    "openai": ("https://api.openai.com/v1", "OPENAI_API_KEY"),
    "groq": ("https://api.groq.com/openai/v1", "GROQ_API_KEY"),
    "openrouter": ("https://openrouter.ai/api/v1", "OPENROUTER_API_KEY"),
}


def _post(url, body, headers, retries=4):
    data = json.dumps(body).encode()
    for attempt in range(retries):
        req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json", "User-Agent": "sway-spike/0.1", **headers})
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                return json.loads(r.read().decode())
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 502, 503, 529) and attempt < retries - 1:
                time.sleep(2 ** attempt * 2)
                continue
            raise RuntimeError(f"{e.code} {e.read().decode()[:300]}") from e


class Model:
    def __init__(self, backend, model, temperature=1.0, cache_as=None):
        self.backend, self.model, self.temperature = backend, model, temperature
        # cache_as="claude-cli/haiku": look up and store cache entries under that backend/model
        # identity, so a deployment on another backend reuses the committed benchmark cache.
        self.cache_id = tuple(cache_as.split("/", 1)) if cache_as else (backend, model)
        self.calls = 0
        self.cache_hits = 0

    def _key(self, system, user, sample):
        h = hashlib.sha256(json.dumps([self.cache_id[0], self.cache_id[1], self.temperature, system, user, sample]).encode()).hexdigest()
        return CACHE / h[:2] / f"{h}.json"

    def complete(self, system, user, sample=0):
        path = self._key(system, user, sample)
        if path.exists():
            with _lock:
                self.cache_hits += 1
            return json.loads(path.read_text(encoding="utf-8"))["text"]
        text = self._call(system, user)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps({"text": text}), encoding="utf-8")
        with _lock:
            self.calls += 1
        return text

    def _call(self, system, user):
        b = self.backend
        if b in OPENAI_COMPAT:
            base, env = OPENAI_COMPAT[b]
            base = os.environ.get("OPENAI_BASE_URL", base) if b == "openai" else base
            r = _post(
                f"{base}/chat/completions",
                {"model": self.model, "temperature": self.temperature, "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}]},
                {"Authorization": f"Bearer {os.environ[env]}"},
            )
            return r["choices"][0]["message"]["content"]
        if b == "anthropic":
            r = _post(
                "https://api.anthropic.com/v1/messages",
                {"model": self.model, "max_tokens": 400, "temperature": self.temperature, "system": system, "messages": [{"role": "user", "content": user}]},
                {"x-api-key": os.environ["ANTHROPIC_API_KEY"], "anthropic-version": "2023-06-01"},
            )
            return "".join(c.get("text", "") for c in r["content"])
        if b == "gemini":
            r = _post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent",
                {"systemInstruction": {"parts": [{"text": system}]}, "contents": [{"role": "user", "parts": [{"text": user}]}], "generationConfig": {"temperature": self.temperature}},
                {"x-goog-api-key": os.environ["GEMINI_API_KEY"]},
            )
            return "".join(p.get("text", "") for p in r["candidates"][0]["content"]["parts"])
        if b == "claude-cli":
            sys_file = CACHE / "system" / (hashlib.sha256(system.encode()).hexdigest()[:16] + ".txt")
            if not sys_file.exists():
                sys_file.parent.mkdir(parents=True, exist_ok=True)
                sys_file.write_text(system, encoding="utf-8")
            cmd = [
                "claude", "-p", "--model", self.model, "--tools", "", "--strict-mcp-config",
                "--no-session-persistence", "--setting-sources", "", "--system-prompt-file", str(sys_file), "--output-format", "json",
            ]
            for attempt in range(3):
                try:
                    p = subprocess.run(cmd, input=user, capture_output=True, text=True, encoding="utf-8", timeout=300, shell=os.name == "nt")
                except subprocess.TimeoutExpired:
                    if attempt < 2:
                        continue
                    raise
                out = json.loads(p.stdout or "{}")
                if not out.get("is_error") and "result" in out:
                    return out["result"]
                msg = str(out.get("result") or p.stderr)[:300]
                if "limit" in msg.lower() or attempt == 2:
                    raise RuntimeError(f"claude-cli: {msg}")
                time.sleep(5)
        raise ValueError(f"unknown backend {b}")
