import type { Handler, Scenario } from "../contracts/model.js";
import { fallback } from "../core/engine.js";
import { shallow, simpleText } from "../core/data.js";

/** Extension exercise, not a claim about a company's serialized custom node. */
export const calloutHandler: Handler = {
  type: "callout",
  nodeVersion: 1,
  implementationVersion: "1.0.0",
  fields: ["children", "tone", "title"],
  supports: (n) =>
    ["note", "warning"].includes(String(n.tone)) && typeof n.title === "string",
  compare(a, b) {
    const ac = a.children || [],
      bc = b.children || [];
    if (
      shallow(a, ["children"]) === shallow(b, ["children"]) &&
      ac.length === 1 &&
      bc.length === 1 &&
      ac[0].type === "paragraph" &&
      bc[0].type === "paragraph" &&
      simpleText(ac[0]) &&
      simpleText(bc[0]) &&
      shallow(ac[0], ["children"]) === shallow(bc[0], ["children"]) &&
      [...(ac[0].children || []), ...(bc[0].children || [])].every(
        (n) => n.format === 0,
      )
    )
      return {
        kind: "text",
        changed: true,
        reasonCode: "NONE",
        verification: null,
      };
    return fallback(true, "WHOLE_BLOCK");
  },
};
const state = (days: number) => ({
  editorState: {
    root: {
      type: "root",
      version: 1,
      children: [
        {
          type: "callout",
          version: 1,
          blockId: "callout-rule",
          title: "資料保存提醒",
          tone: "warning",
          children: [
            {
              type: "paragraph",
              version: 1,
              children: [
                {
                  type: "text",
                  version: 1,
                  text: `審查證據須保存 ${days} 天。`,
                  format: 0,
                  detail: 0,
                  mode: "normal",
                  style: "",
                },
              ],
            },
          ],
        },
      ],
    },
  },
});
export const calloutScenario: Scenario = {
  id: "extension-callout",
  title: "擴充演練 · 提示區塊",
  group: "擴充契約驗收",
  context:
    "合成擴充案例 · 非公司 node schema · 展示新增 handler 與 renderer 的接入方式",
  task: "請確認提醒區塊的證據保存期限如何改變，並核對原始內容。",
  a: {
    ...state(30),
    revision: "example-a",
    label: "調整前",
    savedAt: "合成測資",
  },
  b: {
    ...state(7),
    revision: "example-b",
    label: "調整後",
    savedAt: "合成測資",
  },
};
