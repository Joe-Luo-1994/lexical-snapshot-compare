import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {prepareSnapshot,compareSnapshots,canonical,plain} from '../src/index.mjs';
import {createReferenceEditor} from '../src/reference-registry.mjs';
import {$getRoot,$createParagraphNode,$createTextNode} from 'lexical';
import {$createTableNode,$createTableRowNode,$createTableCellNode} from '@lexical/table';
const options={createEditor:createReferenceEditor};
const read=async name=>JSON.parse(await readFile(new URL('../corpus/snapshots/'+name,import.meta.url),'utf8'));
const ids=['article-tech','article-policy'];
for(const id of ids)test(id+' uses saved native JSON, real parse, stable identities and independent edit answers',async()=>{
 const a=await read(id+'.a.json'),b=await read(id+'.b.json'),answers=await read(id+'.answers.json');const original=canonical([a,b]);
 assert.equal(JSON.stringify(a.editorState).includes('blockId'),false);
 const result=compareSnapshots(JSON.stringify(a),JSON.stringify(b),options);
 assert.equal(result.status,'ready');assert.equal(result.runtime.a.parsed,true);assert.equal(result.runtime.b.parsed,true);assert.deepEqual(result.runtime.a.roundTripChanges,[]);assert.deepEqual(result.runtime.b.roundTripChanges,[]);
 assert.deepEqual(result.records.filter(r=>r.changed).map(r=>r.id).sort(),answers.map(r=>r.id).sort());
 assert.equal(canonical([a,b]),original);
 const same=compareSnapshots(a,a,options);assert.equal(same.records.filter(r=>r.changed).length,0);assert.equal(same.records.every(r=>r.kind==='same'),true);
});
test('policy obligation and prohibition deletion survive actual runtime and list structure',async()=>{
 const a=await read('article-policy.a.json'),b=await read('article-policy.b.json');const r=compareSnapshots(a,b,options);
 const obligation=r.records.find(r=>plain(r.a).includes('依據 CNCF 章程'));assert.equal(obligation.kind,'text');assert.match(plain(obligation.a),/必須獲得技術監督委員會的批准/);assert.match(plain(obligation.b),/得由專案維護者自行核准/);
 const list=r.records.find(r=>r.a?.type==='list'&&plain(r.a).includes('因某人舉報事件'));assert.equal(list.kind,'coarse');assert.equal(list.a.children.length,2);assert.equal(list.b.children.length,1);assert.equal(plain(list.b).includes('報復'),false);
});
test('technical code stays a native code node and is not falsely presented as paragraph precision',async()=>{
 const a=await read('article-tech.a.json'),b=await read('article-tech.b.json');const r=compareSnapshots(a,b,options);const code=r.records.find(r=>r.a?.type==='code'&&plain(r.a).includes('name: liveness-exec'));assert.equal(code.kind,'coarse');assert.match(plain(code.a),/periodSeconds: 5/);assert.match(plain(code.b),/periodSeconds: 30/);assert.equal(code.a.language,'yaml');
});
test('missing identity parses successfully but cannot silently gain positional matching',async()=>{
 const a=await read('article-policy.a.json');delete a.identity;const r=compareSnapshots(a,a,options);assert.equal(r.status,'partial');assert.equal(r.runtime.a.parsed,true);assert.equal(r.records.length,1);assert.equal(r.records[0].kind,'unverified');assert.ok(r.diagnostics.some(d=>d.code==='IDENTITY_UNAVAILABLE'));
});
test('stale, duplicate, conflicting and cross-document identities fail closed',async()=>{
 const a=await read('article-policy.a.json');
 for(const mutate of [b=>b.identity.nodes['/root/children/999']='stale',b=>b.identity.nodes['/root/children/0']=b.identity.nodes['/root'],b=>b.editorState.root.children[0].blockId='conflict',b=>b.identity.namespace='another-document']){const b=structuredClone(a);mutate(b);assert.equal(compareSnapshots(a,b,options).status,'failed');}
});
test('unknown fields lost by Lexical remain in comparison and are never called equal',async()=>{
 const a=await read('article-policy.a.json'),b=structuredClone(a);b.editorState.root.children[1].internalPolicy='changed';const r=compareSnapshots(a,b,options);assert.equal(r.status,'partial');assert.ok(r.runtime.b.roundTripChanges.some(p=>p.endsWith('/internalPolicy')));const changed=r.records.filter(r=>r.changed);assert.equal(changed.length,1);assert.equal(changed[0].kind,'unverified');assert.equal(changed[0].b.internalPolicy,'changed');
});
test('unregistered company node is a parse diagnostic, not a zero-change success',async()=>{
 const a=await read('article-policy.a.json'),b=structuredClone(a);const n=b.editorState.root.children[1];b.editorState.root.children[1]={type:'company-policy',version:1,payload:'requires legal review'};const r=compareSnapshots(a,b,options);assert.equal(r.status,'partial');assert.equal(r.runtime.b.parsed,false);assert.ok(r.diagnostics.some(d=>d.code==='LEXICAL_PARSE_FAILED'));assert.equal(r.records.find(r=>r.a?.type===n.type&&r.b?.type==='company-policy').kind,'unverified');
});
test('stock 0.18 table-cell format roundtrip loss is detected without normalizing raw evidence away',()=>{
 const editor=createReferenceEditor();editor.update(()=>{$getRoot().append($createTableNode().append($createTableRowNode().append($createTableCellNode(0).setFormat('center').append($createParagraphNode().append($createTextNode('value'))))))},{discrete:true});const raw=editor.getEditorState().toJSON();const p=prepareSnapshot(raw,options);assert.equal(raw.root.children[0].children[0].children[0].format,'center');assert.ok(p.diagnostics.some(d=>d.code==='RUNTIME_ROUNDTRIP_CHANGED'));assert.equal(p.snapshot.editorState.root.children[0].children[0].children[0].format,'center');
});
test('malformed inputs and missing editor factory are explicit failures',()=>{
 assert.equal(compareSnapshots('{',{},options).status,'failed');assert.equal(compareSnapshots({root:null},{root:null},options).status,'failed');assert.throws(()=>prepareSnapshot({root:{type:'root',version:1,children:[],direction:null,format:'',indent:0}}),/EXPLICIT_HOST_EDITOR_FACTORY_REQUIRED/);
});
