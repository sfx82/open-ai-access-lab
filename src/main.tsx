import React from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
import { loadPublishedReports } from './report-loading.mjs';
import { ReportStatus } from './ReportStatus.mjs';
import { ReportComparison, type Report } from './ReportComparison';

type ReportState =
  | {status:'loading' | 'error' | 'empty'}
  | {status:'loaded';reports:Report[]};
function PublishedResults() {
  const [state, setState] = React.useState<ReportState>({status:'loading'});
  React.useEffect(() => {
    let active = true;
    loadPublishedReports().then(reports => {
      if (active) setState(reports.length ? {status:'loaded',reports} : {status:'empty'});
    }).catch(() => { if (active) setState({status:'error'}); });
    return () => { active = false; };
  }, []);
  if (state.status !== 'loaded') return <ReportStatus status={state.status}/>;
  const {reports} = state;
  return <ReportComparison reports={reports}/>;
}

function App() {
  return <><header><a className="brand" href="#">OPEN AI ACCESS LAB</a><a href="https://github.com/sfx82/open-ai-access-lab">View source &gt;</a></header>
    <main><section className="hero"><span className="eyebrow">LOCAL INFERENCE / OPEN RESEARCH / V0.1</span><h1>Open AI<br/><em>Access Lab.</em></h1><p className="tagline">Affordable, Reproducible, Open AI</p><p className="intro">Understand what local AI can do. Transparent measurements, shared methods, and evidence you can reproduce on your own hardware.</p><a className="button" href="https://github.com/sfx82/open-ai-access-lab/blob/main/docs/methodology.md">Explore the methodology &gt;</a></section>
    <section className="metrics" aria-label="Research principles"><div><strong>100%</strong><span>Local inference</span></div><div><strong>3+</strong><span>Measured repetitions</span></div><div><strong>0</strong><span>Cloud API dependencies</span></div></section>
    <PublishedResults/>
    <section className="details"><article><span className="eyebrow">01 / CONDITIONS</span><h2>Hardware matters.</h2><p>The report includes a hardware inventory collected after the run. GPU presence is verified; GPU residency during this benchmark and actual RAM/VRAM consumption are unverified.</p></article><article><span className="eyebrow">02 / REPRODUCIBILITY</span><h2>Run it. Inspect it.</h2><p>One fixed public prompt. Identical generation options. Separate warm-up. Individual runs and median throughput, with exact model digests.</p><a href="https://github.com/sfx82/open-ai-access-lab#run-a-real-benchmark">Reproduce the benchmark &gt;</a></article></section>
    <aside><strong>Measured / estimated / demo.</strong><p>Only reviewed local measurements belong in the comparison. Estimates and demonstrations must carry explicit labels and remain separate.</p></aside></main><footer><span>Open research. Shared access.</span><span>Apache-2.0 / No telemetry / No API keys</span></footer></>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
