import { plain, tokens, canonical } from "../core/data.js";
import type {
  ChangeRecord,
  SavedNode,
  ReasonCode,
} from "../contracts/model.js";
export { plain, tokens } from "../core/data.js";
export function linkDestinationChanged(r: ChangeRecord) {
  const urls = (n: SavedNode | null): (string | undefined)[] =>
    n
      ? [
          ...(n.type === "link" ? [n.url] : []),
          ...(n.children || []).flatMap(urls),
        ]
      : [];
  return canonical(urls(r.a)) !== canonical(urls(r.b));
}
export function linkChangeName(r: ChangeRecord) {
  return linkDestinationChanged(r) ? "連結目的地變更" : "含連結段落變更";
}
const clip = (value: unknown, n = 36) => {
  const a = Array.from(
    String(value || "")
      .replace(/\s+/g, " ")
      .trim(),
  );
  return a.length > n ? a.slice(0, n).join("") + "…" : a.join("");
};
const typeName: Record<string, string> = {
  image: "圖片",
  video: "影片",
  mermaid: "流程來源",
  table: "表格",
  quote: "引用",
  collapse: "收合內容",
  root: "文件",
};
export function navigationLabel(r: ChangeRecord): string {
  const n = r.b || r.a,
    subject =
      n?.title ||
      n?.caption ||
      n?.alt ||
      (n?.type === "table" ? "表格結構與儲存格" : plain(n)) ||
      typeName[n?.type || ""] ||
      n?.type ||
      "內容";
  if (r.kind === "text") {
    const groups = [];
    let group = [];
    for (const p of tokens(plain(r.a), plain(r.b))) {
      if (p.type === "same") {
        if (group.length) {
          groups.push(
            group.join(" ") +
              (p.text.match(/^\s*(分鐘|小時|天|日|個|次)/)?.[0] || ""),
          );
          group = [];
        }
      } else
        group.push(
          (p.type === "removed" ? "−「" : "＋「") + clip(p.text, 18) + "」",
        );
    }
    if (group.length) groups.push(group.join(" "));
    return (
      groups.slice(0, 3).join("；") + (groups.length > 3 ? " · 另有變動" : "")
    );
  }
  if (r.kind === "table") {
    const rows = r.rows.filter((x) => x.status !== "same");
    return `${rows.length} 列變動 · ${rows
      .slice(0, 2)
      .map((x) => clip(plain((x.b || x.a)?.children?.[0]), 16))
      .join("、")}${rows.length > 2 ? "等" : ""}`;
  }
  if (r.kind === "link")
    return (
      linkChangeName(r) +
      " · " +
      (plain(r.a) !== plain(r.b)
        ? navigationLabel({ ...r, kind: "text" })
        : clip(subject, 28))
    );
  if (r.kind === "format") return "樣式調整 · " + clip(subject, 28);
  if (["added", "removed"].includes(r.kind))
    return (r.kind === "added" ? "新增 · " : "刪除 · ") + clip(subject);
  return (r.changed ? "資料變動 · " : "資料相同 · ") + clip(subject);
}
export const verificationCategories = {
  whole: {
    label: "整區核對",
    help: "已知資料有變動，尚無可靠的逐項對應。",
    action: "展開前後內容",
  },
  media: {
    label: "媒體／流程待驗證",
    help: "只能比較保存資料，尚未確認媒體內容或流程語意。",
    action: "查看內容與來源",
  },
  unsupported: {
    label: "尚未支援",
    help: "有尚未支援的欄位或內容，請核對完整保存資料。",
    action: "查看保存資料",
  },
  pairing: {
    label: "未能可靠配對",
    help: "區塊身分不足，無法可靠指出哪一段對應哪一段。",
    action: "查看完整前後內容",
  },
};
export function verification(r: ChangeRecord) {
  return r.verification;
}

const reasons: Record<ReasonCode, string> = {
  NONE: "",
  UNKNOWN_CONTENT: "此區塊含有尚未支援的內容；請核對完整前後內容與保存資料。",
  MEDIA_UNVERIFIED: "只能核對保存來源與描述；媒體內容仍未驗證。",
  STRUCTURE_CHANGED: "區塊結構已改變，保留完整前後內容供核對。",
  TABLE_STRUCTURE:
    "表格結構或合併範圍改變，無法可靠對齊儲存格。請核對兩份完整表格。",
  FORMAT_CHANGED: "文字格式已改變，請對照前後樣式。",
  LINK_CHANGED: "連結或其內容已變動；目的地列在文字下方。",
  WHOLE_BLOCK: "此區塊已有變動，請核對完整前後內容。",
  COLLAPSE_CHANGED: "收合內容或其設定已改變，展開後查看完整前後內容。",
  MERMAID_UNVERIFIED: "流程來源已變動；此工具未驗證圖形語意，請核對來源。",
  ROOT_CHANGED: "文件層級設定已改變，請核對完整保存資料與內容。",
  ROOT_UNKNOWN: "文件層級資料尚未支援，請核對完整前後內容。",
  IDENTITY_MISSING:
    "區塊缺少唯一且穩定的識別資料，無法可靠配對；請核對完整前後內容。",
  PRECISION_DISABLED:
    "目前設定採整區核對；表格變動仍保留，請閱讀完整前後表格。",
  RENDERER_UNAVAILABLE: "此內容尚無可用的安全呈現方式；請核對完整保存資料。",
  HANDLER_FAILED: "此區塊比較未能完成；保留完整前後資料，不將它視為相同。",
};
export function changeReason(r: ChangeRecord): string {
  return reasons[r.reasonCode];
}
export const policyNotices: Readonly<Record<string, string>> = {
  TABLE_PRECISION_DISABLED: "表格採整區核對，仍保留完整前後內容。",
  MEDIA_PREVIEW_DISABLED: "媒體預覽已停用，來源與描述仍可核對。",
  SINGLE_VIEW_MODE: "目前設定提供單一閱讀方式。",
  DOWNLOAD_DISABLED: "目前設定不提供下載；仍可在文件中查看保存資料。",
};
