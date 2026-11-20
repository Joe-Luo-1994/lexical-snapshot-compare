import { scenarios } from "./scenarios.js";
export function rekey(snapshot, prefix = "paste") {
    let next = 0;
    const walk = (node) => ({
        ...node,
        ...(node.blockId ? { blockId: `${prefix}-${next++}` } : {}),
        ...(node.children ? { children: node.children.map(walk) } : {}),
    });
    return {
        ...snapshot,
        revision: prefix,
        label: "刪除後貼回",
        editorState: { root: walk(snapshot.editorState.root) },
    };
}
const a = scenarios.find((s) => s.id === "article-policy").a;
const same = rekey(a);
const change = (node) => ({
    ...node,
    ...(node.type === "text" && node.text?.includes("實質性修改")
        ? { text: node.text.replace("必須獲得", "無須獲得") }
        : {}),
    ...(node.children ? { children: node.children.map(change) } : {}),
});
const b = { ...same, editorState: { root: change(same.editorState.root) } };
const paragraph = (id, text) => ({
    type: "paragraph",
    version: 1,
    blockId: id,
    direction: null,
    format: "",
    indent: 0,
    textStyle: "",
    children: [
        {
            type: "text",
            version: 1,
            text,
            format: 0,
            detail: 0,
            mode: "normal",
            style: "",
        },
    ],
});
const repeated = {
    ...a,
    editorState: {
        root: {
            ...a.editorState.root,
            children: Array.from({ length: 12 }, (_, i) => paragraph(`repeat-${i}`, "證據須保存 30 天；刪除前必須經資料擁有人核准。")),
        },
    },
};
const repeatedB = rekey(repeated);
const repeatedEdited = {
    ...repeatedB,
    editorState: {
        root: {
            ...repeatedB.editorState.root,
            children: repeatedB.editorState.root.children.map((n, i) => i === 6
                ? paragraph(n.blockId, "證據須保存 7 天；刪除前無須經資料擁有人核准。")
                : n),
        },
    },
};
const examples = [
    {
        id: "paste-same",
        title: "整頁貼回 · 內容完全相同",
        task: "判斷內容是否變更；區塊ID重建不應變成整頁刪除與新增。",
        context: "公開規範文章的受控複製演練；非上游修訂史。",
        a,
        b: same,
    },
    {
        id: "paste-edit",
        title: "整頁貼回 · 修改核准義務",
        task: "找出貼回後變更的核准義務，分辨可確認相同內容與尚無法逐段配對的部分。",
        context: "ID全部重建；相同內容不等於同一區塊延續。",
        a,
        b,
    },
    {
        id: "paste-extra",
        title: "原文保留 · 額外貼上整頁",
        task: "確認原文仍存在，而貼上的副本是新增內容。",
        a,
        b: {
            ...same,
            label: "原文加副本",
            editorState: {
                root: {
                    ...a.editorState.root,
                    children: [
                        ...a.editorState.root.children,
                        ...same.editorState.root.children,
                    ],
                },
            },
        },
    },
    {
        id: "paste-repeated",
        title: "重複條款 · 貼回後改一條",
        task: "核對期限及核准義務；重複條款不能憑位置猜配對，請閱讀兩份完整待核對內容。",
        context: "12條相同條款；所有ID重建，其中一條內容變更。",
        a: repeated,
        b: repeatedEdited,
    },
];
// Controlled fixture lineage only: IDs are already known from the simulated edit, never inferred by path.
function nativeFixture(snapshot) {
    const nodes = {};
    const walk = (node, path) => {
        const { blockId, ...saved } = node;
        if (blockId)
            nodes[path] = blockId;
        return {
            ...saved,
            ...(node.children
                ? {
                    children: node.children.map((child, i) => walk(child, `${path}/children/${i}`)),
                }
                : {}),
        };
    };
    return {
        ...snapshot,
        editorState: { root: walk(snapshot.editorState.root, "/root") },
        identity: { version: 1, namespace: "paste-exercise", nodes },
    };
}
export const pasteScenarios = examples.map((s) => ({
    ...s,
    documentTitle: s.id === "paste-repeated"
        ? "重複條款 · 配對邊界演練"
        : "CNCF 規範文章 · 貼上演練",
    context: "受控測試修訂，非上游歷史或政策依據。" + (s.context || ""),
    ...(s.id === "paste-repeated"
        ? {}
        : {
            provenance: scenarios.find((x) => x.id === "article-policy")
                .provenance,
        }),
    savedA: nativeFixture(s.a),
    savedB: nativeFixture(s.b),
}));
