import { compareWithRuntime } from "../adapters/lexical018/runtime.js";
import { createController } from "../application/controller.js";
import { referenceEngine } from "./engine.js";
export function compareSnapshots(a, b, options) {
    return compareWithRuntime(a, b, {
        ...options,
        engine: options.engine || referenceEngine,
    });
}
export function createComparisonController(options) {
    const engine = options.engine || referenceEngine;
    return createController({
        ...options,
        compare: (a, b) => compareWithRuntime(a, b, { createEditor: options.createEditor, engine }),
    });
}
export { prepareSnapshot, compareWithRuntime, } from "../adapters/lexical018/runtime.js";
export { createEngine } from "../core/engine.js";
export { resolvePolicy, presets } from "../core/policy.js";
export { createController } from "../application/controller.js";
export { builtinHandlers } from "../handlers/builtins.js";
export { compare, canonical, plain, tokens, validate, LIMITS, createReferenceEngine, } from "./engine.js";
