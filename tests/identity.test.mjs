import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshSubtree,splitParagraph,mergeParagraphs} from '../dist/identity-contract.js';
import {doc,p,container} from '../dist/fixtures.js';
import {compare} from '../dist/compare.js';
test('new, duplicate/paste, split, merge and JSON reload preserve reference lifecycle',()=>{
 let serial=0;const next=()=>`new-${++serial}`;
 const original=freshSubtree(p('ignored','須經核准才能刪除'),next),copy=freshSubtree(original,next);
 assert.notEqual(original.blockId,copy.blockId);
 const tree=freshSubtree(container('collapse','old',[p('child','規則')],{title:'例外'}),next);const pasted=freshSubtree(tree,next);assert.notEqual(tree.children[0].blockId,pasted.children[0].blockId);
 const [left,right]=splitParagraph(original,4,next);assert.equal(left.blockId,original.blockId);assert.notEqual(right.blockId,left.blockId);
 const result=compare(doc([original]),doc([left,right]));assert.deepEqual(result.records.map(r=>r.kind),['text','added']);
 const merged=mergeParagraphs(left,right);assert.equal(merged.blockId,original.blockId);assert.equal(merged.children[0].text,original.children[0].text);
 const reloaded=JSON.parse(JSON.stringify(doc([merged,copy,tree,pasted])));assert.equal(compare(reloaded,JSON.parse(JSON.stringify(reloaded))).records.every(r=>!r.changed),true);
});
