import type { SavedNode } from "../contracts/model.js";
export const el = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  cls?: string,
  txt?: string,
): HTMLElementTagNameMap[K] => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (txt !== undefined) n.textContent = txt;
  return n;
};
export function preserveFormat(n: HTMLElement, f: number | string = 0) {
  for (const [bit, tag] of [
    [1, "strong"],
    [2, "em"],
    [4, "s"],
    [8, "u"],
    [16, "code"],
    [32, "sub"],
    [64, "sup"],
  ] as const)
    if (Number(f) & bit) {
      const wrapper = el(tag);
      wrapper.append(...n.childNodes);
      n.append(wrapper);
    }
  return n;
}
export function safeUrl(value: string | undefined) {
  try {
    const u = new URL(value || "", location.href);
    return ["https:", "http:"].includes(u.protocol) ? u.href : null;
  } catch {
    return null;
  }
}
export function placeholder(title: string, msg: string) {
  const n = el("div", "placeholder");
  n.append(el("strong", "", title), el("p", "", msg));
  return n;
}
export function source(label: string, value: unknown) {
  const n = el("div", "url-note");
  n.append(
    el("span", "", label),
    el("code", "", typeof value === "string" ? value : "未提供"),
  );
  return n;
}
export function payload(node: SavedNode) {
  const n = el("details", "payload");
  n.append(
    el("summary", "", "查看保存資料"),
    el("pre", "source-box", JSON.stringify(node, null, 2)),
  );
  return n;
}
