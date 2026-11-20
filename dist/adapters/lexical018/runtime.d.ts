import type { LexicalEditor } from "lexical";
import type { Engine, Prepared, RuntimeResult } from "../../contracts/model.js";
export type EditorFactory = (onError: (error: Error) => void) => LexicalEditor;
export declare function prepareSnapshot(input: unknown, options?: {
    createEditor: EditorFactory;
}): Prepared;
export declare function compareWithRuntime(a: unknown, b: unknown, options: {
    createEditor: EditorFactory;
    engine: Engine;
}): RuntimeResult;
