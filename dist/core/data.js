export const LIMITS = {
    nodes: 12000,
    depth: 32,
    text: 240000,
    inlineCells: 60000,
};
export function canonical(x) {
    if (Array.isArray(x))
        return "[" + x.map(canonical).join(",") + "]";
    if (x && typeof x === "object")
        return ("{" +
            Object.keys(x)
                .sort()
                .map((k) => JSON.stringify(k) +
                ":" +
                canonical(x[k]))
                .join(",") +
            "}");
    return JSON.stringify(x) ?? "undefined";
}
function normalizedContent(n) {
    if (!n || typeof n !== "object")
        return n;
    const c = {};
    for (const [k, v] of Object.entries(n)) {
        if (k === "blockId")
            continue;
        if (k === "children") {
            const merged = [];
            for (const child of v) {
                const prev = merged.at(-1);
                if (child.type === "text" &&
                    prev?.type === "text" &&
                    shallow(child, ["text"]) === shallow(prev, ["text"]))
                    merged[merged.length - 1] = {
                        ...prev,
                        text: (prev.text || "") + (child.text || ""),
                    };
                else
                    merged.push({ ...child });
            }
            c[k] = merged.map(normalizedContent);
        }
        else
            c[k] = v;
    }
    return c;
}
export function contentKey(n) {
    return canonical(normalizedContent(n));
}
export function plain(n) {
    if (!n)
        return "";
    if (["text", "code-highlight"].includes(n.type))
        return n.text || "";
    if (n.type === "linebreak")
        return "\n";
    return ((n.children ?? []) || []).map(plain).join("");
}
export function validate(input) {
    const snapshot = input;
    let size;
    try {
        size = JSON.stringify(snapshot).length;
    }
    catch {
        throw new Error("文件無法讀取，資料結構不完整。");
    }
    if (size > 2000000)
        throw new Error("文件超出此原型的比較範圍。");
    const root = snapshot?.editorState?.root;
    if (!root || root.type !== "root" || !Array.isArray(root.children))
        throw new Error("無法讀取這份文件：缺少完整的文件內容。");
    let nodes = 0, length = 0;
    function visit(n, depth) {
        if (!n ||
            typeof n !== "object" ||
            Array.isArray(n) ||
            typeof n.type !== "string")
            throw new Error("文件包含無效區塊，尚未開始比較。");
        if (++nodes > LIMITS.nodes || depth > LIMITS.depth)
            throw new Error("文件超出此原型的比較範圍，請使用較小的版本對。");
        if (n.children !== undefined && !Array.isArray(n.children))
            throw new Error("區塊內容格式不完整。");
        if ([
            "root",
            "paragraph",
            "heading",
            "link",
            "quote",
            "collapse",
            "table",
            "tablerow",
            "tablecell",
            "list",
            "listitem",
            "code",
        ].includes(n.type) &&
            !Array.isArray(n.children))
            throw new Error("容器區塊缺少內容。");
        for (const key of [
            "text",
            "blockId",
            "mode",
            "style",
            "textStyle",
            "tag",
            "url",
            "src",
            "alt",
            "caption",
            "poster",
            "assetVersion",
            "source",
            "listType",
        ])
            if (n[key] !== undefined && typeof n[key] !== "string")
                throw new Error("無效文字欄位：" + key);
        for (const key of ["title", "language", "direction", "rel", "target"])
            if (n[key] != null && typeof n[key] !== "string")
                throw new Error("無效文字欄位：" + key);
        for (const key of [
            "version",
            "detail",
            "indent",
            "textFormat",
            "headerState",
            "start",
            "value",
        ])
            if (n[key] !== undefined &&
                (typeof n[key] !== "number" || !Number.isFinite(n[key])))
                throw new Error("無效數值欄位：" + key);
        if (n.format !== undefined &&
            typeof n.format !== "number" &&
            typeof n.format !== "string")
            throw new Error("無效格式欄位。");
        for (const key of ["collapsed", "checked"])
            if (n[key] !== undefined && typeof n[key] !== "boolean")
                throw new Error("無效狀態欄位：" + key);
        if (n.type === "table" &&
            (n.children ?? []).some((c) => c.type !== "tablerow"))
            throw new Error("表格列結構不完整。");
        if (n.type === "tablerow" &&
            (n.children ?? []).some((c) => c.type !== "tablecell"))
            throw new Error("表格儲存格結構不完整。");
        if (n.type === "tablecell" &&
            [n.rowSpan ?? 1, n.colSpan ?? 1].some((v) => !Number.isInteger(v) || v < 1 || v > 100))
            throw new Error("表格合併範圍無法可靠顯示。");
        if (["text", "code-highlight"].includes(n.type) &&
            typeof n.text !== "string")
            throw new Error("文字區塊缺少有效文字。");
        length += typeof n.text === "string" ? n.text.length : 0;
        if (length > LIMITS.text)
            throw new Error("文件文字超出此原型的比較範圍。");
        for (const child of (n.children ?? []) || [])
            visit(child, depth + 1);
    }
    visit(root, 0);
    function checkGrid(n) {
        if (n.type === "table" && (n.children ?? []).length) {
            const grid = Array.from({ length: (n.children ?? []).length }, () => []);
            let width = 0, slots = 0;
            for (let y = 0; y < (n.children ?? []).length; y++) {
                let x = 0;
                for (const c of (n.children ?? [])[y].children ?? []) {
                    while (grid[y][x])
                        x++;
                    const rs = c.rowSpan ?? 1, cs = c.colSpan ?? 1;
                    if (y + rs > grid.length)
                        throw new Error("表格合併範圍超出保存的列，無法可靠顯示。");
                    for (let dy = 0; dy < rs; dy++)
                        for (let dx = 0; dx < cs; dx++) {
                            if (++slots > 60000)
                                throw new Error("表格展開範圍過大，超出此原型的比較範圍。");
                            if (grid[y + dy][x + dx])
                                throw new Error("表格合併範圍重疊，無法可靠顯示。");
                            grid[y + dy][x + dx] = true;
                        }
                    x += cs;
                }
                width = Math.max(width, grid[y].length);
            }
            if (grid.some((r) => r.length !== width ||
                Array.from({ length: width }, (_, i) => !r[i]).some(Boolean)))
                throw new Error("表格列寬或合併結構不完整，無法可靠顯示。");
        }
        for (const c of (n.children ?? []) || [])
            checkGrid(c);
    }
    checkGrid(root);
    return root;
}
export function identity(nodes) {
    const ids = nodes.map((n) => n.blockId);
    return (ids.every((id) => typeof id === "string" && id.length > 0) &&
        new Set(ids).size === ids.length);
}
export function shallow(n, omit = []) {
    return canonical(Object.fromEntries(Object.entries(n).filter(([k]) => k !== "blockId" && !omit.includes(k))));
}
export function simpleText(n) {
    return ((n.children ?? [])?.every((c) => c.type === "text" &&
        c.mode === "normal" &&
        c.detail === 0 &&
        c.style === "") &&
        (n.children ?? []).every((c) => c.format === (n.children ?? [])[0]?.format));
}
function spans(n) {
    return (n.children ?? []).every((r) => r.type === "tablerow" &&
        (r.children ?? []).every((c) => c.type === "tablecell" &&
            (c.colSpan ?? 1) === 1 &&
            (c.rowSpan ?? 1) === 1));
}
export function tableChanges(a, b) {
    if (!spans(a) ||
        !spans(b) ||
        !identity(a.children ?? []) ||
        !identity(b.children ?? []) ||
        shallow(a, ["children"]) !== shallow(b, ["children"]))
        return null;
    const width = (a.children ?? [])[0]?.children?.length;
    if (!width ||
        ![...(a.children ?? []), ...(b.children ?? [])].every((r) => (r.children ?? []).length === width && identity(r.children ?? [])))
        return null;
    const am = new Map((a.children ?? []).map((r) => [r.blockId, r]));
    const commonA = (a.children ?? [])
        .filter((r) => (b.children ?? []).some((x) => x.blockId === r.blockId))
        .map((r) => r.blockId)
        .join("|");
    const commonB = (b.children ?? [])
        .filter((r) => am.has(r.blockId))
        .map((r) => r.blockId)
        .join("|");
    if (commonA !== commonB)
        return null;
    const rows = [], bm = new Map((b.children ?? []).map((r) => [r.blockId, r]));
    const order = (b.children ?? []).map((r) => r.blockId);
    for (let i = 0; i < (a.children ?? []).length; i++) {
        const old = (a.children ?? [])[i];
        if (bm.has(old.blockId))
            continue;
        let previous = i - 1;
        while (previous >= 0 &&
            !order.includes((a.children ?? [])[previous].blockId))
            previous--;
        order.splice(previous >= 0
            ? order.indexOf((a.children ?? [])[previous].blockId) + 1
            : 0, 0, old.blockId);
    }
    for (const id of order) {
        const r = bm.get(id), old = am.get(id);
        if (!r) {
            rows.push({ id, status: "removed", a: old, b: null });
            continue;
        }
        if (!old) {
            rows.push({ id: r.blockId, status: "added", a: null, b: r });
            continue;
        }
        if (shallow(old, ["children"]) !== shallow(r, ["children"]) ||
            (old.children ?? []).some((c, i) => c.blockId !== (r.children ?? [])[i].blockId))
            return null;
        const cells = [];
        for (let i = 0; i < (r.children ?? []).length; i++) {
            const x = (old.children ?? [])[i], y = (r.children ?? [])[i];
            if (shallow(x, ["children"]) !== shallow(y, ["children"]) ||
                (x.children ?? []).length !== 1 ||
                (y.children ?? []).length !== 1 ||
                (x.children ?? [])[0].type !== "paragraph" ||
                (y.children ?? [])[0].type !== "paragraph" ||
                !simpleText((x.children ?? [])[0]) ||
                !simpleText((y.children ?? [])[0]) ||
                [
                    ...((x.children ?? [])[0].children ?? []),
                    ...((y.children ?? [])[0].children ?? []),
                ].some((t) => t.format !== 0))
                return null;
            cells.push({ a: x, b: y, changed: contentKey(x) !== contentKey(y) });
        }
        rows.push({
            id: r.blockId,
            status: cells.some((c) => c.changed) ? "modified" : "same",
            a: old,
            b: r,
            cells,
        });
    }
    return rows;
}
export function tokens(a, b) {
    // Keep numeric values intact: 180→30 must not read as 18→3 followed by an unchanged 0.
    const split = (s) => s
        .split(/(\d+(?:[.,]\d+)*(?:%)?)/u)
        .filter(Boolean)
        .flatMap((part) => /^\d/.test(part)
        ? [part]
        : typeof Intl.Segmenter === "function"
            ? [
                ...new Intl.Segmenter("zh-Hant", {
                    granularity: "grapheme",
                }).segment(part),
            ].map((x) => x.segment)
            : Array.from(part));
    const x = split(a), y = split(b);
    if (x.length * y.length > LIMITS.inlineCells)
        return [
            { type: "removed", text: a },
            { type: "added", text: b },
        ];
    const dp = Array.from({ length: x.length + 1 }, () => new Uint32Array(y.length + 1));
    for (let i = x.length - 1; i >= 0; i--)
        for (let j = y.length - 1; j >= 0; j--)
            dp[i][j] =
                x[i] === y[j]
                    ? dp[i + 1][j + 1] + 1
                    : Math.max(dp[i + 1][j], dp[i][j + 1]);
    const out = [];
    function push(type, text) {
        if (out.at(-1)?.type === type)
            out.at(-1).text += text;
        else
            out.push({ type, text });
    }
    let i = 0, j = 0;
    while (i < x.length || j < y.length) {
        if (i < x.length && j < y.length && x[i] === y[j]) {
            push("same", x[i++]);
            j++;
        }
        else if (i < x.length && (j === y.length || dp[i + 1][j] >= dp[i][j + 1]))
            push("removed", x[i++]);
        else
            push("added", y[j++]);
    }
    return out;
}
