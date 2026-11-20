import type { ChangeRecord, RowChange, SavedNode } from "../contracts/model.js";
export type DisplayRow = RowChange | { readonly gap: number };
export type TableRecord = Omit<
  Extract<ChangeRecord, { kind: "table" }>,
  "rows"
> & {
  readonly rows: readonly DisplayRow[];
};
export type DisplayRecord =
  Exclude<ChangeRecord, { kind: "table" }> | TableRecord;
export type PairRecord =
  | DisplayRecord
  | { a: SavedNode | null; b: SavedNode | null; kind?: undefined };
export function focusedRows(rows: readonly RowChange[]): DisplayRow[] {
  const keep = new Set([0]);
  rows.forEach((r, i) => {
    if (r.status !== "same")
      for (
        let j = Math.max(0, i - 1);
        j <= Math.min(rows.length - 1, i + 1);
        j++
      )
        keep.add(j);
  });
  const out: DisplayRow[] = [];
  let hidden = 0;
  for (let i = 0; i < rows.length; i++) {
    if (!keep.has(i)) {
      hidden++;
      continue;
    }
    if (hidden) {
      out.push({ gap: hidden });
      hidden = 0;
    }
    out.push(rows[i]);
  }
  if (hidden) out.push({ gap: hidden });
  return out;
}
