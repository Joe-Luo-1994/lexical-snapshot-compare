import type { ChangeRecord, RowChange, SavedNode } from "../contracts/model.js";
export type DisplayRow = RowChange | {
    readonly gap: number;
};
export type TableRecord = Omit<Extract<ChangeRecord, {
    kind: "table";
}>, "rows"> & {
    readonly rows: readonly DisplayRow[];
};
export type DisplayRecord = Exclude<ChangeRecord, {
    kind: "table";
}> | TableRecord;
export type PairRecord = DisplayRecord | {
    a: SavedNode | null;
    b: SavedNode | null;
    kind?: undefined;
};
export declare function focusedRows(rows: readonly RowChange[]): DisplayRow[];
