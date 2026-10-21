import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateReport} from '../src/report.mjs';
const run={repetition:1,eval_count:100,eval_duration:2e9,prompt_eval_count:10,prompt_eval_duration:100,load_duration:10,total_duration:2e9+200,tokens_per_second:50};
const report={schema_version:'1.0',status:'measured',started_at:'2026-10-21T13:00:00Z',completed_at:'2026-10-21T13:01:00Z',ollama_version:'mock',environment:{os:'mock'},methodology:{prompt:'mock',duration_unit:'nanoseconds',warmups_per_model:1,options:{temperature:0,seed:42,num_predict:256,num_ctx:2048},repetitions:3},models:[{model:'mock',digest:'a'.repeat(64),median_tokens_per_second:50,runs:[run,{...run,repetition:2},{...run,repetition:3}]}]};
test('validates calculated reports, rejects demos and corrupt metrics',()=>{assert.equal(validateReport(report),true); for(const bad of [null,{}, {...report,models:[null]}, {...report,models:[{...report.models[0],runs:[null,null,null]}]}, {...report,status:'demo'}, {...report,models:[{...report.models[0],median_tokens_per_second:99}]}, {...report,models:[{...report.models[0],runs:[run]}]}]) assert.equal(validateReport(bad),false);});
