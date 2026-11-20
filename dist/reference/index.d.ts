import type { EditorFactory } from "../adapters/lexical018/runtime.js";
import type { ControllerPorts } from "../application/controller.js";
import type { Engine } from "../contracts/model.js";
export declare function compareSnapshots(a: unknown, b: unknown, options: {
    createEditor: EditorFactory;
    engine?: Engine;
}): import("../contracts/model.js").RuntimeResult;
export declare function createComparisonController(options: Omit<ControllerPorts, "compare"> & {
    createEditor: EditorFactory;
    engine?: Engine;
}): {
    select(pair: import("../contracts/model.js").Pair): Promise<void>;
    dispose(): void;
};
export { prepareSnapshot, compareWithRuntime, } from "../adapters/lexical018/runtime.js";
export type { EditorFactory } from "../adapters/lexical018/runtime.js";
export { createEngine } from "../core/engine.js";
export { resolvePolicy, presets } from "../core/policy.js";
export { createController } from "../application/controller.js";
export { builtinHandlers } from "../handlers/builtins.js";
export { compare, canonical, plain, tokens, validate, LIMITS, createReferenceEngine, } from "./engine.js";
export type * from "../contracts/model.js";
