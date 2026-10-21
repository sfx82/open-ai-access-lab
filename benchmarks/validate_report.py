"""Validate saved reports offline; never start inference."""
import argparse
import datetime as dt
import hashlib
import json
import math
import re
import statistics
from pathlib import Path

FIELDS = ("eval_count", "eval_duration", "prompt_eval_count", "prompt_eval_duration", "load_duration", "total_duration")

def validate(report):
    def require(condition, message):
        if not condition:
            raise ValueError(message)
    require(isinstance(report, dict), "Report must be an object")
    require(report.get("schema_version") == "1.0" and report.get("status") == "measured", "Unsupported schema/status")
    dates = [dt.datetime.fromisoformat(report[k]) for k in ("started_at", "completed_at")]
    require(all(d.tzinfo is not None for d in dates) and dates[0] <= dates[1], "Invalid timestamps")
    require(isinstance(report.get("ollama_version"), str) and bool(report["ollama_version"]), "Missing Ollama version")
    require(isinstance(report.get("environment"), dict) and all(isinstance(v, str) for v in report["environment"].values()), "Invalid environment")
    method = report["methodology"]
    require(isinstance(method, dict), "Invalid methodology")
    require(isinstance(method.get("prompt"), str) and bool(method["prompt"]), "Missing prompt")
    require(type(method.get("repetitions")) is int and method["repetitions"] >= 3, "Too few repetitions")
    require(type(method.get("warmups_per_model")) is int and method["warmups_per_model"] >= 1, "Missing warm-up")
    require(method.get("duration_unit") == "nanoseconds", "Invalid duration unit")
    options = method["options"]
    require(isinstance(options, dict) and all(k in options for k in ("temperature", "seed", "num_predict", "num_ctx")), "Missing options")
    require(all(type(v) in (int, float) and math.isfinite(v) for v in options.values()), "Invalid options")
    require(type(options["num_predict"]) is int and options["num_predict"] > 0 and type(options["num_ctx"]) is int and options["num_ctx"] > 0, "Invalid token limits")
    models = report["models"]
    require(isinstance(models, list) and bool(models), "Missing models")
    ids = set()
    for model in models:
        name = model["model"]
        require(isinstance(name, str) and bool(name) and name not in ids, "Invalid/duplicate model ID")
        ids.add(name)
        require(isinstance(model.get("digest"), str) and re.fullmatch(r"[a-f0-9]{64}", model["digest"]) is not None, "Invalid digest")
        runs = model["runs"]
        require(isinstance(runs, list) and len(runs) == method["repetitions"], "Wrong run count")
        for index, run in enumerate(runs, 1):
            require(run.get("repetition") == index and type(run["repetition"]) is int, "Invalid repetition ID")
            require(all(type(run.get(k)) is int and run[k] >= 0 for k in FIELDS), "Invalid metric")
            require(0 < run["eval_count"] <= options["num_predict"] and run["eval_duration"] > 0, "Invalid generation")
            require(run["total_duration"] >= run["eval_duration"] + run["prompt_eval_duration"] + run["load_duration"], "Inconsistent durations")
            expected = run["eval_count"] * 1e9 / run["eval_duration"]
            require(type(run.get("tokens_per_second")) in (int, float) and math.isclose(run["tokens_per_second"], expected, rel_tol=1e-12), "Invalid throughput")
        expected = statistics.median(r["tokens_per_second"] for r in runs)
        require(type(model.get("median_tokens_per_second")) in (int, float) and math.isclose(model["median_tokens_per_second"], expected, rel_tol=1e-12), "Invalid median")
    return report

def compare_source(public, source_path):
    raw = Path(source_path).read_bytes()
    original = json.loads(raw)
    validate(original)
    measured = {k: v for k, v in public.items() if k != "publication"}
    if measured != original or public.get("publication", {}).get("source_sha256") != hashlib.sha256(raw).hexdigest():
        raise ValueError("Public measurements or source checksum differ")

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("report")
    parser.add_argument("--source")
    args = parser.parse_args()
    try:
        report = validate(json.loads(Path(args.report).read_text(encoding="utf-8")))
        if args.source:
            compare_source(report, args.source)
        print(f"Valid: {len(report['models'])} models; {sum(len(m['runs']) for m in report['models'])} measured repetitions")
        return 0
    except (ValueError, KeyError, TypeError, OSError, OverflowError):
        print("Invalid report or source mismatch")
        return 1

if __name__ == "__main__":
    raise SystemExit(main())
