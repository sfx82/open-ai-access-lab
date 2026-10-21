import React from 'react';

type Run = {repetition:number; eval_count:number; eval_duration:number; prompt_eval_count:number; total_duration:number; prompt_eval_duration:number; load_duration:number; tokens_per_second:number};
export type Report = {
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
export function ReportComparison({reports}:{reports:Report[]}) {
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
