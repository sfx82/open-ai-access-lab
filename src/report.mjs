const fields = ['eval_count','eval_duration','prompt_eval_count','prompt_eval_duration','load_duration','total_duration'];
const median = xs => { const s=[...xs].sort((a,b)=>a-b); const i=Math.floor(s.length/2); return s.length%2?s[i]:(s[i-1]+s[i])/2; };
export function validateReport(r) {
  try { return validate(r); } catch { return false; }
}
function validate(r) {
  if (!r || !Number.isFinite(Date.parse(r.started_at)) || !Number.isFinite(Date.parse(r.completed_at)) || Date.parse(r.started_at)>Date.parse(r.completed_at) || r.schema_version !== '1.0' || r.status !== 'measured' || !r.completed_at || !r.started_at || !r.ollama_version || !r.methodology?.options || !r.environment || !Object.values(r.environment).every(x=>typeof x==='string') || !Array.isArray(r.models) || !r.models.length) return false;
  if (!r.methodology.prompt || r.methodology.duration_unit !== 'nanoseconds' || !Number.isInteger(r.methodology.warmups_per_model) || r.methodology.warmups_per_model<1 || !Number.isInteger(r.methodology.repetitions)) return false;
  if (!['temperature','seed','num_predict','num_ctx'].every(k=>Number.isFinite(r.methodology.options[k]))) return false;
  if (r.publication && (!/^[a-f0-9]{64}$/.test(r.publication.source_sha256) || !r.publication.hardware || !Object.values(r.publication.hardware).every(v=>typeof v==='string' || (typeof v==='number' && Number.isFinite(v))))) return false;
  if (new Set(r.models.map(m=>m.model)).size !== r.models.length) return false;
  return r.models.every(m => m && typeof m.model==='string' && typeof m.digest==='string' && /^[a-f0-9]{64}$/.test(m.digest) && Array.isArray(m.runs) && m.runs.length>=3 && m.runs.length===r.methodology.repetitions && m.runs.every((x,i) => x && x.repetition===i+1 && fields.every(f=>Number.isSafeInteger(x[f]) && x[f]>=0) && x.eval_count>0 && x.eval_count<=r.methodology.options.num_predict && x.eval_duration>0 && x.total_duration>=x.eval_duration+x.prompt_eval_duration+x.load_duration && Number.isFinite(x.tokens_per_second) && Math.abs(x.tokens_per_second-x.eval_count*1e9/x.eval_duration)<1e-8) && Number.isFinite(m.median_tokens_per_second) && Math.abs(m.median_tokens_per_second-median(m.runs.map(x=>x.tokens_per_second)))<1e-8);
}
