import { canonical } from "./data.js";
/** Exact serialized content, ignoring only node identity; no text/style normalization. */
function withoutIdentity(node) {
    const fields = {};
    for (const [key, value] of Object.entries(node)) {
        if (key === "blockId")
            continue;
        fields[key] =
            key === "children" ? (node.children || []).map(withoutIdentity) : value;
    }
    return fields;
}
export function exactNodeKey(node) {
    return canonical(withoutIdentity(node));
}
/** Stable IDs win. Content anchors require uniqueness across each complete sibling list. */
export function recoverContentPairs(a, b) {
    const index = (nodes) => {
        const result = new Map();
        for (const node of nodes) {
            const key = exactNodeKey(node);
            const list = result.get(key) || [];
            list.push(node);
            result.set(key, list);
        }
        return result;
    };
    const ai = index(a), bi = index(b), aIds = new Set(a.map((n) => n.blockId)), bIds = new Set(b.map((n) => n.blockId));
    const pairs = [];
    for (const [key, left] of ai) {
        const right = bi.get(key);
        if (left.length === 1 &&
            right?.length === 1 &&
            !bIds.has(left[0].blockId) &&
            !aIds.has(right[0].blockId))
            pairs.push([left[0], right[0]]);
    }
    return pairs;
}
