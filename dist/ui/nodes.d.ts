import type { Engine, SavedNode } from "../contracts/model.js";
export type NodeRenderer = (node: SavedNode, renderChild: (node: SavedNode) => HTMLElement) => HTMLElement;
export declare function createNodeRenderer(engine: Engine, renderers?: Readonly<Record<string, NodeRenderer>>): (node: SavedNode | null) => HTMLElement;
