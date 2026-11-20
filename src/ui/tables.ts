import type { TableRecord } from "./view-model.js";
import { el } from "./dom.js";
import { plain } from "../presentation/changes.js";
export function alignedTable(record: TableRecord, key: "a" | "b") {
  const outer = el("div", "table-scroll");
  outer.tabIndex = 0;
  outer.setAttribute("aria-label", "依已確認列對齊的表格");
  const table = el(
      "table",
      ((record.a || record.b)?.children?.[0]?.children?.length || 0) > 6
        ? "wide-table"
        : "",
    ),
    body = el("tbody");
  for (const row of record.rows) {
    const tr = el("tr");
    if ("id" in row) tr.dataset.row = row.id;
    if ("gap" in row) {
      const c = el("td", "table-gap", row.gap + " 列未變內容已收起");
      c.colSpan = (record.a || record.b)?.children?.[0]?.children?.length || 0;
      tr.append(c);
      body.append(tr);
      continue;
    }
    const node = row[key];
    if (!node) {
      const c = el("td", "missing-row", "此版本沒有這一列");
      c.colSpan = (row.a || row.b)?.children?.length || 0;
      tr.append(c);
    } else
      for (const [i, c] of (node.children || []).entries()) {
        const td = el(c.headerState ? "th" : "td");
        if (c.headerState === 1) td.scope = "col";
        if (c.headerState === 2) td.scope = "row";
        const changed = row.cells ? row.cells[i].changed : true;
        if (changed)
          td.className = key === "a" ? "split-old-cell" : "split-new-cell";
        td.textContent = plain(c);
        tr.append(td);
      }
    body.append(tr);
  }
  table.append(body);
  outer.append(table);
  return outer;
}
export function tableDiff(record: TableRecord) {
  const outer = el("div", "table-scroll");
  outer.tabIndex = 0;
  outer.setAttribute("aria-label", "服務承諾差異表，可左右捲動");
  const table = el(
      "table",
      ((record.a || record.b)?.children?.[0]?.children?.length || 0) > 6
        ? "wide-table"
        : "",
    ),
    body = el("tbody");
  for (const row of record.rows) {
    if ("gap" in row) {
      const gap = el("tr"),
        c = el("td", "table-gap", row.gap + " 列未變內容已收起");
      c.colSpan = (record.a || record.b)?.children?.[0]?.children?.length || 0;
      gap.append(c);
      body.append(gap);
      continue;
    }
    const tr = el(
      "tr",
      row.status === "added"
        ? "row-added"
        : row.status === "removed"
          ? "row-removed"
          : "",
    );
    if ("id" in row) tr.dataset.row = row.id;
    if (row.cells) {
      for (const c of row.cells) {
        const cell = el(
          c.b.headerState ? "th" : "td",
          c.changed ? "changed-cell" : "",
        );
        if (c.b.headerState === 1) cell.scope = "col";
        if (c.b.headerState === 2) cell.scope = "row";
        if (c.changed) {
          const old = el("span", "cell-old"),
            next = el("span", "cell-new");
          old.append(
            el("span", "cell-label", "− "),
            document.createTextNode(plain(c.a)),
          );
          next.append(
            el("span", "cell-label", "＋ "),
            document.createTextNode(plain(c.b)),
          );
          cell.append(old, next);
        } else cell.textContent = plain(c.b);
        tr.append(cell);
      }
    } else {
      for (const [i, c] of ((row.b || row.a)?.children || []).entries()) {
        const cell = el(c.headerState ? "th" : "td");
        if (i === 0)
          cell.append(
            el(
              "span",
              "row-label",
              row.status === "added" ? "＋ 新增" : "− 刪除",
            ),
          );
        cell.append(document.createTextNode(plain(c)));
        tr.append(cell);
      }
    }
    body.append(tr);
  }
  table.append(body);
  outer.append(table);
  return outer;
}
