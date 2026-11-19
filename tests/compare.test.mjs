import {test} from 'node:test';
import assert from 'node:assert/strict';
import {compare,tokens,canonical,plain} from '../dist/compare.js';
import {scenarios,clone,doc,p,special,container,table,row} from '../dist/fixtures.js';
const run=(a,b)=>compare(doc(a),doc(b,'r13'));
const changes=r=>r.records.filter(x=>x.changed);
// Expected sets authored separately from engine output, including exact critical old/new values.
for(const s of scenarios.filter(s=>!s.expected.error))test('scenario '+s.id+' preserves independent expected changed blocks',()=>{
 const original=canonical(s);const r=compare(s.a,s.b);
 assert.deepEqual(changes(r).map(x=>x.id).sort(),s.expected.changedIds.slice().sort());
 for(const id of s.expected.coarse||[])assert.equal(r.records.find(x=>x.id===id).kind,'coarse');
 assert.equal(canonical(s),original,'comparison must not mutate inputs');
});
test('C1 contains old/new number and the complete removed obligation',()=>{const s=scenarios.find(x=>x.id==='C1'),r=compare(s.a,s.b);const n=r.records.find(x=>x.id==='retention');assert.match(plain(n.a),/30 天/);assert.match(plain(n.b),/7 天/);const deleted=r.records.find(x=>x.id==='approval');assert.equal(deleted.kind,'removed');assert.equal(plain(deleted.a),'刪除前須經資料擁有人核准。');});
test('C2 inserted row does not rewrite unchanged rows; two cells precisely modified',()=>{const s=scenarios.find(x=>x.id==='C2'),r=compare(s.a,s.b).records.find(x=>x.id==='sla');assert.equal(r.kind,'table');assert.equal(r.rows.find(x=>x.id==='notify').status,'added');assert.equal(r.rows.find(x=>x.id==='search').status,'same');assert.deepEqual(r.rows.find(x=>x.id==='payment').cells.filter(x=>x.changed).map(x=>[plain(x.a),plain(x.b)]),[['4 小時','8 小時'],['全天','工作日']]);});
test('C3 link destination-only is not no-change',()=>{const s=scenarios.find(x=>x.id==='C3'),r=changes(compare(s.a,s.b))[0];assert.equal(r.kind,'link');assert.equal(plain(r.a),plain(r.b));assert.notEqual(r.a.children[1].url,r.b.children[1].url);});
test('C4 order changes separately from content; formatting remains visible',()=>{const s=scenarios.find(x=>x.id==='C4'),r=compare(s.a,s.b);assert.equal(r.moved,true);assert.equal(r.records.find(x=>x.id==='intro').kind,'format');assert.equal(r.records.find(x=>x.id==='rollback').kind,'text');});
const specimens=[special('image','n',{src:'https://example.com/image.png',alt:'操作圖'}),special('video','n',{src:'https://example.com/v.mp4',title:'教學'}),table('n',[row('r',['A','B'])]),special('mermaid','n',{source:'flowchart LR\n A-->B'}),container('quote','n',[p('q','需核准')]),container('collapse','n',[p('c','隱藏的規則')],{title:'規則',collapsed:true}),special('unknownWidget','n',{value:1})];
for(const node of specimens){
 test(node.type+' added/removed/modified/identical coverage',()=>{
 assert.equal(changes(run([], [node])).length,1);assert.equal(changes(run([node],[])).length,1);
 const b=clone(node);if(b.type==='table')b.children[0].children[0].colSpan=2;else if(b.children)b.children[0]=p('child','修改規則');else if(b.type==='mermaid')b.source='invalid syntax';else if(b.type==='unknownWidget')b.value=2;else b.src+='?revision=2';
 assert.equal(changes(run([node],[b])).length,1);
 const same=run([node],[clone(node)]).records[0];assert.equal(same.changed,false);if(['image','video','unknownWidget'].includes(node.type))assert.equal(same.kind,'unverified');
 });
}
test('unknown fields and versions never silently pass, even unchanged',()=>{for(const extras of [{mystery:'x'},{version:2},{style:'color:red'},{format:256}]){const n=p('a','相同');Object.assign(n.children[0],extras);assert.equal(run([n],[clone(n)]).records[0].kind,'unverified');}});
test('missing or duplicate identity fails closed, not position matching',()=>{const a=p('a','A'),b=p('b','B');delete a.blockId;assert.equal(run([a],[b]).records[0].kind,'unverified');assert.equal(run([b,clone(b)],[b]).records[0].id,'document');});
test('nested hidden content detected and outside text stays precise',()=>{const s=scenarios.find(x=>x.id==='nested'),r=compare(s.a,s.b);assert.equal(r.records.find(x=>x.id==='details').kind,'coarse');assert.equal(r.records.find(x=>x.id==='outside').kind,'text');});
test('merged cells and changed quote structure never receive fake text precision',()=>{for(const id of ['merged','quote']){const s=scenarios.find(x=>x.id===id);assert.equal(changes(compare(s.a,s.b))[0].kind,'coarse');}});
test('all inline diff tokens reconstruct originals including Chinese and graphemes',()=>{for(const [a,b] of [['30 天','7 天'],['必須核准','可以核准'],['👨‍👩‍👧‍👦 café\nA','👨‍👩‍👧‍👦 café\nB'],['','新增'],['刪除',''],['同'.repeat(400),'異'.repeat(400)]]){const r=tokens(a,b);assert.equal(r.filter(x=>x.type!=='added').map(x=>x.text).join(''),a);assert.equal(r.filter(x=>x.type!=='removed').map(x=>x.text).join(''),b);}});
test('swap reverses addition/deletion and preserves count',()=>{const s=scenarios.find(x=>x.id==='C1'),r=compare(s.b,s.a);assert.equal(r.records.find(x=>x.id==='approval').kind,'added');assert.equal(changes(r).length,2);});
test('malformed and oversized data is explicit failure',()=>{assert.throws(()=>compare({},{}),/缺少/);const a=doc([p('a','x'.repeat(240001))]);assert.throws(()=>compare(a,a),/超出/);const b=doc([p('a','x')]);b.editorState.root.children[0].children={};assert.throws(()=>compare(b,b),/格式/);});
test('root settings cannot be ignored',()=>{const a=doc([p('a','x')]),b=clone(a);b.editorState.root.direction='rtl';assert.equal(compare(a,b).records[0].kind,'unverified');});
test('equivalent adjacent text runs do not create fake changes',()=>{const a=p('a','完整文字'),b=clone(a);b.children=[{...b.children[0],text:'完整'},{...b.children[0],text:'文字'}];assert.equal(changes(run([a],[b])).length,0);});
test('link attributes and table formatting cannot masquerade as unchanged text',()=>{const s=clone(scenarios.find(x=>x.id==='C3'));s.b.editorState.root.children.find(n=>n.blockId==='reference').children[1].title='改變';assert.equal(compare(s.a,s.b).records.find(r=>r.id==='reference').kind,'unverified');const a=table('t',[row('r',['A','B'])]),b=clone(a);b.children[0].children[0].children[0].children[0].format=1;assert.equal(run([a],[b]).records[0].kind,'coarse');});
test('invalid table shape or spans fail explicitly instead of silently reshaping',()=>{const a=table('t',[p('p','not a row')]);assert.throws(()=>run([a],[a]),/表格/);const b=table('t',[row('r',['A'])]);b.children[0].children[0].rowSpan=101;assert.throws(()=>run([b],[b]),/合併/);});
test('incomplete version story fails rather than reporting zero changes',()=>{const s=scenarios.find(s=>s.expected.error);assert.throws(()=>compare(s.a,s.b),/缺少/);});
test('release numbers are whole evidence units and deleted service keeps its neighbors',()=>{const s=scenarios.find(s=>s.id==='release'),r=compare(s.a,s.b);const rows=r.records.find(r=>r.id==='ops-matrix').rows;const i=rows.findIndex(r=>r.id==='ops-25');assert.equal(rows[i-1].id,'ops-24');assert.equal(rows[i+1].id,'ops-26');assert.equal(rows[i].status,'removed');assert.deepEqual(tokens('保存 180 天','保存 30 天').filter(t=>t.type!=='same').map(t=>t.text),['180','30']);assert.deepEqual(tokens('99.5%','98.5%').map(t=>t.text),['99.5%','98.5%']);});
test('unchanged unsupported root presentation and nested media cannot claim full no-change',()=>{const a=doc([p('a','相同')]);a.editorState.root.direction='rtl';assert.equal(compare(a,a).records[0].kind,'unverified');const c=container('collapse','c',[special('video','v',{src:'https://example.com/live.mp4'})],{title:'教學',collapsed:true});assert.equal(run([c],[c]).records[0].kind,'unverified');});
test('malformed span topology and large expanded grids fail before rendering',()=>{const a=table('t',[row('r',['A'])]);a.children[0].children[0].rowSpan=2;assert.throws(()=>run([a],[a]),/超出保存/);const wide=table('wide',Array.from({length:100},(_,i)=>row('r'+i,Array.from({length:7},()=>''))));for(const r of wide.children)for(const c of r.children)c.colSpan=100;assert.throws(()=>run([wide],[wide]),/展開範圍過大/);});
