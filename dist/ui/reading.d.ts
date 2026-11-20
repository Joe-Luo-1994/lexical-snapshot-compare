/** Ephemeral view state. Never writes to snapshots or comparison reports. */
interface Anchor {
    id: string;
    offset: number;
}
export interface ReadingCapture {
    anchor: Anchor | null;
    focus?: string;
    summary?: string;
}
export declare function readingMemory(root: HTMLElement): {
    capture: () => ReadingCapture;
    restore: (saved: ReadingCapture | null) => string | undefined;
    select(id: string): void;
    reset(): void;
    forgetDetails(): void;
    dispose(): void;
};
export {};
