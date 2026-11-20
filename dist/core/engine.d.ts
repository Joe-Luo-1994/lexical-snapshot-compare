import type { Engine, Finding, Handler, Verification } from "../contracts/model.js";
export declare function freeze<T>(value: T): T;
export declare const fallback: (changed: boolean, reasonCode: Finding["reasonCode"], verification?: Verification) => Finding;
export declare function createEngine(options: {
    handlers: readonly Handler[];
    policy?: unknown;
    hostPolicy?: unknown;
    renderers: readonly string[];
}): Engine;
