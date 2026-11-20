/** Example lifecycle only. Host must bind these to persistence transactions. */
export function freshSubtree(node, allocate) {
    const copy = { ...structuredClone(node) };
    if (node.type !== "text" && node.type !== "linebreak")
        copy.blockId = allocate();
    else
        delete copy.blockId;
    if (node.children)
        copy.children = node.children.map((c) => freshSubtree(c, allocate));
    return copy;
}
function singleText(node) {
    const child = node.children?.[0];
    if (node.type !== "paragraph" ||
        node.children?.length !== 1 ||
        child?.type !== "text" ||
        typeof child.text !== "string")
        throw new Error("Reference operation supports one text run only");
    return child;
}
export function splitParagraph(node, offset, allocate) {
    const child = singleText(node), text = child.text;
    if (!Number.isInteger(offset) || offset < 0 || offset > text.length)
        throw new Error("Invalid split offset");
    return [
        {
            ...structuredClone(node),
            children: [{ ...child, text: text.slice(0, offset) }],
        },
        {
            ...freshSubtree(node, allocate),
            children: [{ ...child, text: text.slice(offset) }],
        },
    ];
}
export function mergeParagraphs(left, right) {
    const a = singleText(left), b = singleText(right);
    if (a.format !== b.format)
        throw new Error("Reference merge requires equivalent simple text formatting");
    return {
        ...structuredClone(left),
        children: [{ ...a, text: a.text + b.text }],
    };
}
