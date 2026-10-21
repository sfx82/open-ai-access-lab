# Benchmark methodology - V0.1

## Scope and provenance

This protocol measures local Ollama generation throughput. A completed runner report is a measured artifact, not a claim of independent validation. Publication requires manual review. The default models are `gemma3:4b` and `mistral:7b-instruct-q4_0`. Exact installed names and content digests from `/api/tags`, Ollama version from `/api/version`, UTC start/end timestamps and schema version `1.0` are saved. All models are checked before generation begins. Models are never downloaded by this runner.

## Fixed prompt

> Explain how a rainbow forms in clear English, including refraction, reflection, and dispersion. Write approximately 200 words.

Every request uses this prompt without a conversation history. Options: `temperature=0`, `seed=42`, `num_predict=256`, `num_ctx=2048`; `stream=false`, `keep_alive=5m`. Ollama model templates and tokenizers can differ. The same requested options do not prove identical backend behavior or deterministic output across versions/hardware. A model may stop before the cap. Output text is discarded and never published.

## Procedure

1. Close competing inference workloads and record power/thermal conditions manually if needed.
2. Run models sequentially in CLI order. No parallel inference.
3. Perform one warm-up generation for each model, validate its metric fields, and exclude it from statistics.
4. Perform at least three measured generations per model. Record every repetition; never silently skip failed requests or retry them into a successful report.
5. Explicitly unload each tested model after its block. Other processes and already loaded models are outside the runner's control.
6. Save a complete report only when all model blocks succeed. Use unique filenames and review before publishing.

Identical prompts may benefit from Ollama prompt caching. This protocol describes warm model / potentially cached prompt conditions, not cold startup. Model-block ordering can introduce thermal or order bias. For stronger comparisons repeat sessions with reversed order; do not pool unrelated setups automatically. Three samples provide a basic median, not statistical confidence.

## Metrics

All durations from Ollama are nanoseconds. Store `eval_count`, `eval_duration`, `prompt_eval_count`, `prompt_eval_duration`, `load_duration`, `total_duration` for each measured repetition. Counts and durations must be nonnegative integers, generation count and duration strictly positive, and total duration at least generation duration. `done` must be true.

`tokens_per_second = eval_count * 1,000,000,000 / eval_duration`.

The model summary is the median of per-repetition generation throughput, not total tokens divided by total time. Dashboard times and counts are separately computed medians; they need not correspond to the same repetition. Prompt tokenization and prompt cache behavior affect prompt time. Load and total duration are stored separately and are not substituted for generation duration. This is not a quality evaluation, time-to-first-token test or power benchmark.

## Hardware and privacy

Automatically collect only OS family, OS release and machine architecture through Python platform functions. No hostname, username, serial, personal path, credentials, process environment or generated text is collected. RAM/VRAM usage, GPU model, GPU residency, driver and quantization details are not inferred. Reviewers may add generic, evidence-backed hardware descriptions; mark unavailable information as unverified. An observed GPU residency in a preliminary session does not validate a later benchmark.

The HTTP origin is fixed to loopback `127.0.0.1:11434`, proxies are disabled, redirects forbidden, and every request has an explicit timeout (default 180 seconds). This is a socket operation timeout, not a whole-session wall-clock deadline. There are no external requests, cloud services, paid GPU tests or API keys in the runner.

## Publication and validation

Reports stay in ignored `results/` until reviewed. Only sanitized reports explicitly copied into `public/results/` and listed in its index are included in the static dashboard. Preserve original measured metrics and exact digests. Record manual review context separately without personal data. Schema and arithmetic validation cannot prove provenance or hardware accuracy.

No preliminary numbers, mocked test outputs, estimates or demos are published as measurements. An empty index produces an explicit empty dashboard. A failed fetch or invalid report produces an error instead of a fabricated chart. Tests use synthetic HTTP responses and must never write to the published index.

## First reviewed session

See [run01](run01.md) for the first real saved session, post-run hardware inventory and provenance limits. All six measured runs reached the 256-token cap; the dashboard reports generation throughput, not model quality. The public copy adds publication metadata only; original numerical measurements remain unchanged. The structural validator is `benchmarks/validate_report.py`; dashboard arithmetic validation also runs before rendering.
