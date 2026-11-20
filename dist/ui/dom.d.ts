import type { SavedNode } from "../contracts/model.js";
export declare const el: <K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, txt?: string) => HTMLElementTagNameMap[K];
export declare function preserveFormat(n: HTMLElement, f?: number | string): HTMLElement;
export declare function safeUrl(value: string | undefined): string | null;
export declare function placeholder(title: string, msg: string): HTMLDivElement;
export declare function source(label: string, value: unknown): HTMLDivElement;
export declare function payload(node: SavedNode): HTMLDetailsElement;
