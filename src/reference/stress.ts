import type { SavedNode, Scenario, Snapshot } from "../contracts/model.js";
const paragraph = (id: string, value: string): SavedNode => ({
  type: "paragraph",
  textStyle: "",
  version: 1,
  blockId: id,
  direction: null,
  format: "",
  indent: 0,
  children: [
    {
      type: "text",
      version: 1,
      text: value,
      format: 0,
      detail: 0,
      mode: "normal",
      style: "",
    },
  ],
});
const snapshot = (
  children: readonly SavedNode[],
  revision: string,
): Snapshot => ({
  revision,
  label: revision,
  savedAt: "合成壓力測資",
  editorState: {
    root: {
      type: "root",
      version: 1,
      direction: null,
      format: "",
      indent: 0,
      children,
    },
  },
});
const original = Array.from({ length: 160 }, (_, i) =>
  paragraph(
    `rule-${i}`,
    `第 ${i + 1} 條：服務 ${String(i + 1).padStart(3, "0")} 上線前須由值班負責人核對監控、回復程序與核准紀錄。失敗時必須回復，證據保留 30 天。`,
  ),
);
const inserted = Array.from({ length: 80 }, (_, i) =>
  paragraph(
    `new-${i}`,
    `新增附則 ${i + 1}：區域服務應保留獨立驗證記錄，完成通知、備援切換與資料完整性檢查後才能進入下一階段。`,
  ),
);
const moved = [
  ...original.slice(0, 20),
  ...original.slice(100, 140),
  ...original.slice(20, 100),
  ...original.slice(140),
];
const edited = moved.map((n) =>
  n.blockId === "rule-117"
    ? paragraph(
        n.blockId,
        "第 118 條：服務 118 上線前須核對監控。失敗時可以回復，證據保留 7 天。",
      )
    : n,
);
export const stressScenarios: readonly Scenario[] = [
  {
    id: "stress-insert",
    title: "壓力測試 · 中段新增80條規範",
    task: "確認新增附則範圍，既有160條規範不應被誤報為搬移或修改。",
    context: "合成160條規範＋80條附則；固定持久身分，不按位置配對。",
    a: snapshot(original, "原規範"),
    b: snapshot(
      [...original.slice(0, 60), ...inserted, ...original.slice(60)],
      "新增附則",
    ),
    expected: { changedIds: inserted.map((n) => n.blockId!) },
  },
  {
    id: "stress-move",
    title: "壓力測試 · 搬移40條並改義務",
    task: "確認第101–140條排列位置改變，同時找到第118條回復義務與保存期限修改。",
    context: "合成章節重排；順序不同不代表能還原作者的搬移操作。",
    a: snapshot(original, "原規範"),
    b: snapshot(edited, "重排與規則修訂"),
    expected: { changedIds: ["rule-117"] },
  },
  {
    id: "stress-reorder-only",
    title: "壓力測試 · 只重排、無文字修改",
    task: "區分沒有文字變更與排列順序已改變。展開完整前後文件核對順序。",
    a: snapshot(original, "原規範"),
    b: snapshot(moved, "僅重排"),
    expected: { changedIds: [] },
  },
];
