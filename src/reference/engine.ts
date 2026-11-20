import { createEngine } from "../core/engine.js";
import { builtinHandlers, fields } from "../handlers/builtins.js";
import type { Handler } from "../contracts/model.js";

export const referenceRendererTypes = Object.keys(fields);
export function createReferenceEngine(
  options: {
    policy?: unknown;
    hostPolicy?: unknown;
    handlers?: readonly Handler[];
    renderers?: readonly string[];
  } = {},
) {
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
