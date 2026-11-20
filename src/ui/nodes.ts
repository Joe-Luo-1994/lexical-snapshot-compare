import type { Engine, SavedNode } from "../contracts/model.js";
import { el, safeUrl, placeholder, source, payload } from "./dom.js";
import { plain } from "../presentation/changes.js";
export type NodeRenderer = (
  node: SavedNode,
  renderChild: (node: SavedNode) => HTMLElement,
) => HTMLElement;
export function createNodeRenderer(
  engine: Engine,
  renderers: Readonly<Record<string, NodeRenderer>> = {},
) {
  const builtinRendererTypes = [
    "root",
    "paragraph",
    "heading",
    "text",
    "linebreak",
    "link",
    "quote",
    "collapse",
    "table",
    "tablerow",
    "tablecell",
    "image",
    "video",
    "mermaid",
    "list",
    "listitem",
    "code",
    "code-highlight",
  ];
  for (const type of Object.keys(renderers))
    if (builtinRendererTypes.includes(type))
      throw new Error("DUPLICATE_RENDERER:" + type);
  for (const type of engine.rendererTypes)
    if (!builtinRendererTypes.includes(type) && !renderers[type])
      throw new Error("MISSING_RENDERER:" + type);
  const registeredRenderers = { ...renderers };
  function renderNode(node: SavedNode | null): HTMLElement {
    if (!node) return el("p", "changed-empty", "此版本沒有這個區塊");
    if (registeredRenderers[node.type]) {
      try {
        return registeredRenderers[node.type](node, renderNode);
      } catch {
        const n = el("div");
        n.append(
          placeholder(
            "此內容預覽失敗",
            "請核對保存資料，不能由預覽失敗判定內容相同。",
          ),
          payload(node),
        );
        return n;
      }
    }
    const children = () => (node.children || []).map(renderNode);
    switch (node.type) {
      case "root": {
        const n = el("div");
        n.append(...children());
        return n;
      }
      case "code-highlight":
      case "text": {
        let n = el("span", "", node.text);
        const f = Number(node.format || 0);
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
            const x = el(tag);
            x.append(n);
            n = x;
          }
        if (Number(f) & 128) n.style.textTransform = "lowercase";
        if (Number(f) & 256) n.style.textTransform = "uppercase";
        return n;
      }
      case "linebreak":
        return el("br");
      case "paragraph": {
        const n = el("p");
        n.append(...children());
        return n;
      }
      case "heading": {
        const n = el(
          (/^h[1-6]$/.test(node.tag || "") ? node.tag : "h2") as "h2",
          "context-heading",
        );
        n.append(...children());
        return n;
      }
      case "link": {
        const url = safeUrl(node.url);
        const n = el(url ? "a" : "span");
        if (url && n instanceof HTMLAnchorElement) {
          n.href = url;
          n.target = "_blank";
          n.rel = "noopener noreferrer";
        }
        n.append(...children());
        return n;
      }
      case "list": {
        const n = el(node.listType === "number" ? "ol" : "ul");
        if (node.listType === "number")
          (n as HTMLOListElement).start = node.start || 1;
        n.append(...children());
        return n;
      }
      case "listitem": {
        const n = el("li");
        if (node.value) n.value = node.value;
        n.append(...children());
        return n;
      }
      case "code": {
        const n = el("div");
        n.append(
          el("span", "raw-note", node.language || "程式碼"),
          el("pre", "source-box", plain(node)),
        );
        return n;
      }
      case "quote": {
        const n = el("blockquote", "node-quote");
        n.append(...children());
        return n;
      }
      case "collapse": {
        const n = el("details", "node-collapse");
        n.open = node.collapsed === false;
        n.append(el("summary", "", node.title || "收合內容"));
        const inner = el("div", "collapse-content");
        inner.append(
          el(
            "p",
            "raw-note",
            node.collapsed === false
              ? "此版本保存時為展開狀態。"
              : "此版本保存時為收合狀態。",
          ),
          ...children(),
        );
        n.append(inner);
        return n;
      }
      case "table": {
        const outer = el("div", "table-scroll");
        outer.tabIndex = 0;
        outer.setAttribute("aria-label", "完整表格，可左右捲動");
        const n = el("table");
        const body = el("tbody");
        body.append(...children());
        n.append(body);
        outer.append(n);
        return outer;
      }
      case "tablerow": {
        const n = el("tr");
        n.append(...children());
        return n;
      }
      case "tablecell": {
        const n = el(node.headerState ? "th" : "td");
        if (node.headerState === 1) n.scope = "col";
        if (node.headerState === 2) n.scope = "row";
        n.colSpan = Math.min(100, Math.max(1, Number(node.colSpan) || 1));
        n.rowSpan = Math.min(100, Math.max(1, Number(node.rowSpan) || 1));
        n.append(...children());
        return n;
      }
      case "image": {
        const n = el("figure");
        if (
          engine.policy.mediaPreview === "reference-assets" &&
          ["assets/screen-before.svg", "assets/screen-after.svg"].includes(
            node.src || "",
          )
        ) {
          const img = el("img", "media-preview");
          img.src = node.src || "";
          img.alt = node.alt || "操作圖示意";
          img.width = 640;
          img.height = 320;
          n.append(img);
        } else
          n.append(
            placeholder(
              engine.policy.mediaPreview === "off"
                ? "圖片預覽已停用"
                : "無法確認歷史圖片",
              "保留來源資訊，未以目前圖片代替舊版。",
            ),
          );
        n.append(
          el("figcaption", "", node.caption || node.alt || "未提供圖片描述"),
          source("圖片來源", node.src),
        );
        if (node.alt) n.append(source("替代文字", node.alt));
        if (node.poster) n.append(source("封面來源", node.poster));
        if (node.assetVersion) n.append(source("資產版本", node.assetVersion));
        return n;
      }
      case "video": {
        const n = el("div");
        n.append(
          placeholder(
            node.title || "教學影片",
            "此合成案例沒有可播放的歷史影片，無法驗證影片內容。",
          ),
          source("影片來源", node.src),
        );
        if (node.alt) n.append(source("替代文字", node.alt));
        if (node.poster) n.append(source("封面來源", node.poster));
        if (node.assetVersion) n.append(source("資產版本", node.assetVersion));
        return n;
      }
      case "mermaid": {
        const n = el("div");
        n.append(
          placeholder(
            "流程預覽尚未驗證",
            "請核對下方流程來源；不根據布局猜測邏輯差異。",
          ),
          el("pre", "source-box", node.source || ""),
        );
        return n;
      }
      default: {
        const n = el("div");
        n.append(
          placeholder(
            "此內容尚未支援",
            `區塊類型：${node.type}。請由熟悉這類內容的人確認。`,
          ),
          payload(node),
        );
        return n;
      }
    }
  }
  return renderNode;
}
