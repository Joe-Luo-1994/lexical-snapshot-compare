import type { SavedNode } from "../contracts/model.js";
export declare function exactNodeKey(node: SavedNode): string;
/** Stable IDs win. Content anchors require uniqueness across each complete sibling list. */
export declare function recoverContentPairs(a: readonly SavedNode[], b: readonly SavedNode[]): readonly (readonly [SavedNode, SavedNode])[];
