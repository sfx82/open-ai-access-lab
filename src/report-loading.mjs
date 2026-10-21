import { validateReport } from './report.mjs';

export const RESULTS_BASE = '/open-ai-access-lab/results/';
export function isSafeReportFilename(name) {
  return typeof name === 'string' && /^[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*\.json$/.test(name);
}

export async function loadPublishedReports(fetchReport = globalThis.fetch) {
  async function readJson(path) {
    const response = await fetchReport(RESULTS_BASE + path);
    if (!response.ok) throw new Error('Report request failed');
    return response.json();
  }
  const names = await readJson('index.json');
  if (!Array.isArray(names) || !names.every(isSafeReportFilename)) {
    throw new Error('Unsafe report index');
  }
  return Promise.all(names.map(async name => {
    const report = await readJson(name);
    if (!validateReport(report)) throw new Error('Invalid report');
    return report;
  }));
}
