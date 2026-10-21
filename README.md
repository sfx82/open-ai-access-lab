# Open AI Access Lab

**Affordable, Reproducible, Open AI**

An Apache-2.0 local inference benchmark and static dashboard. V0.1 includes the first locally measured session: Gemma 3 4B **97.63 token/s**, Mistral 7B Instruct **74.31 token/s** (medians, three measured repetitions each). These are capped generation speeds, not quality scores or universal rankings. See [the reviewed run](docs/run01.md). Preliminary observations remain excluded.

## Requirements and installation

- Python 3.10+ (standard library only for the runner and Python tests).
- Node.js 22.12+ and npm for the dashboard.
- A separately installed Ollama server listening at `http://127.0.0.1:11434`, with the requested models already installed. Nothing downloads models automatically.

```sh
npm ci --ignore-scripts
npm run dev
```

Open the local Vite URL with `/open-ai-access-lab/`. Dependencies require an initial npm registry download unless cached. The application, tests and benchmark require no cloud services, API keys or telemetry. The runner bypasses proxies and rejects redirects.

## Tests and build

```sh
python -m unittest discover -s tests -v
npm test
npm run lint
npm run build
```

HTTP responses in automated tests are mocks. Their scores are never real benchmark results. Build output is `dist/`; Vite uses `/open-ai-access-lab/` for GitHub Pages project hosting.

## Run a real benchmark

This command performs eight generations by default: one warm-up and three measured runs for each of two models. It can occupy the local GPU for several minutes. Close competing workloads first; review the command before executing.

```sh
python benchmarks/ollama_benchmark.py --models gemma3:4b mistral:7b-instruct-q4_0 --repetitions 3 --timeout 180 --output results/ollama-v0.1-run01.json
```

Output paths must not already exist. Raw reports are ignored by Git by default. Failures exit nonzero; no complete report is saved. Do not interpret failed or partial runs as successful comparisons. No real benchmark is run by the test commands.

Read [the methodology](docs/methodology.md) for the exact prompt, settings, metric definitions and limitations. Record any manual hardware notes using generic product names only; do not include usernames, serials, hostnames, personal paths or credentials.

## Review and publish results

1. Inspect the raw JSON, confirm model digests and all repetitions, and review the machine conditions and hardware evidence.
2. Copy only reviewed, privacy-audited reports into `public/results/` using simple names such as `run01.json`.
3. Add those basenames to the JSON array in `public/results/index.json`. This curated index is the publication boundary; `status: measured` alone is not independent verification.
4. Rebuild and review the dashboard. Invalid reports suppress comparisons with an explicit error. Each report has its own comparison and graph; different machines are not pooled.

The static dashboard shows median generation token/s, median total time, generated token count, prompt time, generation parameters, and environment details. It uses no remote backend. Estimates and demos must remain separate and explicitly labeled; none are included.

For GitHub Pages, upload the contents of `dist/` through an approved Pages workflow or branch, then configure project Pages hosting. The Pages workflow runs only through manual dispatch on `main` with an explicit publication confirmation. Pushes do not deploy. See [publication instructions](docs/publishing.md); repository environment protections still need to be configured by the owner. Push, merge and deployment require the owner's consent.

## Interpretation

Throughput measures this fixed prompt and local setup, not model quality or universal speed. Tokenizers differ. Prompt caching, thermal state, background activity and model execution order affect measurements. GPU residency and actual VRAM/RAM consumption are not inferred. Compare only equivalent conditions and inspect individual runs as well as medians.

Original code in this repository; no private repository sources, production connections, databases, SMTP or telemetry. License: [Apache-2.0](LICENSE).

Validate the public report against the ignored original without running inference:

```sh
python benchmarks/validate_report.py public/results/ollama-v0.1-run01.json --source results/ollama-v0.1-run01.json
```

CI validates the committed public report; the original stays local. Published-report tests inspect real saved measurements; synthetic fixtures remain confined to runner and validator tests.
