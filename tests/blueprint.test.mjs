import test from 'node:test';
import assert from 'node:assert/strict';
import {blueprintScenarios} from '../dist/reference/blueprint.js';
import {createReferenceEngine,presets,compareSnapshots,plain,canonical} from '../dist/reference/index.js';
import {createReferenceEditor} from '../dist/reference/registry.js';
import {preferWholeText,navigationLabel} from '../dist/presentation/changes.js';
import {doc,p} from '../dist/fixtures.js';
// Oracle is the authored edit plan, independent of engine output or scenario.expected.
const changedIds=Array.from({length:24},(_,i)=>[`spec-${i}-decision`,`spec-${i}-procedure`]).flat();
const [stable,pasted]=blueprintScenarios;
test('50% denominator, interleaving, expansion and independent critical decisions',()=>{
 const a=stable.a.editorState.root.children,b=stable.b.editorState.root.children;
 assert.equal(a.length,96);assert.equal(b.length,96);
 for(let i=0;i<96;i++)assert.equal(canonical(a[i])!==canonical(b[i]),i%4>=2);
 assert.ok(plain(stable.b.editorState.root).length>3*plain(stable.a.editorState.root).length);
 for(const [id,before,after] of [['spec-2-decision','200','202'],['spec-6-decision','3 次','8 次'],['spec-9-procedure','不再檢查','建立後撤銷權限'],['spec-17-decision','7 天','30 天'],['spec-22-procedure','全綠即可','真人理解']]){
   assert.ok(plain(a.find(n=>n.blockId===id)).includes(before),id+' before');
   assert.ok(plain(b.find(n=>n.blockId===id)).includes(after),id+' after');
 }
});
for(const [preset,policy] of Object.entries(presets))for(const reverse of [false,true])test(`blueprint ${preset} reverse=${reverse}: no lost change, noise, mutation or false move`,()=>{
 const engine=createReferenceEngine({policy}),before=canonical(stable);
 const a=reverse?stable.b:stable.a,b=reverse?stable.a:stable.b,r=engine.compare(a,b);
 assert.deepEqual(r.records.filter(n=>n.changed).map(n=>n.id),changedIds);
 assert.equal(r.records.filter(n=>n.kind==='same').length,48);assert.equal(r.moved,false);
 assert.equal(r.records.length,96);assert.equal(canonical(stable),before);
 for(const record of r.records){assert.deepEqual(record.a,a.editorState.root.children.find(n=>n.blockId===record.id));assert.deepEqual(record.b,b.editorState.root.children.find(n=>n.blockId===record.id));}
});
for(const [preset,policy] of Object.entries(presets))test(`blueprint pasted ${preset}: exact anchors plus complete unpaired originals`,()=>{
 const r=createReferenceEngine({policy}).compare(pasted.a,pasted.b);
 assert.equal(r.pairing.exactMatches,48);assert.equal(r.pairing.unresolvedA,48);assert.equal(r.pairing.unresolvedB,48);assert.equal(r.moved,false);
 const unknown=r.records.filter(n=>n.changed);assert.equal(unknown.length,1);assert.equal(unknown[0].reasonCode,'IDENTITY_REBUILT');assert.equal(unknown[0].kind,'unverified');
 assert.deepEqual(unknown[0].a.children,stable.a.editorState.root.children.filter(n=>changedIds.includes(n.blockId)));
 assert.deepEqual(unknown[0].b.children,pasted.b.editorState.root.children.filter((_,i)=>i%4>=2));
 assert.equal(r.records.filter(n=>n.kind==='same').length,48);
});
for(const s of blueprintScenarios)test(s.id+' actual native Lexical parse, roundtrip and projection parity',()=>{
 const result=compareSnapshots(s.savedA,s.savedB,{createEditor:createReferenceEditor});
 assert.equal(result.status,'ready');assert.equal(result.runtime.a.parsed,true);assert.equal(result.runtime.b.parsed,true);
 assert.equal(JSON.stringify(s.savedA.editorState).includes('blockId'),false);
 const projection=createReferenceEngine().compare(s.a,s.b);
 assert.deepEqual(result.records.map(n=>[n.id,n.kind,n.changed]),projection.records.map(n=>[n.id,n.kind,n.changed]));
});
test('dense rewrite reading is symmetric and leaves report and original text intact',()=>{
 const engine=createReferenceEngine();
 for(const [a,b] of [[stable.a,stable.b],[stable.b,stable.a]]){
   const r=engine.compare(a,b),before=canonical(r);
   for(const row of r.records.filter(n=>n.changed)){assert.equal(preferWholeText(row),true);assert.match(navigationLabel(row),/^大幅改寫 · 原「/);assert.match(navigationLabel(row),/／新「/);}
   assert.equal(canonical(r),before);
 }
});
test('small but important edits remain precise, unknown pairing never gains rewrite precision',()=>{
 const engine=createReferenceEngine();
 const a='上線前需要審查。'.repeat(10)+'必須保留30天。',b=a.replace('30天','7天');
 const row=engine.compare(doc([p('a',a)]),doc([p('a',b)])).records[0];
 assert.equal(preferWholeText(row),false);assert.match(navigationLabel(row),/30.*7/);
 const fallback=engine.compare(pasted.a,pasted.b).records.find(n=>n.changed);assert.equal(preferWholeText(fallback),false);
});


test('token budget exhaustion does not relabel a long small edit as a large rewrite',()=>{
 const a='上線前需要審查。'.repeat(100)+'必須保留30天。',b=a.replace('30天','7天');
 const row=createReferenceEngine().compare(doc([p('a',a)]),doc([p('a',b)])).records[0];
 assert.equal(preferWholeText(row),false);
 assert.equal(plain(row.a),a);assert.equal(plain(row.b),b);
});
