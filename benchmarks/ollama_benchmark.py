"""Local-only Ollama benchmark. Python standard library; no model downloads."""
import argparse
import datetime as dt
import json
import math
import platform
import statistics
import sys
import urllib.error
import urllib.request
from pathlib import Path

PROMPT = "Explain how a rainbow forms in clear English, including refraction, reflection, and dispersion. Write approximately 200 words."
OPTIONS = {"temperature": 0, "seed": 42, "num_predict": 256, "num_ctx": 2048}
FIELDS = ("eval_count", "eval_duration", "prompt_eval_count", "prompt_eval_duration", "load_duration", "total_duration")

class BenchmarkError(Exception):
    pass

class Client:
    def __init__(self, timeout=180):
        self.timeout = timeout
        self.opener = urllib.request.build_opener(urllib.request.ProxyHandler({}), NoRedirect())

    def request(self, endpoint, payload=None):
        data = None if payload is None else json.dumps(payload).encode()
        req = urllib.request.Request("http://127.0.0.1:11434/api/" + endpoint, data=data, headers={"Content-Type": "application/json"})
        try:
            with self.opener.open(req, timeout=self.timeout) as response:
                value = json.load(response)
            if not isinstance(value, dict) or "error" in value:
                raise BenchmarkError("Invalid API response")
            return value
        except (OSError, ValueError, urllib.error.URLError) as exc:
            raise BenchmarkError("Local Ollama request failed (connection, timeout, HTTP or JSON error)") from exc

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise BenchmarkError("HTTP redirects are forbidden")

def measurement(response):
    if not isinstance(response, dict) or response.get("done") is not True:
        raise BenchmarkError("Incomplete generation")
    result = {}
    for field in FIELDS:
        value = response.get(field)
        if type(value) is not int or value < 0:
            raise BenchmarkError("Invalid metric: " + field)
        result[field] = value
    if result["eval_count"] == 0 or result["eval_duration"] == 0 or result["total_duration"] < result["eval_duration"]:
        raise BenchmarkError("Invalid generation duration or token count")
    result["tokens_per_second"] = result["eval_count"] * 1_000_000_000 / result["eval_duration"]
    if not math.isfinite(result["tokens_per_second"]):
        raise BenchmarkError("Non-finite throughput")
    return result

def run(client, models, repetitions=3):
    if repetitions < 3 or not models or len(set(models)) != len(models):
        raise BenchmarkError("Use distinct models and at least three repetitions")
    version = client.request("version").get("version")
    if not isinstance(version, str) or not version:
        raise BenchmarkError("Missing Ollama version")
    tags = client.request("tags").get("models", [])
    if not isinstance(tags, list) or not all(isinstance(item, dict) for item in tags):
        raise BenchmarkError("Invalid model inventory")
    installed = {item.get("name"): item for item in tags}
    selected = []
    for model in models:
        tag = installed.get(model)
        if not tag or not isinstance(tag.get("digest"), str) or not tag["digest"]:
            raise BenchmarkError("Requested model is not installed with an exact digest: " + model)
        selected.append((model, tag["digest"]))
    report = {"schema_version": "1.0", "status": "measured", "started_at": dt.datetime.now(dt.timezone.utc).isoformat(), "ollama_version": version,
              "environment": {"os": platform.system(), "os_release": platform.release(), "architecture": platform.machine(), "hardware": "Not collected automatically; GPU residency, RAM and VRAM usage unverified."},
              "methodology": {"prompt": PROMPT, "options": OPTIONS.copy(), "warmups_per_model": 1, "repetitions": repetitions, "order": "sequential model blocks", "duration_unit": "nanoseconds", "throughput": "eval_count * 1e9 / eval_duration", "keep_alive": "5m", "cache_policy": "Repeated identical prompt; Ollama may reuse prompt cache. Warm load and cached prompt conditions."}, "models": []}
    for model, digest in selected:
        print("Warm-up: " + model, flush=True)
        payload = {"model": model, "prompt": PROMPT, "stream": False, "options": OPTIONS.copy(), "keep_alive": "5m"}
        measurement(client.request("generate", payload))
        runs = []
        for index in range(repetitions):
            result = measurement(client.request("generate", payload))
            result["repetition"] = index + 1
            runs.append(result)
            print(f"  {index + 1}/{repetitions}: {result['tokens_per_second']:.2f} token/s", flush=True)
        report["models"].append({"model": model, "digest": digest, "runs": runs, "median_tokens_per_second": statistics.median(r["tokens_per_second"] for r in runs)})
        # Unload each model so the next block does not inherit its memory residency.
        client.request("generate", {"model": model, "keep_alive": 0})
    report["completed_at"] = dt.datetime.now(dt.timezone.utc).isoformat()
    return report

def save(report, output):
    target = Path(output)
    target.parent.mkdir(parents=True, exist_ok=True)
    # Exclusive creation prevents accidentally overwriting a previous measurement.
    with target.open("x", encoding="utf-8") as handle:
        json.dump(report, handle, indent=2, allow_nan=False)
        handle.write("\n")

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--models", nargs="+", default=["gemma3:4b", "mistral:7b-instruct-q4_0"])
    parser.add_argument("--repetitions", type=int, default=3)
    parser.add_argument("--timeout", type=float, default=180)
    parser.add_argument("--output", default="results/ollama-" + dt.datetime.now(dt.timezone.utc).strftime("%Y%m%dT%H%M%S%fZ") + ".json")
    args = parser.parse_args()
    if not math.isfinite(args.timeout) or args.timeout <= 0:
        parser.error("timeout must be finite and positive")
    try:
        report = run(Client(args.timeout), args.models, args.repetitions)
        save(report, args.output)
        print("Saved complete measured report.")
        return 0
    except (BenchmarkError, OSError):
        print("Benchmark failed. No complete report published; check local Ollama, installed models and output permissions.", file=sys.stderr)
        return 1

if __name__ == "__main__":
    sys.exit(main())
