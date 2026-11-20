import { $getRoot } from "lexical";
import { canonical, validate } from "../../core/data.js";
const message = (error) => error instanceof Error ? error.message : String(error);
export function prepareSnapshot(input, options) {
    const source = typeof input === "string" ? JSON.parse(input) : input;
    const envelope = source && typeof source === "object" && "editorState" in source
        ? source
        : { editorState: source };
    validate(envelope);
    const saved = envelope;
    const snapshot = structuredClone(saved);
    const diagnostics = [];
    const identity = snapshot.identity;
    if (identity !== undefined) {
        if (!identity ||
            identity.version !== 1 ||
            typeof identity.namespace !== "string" ||
            !identity.namespace ||
            typeof identity.nodes !== "object" ||
            Array.isArray(identity.nodes) ||
            !identity.nodes)
            throw new Error("INVALID_IDENTITY_MANIFEST");
        const pending = new Map(Object.entries(identity.nodes)), ids = new Set();
        function walk(n, path) {
            if (pending.has(path)) {
                const id = pending.get(path);
                if (typeof id !== "string" || !id || ids.has(id))
                    throw new Error("INVALID_IDENTITY_MANIFEST");
                if (n.blockId !== undefined && n.blockId !== id)
                    throw new Error("CONFLICTING_IDENTITY");
                ids.add(id);
                // Only our deep-cloned comparison projection receives identity. Saved JSON is unchanged.
                const owned = n;
                owned.blockId = id;
                pending.delete(path);
            }
            for (const [i, c] of (n.children || []).entries())
                walk(c, path + "/children/" + i);
        }
        walk(snapshot.editorState.root, "/root");
        if (pending.size)
            throw new Error("STALE_IDENTITY_PATH");
    }
    if (snapshot.editorState.root.children?.some((n) => !n.blockId))
        diagnostics.push({
            code: "IDENTITY_UNAVAILABLE",
            message: "保存版本缺少可靠區塊身分；只能核對完整文件，不按陣列位置猜配對。",
        });
    if (typeof options?.createEditor !== "function")
        throw new Error("EXPLICIT_HOST_EDITOR_FACTORY_REQUIRED");
    let runtime;
    try {
        const errors = [];
        const editor = options.createEditor((error) => errors.push(error));
        const state = editor.parseEditorState(JSON.stringify(saved.editorState));
        if (errors.length)
            throw errors[0];
        const exported = state.toJSON();
        const changes = [];
        function inspect(a, b, path) {
            if (a &&
                typeof a === "object" &&
                b &&
                typeof b === "object" &&
                Array.isArray(a) === Array.isArray(b)) {
                for (const k of new Set([...Object.keys(a), ...Object.keys(b)]))
                    inspect(a[k], b[k], path + "/" + k);
            }
            else if (canonical(a) !== canonical(b))
                changes.push(path);
        }
        inspect(saved.editorState, exported, "");
        const count = (n) => 1 + (n.children || []).reduce((sum, c) => sum + count(c), 0);
        runtime = {
            parsed: true,
            nodeCount: count(exported.root),
            textLength: state.read(() => $getRoot().getTextContent().length),
            roundTripChanges: changes,
        };
        if (changes.length)
            diagnostics.push({
                code: "RUNTIME_ROUNDTRIP_CHANGED",
                paths: changes,
                message: "Lexical重新序列化與保存資料不同；比較仍保留原JSON，不能將被捨棄欄位當作相同。",
            });
    }
    catch (error) {
        runtime = { parsed: false };
        diagnostics.push({ code: "LEXICAL_PARSE_FAILED", message: message(error) });
    }
    return { snapshot, runtime, diagnostics };
}
export function compareWithRuntime(a, b, options) {
    try {
        const left = prepareSnapshot(a, options), right = prepareSnapshot(b, options);
        if (left.snapshot.identity?.namespace !== right.snapshot.identity?.namespace)
            throw new Error("IDENTITY_NAMESPACE_MISMATCH");
        const result = options.engine.compare(left.snapshot, right.snapshot);
        const diagnostics = [
            ...left.diagnostics.map((d) => ({ ...d, side: "a" })),
            ...right.diagnostics.map((d) => ({ ...d, side: "b" })),
        ];
        return {
            ...result,
            status: diagnostics.length ? "partial" : "ready",
            diagnostics,
            runtime: { a: left.runtime, b: right.runtime },
            snapshots: { a: left.snapshot, b: right.snapshot },
        };
    }
    catch (error) {
        return {
            status: "failed",
            records: [],
            moved: false,
            diagnostics: [{ code: "INVALID_SNAPSHOT", message: message(error) }],
        };
    }
}
