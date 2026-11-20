import { el } from "../ui/dom.js";
export const calloutRenderer = (node, renderChild) => {
    const content = el("aside", "node-quote");
    content.append(el("strong", "", node.title || "提醒"));
    content.append(...(node.children || []).map(renderChild));
    return content;
};
