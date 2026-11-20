import type { Handler, SavedNode, Finding } from "../contracts/model.js";
import { plain, shallow, simpleText, tableChanges } from "../core/data.js";
import { fallback } from "../core/engine.js";

const element = ["children", "direction", "format", "indent"];
export const fields: Readonly<Record<string, readonly string[]>> = {
  root: element,
  paragraph: [...element, "textFormat", "textStyle"],
  heading: [...element, "tag"],
  text: ["text", "format", "detail", "mode", "style"],
  linebreak: [],
  link: [...element, "url", "rel", "target", "title"],
  quote: element,
  collapse: [...element, "title", "collapsed"],
  table: [...element, "colWidths"],
  tablerow: [...element, "height"],
  tablecell: [
    ...element,
    "headerState",
    "colSpan",
    "rowSpan",
    "width",
    "backgroundColor",
  ],
  image: ["src", "alt", "caption", "assetVersion"],
  video: ["src", "title", "poster", "assetVersion"],
  mermaid: ["source"],
  list: [...element, "listType", "start", "tag"],
  listitem: [...element, "value", "checked"],
  code: [...element, "language"],
  "code-highlight": [
    "text",
    "format",
    "detail",
    "mode",
    "style",
    "highlightType",
  ],
};
function supports(n: SavedNode): boolean {
  return !(
    (n.direction != null && n.direction !== "ltr") ||
    (n.indent ?? 0) !== 0 ||
    (n.type !== "text" && n.format !== undefined && n.format !== "") ||
    (n.style ?? "") !== "" ||
    (n.textStyle ?? "") !== "" ||
    (n.textFormat ?? 0) !== 0 ||
    (n.type === "text" &&
      (Number(n.format || 0) > 127 || n.mode !== "normal" || n.detail !== 0)) ||
    (n.type === "link" && [n.rel, n.target, n.title].some((v) => v != null)) ||
    n.backgroundColor != null ||
    n.colWidths != null ||
    n.width != null ||
    n.height != null ||
    (n.type === "list" && !["number", "bullet"].includes(n.listType || "")) ||
    (n.type === "listitem" && n.checked !== undefined)
  );
}
const text: Handler["compare"] = (a, b) => {
  if (
    simpleText(a) &&
    simpleText(b) &&
    shallow(a, ["children"]) === shallow(b, ["children"])
  ) {
    const af = a.children?.[0]?.format || 0,
      bf = b.children?.[0]?.format || 0;
    if (af !== bf)
      return {
        kind: plain(a) === plain(b) ? "format" : "coarse",
        changed: true,
        reasonCode: "FORMAT_CHANGED",
        verification: plain(a) === plain(b) ? null : "whole",
      };
    return {
      kind: "text",
      changed: true,
      reasonCode: "NONE",
      verification: null,
    };
  }
  if (
    a.type === "paragraph" &&
    a.children?.some((n) => n.type === "link") &&
    b.children?.some((n) => n.type === "link")
  )
    return {
      kind: "link",
      changed: true,
      reasonCode: "LINK_CHANGED",
      verification: null,
    };
  return fallback(true, "WHOLE_BLOCK");
};
const table: Handler["compare"] = (a, b, policy) => {
  if (policy.tablePrecision === "whole-block")
    return fallback(true, "PRECISION_DISABLED");
  const rows = tableChanges(a, b);
  return rows
    ? {
        kind: "table",
        rows,
        changed: true,
        reasonCode: "NONE",
        verification: null,
      }
    : fallback(true, "TABLE_STRUCTURE");
};
const strategies: Readonly<Record<string, Handler["compare"]>> = {
  paragraph: text,
  heading: text,
  table,
  image: () => fallback(true, "MEDIA_UNVERIFIED", "media"),
  video: () => fallback(true, "MEDIA_UNVERIFIED", "media"),
  mermaid: () => fallback(true, "MERMAID_UNVERIFIED", "media"),
  collapse: () => fallback(true, "COLLAPSE_CHANGED"),
};
export const builtinHandlers: readonly Handler[] = Object.entries(fields).map(
  ([type, list]) => ({
    type,
    nodeVersion: 1,
    implementationVersion: "1.0.0",
    fields: list,
    opaque: ["image", "video", "mermaid"].includes(type),
    supports,
    compare: strategies[type] || ((): Finding => fallback(true, "WHOLE_BLOCK")),
  }),
);
