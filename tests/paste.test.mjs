import test from 'node:test';
import assert from 'node:assert/strict';
import {compare,createReferenceEngine,presets,compareSnapshots,canonical,plain} from '../dist/reference/index.js';
import {createReferenceEditor} from '../dist/reference/registry.js';
import {pasteScenarios,rekey} from '../dist/reference/paste.js';
import {doc,p,special,clone} from '../dist/fixtures.js';
import {navigationLabel,changeReason} from '../dist/presentation/changes.js';
const scenario=id=>pasteScenarios.find(s=>s.id===id);
for(const preset of Object.keys(presets))test(preset+' whole-page paste scenarios preserve content and honest downgrade',()=>{
 const engine=createReferenceEngine({policy:presets[preset]});
 const same=scenario('paste-same'),r=engine.compare(same.a,same.b);assert.equal(r.pairing.mode,'content-equal');assert.equal(r.records.some(x=>x.changed),false);assert.equal(r.records[0].kind,'same');
 const edit=scenario('paste-edit'),e=engine.compare(edit.a,edit.b);const changed=e.records.filter(x=>x.changed);assert.equal(changed.length,1);assert.equal(changed[0].reasonCode,'IDENTITY_REBUILT');assert.equal(e.pairing.unresolvedA,1);assert.equal(e.pairing.unresolvedB,1);assert.match(plain(changed[0].a),/必須獲得/);assert.match(plain(changed[0].b),/無須獲得/);assert.equal(changed[0].kind,'unverified');
 const extra=scenario('paste-extra'),x=engine.compare(extra.a,extra.b);assert.equal(x.pairing,undefined);assert.equal(x.records.filter(n=>n.kind==='added').length,extra.a.editorState.root.children.length);
 const repeat=scenario('paste-repeated'),u=engine.compare(repeat.a,repeat.b);assert.equal(u.pairing.mode,'unresolved');assert.equal(u.records.length,1);assert.equal(u.records[0].a.children.length,12);assert.equal(u.records[0].b.children.length,12);assert.equal(u.records[0].verification,'pairing');
});
test('full content equality still preserves media and unknown-schema uncertainty',()=>{
 for(const n of [special('image','n',{src:'same.png',alt:'圖'}),special('company-widget','n',{rule:'核准'})]){
 const a=doc([n]),b=rekey(a),r=compare(a,b);assert.equal(r.pairing.mode,'content-equal');assert.equal(r.records[0].changed,false);assert.equal(r.records[0].kind,'unverified');assert.ok(r.records[0].verification);
 }
});
test('stable IDs win when the same texts cross over between nodes',()=>{
 const a=doc([p('a','甲'),p('b','乙')]),b=doc([p('a','乙'),p('b','甲')]);const r=compare(a,b);assert.equal(r.pairing,undefined);assert.deepEqual(r.records.map(n=>[n.id,n.kind]),[['a','text'],['b','text']]);
});
test('unique anchors retain actual IDs, original payload, reverse evidence and immutability',()=>{
 const s=scenario('paste-edit'),before=canonical(s);const r=compare(s.a,s.b),reverse=compare(s.b,s.a);
 assert.equal(canonical(s),before);assert.equal(Object.isFrozen(r.pairing),true);assert.equal(reverse.pairing.exactMatches,r.pairing.exactMatches);
 const matched=r.records.find(n=>n.kind==='same');assert.notEqual(matched.a.blockId,matched.b.blockId);assert.equal(matched.pairingBasis,"exact-content");
 assert.deepEqual(reverse.records.find(n=>n.reasonCode==='IDENTITY_REBUILT').a,r.records.find(n=>n.reasonCode==='IDENTITY_REBUILT').b);
});
test('repeated identical whole document is equal without pretending duplicate blocks are unique anchors',()=>{
 const a=doc([p('a','相同'),p('b','相同')]),b=rekey(a);const r=compare(a,b);assert.equal(r.pairing.mode,'content-equal');assert.equal(r.records[0].changed,false);
});
test('duplicates cannot become unique merely because one was consumed by stable identity',()=>{
 const a=doc([p('a','相同'),p('b','相同'),p('c','唯一')]);const b=doc([p('a','相同'),p('new-b','相同'),p('new-c','唯一'),p('new-d','修改')]);const r=compare(a,b);assert.equal(r.pairing.exactMatches,1);const unresolved=r.records.find(n=>n.reasonCode==='IDENTITY_REBUILT');assert.deepEqual(unresolved.a.children.map(n=>n.blockId),['b']);assert.deepEqual(unresolved.b.children.map(n=>n.blockId),['new-b','new-d']);
});
test('unique content order changes are reported as content order, not proven lineage moves',()=>{
 const a=doc([p('a','甲'),p('b','乙'),p('c','丙')]),b=rekey(a);b.editorState.root.children.reverse();const r=compare(a,b);assert.equal(r.moved,false);assert.equal(r.pairing.contentOrderChanged,true);assert.equal(r.records.some(n=>n.changed),false);
});
test('unknown fields and formatting differences cannot qualify as exact anchors',()=>{
 for(const modify of [n=>n.futureRule='保留',n=>n.children[0].format=1,n=>n.children[0].text='甲 ']){
 const a=doc([p('a','甲'),p('b','乙')]),b=rekey(a);modify(b.editorState.root.children[0]);const r=compare(a,b);assert.equal(r.pairing.exactMatches,1);assert.equal(r.records.find(n=>n.changed).reasonCode,'IDENTITY_REBUILT');
 }
});
test('missing or duplicate IDs remain invalid, even with content anchors available',()=>{
 const a=doc([p('a','甲'),p('b','乙')]);for(const mutate of [b=>delete b.editorState.root.children[0].blockId,b=>b.editorState.root.children[0].blockId=b.editorState.root.children[1].blockId]){const b=rekey(a);mutate(b);assert.equal(compare(a,b).records[0].reasonCode,'IDENTITY_MISSING');}
});
test('residual record ID cannot collide with a user node and downgrade wording is explicit',()=>{
 const a=doc([p('unpaired-content','固定'),p('a','甲')]),b=doc([p('unpaired-content','固定'),p('new','乙'),p('new2','新增')]);
 // No ID discontinuity evidence yet: ordinary stable-lineage remove/add remains available.
 assert.equal(compare(a,b).pairing,undefined);
 const c=rekey(a);c.editorState.root.children[1]=p('x','修改');const r=compare(a,c);const u=r.records.find(n=>n.reasonCode==='IDENTITY_REBUILT');assert.equal(new Set(r.records.map(n=>n.id)).size,r.records.length);assert.match(navigationLabel(u),/未配對內容/);assert.match(changeReason(u),/不代表逐段配對/);
});
function native(s){const c=clone(s),nodes={};function walk(n,path){if(n.blockId){nodes[path]=n.blockId;delete n.blockId;}n.children?.forEach((x,i)=>walk(x,path+'/children/'+i));}walk(c.editorState.root,'/root');c.identity={version:1,namespace:'paste-lineage',nodes};return c;}
test('paste cases run through actual Lexical 0.18 parsing with immutable original native JSON',()=>{
 for(const s of pasteScenarios){const a=native(s.a),b=native(s.b),before=canonical([a,b]);const r=compareSnapshots(a,b,{createEditor:createReferenceEditor});assert.equal(r.status,'ready');assert.equal(r.runtime.a.parsed,true);assert.equal(canonical([a,b]),before);assert.equal(JSON.stringify(a.editorState).includes('blockId'),false);}
});
test('fallback never correlates matching text across different container structures',()=>{
 const a=doc([p('a','相同')]),b=doc([{...p('b','相同'),type:'quote'}]);const r=compare(a,b);assert.equal(r.pairing.exactMatches,0);assert.equal(r.records[0].reasonCode,'IDENTITY_REBUILT');
});

test('nested identity-rebuilt containers serialize structurally without exponential escaped strings',()=>{
 let n=p('leaf','規範');for(let i=0;i<22;i++)n={type:'quote',version:1,blockId:'q'+i,direction:null,format:'',indent:0,children:[n]};
 const a=doc([n]),b=rekey(a);const r=compare(a,b);assert.equal(r.pairing.mode,'content-equal');assert.equal(r.records[0].changed,false);
});

test('downloadable fixture snapshots have consistent sidecars and parse with the same downgrade',()=>{
 for(const s of pasteScenarios){const r=compareSnapshots(s.savedA,s.savedB,{createEditor:createReferenceEditor});assert.equal(r.status,'ready');assert.equal(JSON.stringify(s.savedB.editorState).includes('blockId'),false);assert.deepEqual(r.pairing,compare(s.a,s.b).pairing);}
});
