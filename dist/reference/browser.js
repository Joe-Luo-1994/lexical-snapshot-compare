import { pasteScenarios } from "./paste.js";
import { blueprintScenarios } from "./blueprint.js";
import { stressScenarios } from "./stress.js";
import { builtinHandlers } from "../handlers/builtins.js";
import { referenceRendererTypes } from "./engine.js";
import { calloutHandler, calloutScenario } from "./callout.js";
import { calloutRenderer } from "./callout-renderer.js";
import { mountComparison } from "../ui/app.js";
import { createReferenceEngine } from "./engine.js";
import { presets } from "../core/policy.js";
import { scenarios, defaultScenario } from "./scenarios.js";
const theme = document.querySelector("#theme");
if (theme)
    theme.onchange = () => {
        if (theme.value === "system")
            delete document.documentElement.dataset.theme;
        else
            document.documentElement.dataset.theme = theme.value;
    };
// Demo composition only. Product flags/authorization belong to the host, never URL input.
const requested = new URLSearchParams(location.search).get("preset") || "standard";
if (!Object.hasOwn(presets, requested)) {
    const message = document.createElement("p");
    message.textContent = "無法使用此比較設定，請選擇標準、保守或精簡模式。";
    const recovery = document.createElement("a");
    recovery.href = "./" + location.hash;
    recovery.textContent = "使用標準設定重新開始";
    document.querySelector("#document")?.replaceChildren(message, recovery);
}
else {
    const policy = presets[requested];
    const toolbar = document.querySelector(".sidebar-top");
    const label = document.createElement("label");
    label.htmlFor = "capability-preset";
    label.textContent = "比較能力";
    const select = document.createElement("select");
    select.id = "capability-preset";
    for (const [value, text] of Object.entries({
        standard: "標準 · 精準表格與雙閱讀模式",
        conservative: "保守 · 整區表格、不預覽媒體",
        compact: "精簡 · 連續閱讀、不提供下載",
    })) {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = text;
        select.append(option);
    }
    select.value = requested;
    select.onchange = () => {
        const url = new URL(location.href);
        url.searchParams.set("preset", select.value);
        location.assign(url);
    };
    toolbar?.append(label, select);
    const dispose = mountComparison({
        scenarios: [
            ...scenarios,
            ...stressScenarios,
            ...pasteScenarios,
            ...blueprintScenarios,
            calloutScenario,
        ],
        defaultScenario,
        renderers: { callout: calloutRenderer },
        engine: createReferenceEngine({
            policy,
            handlers: [...builtinHandlers, calloutHandler],
            renderers: [...referenceRendererTypes, "callout"],
        }),
    });
    window.addEventListener("pagehide", dispose, { once: true });
}
