export function createController(ports) {
    let generation = 0, abort = null;
    return {
        async select(pair) {
            const id = ++generation;
            abort?.abort();
            abort = new AbortController();
            const signal = abort.signal;
            const selected = {
                documentId: pair.documentId,
                baselineRevision: pair.baselineRevision,
                targetRevision: pair.targetRevision,
            };
            if (Object.values(selected).some((v) => typeof v !== "string" || !v)) {
                ports.onState({
                    kind: "error",
                    pair: selected,
                    message: "EXPLICIT_DOCUMENT_AND_REVISIONS_REQUIRED",
                });
                return;
            }
            ports.onState({ kind: "loading", pair: selected });
            try {
                const revisions = [selected.baselineRevision, selected.targetRevision];
                const [a, b] = await Promise.all(revisions.map((revision) => ports.loadSnapshot({
                    documentId: selected.documentId,
                    revision,
                    signal,
                })));
                if (id !== generation)
                    return;
                for (const [index, value] of [a, b].entries())
                    if (value.documentId !== selected.documentId ||
                        value.revision !== revisions[index])
                        throw new Error("SNAPSHOT_IDENTITY_MISMATCH");
                const result = ports.compare(a, b);
                if (result.status === "failed")
                    ports.onState({
                        kind: "error",
                        pair: selected,
                        result,
                        message: result.diagnostics.map((d) => d.message).join("; "),
                    });
                else
                    ports.onState({ kind: result.status, pair: selected, result });
            }
            catch (error) {
                if (id === generation)
                    ports.onState({
                        kind: "error",
                        pair: selected,
                        message: error instanceof Error ? error.message : String(error),
                    });
            }
        },
        dispose() {
            generation++;
            abort?.abort();
        },
    };
}
