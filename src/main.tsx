import React from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
import { validateReport } from './report.mjs';

type Run = {repetition:number; eval_count:number; eval_duration:number; prompt_eval_count:number; total_duration:number; prompt_eval_duration:number; load_duration:number; tokens_per_second:number};
type Report = {
  started_at:string; completed_at:string; ollama_version:string;
  models:{model:string;digest:string;median_tokens_per_second:number;runs:Run[]}[];
  environment:Record<string,string>;
  methodology:{prompt:string;options:Record<string,number>;warmups_per_model:number;repetitions:number};
  publication?:{source_sha256:string;interpretation:string;review_scope:string;hardware:Record<string,string|number>};
};
function median(values:number[]) {
  const sorted=[...values].sort((a,b)=>a-b);
  const i=Math.floor(sorted.length/2);
  return sorted.length%2 ? sorted[i] : (sorted[i-1]+sorted[i])/2;
}
function PublishedResults({onLoaded}:{onLoaded:()=>void}) {
  const [reports, setReports] = React.useState<Report[]>([]);
  const [failed, setFailed] = React.useState(false);
  React.useEffect(() => {
    let active = true;
    const base = '/open-ai-access-lab/results/';
    fetch(base + 'index.json').then(r => { if (!r.ok) throw Error(); return r.json(); }).then(async names => {
      if (!Array.isArray(names) || !names.every(n => typeof n === 'string' && /^[a-zA-Z0-9_-]+\.json$/.test(n))) throw Error();
      return Promise.all(names.map(async name => {
        const r = await fetch(base + name);
        if (!r.ok) throw Error();
        const data = await r.json();
        if (!validateReport(data)) throw Error();
        return data as Report;
      }));
    }).then(data => {
      if (active) { setReports(data); if (data.length) onLoaded(); }
    }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [onLoaded]);
  if (failed) return <p role="alert">Published reports could not be validated. No comparison displayed.</p>;
  if (!reports.length) return null;
  return <section className="results"><h2>Measured generation throughput</h2>{reports.map((report, index) => <article key={index}>
    <span className="badge">REAL LOCAL RUN / STRUCTURE AND ARITHMETIC REVIEWED</span>
    <p>Ollama {report.ollama_version} / {report.started_at} to {report.completed_at}</p>
    <p>{report.methodology.repetitions} measured repetitions per model / {report.methodology.warmups_per_model} excluded warm-up per model</p>
    <p>Generation options: <code>{JSON.stringify(report.methodology.options)}</code></p>
    <p>{report.publication?.interpretation ?? 'Generation speed only; this is not a quality evaluation.'}</p>
    <div className="table-wrap"><table><caption>Per-model medians; durations in seconds</caption><thead><tr>{['Model / exact digest','Token/s','Generation (s)','Total (s)','Generated tokens','Prompt (s)'].map(x=><th key={x}>{x}</th>)}</tr></thead><tbody>{report.models.map(m => <tr key={m.digest}>
      <td>{m.model}<br/><small>{m.digest}</small></td><td>{m.median_tokens_per_second.toFixed(2)}</td><td>{median(m.runs.map(r=>r.eval_duration/1e9)).toFixed(3)}</td><td>{median(m.runs.map(r=>r.total_duration/1e9)).toFixed(3)}</td><td>{median(m.runs.map(r=>r.eval_count))}</td><td>{median(m.runs.map(r=>r.prompt_eval_duration/1e9)).toFixed(3)}</td>
    </tr>)}</tbody></table></div>
    <figure aria-label="Measured generation speed"><figcaption>Median generation throughput / token/s</figcaption>{report.models.map(m=><div key={m.digest} className="bar-row"><span>{m.model}</span><div className="bar" style={{width:`${100*m.median_tokens_per_second/Math.max(...report.models.map(x=>x.median_tokens_per_second))}%`}}>{m.median_tokens_per_second.toFixed(2)}</div></div>)}</figure>
    {report.models.map(m=><details key={m.digest}><summary>{m.model}: all {m.runs.length} measured repetitions</summary><div className="table-wrap"><table><thead><tr>{['Run','Token/s','Generation (s)','Total (s)','Tokens','Prompt tokens','Prompt (s)','Load (s)'].map(x=><th key={x}>{x}</th>)}</tr></thead><tbody>{m.runs.map(r=><tr key={r.repetition}><td>{r.repetition}</td><td>{r.tokens_per_second.toFixed(4)}</td><td>{(r.eval_duration/1e9).toFixed(4)}</td><td>{(r.total_duration/1e9).toFixed(4)}</td><td>{r.eval_count}</td><td>{r.prompt_eval_count}</td><td>{(r.prompt_eval_duration/1e9).toFixed(4)}</td><td>{(r.load_duration/1e9).toFixed(4)}</td></tr>)}</tbody></table></div></details>)}
    <h3>Environment and evidence</h3><dl>{Object.entries(report.environment).map(([k,v])=><React.Fragment key={k}><dt>{k}</dt><dd>{v}</dd></React.Fragment>)}</dl>
    {report.publication && <><dl>{Object.entries(report.publication.hardware).map(([k,v])=><React.Fragment key={k}><dt>{k.replaceAll('_',' ')}</dt><dd>{v}</dd></React.Fragment>)}</dl><p>{report.publication.review_scope}</p><details><summary>Source integrity and exact prompt</summary><p>Original source SHA-256: <code>{report.publication.source_sha256}</code></p><p>{report.methodology.prompt}</p></details></>}
    <p><a href="/open-ai-access-lab/results/ollama-v0.1-run01.json">Download reviewed JSON</a></p>
  </article>)}</section>;
}
function App() {
  const [hasResults, setHasResults] = React.useState(false);
  const onLoaded = React.useCallback(() => setHasResults(true), []);
  return <><header><a className="brand" href="#">OPEN AI ACCESS LAB</a><a href="https://github.com/sfx82/open-ai-access-lab">View source &gt;</a></header>
    <main><section className="hero"><span className="eyebrow">LOCAL INFERENCE / OPEN RESEARCH / V0.1</span><h1>Open AI<br/><em>Access Lab.</em></h1><p className="tagline">Affordable, Reproducible, Open AI</p><p className="intro">Understand what local AI can do. Transparent measurements, shared methods, and evidence you can reproduce on your own hardware.</p><a className="button" href="https://github.com/sfx82/open-ai-access-lab/blob/main/docs/methodology.md">Explore the methodology &gt;</a></section>
    <section className="metrics" aria-label="Research principles"><div><strong>100%</strong><span>Local inference</span></div><div><strong>3+</strong><span>Measured repetitions</span></div><div><strong>0</strong><span>Cloud API dependencies</span></div></section>
    <PublishedResults onLoaded={onLoaded}/>{!hasResults && <section className="results"><div className="section-title"><div><span className="eyebrow">THE BENCHMARK</span><h2>Evidence before rankings.</h2></div><span className="badge">AWAITING REVIEWED RESULTS</span></div><div className="empty"><span className="symbol">|||</span><h3>No verified benchmarks published yet.</h3><p>The measurement runner is ready. Results appear here only after a real local run and manual review.</p><p>Preliminary observations are excluded. No synthetic scores or estimated rankings.</p></div><div className="table-wrap"><table><caption>Comparison schema / awaiting measured data</caption><thead><tr>{['Model / digest','Median token/s','Total time','Generated tokens','Prompt time','Parameters'].map(x=><th key={x}>{x}</th>)}</tr></thead><tbody><tr><td colSpan={6}>No measured rows available.</td></tr></tbody></table></div></section>}
    <section className="details"><article><span className="eyebrow">01 / CONDITIONS</span><h2>Hardware matters.</h2><p>The report includes a hardware inventory collected after the run. GPU presence is verified; GPU residency during this benchmark and actual RAM/VRAM consumption are unverified.</p></article><article><span className="eyebrow">02 / REPRODUCIBILITY</span><h2>Run it. Inspect it.</h2><p>One fixed public prompt. Identical generation options. Separate warm-up. Individual runs and median throughput, with exact model digests.</p><a href="https://github.com/sfx82/open-ai-access-lab#run-a-real-benchmark">Reproduce the benchmark &gt;</a></article></section>
    <aside><strong>Measured / estimated / demo.</strong><p>Only reviewed local measurements belong in the comparison. Estimates and demonstrations must carry explicit labels and remain separate.</p></aside></main><footer><span>Open research. Shared access.</span><span>Apache-2.0 / No telemetry / No API keys</span></footer></>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
