import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {isSafeReportFilename, loadPublishedReports, RESULTS_BASE} from '../src/report-loading.mjs';
import {ReportStatus} from '../src/ReportStatus.mjs';

test('loads actual dotted filename through the dashboard loader and project base path', async () => {
  const requests=[];
  const reports=await loadPublishedReports(async url => {
    requests.push(url);
    assert.ok(url.startsWith(RESULTS_BASE));
    const data=JSON.parse(await readFile(new URL('../public'+url.slice('/open-ai-access-lab'.length),import.meta.url),'utf8'));
    return {ok:true,json:async()=>data};
  });
  assert.deepEqual(requests,[RESULTS_BASE+'index.json',RESULTS_BASE+'ollama-v0.1-run01.json']);
  assert.deepEqual(reports[0].models.map(m=>Number(m.median_tokens_per_second.toFixed(2))),[97.63,74.31]);
  assert.deepEqual(reports[0].models.map(m=>m.runs.length),[3,3]);
});

test('allows internal dots but rejects traversal, separators and unsafe filenames', () => {
  for (const name of ['ollama-v0.1-run01.json','run01.json','run.1.2.json']) assert.equal(isSafeReportFilename(name),true);
  for (const name of ['../run.json','a..b.json','a/b.json','a\\b.json','.hidden.json','/run.json','a%2fb.json','a.json?x=1','a.json#x','a b.json','a.json\n','a.JSON','a.json/','..',null,42]) assert.equal(isSafeReportFilename(name),false,String(name));
});

test('empty index and failures remain distinct; unsafe entries never fetched', async () => {
  assert.deepEqual(await loadPublishedReports(async()=>({ok:true,json:async()=>[]})),[]);
  await assert.rejects(loadPublishedReports(async()=>({ok:false})),/request failed/);
  await assert.rejects(loadPublishedReports(async()=>({ok:true,json:async()=>{throw Error('bad JSON');}})),/bad JSON/);
  let calls=0;
  await assert.rejects(loadPublishedReports(async()=>{calls++;return {ok:true,json:async()=>['../bad.json']};}),/Unsafe/);
  assert.equal(calls,1);
  let index=true;
  await assert.rejects(loadPublishedReports(async()=>({ok:true,json:async()=>{if(index){index=false;return ['ollama-v0.1-run01.json'];}return {};}})),/Invalid report/);
});

test('UI renders mutually exclusive loading, error, empty and loaded states', () => {
  const render=status=>renderToStaticMarkup(createElement(ReportStatus,{status}));
  assert.match(render('loading'),/Loading published benchmarks/);
  assert.match(render('error'),/role="alert"/);
  assert.doesNotMatch(render('error'),/No verified benchmarks published yet/);
  assert.match(render('empty'),/No verified benchmarks published yet/);
  assert.doesNotMatch(render('empty'),/role="alert"|Loading published benchmarks/);
  assert.doesNotMatch(render('loading'),/No verified benchmarks published yet|role="alert"/);
  assert.equal(render('loaded'),'');
});

test('production loader renders measured medians, graph and six repetitions', async () => {
  const {createServer}=await import('vite');
  const server=await createServer({server:{middlewareMode:true},appType:'custom'});
  try {
    const {ReportComparison}=await server.ssrLoadModule('/src/ReportComparison.tsx');
    const reports=await loadPublishedReports(async url=>({ok:true,json:async()=>JSON.parse(await readFile(new URL('../public'+url.slice('/open-ai-access-lab'.length),import.meta.url),'utf8'))}));
    const html=renderToStaticMarkup(createElement(ReportComparison,{reports}));
    assert.match(html,/97\.63/); assert.match(html,/74\.31/);
    assert.match(html,/gemma3:4b/); assert.match(html,/mistral:7b-instruct-q4_0/);
    assert.match(html,/aria-label="Measured generation speed"/);
    assert.equal((html.match(/class="bar"/g)||[]).length,2);
    assert.equal((html.match(/all 3 measured repetitions/g)||[]).length,2);
    for(const model of reports[0].models) for(const run of model.runs) assert.ok(html.includes(run.tokens_per_second.toFixed(4)));
    assert.doesNotMatch(html,/No verified benchmarks published yet|Published reports could not be validated/);
  } finally {await server.close();}
});
