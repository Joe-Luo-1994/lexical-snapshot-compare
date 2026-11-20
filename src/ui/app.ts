import { el, preserveFormat, source, payload } from "./dom.js";
import { createNodeRenderer } from "./nodes.js";
import type { NodeRenderer } from "./nodes.js";
export type { NodeRenderer } from "./nodes.js";
import { alignedTable, tableDiff } from "./tables.js";
import { focusedRows } from "./view-model.js";
import type { DisplayRecord, PairRecord } from "./view-model.js";
import type { SavedNode, RowChange } from "../contracts/model.js";
import type {
  ChangeRecord,
  ComparisonReport,
  Engine,
  Scenario,
  ViewMode,
} from "../contracts/model.js";
import {
  plain,
  tokens,
  navigationLabel,
  verification,
  verificationCategories,
  linkChangeName,
  changeReason,
  policyNotices,
} from "../presentation/changes.js";
import { readingMemory } from "./reading.js";
import type { ReadingCapture } from "./reading.js";

export function mountComparison({
  scenarios,
  defaultScenario,
  engine,
  renderers = {},
}: {
  scenarios: readonly Scenario[];
  defaultScenario: Scenario;
  engine: Engine;
  renderers?: Readonly<Record<string, NodeRenderer>>;
}): () => void {
  type Selectors = {
    "#scenario": HTMLSelectElement;
    "#previous": HTMLButtonElement;
    "#next": HTMLButtonElement;
    "#format-filter": HTMLInputElement;
    "#info": HTMLDialogElement;
    "#full-order": HTMLDetailsElement;
    "#flow": HTMLButtonElement;
    "#split": HTMLButtonElement;
    "#download": HTMLButtonElement;
  };
  const $ = <S extends string>(
    s: S,
  ): S extends keyof Selectors ? Selectors[S] : HTMLElement => {
    const node = document.querySelector(s);
    if (!(node instanceof HTMLElement))
      throw new Error("MISSING_VIEW_ELEMENT:" + s);
    return node as S extends keyof Selectors ? Selectors[S] : HTMLElement;
  };

  let current = defaultScenario,
    reverse = false,
    mode: ViewMode = engine.policy.viewModes[0],
    expanded = false,
    showFormat = true,
    result: ComparisonReport,
    visible: ChangeRecord[] = [],
    active = -1;
  const expandedTables = new Set<string>();
  const renderNode = createNodeRenderer(engine, renderers);
  const memory = readingMemory($("#document"));
  $(".review-toolbar").append($("#swap"));
  const resizeObserver = new ResizeObserver(() =>
    document.documentElement.style.setProperty(
      "--reading-top",
      $(".review-toolbar").offsetHeight + 24 + "px",
    ),
  );
  resizeObserver.observe($(".review-toolbar"));
  let pendingReading: ReadingCapture | null = null,
    renderGeneration = 0,
    hiddenPrevious: number | null = null;
  function refresh(change: () => void) {
    pendingReading = memory.capture();
    change();
    render();
  }

  const names: Record<ChangeRecord["kind"], string> = {
    text: "文字變更",
    link: "連結變更",
    table: "表格變更",
    format: "格式變更",
    coarse: "前後內容需核對",
    unverified: "內容尚未驗證",
    added: "新增區塊",
    removed: "刪除區塊",
    same: "未變內容",
  };
  function warning(message: string) {
    const n = el("div", "notice");
    n.append(el("span", "notice-icon", "!"), el("p", "", message));
    return n;
  }

  function diff(a: string, b: string, format: number | string = 0) {
    const n = el("p", "diff-line");
    for (const part of tokens(a, b)) {
      const span = el(
        part.type === "removed"
          ? "del"
          : part.type === "added"
            ? "ins"
            : "span",
        part.type === "same"
          ? ""
          : part.type === "removed"
            ? "diff-del"
            : "diff-add",
        part.text,
      );
      if (part.type !== "same") {
        const label = el(
          "span",
          "sr-only",
          part.type === "removed" ? "刪除：" : "新增：",
        );
        span.prepend(label);
      }
      n.append(span);
    }
    return preserveFormat(n, format);
  }

  function urls(node: SavedNode | null): (string | undefined)[] {
    const out: (string | undefined)[] = [];
    function visit(n: SavedNode | null) {
      if (!n) return;
      if (n.type === "link") out.push(n.url);
      for (const child of n.children || []) visit(child);
    }
    visit(node);
    return out;
  }
  function pair(record: PairRecord) {
    const grid = el("div", "side-grid");
    for (const [key, label, side] of [
      ["a", "基準 A · 原內容", "old"],
      ["b", "目標 B · 新內容", "new"],
    ] as const) {
      const cell = el("div", `side ${side}`);
      cell.dataset.snapshot =
        key === "a"
          ? reverse
            ? "second"
            : "first"
          : reverse
            ? "first"
            : "second";
      cell.append(el("span", `side-label ${side}-label`, label));
      const content = el("div", "prose");
      if (record.kind === "text") {
        const line = el("p");
        for (const part of tokens(plain(record.a), plain(record.b))) {
          if (
            (key === "a" && part.type === "added") ||
            (key === "b" && part.type === "removed")
          )
            continue;
          line.append(
            el(
              "span",
              part.type === "same" ? "" : key === "a" ? "diff-del" : "diff-add",
              part.text,
            ),
          );
        }
        content.append(
          preserveFormat(line, record[key]?.children?.[0]?.format),
        );
      } else if (record.kind === "table")
        content.append(alignedTable(record, key));
      else content.append(renderNode(record[key]));
      cell.append(content);
      if (record.kind === "link")
        for (const url of urls(record[key]))
          cell.append(source("連結目的地", url));
      if (record.kind === "unverified" && record[key])
        cell.append(payload(record[key]));
      grid.append(cell);
    }
    return grid;
  }

  function recordCard(r: DisplayRecord, index: number): HTMLElement {
    const section = el("article", "record");
    section.id = "record-" + r.id;
    section.dataset.record = r.id;
    section.dataset.kind = r.kind;
    section.tabIndex = -1;
    const category = verification(r as ChangeRecord);
    const header = el("div", "record-head");
    header.append(
      el("span", "record-section", r.section),
      el(
        "span",
        "record-kind " + (category ? "warning" : ""),
        category
          ? verificationCategories[category].label
          : r.kind === "link"
            ? linkChangeName(r as ChangeRecord)
            : names[r.kind],
      ),
      el("span", "record-number", String(index + 1).padStart(2, "0")),
    );
    section.append(
      header,
      el("h2", "change-title", navigationLabel(r as ChangeRecord)),
    );
    if (changeReason(r as ChangeRecord))
      section.append(
        el(
          "p",
          "block-reason " +
            (["link", "format"].includes(r.kind) ? "informational" : ""),
          changeReason(r as ChangeRecord),
        ),
      );
    if (category) {
      const c = verificationCategories[category],
        bar = el("div", "verification-detail");
      bar.append(
        el(
          "span",
          "",
          `${r.changed ? "保存資料有變動" : "保存資料相同；仍有內容待確認"}`,
        ),
      );
      const action = el("button", "quiet", c.action);
      action.onclick = () => {
        section
          .querySelectorAll<HTMLDetailsElement>(".node-collapse,.payload")
          .forEach((n) => (n.open = true));
        const target =
          section.querySelector<HTMLElement>(
            category === "unsupported" ? ".payload summary" : ".side-grid",
          ) || section;
        target.tabIndex = -1;
        target.focus({ preventScroll: true });
        target.scrollIntoView({ block: "start", behavior: "instant" });
      };
      bar.append(action);
      section.append(bar);
    }
    if (r.kind === "table" && r.rows.length > 12) {
      const original = r,
        isOpen = expandedTables.has(r.id);
      const bar = el("div", "table-controls");
      bar.append(
        el(
          "span",
          "",
          isOpen
            ? "完整表格；標頭會保留於捲動區域。"
            : "已聚焦變動列，保留相鄰列與標頭。",
        ),
      );
      const toggle = el(
        "button",
        "quiet table-toggle",
        isOpen ? "聚焦變動列" : `查看完整 ${r.rows.length} 列對照`,
      );
      toggle.setAttribute("aria-expanded", String(isOpen));
      toggle.onclick = () => {
        isOpen ? expandedTables.delete(r.id) : expandedTables.add(r.id);
        const card = recordCard(original, index);
        section.replaceWith(card);
        card.querySelector<HTMLElement>(".table-toggle")?.focus();
        syncTableRows();
      };
      bar.append(toggle);
      section.append(bar);
      if (!isOpen)
        r = {
          ...r,
          rows: focusedRows(
            r.rows.filter((row): row is RowChange => !("gap" in row)),
          ),
        };
    }
    if (mode === "flow" && r.kind === "text")
      section.append(diff(plain(r.a), plain(r.b), r.b?.children?.[0]?.format));
    else if (mode === "flow" && r.kind === "table")
      section.append(tableDiff(r));
    else if (mode === "flow" && ["added", "removed"].includes(r.kind)) {
      const wrapper = el("div", `prose whole-${r.kind}`);
      wrapper.append(renderNode(r.b || r.a));
      section.append(wrapper);
    } else section.append(pair(r));
    return section;
  }
  function contextGroup(group: readonly ChangeRecord[]) {
    const details = el("details", "unchanged");
    details.dataset.viewKey = "context|" + group.map((r) => r.id).join("|");
    details.dataset.record = "context:" + group[0].id;
    details.tabIndex = -1;
    details.open = expanded;
    details.append(
      el("summary", "", `${group.length} 個未變區塊 · 展開上下文`),
    );
    const content = el("div", "prose");
    group.forEach((r) => content.append(renderNode(r.b || r.a)));
    details.append(content);
    return details;
  }
  function fullDocuments() {
    const wrap = el("details", "unchanged");
    wrap.append(el("summary", "", "查看兩份完整文件與原始順序"));
    const r = {
      a: (reverse ? current.b : current.a).editorState.root,
      b: (reverse ? current.a : current.b).editorState.root,
    };
    wrap.append(pair(r));
    return wrap;
  }
  function render() {
    const generation = ++renderGeneration,
      saved = pendingReading;
    pendingReading = null;
    hiddenPrevious = null;
    const renderStarted = performance.now();
    const a = reverse ? current.b : current.a,
      b = reverse ? current.a : current.b;
    active = -1;
    visible = [];
    $("#document").replaceChildren();
    $("#changes").replaceChildren();
    $("#status").replaceChildren();
    $("h1").textContent = current.documentTitle || "服務上線與維運規範";
    $(".subtitle").textContent =
      current.context || "把注意力留給真正需要審查的內容。";
    $("#task").textContent = current.task;
    $("#source-note").replaceChildren();
    if (current.provenance) {
      const sourceLink = el("a", "", "公開原文與授權");
      sourceLink.href = current.provenance.source;
      sourceLink.target = "_blank";
      sourceLink.rel = "noopener noreferrer";
      $("#source-note").append(
        sourceLink,
        el("span", "", " · " + current.provenance.license),
      );
    }
    $("#version-a").textContent = a.revision + " · " + a.label;
    $("#version-b").textContent = b.revision + " · " + b.label;
    $("#date-a").textContent = a.savedAt || "";
    $("#date-b").textContent = b.savedAt || "";
    try {
      result = engine.compare(a, b);
    } catch (error) {
      const box = el("div", "error-state");
      box.append(
        el("h2", "", "這次比較未完成"),
        el("p", "", error instanceof Error ? error.message : String(error)),
      );
      const retry = el("button", "primary", "回到可比較的版本");
      retry.onclick = () => {
        load(defaultScenario.id);
        $("#document").focus();
      };
      box.append(retry);
      $("#document").append(box);
      $("#status").append(
        warning("尚未取得比較結果，不能判定文件是否有變更。"),
      );
      updateNavigation();
      $("#position").textContent = "尚無可用的比較結果";
      return;
    }
    if (engine.policy.notices.length) {
      const notice = el("p", "policy-notice");
      notice.textContent = engine.policy.notices
        .map((code) => policyNotices[code] || code)
        .join(" ");
      $("#status").append(notice);
    }
    const changed = result.records.filter((r) => r.changed),
      unverified = result.records.filter(
        (r) => r.needsReview || ["coarse", "unverified"].includes(r.kind),
      );
    const summary = el("div", "status-summary");
    summary.append(
      el("strong", "", `${changed.length} 個內容變動區塊`),
      el("span", "status-separator", "/"),
      el(
        "span",
        "",
        `${unverified.length + (result.moved ? 1 : 0)} 個區域需要核對`,
      ),
    );
    $("#status").append(summary);
    if (unverified.length) {
      const list = el("div", "verification-summary");
      for (const [key, c] of Object.entries(verificationCategories)) {
        const items = result.records.filter(
          (r) => verification(r as ChangeRecord) === key,
        );
        if (!items.length) continue;
        const button = el("button", "verification-category");
        button.append(
          el("strong", "", `${c.label} · ${items.length}`),
          el("span", "", c.help),
        );
        button.onclick = () =>
          jump(visible.findIndex((r) => r.id === items[0].id));
        list.append(button);
      }
      $("#status").append(list);
    }
    if (result.moved) {
      const n = warning(
        "區塊排列順序已變動。下方依目標版閱讀，不能據此推定完整搬移歷程。",
      );
      const btn = el("button", "", "查看兩份原始順序");
      btn.onclick = () => {
        const x = $("#full-order");
        x.open = true;
        x.scrollIntoView({ block: "start" });
        x.querySelector("summary")?.focus();
      };
      n.lastElementChild!.append(document.createElement("br"), btn);
      $("#status").append(n);
    }
    let context: ChangeRecord[] = [];
    function flush() {
      if (context.length) {
        $("#document").append(contextGroup(context));
        context = [];
      }
    }
    if (!changed.length && !unverified.length && !result.moved) {
      const empty = el("div", "empty-state");
      empty.append(
        el("span", "empty-symbol", "✓"),
        el("h2", "", "這兩版沒有內容變更"),
        el("p", "", "已比較此原型支援的保存內容。你仍可展開完整文件確認。"),
      );
      $("#document").append(empty);
    }
    for (const r of result.records) {
      if (r.kind === "same") {
        context.push(r);
        continue;
      }
      if (r.kind === "format" && !showFormat) {
        flush();
        const details = el("details", "unchanged");
        details.id = "record-" + r.id;
        details.dataset.record = r.id;
        details.tabIndex = -1;
        details.append(
          el(
            "summary",
            "",
            `格式變更已收起 · ${navigationLabel(r as ChangeRecord)}`,
          ),
          pair(r),
        );
        $("#document").append(details);
        continue;
      }
      flush();
      const index = visible.length;
      visible.push(r);
      $("#document").append(recordCard(r, index));
    }
    flush();
    const full = fullDocuments();
    full.id = "full-order";
    full.dataset.record = "full-order";
    full.dataset.viewKey = "full-order";
    full.tabIndex = -1;
    $("#document").append(full);
    $("#changes").append(
      el("div", "nav-label", visible.length ? "變更導覽" : "文件狀態"),
    );
    visible.forEach((r, i) => {
      const btn = el("button", "nav-item");
      btn.dataset.index = String(i);
      btn.append(el("span", "nav-index", String(i + 1).padStart(2, "0")));
      const label = el("span");
      label.append(
        el("strong", "", navigationLabel(r as ChangeRecord)),
        el(
          "small",
          "",
          r.section +
            " · " +
            (verification(r as ChangeRecord)
              ? verificationCategories[verification(r as ChangeRecord)!].label
              : r.kind === "link"
                ? linkChangeName(r as ChangeRecord)
                : names[r.kind]),
        ),
      );
      btn.append(label);
      btn.onclick = () => jump(i);
      $("#changes").append(btn);
    });
    if (!visible.length)
      $("#changes").append(
        el(
          "p",
          "task",
          result.moved
            ? "排列順序有變動，請查看兩份原始順序。"
            : changed.length
              ? "格式變更目前已收起。"
              : "沒有待查看的變更。",
        ),
      );
    updateNavigation();
    requestAnimationFrame(() => {
      if (generation !== renderGeneration) return;
      syncTableRows();
      const id = memory.restore(saved);
      if (id) {
        active = visible.findIndex((r) => r.id === id);
        markActive();
        updateNavigation();
        if (active < 0) {
          const record = result.records.find(
            (r) => r.id === id.replace("context:", ""),
          );
          $("#position").textContent =
            id === "full-order"
              ? "保留完整文件閱讀位置"
              : id.startsWith("context:")
                ? "保留未變內容閱讀位置"
                : "目前格式變更已收起 · 開啟「顯示格式變更」可回到原項目";
          const at =
            id === "full-order"
              ? result.records.length
              : record
                ? result.records.indexOf(record)
                : -1;
          active =
            visible.filter((r) => result.records.indexOf(r) < at).length - 1;
          hiddenPrevious = active;
          $("#previous").disabled = active < 0;
          $("#next").disabled = active >= visible.length - 1;
        }
      }
      $("#document").dataset.renderMs = (
        performance.now() - renderStarted
      ).toFixed(1);
    });
  }
  function syncTableRows() {
    for (const pair of document.querySelectorAll(".record .side-grid")) {
      const tables = pair.querySelectorAll("table");
      if (
        tables.length !== 2 ||
        pair.closest<HTMLElement>(".record")?.dataset.kind !== "table"
      )
        continue;
      const [a, b] = tables;
      for (const r of [...a.rows, ...b.rows]) r.style.height = "";
      if (getComputedStyle(pair).gridTemplateColumns.split(" ").length < 2)
        continue;
      for (let i = 0; i < a.rows.length && i < b.rows.length; i++) {
        const height = Math.max(
          a.rows[i].getBoundingClientRect().height,
          b.rows[i].getBoundingClientRect().height,
        );
        a.rows[i].style.height = b.rows[i].style.height = height + "px";
      }
    }
  }
  const onResize = () => requestAnimationFrame(syncTableRows);
  window.addEventListener("resize", onResize);
  function markActive() {
    document.querySelectorAll<HTMLElement>(".nav-item").forEach((n) => {
      n.classList.toggle("active", Number(n.dataset.index) === active);
      if (Number(n.dataset.index) === active)
        n.setAttribute("aria-current", "true");
      else n.removeAttribute("aria-current");
    });
  }
  function jump(index: number) {
    if (!visible.length) return;
    hiddenPrevious = null;
    active = Math.max(0, Math.min(index, visible.length - 1));
    const card = document.getElementById("record-" + visible[active].id)!;
    card
      .querySelectorAll<HTMLDetailsElement>(".node-collapse")
      .forEach((d) => (d.open = true));
    memory.select(visible[active].id);
    card.focus({ preventScroll: true });
    card.scrollIntoView({ block: "start", behavior: "instant" });
    markActive();
    updateNavigation();
  }
  function updateNavigation() {
    $("#previous").disabled = active <= 0;
    $("#next").disabled = !visible.length || active === visible.length - 1;
    $("#position").textContent =
      active >= 0
        ? `第 ${active + 1} / ${visible.length} 項 · ${visible[active].section}`
        : visible.length
          ? `${visible.length} 項可查看 · 從第一項開始`
          : "沒有其他變更";
  }
  function load(id: string) {
    memory.reset();
    pendingReading = null;
    expandedTables.clear();
    current = scenarios.find((s) => s.id === id) || defaultScenario;
    reverse = false;
    $("#scenario").value = current.id;
    history.replaceState(null, "", "#" + current.id);
    render();
    $("#changes").scrollTop = 0;
    $("#changes").scrollLeft = 0;
    $(".sidebar").scrollTop = 0;
    window.scrollTo(0, 0);
  }
  const groups = new Map<string, HTMLOptGroupElement>();
  scenarios.forEach((s) => {
    const group = s.group || "審查情境";
    if (!groups.has(group)) {
      const g = el("optgroup");
      g.label = group;
      groups.set(group, g);
      $("#scenario").append(g);
    }
    const option = el("option", "", s.title);
    option.value = s.id;
    groups.get(group)!.append(option);
  });
  $("#scenario").onchange = () => load($("#scenario").value);
  $("#swap").onclick = () =>
    refresh(() => {
      reverse = !reverse;
    });
  $("#flow").onclick = () => setMode("flow");
  $("#split").onclick = () => setMode("split");
  function setMode(value: ViewMode) {
    if (!engine.policy.viewModes.includes(value)) return;
    refresh(() => {
      mode = value;
      $("#flow").setAttribute("aria-pressed", String(mode === "flow"));
      $("#split").setAttribute("aria-pressed", String(mode === "split"));
    });
  }
  $("#context").onclick = () =>
    refresh(() => {
      expanded = !expanded;
      $("#context").setAttribute("aria-pressed", String(expanded));
      $("#context").textContent = expanded ? "收合未變內容" : "展開未變內容";
      memory.forgetDetails();
    });
  $("#format-filter").onchange = () =>
    refresh(() => {
      showFormat = $("#format-filter").checked;
    });
  $("#previous").onclick = () => jump(hiddenPrevious ?? active - 1);
  $("#next").onclick = () => jump(active + 1);
  $("#reset").onclick = () => {
    expanded = false;
    showFormat = true;
    $("#format-filter").checked = true;
    $("#context").textContent = "展開未變內容";
    $("#context").setAttribute("aria-pressed", "false");
    setMode(engine.policy.viewModes[0]);
    load(defaultScenario.id);
    window.scrollTo(0, 0);
  };
  $("#about").onclick = () => $("#info").showModal();
  $("#close-info").onclick = () => $("#info").close();
  $("#download").onclick = () => {
    if (engine.policy.download === "disabled") return;
    const blob = new Blob(
      [
        JSON.stringify(
          {
            scenario: current.title,
            baseline: reverse
              ? current.savedB || current.b
              : current.savedA || current.a,
            target: reverse
              ? current.savedA || current.a
              : current.savedB || current.b,
            scope: current.provenance
              ? "Public article transcription and controlled test edit, not upstream history. Native Lexical JSON plus explicit identity sidecar."
              : "Synthetic snapshot-demo-v1. Not the production node registry.",
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob),
      a = el("a");
    a.href = url;
    a.download = `snapshot-${current.id}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  if (new URLSearchParams(location.search).get("audit") === "grayscale")
    document.documentElement.dataset.audit = "grayscale";
  applyPolicy();
  load(location.hash.slice(1));

  function applyPolicy() {
    $("#flow").hidden = !engine.policy.viewModes.includes("flow");
    $("#split").hidden = !engine.policy.viewModes.includes("split");
    $("#flow").setAttribute("aria-pressed", String(mode === "flow"));
    $("#split").setAttribute("aria-pressed", String(mode === "split"));
    $("#download").hidden = engine.policy.download === "disabled";
  }
  return () => {
    renderGeneration++;
    memory.dispose();
    resizeObserver.disconnect();
    window.removeEventListener("resize", onResize);
  };
}
