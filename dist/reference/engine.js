import { createEngine } from "../core/engine.js";
import { builtinHandlers, fields } from "../handlers/builtins.js";
export const referenceRendererTypes = Object.keys(fields);
export function createReferenceEngine(options = {}) {
    return createEngine({
        handlers: options.handlers || builtinHandlers,
        renderers: options.renderers || referenceRendererTypes,
        policy: options.policy,
        hostPolicy: options.hostPolicy,
    });
}
export const referenceEngine = createReferenceEngine();
export const compare = referenceEngine.compare;
export { canonical, plain, tokens, validate, LIMITS } from "../core/data.js";
