import {performance} from 'node:perf_hooks';
import {compare,plain} from '../dist/reference/index.js';
import {blueprintScenarios} from '../dist/reference/blueprint.js';
const results=blueprintScenarios.map(s=>{for(let i=0;i<3;i++)compare(s.a,s.b);const samples=Array.from({length:25},()=>{const t=performance.now();compare(s.a,s.b);return performance.now()-t}).sort((a,b)=>a-b);return {scenario:s.id,blocksA:96,blocksB:96,changedBlocks:48,charactersA:plain(s.a.editorState.root).length,charactersB:plain(s.b.editorState.root).length,p50:samples[12],p95:samples[23],max:samples[24],budgetP95:250,pass:samples[23]<=250}});
console.log(JSON.stringify({node:process.version,iterations:25,results},null,2));if(results.some(r=>!r.pass))process.exitCode=1;
