export const presets = {
    standard: {
        tablePrecision: "cells",
        mediaPreview: "reference-assets",
        viewModes: ["flow", "split"],
        download: "enabled",
    },
    conservative: {
        tablePrecision: "whole-block",
        mediaPreview: "off",
        viewModes: ["flow", "split"],
        download: "enabled",
    },
    compact: {
        tablePrecision: "cells",
        mediaPreview: "off",
        viewModes: ["flow"],
        download: "disabled",
    },
};
for (const preset of Object.values(presets)) {
    Object.freeze(preset.viewModes);
    Object.freeze(preset);
}
Object.freeze(presets);
/** Resolve once per engine/session. Host restrictions can only reduce capability. */
export function resolvePolicy(requested = {}, host = {}) {
    function validate(value) {
        if (!value || typeof value !== "object" || Array.isArray(value))
            throw new Error("INVALID_POLICY");
        const v = value;
        for (const k of Object.keys(v))
            if (!["tablePrecision", "mediaPreview", "viewModes", "download"].includes(k))
                throw new Error("UNKNOWN_POLICY_KEY:" + k);
        for (const [key, choices] of Object.entries({
            tablePrecision: ["cells", "whole-block"],
            mediaPreview: ["reference-assets", "off"],
            download: ["enabled", "disabled"],
        })) {
            if (key in v && (typeof v[key] !== "string" || !choices.includes(v[key])))
                throw new Error("INVALID_POLICY:" + key);
        }
        if ("viewModes" in v &&
            (!Array.isArray(v.viewModes) ||
                !v.viewModes.length ||
                new Set(v.viewModes).size !== v.viewModes.length ||
                v.viewModes.some((x) => !["flow", "split"].includes(x))))
            throw new Error("INVALID_POLICY:viewModes");
        return v;
    }
    const r = { ...presets.standard, ...validate(requested) }, h = validate(host);
    const viewModes = [...r.viewModes].filter((m) => !h.viewModes || h.viewModes.includes(m));
    if (!viewModes.length)
        throw new Error("NO_ALLOWED_VIEW_MODE");
    const tablePrecision = h.tablePrecision === "whole-block" ? "whole-block" : r.tablePrecision;
    const mediaPreview = h.mediaPreview === "off" ? "off" : r.mediaPreview;
    const download = h.download === "disabled" ? "disabled" : r.download;
    const notices = [
        tablePrecision === "whole-block" ? "TABLE_PRECISION_DISABLED" : "",
        mediaPreview === "off" ? "MEDIA_PREVIEW_DISABLED" : "",
        viewModes.length === 1 ? "SINGLE_VIEW_MODE" : "",
        download === "disabled" ? "DOWNLOAD_DISABLED" : "",
    ].filter(Boolean);
    return Object.freeze({
        tablePrecision,
        mediaPreview,
        download,
        viewModes: Object.freeze(viewModes),
        notices: Object.freeze(notices),
        id: `policy-v1:${tablePrecision}:${mediaPreview}:${viewModes.join(",")}:${download}`,
    });
}
