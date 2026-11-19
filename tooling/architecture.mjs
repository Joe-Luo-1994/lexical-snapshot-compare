import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const legacy = {
  'dist/compare.js': 'core',
  'dist/presentation.js': 'presentation',
  'dist/reading.js': 'ui',
  'dist/app.js': 'ui',
  'dist/fixtures.js': 'reference',
  'dist/article-fixtures.js': 'reference',
  'src/lexical-adapter.mjs': 'adapters',
  'src/reference-registry.mjs': 'reference',
  'src/controller.mjs': 'application',
  'src/index.mjs': 'entry',
};
const allowed = {
  contracts: ['contracts'],
  core: ['contracts', 'core'],
  handlers: ['contracts', 'core', 'handlers'],
  adapters: ['contracts', 'core', 'adapters'],
  application: ['contracts', 'core', 'application'],
  presentation: ['contracts', 'core', 'presentation'],
  ui: ['contracts', 'application', 'presentation', 'ui'],
  reference: ['contracts', 'core', 'handlers', 'adapters', 'application', 'presentation', 'ui', 'reference'],
  entry: ['contracts', 'core', 'adapters', 'application', 'presentation', 'reference'],
};
// Exact existing edges only; new modules cannot inherit migration exceptions.
const migrationEdges = new Set([
  'src/controller.mjs -> src/lexical-adapter.mjs',
  'dist/app.js -> dist/compare.js',
  'dist/app.js -> dist/fixtures.js',
]);
const relative = filename => path.relative(root, filename).replaceAll('\\', '/');
function layer(filename) {
  return legacy[filename] || (/^src\/([^/]+)\//.exec(filename)?.[1]);
}

export default {
  rules: {
    boundaries: {
      meta: {type: 'problem', schema: [], messages: {invalid: '{{detail}}'}},
      create(context) {
        const from = relative(context.filename);
        const owner = layer(from);
        const report = (node, detail) => context.report({node, messageId: 'invalid', data: {detail}});
        const check = (node, value) => {
          if (typeof value !== 'string') { report(node, 'Dependency must be a literal; dynamic module selection bypasses the registry.'); return; }
          if (!value.startsWith('.')) {
            if (!['adapters', 'reference'].includes(owner)) report(node, 'External imports and aliases are forbidden in this layer; use an explicit host port.');
            return;
          }
          const target = relative(path.resolve(path.dirname(context.filename), value));
          if (!migrationEdges.has(`${from} -> ${target}`) && !allowed[owner]?.includes(layer(target))) {
            report(node, `${owner || 'unclassified'} cannot depend on ${target}; consult docs/EXTENSION-CONTRACT.md.`);
          }
        };
        return {
          Program(node) { if (!allowed[owner]) report(node, 'Unclassified source module: assign it to a documented layer.'); },
          ImportDeclaration(node) { check(node, node.source.value); },
          ExportNamedDeclaration(node) { if (node.source) check(node, node.source.value); },
          ExportAllDeclaration(node) { check(node, node.source.value); },
          ImportExpression(node) { check(node, node.source.type === 'Literal' ? node.source.value : undefined); },
          CallExpression(node) { if (node.callee.type === 'Identifier' && node.callee.name === 'require') report(node, 'Use explicit ESM imports; require bypasses the dependency contract.'); },
          TSImportEqualsDeclaration(node) { report(node, 'Use explicit ESM imports; import-equals bypasses the dependency contract.'); },
          TSImportType(node) { check(node, node.argument?.value || node.argument?.literal?.value); },
        };
      },
    },
  },
};
