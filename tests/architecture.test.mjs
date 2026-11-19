import test from 'node:test';
import assert from 'node:assert/strict';
import {ESLint} from 'eslint';

const eslint = new ESLint();
const checks = [
  ['src/core/example.ts', "import {createEditor} from 'lexical'; export {createEditor};", 'architecture/boundaries'],
  ['src/core/example.ts', "export * from '../ui/view.js';", 'architecture/boundaries'],
  ['src/core/example.ts', "export const load = () => import('../adapters/runtime.js');", 'architecture/boundaries'],
  ['src/core/example.ts', 'export const load = (name: string) => import(name);', 'architecture/boundaries'],
  ['src/core/example.ts', "export type X = import('../ui/view.js').X;", 'architecture/boundaries'],
  ['src/core/example.ts', "export const x = require('node:fs');", 'architecture/boundaries'],
  ['src/core/example.ts', 'export const x = document.title;', 'no-restricted-globals'],
  ['src/core/example.ts', 'export const x = globalThis.fetch;', 'no-restricted-globals'],
  ['src/core/example.ts', 'export const x = Math.random();', 'no-restricted-properties'],
  ['src/core/example.ts', 'export const change = (node: {text: string}) => { node.text = "lost"; };', 'no-param-reassign'],
  ['src/ui/example.ts', 'export const flag = process.env.ENABLE_TABLE;', 'no-restricted-globals'],
  ['src/core/example.ts', 'export const x: any = 1;', '@typescript-eslint/no-explicit-any'],
  ['src/core/example.ts', '// @ts-ignore\nexport const x = 1;', '@typescript-eslint/ban-ts-comment'],
  ['src/new-file.ts', 'export const x = 1;', 'architecture/boundaries'],
];
for (const [filePath, code, rule] of checks) {
  test(`architecture rejects ${rule}: ${code}`, async () => {
    const [result] = await eslint.lintText(code, {filePath});
    assert.ok(result.messages.some(m => m.ruleId === rule && m.severity === 2), JSON.stringify(result.messages));
  });
}
test('legal typed core dependency and host adapter pass', async () => {
  for (const [filePath, code] of [
    ['src/handlers/example.ts', "import type {Result} from '../contracts/result.js'; export const identity = (x: Result) => x;"],
    ['src/adapters/example.ts', "export {createEditor} from 'lexical';"],
  ]) {
    const [result] = await eslint.lintText(code, {filePath});
    assert.equal(result.errorCount, 0, JSON.stringify(result.messages));
  }
});
test('inline disable cannot bypass the dependency rule', async () => {
  const [result] = await eslint.lintText("/* eslint-disable architecture/boundaries */\nexport * from '../ui/view.js';", {filePath: 'src/core/example.ts'});
  assert.ok(result.messages.some(m => m.ruleId === 'architecture/boundaries'));
});
