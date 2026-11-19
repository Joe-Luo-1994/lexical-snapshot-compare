import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import architecture from './tooling/architecture.mjs';

const source = ['src/**/*.{js,mjs,ts,tsx}', 'dist/{compare,presentation,reading,app}.js'];
const pure = ['src/{contracts,core,handlers}/**/*.{js,mjs,ts,tsx}', 'dist/compare.js'];
export default [
  {ignores: ['node_modules/**', '.local/**', 'dist/article-fixtures.js']},
  {files: ['**/*.{js,mjs,ts,tsx}'], linterOptions: {noInlineConfig: true, reportUnusedDisableDirectives: 'error'},
    languageOptions: {ecmaVersion: 'latest', sourceType: 'module', globals: {...globals.node, ...globals.browser}},
    rules: {...js.configs.recommended.rules, 'no-unused-vars': ['error', {argsIgnorePattern: '^_', varsIgnorePattern: '^_'}], 'no-eval': 'error', 'no-new-func': 'error'}},
  {files: ['**/*.{ts,tsx}'], languageOptions: {parser: tseslint.parser}, plugins: {'@typescript-eslint': tseslint.plugin},
    rules: {'no-undef': 'off', 'no-unused-vars': 'off', '@typescript-eslint/no-unused-vars': ['error', {argsIgnorePattern: '^_'}], '@typescript-eslint/no-explicit-any': 'error', '@typescript-eslint/ban-ts-comment': 'error'}},
  {files: source, plugins: {architecture}, rules: {'architecture/boundaries': 'error'}},
  {files: pure, rules: {
    'no-param-reassign': ['error', {props: true}],
    'no-restricted-globals': ['error', {globals: ['window', 'document', 'fetch', 'XMLHttpRequest', 'localStorage', 'sessionStorage', 'process', 'globalThis', 'global', 'self', 'Date', 'performance', 'setTimeout', 'setInterval'], checkGlobalObject: true}],
    'no-restricted-properties': ['error', {object: 'Math', property: 'random', message: 'Inject stable identity; core must be deterministic.'}],
  }},
  {files: ['src/{application,presentation,ui}/**/*.{js,mjs,ts,tsx}'], rules: {
    'no-restricted-globals': ['error', {globals: ['process', 'localStorage', 'sessionStorage'], checkGlobalObject: true}],
  }},
];
