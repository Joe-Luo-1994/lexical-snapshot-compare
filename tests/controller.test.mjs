import test from 'node:test';
import assert from 'node:assert/strict';
import {createComparisonController} from '../dist/reference/index.js';
import {createReferenceEditor} from '../dist/reference/registry.js';
import {readFile} from 'node:fs/promises';
const a=JSON.parse(await readFile(new URL('../corpus/snapshots/article-policy.a.json',import.meta.url))),b=JSON.parse(await readFile(new URL('../corpus/snapshots/article-policy.b.json',import.meta.url)));
const pair={documentId:'doc',baselineRevision:'source',targetRevision:'exercise'};
const document=(revision)=>({...structuredClone(revision==='source'?a:b),documentId:'doc',revision});
test('controller publishes exact pair and loading before real runtime result',async()=>{
 const states=[];const c=createComparisonController({createEditor:createReferenceEditor,onState:s=>states.push(s),loadSnapshot:async({revision})=>document(revision)});await c.select(pair);assert.deepEqual(states.map(s=>s.kind),['loading','ready']);assert.deepEqual(states[1].pair,pair);assert.equal(states[1].result.records.filter(r=>r.changed).length,4);
});
test('late first request cannot replace the selected second pair, even if host ignores abort',async()=>{
 const waiting=[],states=[];const c=createComparisonController({createEditor:createReferenceEditor,onState:s=>states.push(s),loadSnapshot:({revision})=>new Promise(resolve=>waiting.push(()=>resolve(document(revision))))});
 const first=c.select(pair),second=c.select({...pair,baselineRevision:'exercise',targetRevision:'source'});waiting[2]();waiting[3]();await second;waiting[0]();waiting[1]();await first;assert.deepEqual(states.map(s=>s.kind),['loading','loading','ready']);assert.equal(states.at(-1).pair.baselineRevision,'exercise');
});
test('revision mismatch and denied history never publish an old ready result',async()=>{
 for(const loadSnapshot of [async()=>({...document('source'),documentId:'other-doc'}),async()=>document('source'),async()=>{throw new Error('History access denied');}]){const states=[];const c=createComparisonController({createEditor:createReferenceEditor,onState:s=>states.push(s),loadSnapshot});await c.select(pair);assert.deepEqual(states.map(s=>s.kind),['loading','error']);}
});
test('dispose suppresses results from an in-flight request',async()=>{
 const waiting=[],states=[];const c=createComparisonController({createEditor:createReferenceEditor,onState:s=>states.push(s),loadSnapshot:({revision})=>new Promise(resolve=>waiting.push(()=>resolve(document(revision))))});const promise=c.select(pair);c.dispose();waiting.forEach(f=>f());await promise;assert.deepEqual(states.map(s=>s.kind),['loading']);
});
