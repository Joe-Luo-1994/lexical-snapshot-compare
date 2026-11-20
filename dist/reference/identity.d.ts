import type { SavedNode } from "../contracts/model.js";
/** Example lifecycle only. Host must bind these to persistence transactions. */
export declare function freshSubtree(node: SavedNode, allocate: () => string): SavedNode;
export declare function splitParagraph(node: SavedNode, offset: number, allocate: () => string): [SavedNode, SavedNode];
export declare function mergeParagraphs(left: SavedNode, right: SavedNode): SavedNode;
