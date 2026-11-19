import {test} from 'node:test';
import assert from 'node:assert/strict';
import {compare} from '../dist/compare.js';
import {scenarios} from '../dist/fixtures.js';
import {navigationLabel,verification} from '../dist/presentation.js';
const release=scenarios.find(s=>s.id==='release');
const records=compare(release.a,release.b).records;
test('real policy paragraph edits do not falsely claim the destination changed',()=>{
 const s=scenarios.find(s=>s.id==='article-policy');const r=compare(s.a,s.b).records;
 assert.match(navigationLabel(r.find(x=>x.id==='article-policy-n041')),/含連結段落變更.*三.*十/);
 assert.match(navigationLabel(r.find(x=>x.id==='article-policy-n052')),/連結目的地變更/);
});
test('navigation exposes actual values and reverses evidence with A/B',()=>{
 const forward=navigationLabel(records.find(r=>r.id==='release-days'));
 const back=navigationLabel(compare(release.b,release.a).records.find(r=>r.id==='release-days'));
 assert.match(forward,/−「180」.*＋「30」/);assert.match(back,/−「30」.*＋「180」/);
 assert.match(navigationLabel(records.find(r=>r.id==='release-threshold')),/分鐘.*99.5%.*98.5%.*必須.*可以/);
 assert.match(navigationLabel(records.find(r=>r.id==='release-delete-approval')),/資料擁有人與帳務組雙方核准/);
});
test('release uncertainty categories do not assert semantic precision',()=>{
 const expected={'release-runbook':'whole','release-regions':'whole','release-flow':'media','release-screen':'media','release-unknown':'unsupported'};
 assert.deepEqual(Object.fromEntries(records.filter(r=>verification(r)).map(r=>[r.id,verification(r)])),expected);
 assert.equal(navigationLabel(records.find(r=>r.id==='release-regions')),'資料變動 · 表格結構與儲存格');
});
test('same media remains unverified; unknown root and absent identity are distinct',()=>{
 for(const id of ['edge-media-same','matrix-3-same']){const s=scenarios.find(s=>s.id===id);if(!s)continue;assert.ok(compare(s.a,s.b).records.some(r=>!r.changed&&verification(r)==='media'));}
 const s=scenarios.find(s=>s.id==='edge-root');assert.equal(verification(compare(s.a,s.b).records[0]),'unsupported');
 const a=structuredClone(release.a);delete a.editorState.root.children[0].blockId;assert.equal(verification(compare(a,release.b).records[0]),'pairing');
});
test('every special-node state preserves explicit changed versus unverified distinction',()=>{
 for(const s of scenarios.filter(s=>!s.expected.error)){const r=compare(s.a,s.b);for(const item of r.records.filter(r=>r.kind!=='same')){assert.ok(navigationLabel(item).length>0);if(item.needsReview||['coarse','unverified'].includes(item.kind))assert.ok(verification(item),s.id);}}
});
