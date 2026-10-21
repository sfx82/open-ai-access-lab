# First measured session - 2026-10-21

Recorded from 13:31:57 to 13:32:29 UTC (15:31:57 to 15:32:29 Europe/Rome). Ollama version recorded by the runner: `0.40.5`. The original source is local and ignored; its public copy retains every original field and value, adding only a `publication` object.

| Model | Median token/s | Measured repetitions | Generated tokens per repetition |
| --- | ---: | ---: | ---: |
| gemma3:4b | 97.63349378025065 | 3 | 256 |
| mistral:7b-instruct-q4_0 | 74.31296790318413 | 3 | 256 |

Exact SHA-256 model digests are preserved in [the public report](../public/results/ollama-v0.1-run01.json). Digest syntax and presence were checked against the original report; no new inference or independent model-content verification was performed. Per-repetition speeds and median arithmetic were recalculated from original nanosecond durations. Six repetitions total; one excluded warm-up per model as recorded in methodology. Warm-up output is not retained, so its execution is evidenced by runner protocol and report metadata rather than independent traces.

Every measured repetition reached the requested `num_predict=256` cap. This is a comparison of capped generation throughput, not answer quality, equal text length, time to first token or a universal performance ranking. Different tokenizers produced 35 and 39 prompt tokens respectively. Generated text was not stored, so quality was not evaluated.

Generation parameters: temperature 0, seed 42, num_predict 256, num_ctx 2048, non-streaming requests and 5-minute keep-alive. The fixed prompt, potential prompt cache reuse and sequential model block limitations are documented in [methodology](methodology.md).

## Hardware inventory

Collected after the benchmark on 2026-10-21 using Windows CIM, selecting only product name, driver version and memory capacity fields:

- CPU: Intel Core i9-9900K @ 3.60GHz.
- Physical GPU: NVIDIA GeForce RTX 2070.
- Windows GPU driver version: 32.0.16.1088 (not converted into an inferred marketing version).
- Installed physical RAM: 34,359,738,368 bytes / 32 GiB.
- OS: Windows 11, AMD64, as recorded in the benchmark.

A virtual display adapter was excluded from the compute hardware description. GPU presence is verified by inventory; actual GPU execution/residency during this session is **unverified**. A preliminary Mistral observation of 100% GPU does not establish residency for this run. Actual RAM/VRAM usage, temperature, power mode and competing workloads were not recorded. Installed RAM is not process memory consumption. No GPU VRAM capacity is inferred.

## Integrity and review

Original file SHA-256: `1f4aff6e31f9d5b14568333febd4be6c0f5ae81a2f73177ca85f344feb587a25`.

The public copy preserves the original report after removing its added `publication` metadata. Both byte checksum provenance and semantic equality are checked locally by `benchmarks/validate_report.py --source`. A checksum establishes file identity, not independent truth of the measurements. The committed report is independently validated in CI without requiring the ignored local original.

Review covers schema structure, model IDs and digest format, six repetition IDs, positive generation durations, duration consistency, shared parameters, timestamps, throughput formulas, medians and privacy. It does not certify backend parameter compliance or independently repeat the measurement.
