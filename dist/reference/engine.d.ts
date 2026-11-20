import type { Handler } from "../contracts/model.js";
export declare const referenceRendererTypes: string[];
export declare function createReferenceEngine(options?: {
    policy?: unknown;
    hostPolicy?: unknown;
    handlers?: readonly Handler[];
    renderers?: readonly string[];
}): import("../contracts/model.js").Engine;
export declare const referenceEngine: import("../contracts/model.js").Engine;
export declare const compare: (a: unknown, b: unknown) => import("../contracts/model.js").ComparisonReport;
export { canonical, plain, tokens, validate, LIMITS } from "../core/data.js";
