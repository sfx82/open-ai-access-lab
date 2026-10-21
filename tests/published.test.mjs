import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateReport } from '../src/report.mjs';

test('public index resolves real reviewed reports and arithmetic', async () => {
  const index = JSON.parse(await readFile(new URL('../public/results/index.json', import.meta.url), 'utf8'));
  assert.deepEqual(index, ['ollama-v0.1-run01.json']);
  for (const name of index) {
    const report = JSON.parse(await readFile(new URL('../public/results/' + name, import.meta.url), 'utf8'));
    assert.equal(validateReport(report), true);
    assert.deepEqual(report.models.map(m=>Number(m.median_tokens_per_second.toFixed(2))), [97.63,74.31]);
    const bad=structuredClone(report); bad.models[0].digest='invalid'; assert.equal(validateReport(bad),false);
    bad.models[0].digest=report.models[0].digest; bad.models[0].runs[0].tokens_per_second=99; assert.equal(validateReport(bad),false);
  }
});
