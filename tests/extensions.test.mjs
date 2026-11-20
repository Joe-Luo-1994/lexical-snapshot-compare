import test from 'node:test';
import assert from 'node:assert/strict';
import {createEngine,createReferenceEngine,builtinHandlers,resolvePolicy,presets,canonical} from '../dist/reference/index.js';
import {referenceRendererTypes} from '../dist/reference/engine.js';
import {calloutHandler,calloutScenario} from '../dist/reference/callout.js';
import {scenarios,doc,p} from '../dist/fixtures.js';
import {verification,changeReason} from '../dist/presentation/changes.js';

const extended=(options={})=>createEngine({handlers:[...builtinHandlers,calloutHandler],renderers:[...referenceRendererTypes,'callout'],...options});
const first=(engine,a=calloutScenario.a,b=calloutScenario.b)=>engine.compare(a,b).records[0];
test('extension adds a callout without changing pairing: modify, same, add, remove and reverse',()=>{
 const engine=extended(),empty=structuredClone(calloutScenario.a); empty.editorState.root.children=[];
 assert.equal(first(engine).kind,'text');
 assert.equal(first(engine,calloutScenario.a,calloutScenario.a).kind,'same');
 assert.equal(first(engine,empty,calloutScenario.a).kind,'added');
 assert.equal(first(engine,calloutScenario.a,empty).kind,'removed');
 assert.equal(first(engine,calloutScenario.b,calloutScenario.a).kind,'text');
 const report=engine.compare(calloutScenario.a,calloutScenario.b);
 assert.match(JSON.stringify(report.records[0].a),/30 天/);assert.match(JSON.stringify(report.records[0].b),/7 天/);
});
test('extension unknown field, unknown version and nested unsupported child preserve raw evidence',()=>{
 for(const mutate of [n=>n.newRule={mustApprove:true},n=>n.version=2,n=>n.children.push({type:'company-private',version:1,rule:'保留'})]){
  const b=structuredClone(calloutScenario.b);mutate(b.editorState.root.children[0]);
  const record=first(extended(),calloutScenario.a,b);
  assert.equal(record.kind,'unverified');assert.equal(record.changed,true);assert.equal(record.verification,'unsupported');
  assert.deepEqual(record.b,b.editorState.root.children[0]);
 }
});
test('extension without handler or renderer remains visible, including unchanged input',()=>{
 for(const engine of [createReferenceEngine(),extended({renderers:referenceRendererTypes})]){
  assert.equal(first(engine).kind,'unverified');assert.equal(first(engine).changed,true);
  assert.equal(first(engine,calloutScenario.a,calloutScenario.a).kind,'unverified');
  assert.equal(first(engine,calloutScenario.a,calloutScenario.a).changed,false);
 }
 assert.equal(first(extended({renderers:referenceRendererTypes})).reasonCode,'RENDERER_UNAVAILABLE');
});
test('extension cannot use missing identity as positional matching',()=>{
 const a=structuredClone(calloutScenario.a);delete a.editorState.root.children[0].blockId;
 const r=first(extended(),a);assert.equal(r.id,'document');assert.equal(r.reasonCode,'IDENTITY_MISSING');
});
test('duplicate node version registration is rejected instead of first/last wins',()=>{
 assert.throws(()=>extended({handlers:[...builtinHandlers,calloutHandler,calloutHandler]}),/DUPLICATE_HANDLER/);
});
test('faulty strategies cannot erase differences, mutate inputs or return malformed results',()=>{
 for(const compare of [()=>{throw new Error('broken');},()=>({kind:'same',changed:false}),()=>({kind:'invented',changed:true}),a=>{a.children[0].children[0].text='mutated';return {kind:'text',changed:true};}]){
  const a=structuredClone(calloutScenario.a),before=canonical(a);
  const engine=extended({handlers:[...builtinHandlers,{...calloutHandler,compare}]});
  assert.equal(first(engine,a).reasonCode,'HANDLER_FAILED');assert.equal(canonical(a),before);
 }
});
test('input preservation, immutable reports, snapshotted policy and registry versions',()=>{
 const input=structuredClone(calloutScenario.a),before=canonical(input),policy={viewModes:['flow','split'],tablePrecision:'cells'};
 const handlers=[...builtinHandlers,calloutHandler];const engine=extended({policy,handlers});
 policy.viewModes.pop();policy.tablePrecision='whole-block';handlers.pop();
 const report=engine.compare(input,calloutScenario.b);
 assert.equal(canonical(input),before);assert.equal(Object.isFrozen(input),false);
 assert.ok(Object.isFrozen(report.records[0].a.children));
 assert.throws(()=>report.records.push({}),TypeError);
 assert.deepEqual(report.provenance.policy.viewModes,['flow','split']);
 assert.ok(report.provenance.handlers.includes('callout@1:1.0.0'));
});
test('invalid and unsafe policy keys fail closed, including coercible values',()=>{
 for(const value of [null,[],{skipValidation:true},{ignoreUnknown:true},{tablePrecision:true},{mediaPreview:'on'},{viewModes:[]},{viewModes:['flow','flow']},{viewModes:['unknown']},{download:'yes'},{tablePrecision:{toString:()=> 'cells'}}])assert.throws(()=>resolvePolicy(value));
});
test('host restrictions reduce capabilities and empty mode intersection fails explicitly',()=>{
 const p=resolvePolicy(presets.standard,presets.compact);
 assert.equal(p.mediaPreview,'off');assert.equal(p.download,'disabled');assert.deepEqual(p.viewModes,['flow']);
 assert.throws(()=>resolvePolicy({viewModes:['split']},{viewModes:['flow']}),/NO_ALLOWED_VIEW_MODE/);
 assert.throws(()=>resolvePolicy({}, {skipValidation:true}));
});
for(const [name,policy] of Object.entries(presets))test(`${name} preset preserves all independent changed-block answers`,()=>{
 const engine=createReferenceEngine({policy});
 for(const scenario of scenarios){
  if(scenario.expected.error){assert.throws(()=>engine.compare(scenario.a,scenario.b));continue;}
  assert.deepEqual(engine.compare(scenario.a,scenario.b).records.filter(r=>r.changed).map(r=>r.id).sort(),[...scenario.expected.changedIds].sort(),scenario.id);
 }
});
test('turning off cell precision keeps both whole tables and a specific reason',()=>{
 const s=scenarios.find(s=>s.id==='release');const r=createReferenceEngine({policy:presets.conservative}).compare(s.a,s.b).records.find(r=>r.id==='ops-matrix');
 assert.equal(r.kind,'coarse');assert.equal(r.reasonCode,'PRECISION_DISABLED');assert.equal(r.verification,'whole');
 assert.equal(r.a.children.length,37);assert.equal(r.b.children.length,37);
 assert.match(changeReason(r),/整區/);
});
test('presentation uses stable codes rather than translated reason text',()=>{
 const a=doc([p('a','舊內容')]),b=doc([p('a','新內容')]);delete a.editorState.root.children[0].blockId;
 const r=createReferenceEngine().compare(a,b).records[0];
 assert.equal(verification({...r,reason:'arbitrary translated text'}),'pairing');
});
test('runtime validation catches absent container children and wrong primitive types',()=>{
 for(const mutate of [n=>delete n.children,n=>n.children=null,n=>n.tag={html:'bad'},n=>n.text=123]){
  const a=doc([p('p','文字')]);mutate(a.editorState.root.children[0]);assert.throws(()=>createReferenceEngine().compare(a,a));
 }
});

 test('published presets cannot mutate defaults for a future session',()=>{
  assert.throws(()=>{presets.standard.download='disabled'},TypeError);
  assert.throws(()=>{presets.standard.viewModes.push('flow')},TypeError);
  assert.throws(()=>{presets.standard={}},TypeError);
  assert.equal(resolvePolicy().download,'enabled');
 });
