import test from 'node:test';
import assert from 'node:assert/strict';
import {compare,compareSnapshots,createReferenceEngine,presets,plain} from '../dist/reference/index.js';
import {createReferenceEditor} from '../dist/reference/registry.js';
import {stressScenarios} from '../dist/reference/stress.js';
import {doc,p,clone,container,table,row} from '../dist/fixtures.js';
import {$getRoot} from 'lexical';
const changes = r => r.records.filter(x=>x.changed);
for(const preset of Object.keys(presets))for(const s of stressScenarios)test(`stress ${preset} ${s.id}: independent edit set and relative order`,()=>{
 const r=createReferenceEngine({policy:presets[preset]}).compare(s.a,s.b);
 assert.deepEqual(changes(r).map(x=>x.id).sort(),[...s.expected.changedIds].sort());
 assert.equal(r.moved,s.id!=='stress-insert');
 assert.equal(r.records.filter(x=>x.kind==='same').length,s.id==='stress-move'?159:160);
});
test('large insertion inside one paragraph keeps suffix and exact obligation edit',()=>{
 const a=p('a','開始。失敗時必須回復。'+ '既有程序。'.repeat(100));
 const b=p('a','開始。'+ '新增規範。'.repeat(1000)+'失敗時可以回復。'+ '既有程序。'.repeat(100));
 const r=compare(doc([a]),doc([b]));assert.equal(changes(r).length,1);assert.match(plain(r.records[0].b),/可以回復/);assert.ok(['text','coarse'].includes(r.records[0].kind));
});
test('identical repeated paragraphs delete the right identity, not its neighbor',()=>{
 const a=Array.from({length:500},(_,i)=>p('n'+i,'相同的規範文字'));
 const b=a.filter(x=>x.blockId!=='n251');const r=compare(doc(a),doc(b));
 assert.deepEqual(changes(r).map(x=>[x.id,x.kind]),[['n251','removed']]);assert.equal(r.moved,false);
});
test('copy versus move: new identity is addition; same identity changes order',()=>{
 const a=[p('a','條款'),p('b','條款'),p('c','條款')];
 assert.equal(compare(doc(a),doc([a[2],a[0],a[1]])).moved,true);
 const r=compare(doc(a),doc([...a,p('copy','條款')]));assert.equal(r.moved,false);assert.deepEqual(changes(r).map(x=>x.id),['copy']);
});
test('complete deletion and replacement preserve every old block in both directions',()=>{
 const a=Array.from({length:500},(_,i)=>p('old'+i,'規範'+i)),b=Array.from({length:500},(_,i)=>p('new'+i,'新規範'+i));
 for(const [x,y] of [[a,[]],[a,b],[b,a]]){const r=compare(doc(x),doc(y));assert.equal(r.records.filter(n=>n.kind==='removed').length,x.length);assert.equal(r.records.filter(n=>n.kind==='added').length,y.length);assert.equal(r.moved,false);}
});
test('lost or duplicated identities after mass insertion fail closed',()=>{
 for(const damage of [ns=>delete ns[100].blockId,ns=>ns[100].blockId=ns[0].blockId]){
 const s=clone(stressScenarios[0]);damage(s.b.editorState.root.children);const r=compare(s.a,s.b);
 assert.equal(r.records.length,1);assert.equal(r.records[0].verification,'pairing');assert.equal(r.records[0].changed,true);
 }
});
test('same identity across container boundaries is not falsely matched to a top-level paragraph',()=>{
 const a=doc([p('a','條款'),container('quote','q',[p('inner','引文')])]);
 const b=doc([container('quote','q',[p('inner','引文'),p('a','條款')])]);
 const r=compare(a,b);assert.deepEqual(changes(r).map(x=>x.id).sort(),['a','q']);assert.equal(r.records.find(x=>x.id==='q').kind,'coarse');
});
test('unicode, whitespace, emoji and composed characters are not silently normalized away',()=>{
 for(const [a,b] of [['核准','不核准'],['A B','A\u00a0B'],['🙂','🙃'],['é','e\u0301'],['期限30天','期限３０天'],['第一行\n第二行','第一行 第二行']]){
 const r=compare(doc([p('a',a)]),doc([p('a',b)]));assert.equal(changes(r).length,1);assert.equal(plain(r.records[0].a),a);assert.equal(plain(r.records[0].b),b);
 }
});
test('row reorder with a value change never assigns it to another service',()=>{
 const a=table('t',[row('r1',['支付','30']),row('r2',['查詢','60']),row('r3',['通知','90'])]);
 const b=table('t',[row('r3',['通知','90']),row('r1',['支付','7']),row('r2',['查詢','60'])]);
 const r=compare(doc([a]),doc([b])).records[0];assert.equal(r.changed,true);
 if(r.kind==='table')assert.deepEqual(r.rows.filter(x=>x.status==='modified').map(x=>x.id),['r1']);else assert.equal(r.kind,'coarse');
});
// A controlled edit lineage re-addresses sidecar paths from persisted IDs, never from text similarity.
function native(s){const copy=clone(s),nodes={};function walk(n,path){if(n.blockId){nodes[path]=n.blockId;delete n.blockId;}n.children?.forEach((c,i)=>walk(c,path+'/children/'+i));}walk(copy.editorState.root,'/root');copy.identity={version:1,namespace:'stress-document',nodes};return copy;}
test('mass insert and reorder use actual Lexical 0.18 parse with native JSON and remapped sidecars',()=>{
 for(const s of stressScenarios){const a=native(s.a),b=native(s.b);const r=compareSnapshots(a,b,{createEditor:createReferenceEditor});assert.equal(r.status,'ready');assert.equal(r.runtime.a.parsed,true);assert.deepEqual(changes(r).map(x=>x.id).sort(),[...s.expected.changedIds].sort());assert.equal(JSON.stringify(a.editorState).includes('blockId'),false);}
});
test('Lexical runtime keys change after reload while persisted sidecar identity remains',()=>{
 const saved=native(stressScenarios[0].a),editor=createReferenceEditor(e=>{throw e});
 const one=editor.parseEditorState(JSON.stringify(saved.editorState));const two=editor.parseEditorState(JSON.stringify(saved.editorState));
 const keys=s=>s.read(()=>$getRoot().getChildren().map(n=>n.getKey()));
 assert.notDeepEqual(keys(one),keys(two));assert.deepEqual(one.toJSON(),two.toJSON());
 const r=compareSnapshots(saved,JSON.parse(JSON.stringify(saved)),{createEditor:createReferenceEditor});assert.equal(r.status,'ready');assert.equal(changes(r).length,0);
});
test('seeded edit sequences preserve independent expected additions, removals, edits and order',()=>{
 let seed=91273;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 for(let iteration=0;iteration<30;iteration++){
 const a=Array.from({length:100},(_,i)=>p('a'+i,'條款 '+i));const removed=new Set(),edited=new Set();let b=[];
 for(const n of a){const choice=rnd();if(choice<.15)removed.add(n.blockId);else if(choice<.3){edited.add(n.blockId);b.push(p(n.blockId,'改義務 '+n.blockId));}else b.push(n);}
 const additions=Array.from({length:20},(_,i)=>p('new'+i,'新增'+i));b.splice(25,0,...additions);const cut=10+Math.floor(rnd()*30);b=[...b.slice(cut),...b.slice(0,cut)];
 const r=compare(doc(a),doc(b));assert.deepEqual(changes(r).map(n=>n.id).sort(),[...removed,...edited,...additions.map(n=>n.blockId)].sort());assert.equal(r.moved,true);assert.equal(JSON.stringify(a).includes('改義務'),false);
 }
});

