import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const allowed = {
  contracts: ["contracts"],
  core: ["contracts", "core"],
  handlers: ["contracts", "core", "handlers"],
  adapters: ["contracts", "core", "adapters"],
  application: ["contracts", "core", "application"],
  presentation: ["contracts", "core", "presentation"],
  ui: ["contracts", "application", "presentation", "ui"],
  reference: [
    "contracts",
    "core",
    "handlers",
    "adapters",
    "application",
    "presentation",
    "ui",
    "reference",
  ],
  entry: [
    "contracts",
    "core",
    "adapters",
    "application",
    "presentation",
    "reference",
  ],
};
const relative = (filename) =>
  path.relative(root, filename).replaceAll("\\", "/");
function layer(filename) {
  return /^src\/([^/]+)\//.exec(filename)?.[1];
}

export default {
  rules: {
    boundaries: {
      meta: {
        type: "problem",
        schema: [],
        messages: { invalid: "{{detail}}" },
      },
      create(context) {
        const from = relative(context.filename);
        const owner = layer(from);
        const report = (node, detail) =>
          context.report({ node, messageId: "invalid", data: { detail } });
        const check = (node, value) => {
          if (typeof value !== "string") {
            report(
              node,
              "Dependency must be a literal; dynamic module selection bypasses the registry.",
            );
            return;
          }
          if (!value.startsWith(".")) {
            if (!["adapters", "reference"].includes(owner))
              report(
                node,
                "External imports and aliases are forbidden in this layer; use an explicit host port.",
              );
            return;
          }
          const target = relative(
            path.resolve(path.dirname(context.filename), value),
          );
          if (!allowed[owner]?.includes(layer(target))) {
            report(
              node,
              `${owner || "unclassified"} cannot depend on ${target}; consult docs/EXTENSION-CONTRACT.md.`,
            );
          }
        };
        return {
          Program(node) {
            if (!allowed[owner])
              report(
                node,
                "Unclassified source module: assign it to a documented layer.",
              );
          },
          ImportDeclaration(node) {
            check(node, node.source.value);
          },
          ExportNamedDeclaration(node) {
            if (node.source) check(node, node.source.value);
          },
          ExportAllDeclaration(node) {
            check(node, node.source.value);
          },
          ImportExpression(node) {
            check(
              node,
              node.source.type === "Literal" ? node.source.value : undefined,
            );
          },
          CallExpression(node) {
            if (
              node.callee.type === "Identifier" &&
              node.callee.name === "require"
            )
              report(
                node,
                "Use explicit ESM imports; require bypasses the dependency contract.",
              );
          },
          TSImportEqualsDeclaration(node) {
            report(
              node,
              "Use explicit ESM imports; import-equals bypasses the dependency contract.",
            );
          },
          TSImportType(node) {
            check(node, node.argument?.value || node.argument?.literal?.value);
          },
        };
      },
    },
  },
};
