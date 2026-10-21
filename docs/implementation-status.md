# V0.1 release preparation

First real report supplied by the owner is validated and included in `public/results/ollama-v0.1-run01.json`; its index is populated. Original ignored report remains unchanged. Added publication metadata contains a source SHA-256, post-run hardware inventory and explicit evidence limits. No new inference was executed during release preparation.

Dashboard includes median speeds, a comparison graph, individual repetitions, timings, token counts, parameters, exact digests and hardware. Every measured repetition reached 256 generated tokens; this is a speed comparison, not a quality evaluation.

Local verification: 10 Python tests, 2 Node tests, TypeScript/Vite production build and ESLint. Runner HTTP tests use synthetic fixtures; published-report tests validate the saved real data separately. The local source equality test is skipped in CI when the ignored original is unavailable; committed-report validation still runs.

The manual Pages workflow gates both jobs on main and explicit confirmation. Remote Pages settings, environment required reviewers and branch protections remain owner actions documented in publishing.md. No push, merge, deploy or new model download performed. Apache-2.0 license preserved.

Built-site HTTP smoke passed at `/open-ai-access-lab/`: HTML, both generated assets, result index and real report returned HTTP 200. Browser rendering was not visually verified because no browser was connected.

Pre-commit audit: 24 staged source/documentation/public asset files scanned and reviewed; no secret patterns, private paths, personal identifiers or references to private repositories found. The dependency lock resolves only to the official npm registry. The raw original is ignored and its SHA-256 remains unchanged. Local commit uses the public project identity sfx82 with a GitHub noreply email. Pattern scanning cannot establish absence of every possible secret.
