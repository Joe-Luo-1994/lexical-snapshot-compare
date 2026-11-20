import type { EffectivePolicy } from "../contracts/model.js";
export declare const presets: {
    readonly standard: {
        readonly tablePrecision: "cells";
        readonly mediaPreview: "reference-assets";
        readonly viewModes: readonly ["flow", "split"];
        readonly download: "enabled";
    };
    readonly conservative: {
        readonly tablePrecision: "whole-block";
        readonly mediaPreview: "off";
        readonly viewModes: readonly ["flow", "split"];
        readonly download: "enabled";
    };
    readonly compact: {
        readonly tablePrecision: "cells";
        readonly mediaPreview: "off";
        readonly viewModes: readonly ["flow"];
        readonly download: "disabled";
    };
};
/** Resolve once per engine/session. Host restrictions can only reduce capability. */
export declare function resolvePolicy(requested?: unknown, host?: unknown): EffectivePolicy;