test('host identity pattern: UUID allocation, actual edit/move/copy, atomic save and reload',async()=>{
 const {randomUUID}=await import('node:crypto');
 const {$createParagraphNode,$createTextNode}=await import('lexical');
 const editor=createReferenceEditor(e=>{throw e});let identities=new Map();
 const capture=revision=>editor.getEditorState().read(()=>{
  const nodes={};const children=$getRoot().getChildren();children.forEach((node,i)=>{if(!identities.has(node.getKey()))identities.set(node.getKey(),randomUUID());nodes['/root/children/'+i]=identities.get(node.getKey());});
  return {documentId:'uuid-test',revision,editorState:editor.getEditorState().toJSON(),identity:{version:1,namespace:'uuid-test-generation1',nodes}};
 });
 editor.update(()=>{$getRoot().append($createParagraphNode().append($createTextNode('需核准')),$createParagraphNode().append($createTextNode('保留30天')));},{discrete:true});
 const a=capture('a'),savedIds=Object.values(a.identity.nodes);assert.equal(new Set(savedIds).size,2);
 editor.update(()=>{const root=$getRoot(),[first,second]=root.getChildren();second.getFirstChild().setTextContent('保留7天');root.append(first);root.append($createParagraphNode().append($createTextNode('需核准')));},{discrete:true});
 const b=capture('b');assert.deepEqual(Object.values(b.identity.nodes).slice(0,2),[savedIds[1],savedIds[0]]);assert.ok(!savedIds.includes(b.identity.nodes['/root/children/2']));
 const r=compareSnapshots(a,b,{createEditor:createReferenceEditor});assert.equal(r.status,'ready');assert.equal(r.moved,true);assert.equal(changes(r).length,2);
 editor.setEditorState(editor.parseEditorState(JSON.stringify(b.editorState)));
 identities=editor.getEditorState().read(()=>new Map($getRoot().getChildren().map((n,i)=>[n.getKey(),b.identity.nodes['/root/children/'+i]])));
 assert.deepEqual(capture('reloaded').identity,b.identity);
});
