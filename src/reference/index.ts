import { compareWithRuntime } from "../adapters/lexical018/runtime.js";
import type { EditorFactory } from "../adapters/lexical018/runtime.js";
import { createController } from "../application/controller.js";
import type { ControllerPorts } from "../application/controller.js";
import type { Engine } from "../contracts/model.js";
import { referenceEngine } from "./engine.js";

export function compareSnapshots(
  a: unknown,
  b: unknown,
  options: { createEditor: EditorFactory; engine?: Engine },
) {
  return compareWithRuntime(a, b, {
    ...options,
    engine: options.engine || referenceEngine,
  });
}
export function createComparisonController(
  options: Omit<ControllerPorts, "compare"> & {
    createEditor: EditorFactory;
    engine?: Engine;
  },
) {
  const engine = options.engine || referenceEngine;
  return createController({
    ...options,
    compare: (a, b) =>
      compareWithRuntime(a, b, { createEditor: options.createEditor, engine }),
  });
}
export {
  prepareSnapshot,
  compareWithRuntime,
} from "../adapters/lexical018/runtime.js";
export type { EditorFactory } from "../adapters/lexical018/runtime.js";
export { createEngine } from "../core/engine.js";
export { resolvePolicy, presets } from "../core/policy.js";
export { createController } from "../application/controller.js";
export { builtinHandlers } from "../handlers/builtins.js";
export {
  compare,
  canonical,
  plain,
  tokens,
  validate,
  LIMITS,
  createReferenceEngine,
} from "./engine.js";
export type * from "../contracts/model.js";
