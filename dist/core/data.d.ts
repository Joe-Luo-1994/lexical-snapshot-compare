import type { SavedNode, RowChange } from "../contracts/model.js";
export declare const LIMITS: {
    nodes: number;
    depth: number;
    text: number;
    inlineCells: number;
};
export declare function canonical(x: unknown): string;
export declare function contentKey(n: SavedNode | null): string;
export declare function plain(n: SavedNode | null | undefined): string;
export declare function validate(input: unknown): SavedNode;
export declare function identity(nodes: readonly SavedNode[]): boolean;
export declare function shallow(n: SavedNode, omit?: readonly string[]): string;
export declare function simpleText(n: SavedNode): boolean;
export declare function tableChanges(a: SavedNode, b: SavedNode): readonly RowChange[] | null;
export declare function tokens(a: string, b: string): {
    type: "same" | "removed" | "added";
    text: string;
}[];
