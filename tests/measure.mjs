import {performance} from 'node:perf_hooks';
import {scenarios} from '../dist/fixtures.js';
import {compare} from '../dist/compare.js';
const s=scenarios.find(s=>s.id==='release');
function size(snapshot){let nodes=0,chars=0;const visit=n=>{nodes++;chars+=(n.text||n.source||'').length;for(const c of n.children||[])visit(c);};visit(snapshot.editorState.root);return {nodes,chars,bytes:Buffer.byteLength(JSON.stringify(snapshot)),topLevel:snapshot.editorState.root.children.length};}
for(let i=0;i<3;i++)compare(s.a,s.b);
const samples=Array.from({length:25},()=>{const start=performance.now();compare(s.a,s.b);return performance.now()-start;}).sort((a,b)=>a-b);
const result={node:process.version,scenario:s.id,a:size(s.a),b:size(s.b),iterations:25,p50:samples[12],p95:samples[23],max:samples[24],budgetP95:250,pass:samples[23]<=250};
console.log(JSON.stringify(result,null,2));if(!result.pass)process.exitCode=1;
