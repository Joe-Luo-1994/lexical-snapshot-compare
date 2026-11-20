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
interface StoredView {
  stamp: number;
  open?: boolean;
  top: number;
  left: number;
  row?: string;
  rowOffset: number;
}
export function readingMemory(root: HTMLElement) {
  let anchor: Anchor | null = null,
    paused = false,
    intentUntil = 0,
    stamp = 0;
  const states = new Map<string, StoredView>(),
    lastTable = new Map<string, string>();
  const lifecycle = new AbortController(),
    signal = lifecycle.signal;
  const readingTop = () =>
    (document.querySelector<HTMLElement>(".review-toolbar")?.offsetHeight ||
      0) + 24;
  const cards = () => [...root.querySelectorAll<HTMLElement>("[data-record]")];
  function observe() {
    if (paused || performance.now() > intentUntil) return;
    const n = cards().find((n) => {
      const r = n.getBoundingClientRect();
      return r.bottom > readingTop() && r.top < innerHeight - 140;
    });
    if (n)
      anchor = {
        id: n.dataset.record!,
        offset: Math.min(readingTop(), n.getBoundingClientRect().top),
      };
  }
  const intent = () => {
    intentUntil = performance.now() + 700;
  };
  window.addEventListener("wheel", intent, { passive: true, signal });
  window.addEventListener("touchmove", intent, { passive: true, signal });
  window.addEventListener(
    "keydown",
    (e) => {
      if (
        [
          "PageDown",
          "PageUp",
          "ArrowDown",
          "ArrowUp",
          "Home",
          "End",
          " ",
        ].includes(e.key)
      )
        intent();
    },
    { signal },
  );
  window.addEventListener(
    "pointerdown",
    (e) => {
      if (e.target === document.documentElement) intent();
      else intentUntil = 0;
    },
    { capture: true, signal },
  );
  window.addEventListener("scroll", observe, { passive: true, signal });
  root.addEventListener(
    "focusin",
    (e) => {
      if (paused || !(e.target instanceof HTMLElement)) return;
      const n = e.target.closest<HTMLElement>("[data-record]");
      if (n) {
        anchor = {
          id: n.dataset.record!,
          offset: Math.min(readingTop(), n.getBoundingClientRect().top),
        };
        if (
          e.target.classList.contains("table-scroll") &&
          e.target.dataset.viewKey
        )
          lastTable.set(n.dataset.record!, e.target.dataset.viewKey);
      }
    },
    { signal },
  );
  root.addEventListener(
    "scroll",
    (e) => {
      if (
        paused ||
        performance.now() > intentUntil ||
        !(e.target instanceof HTMLElement) ||
        !e.target.classList.contains("table-scroll")
      )
        return;
      const id = e.target.closest<HTMLElement>("[data-record]")?.dataset.record,
        key = e.target.dataset.viewKey;
      if (id && key) lastTable.set(id, key);
    },
    { capture: true, signal },
  );
  function keys() {
    for (const card of cards()) {
      for (const scope of card.querySelectorAll<HTMLElement>("[data-snapshot]"))
        for (const selector of ["details", ".table-scroll"])
          scope
            .querySelectorAll<HTMLElement>(selector)
            .forEach(
              (n, i) =>
                (n.dataset.viewKey =
                  card.dataset.record +
                  "|" +
                  scope.dataset.snapshot +
                  "|" +
                  selector +
                  "|" +
                  i),
            );
      for (const selector of ["details", ".table-scroll"])
        [...card.querySelectorAll<HTMLElement>(selector)]
          .filter((n) => !n.closest("[data-snapshot]"))
          .forEach(
            (n, i) =>
              (n.dataset.viewKey =
                card.dataset.record + "|shared|" + selector + "|" + i),
          );
    }
  }
  function capture(): ReadingCapture {
    keys();
    stamp++;
    for (const n of root.querySelectorAll<HTMLElement>("[data-view-key]")) {
      const row = n.classList.contains("table-scroll")
        ? [...n.querySelectorAll<HTMLElement>("tr[data-row]")].find(
            (r) =>
              r.getBoundingClientRect().bottom >
              n.getBoundingClientRect().top + 60,
          )
        : null;
      states.set(n.dataset.viewKey!, {
        stamp,
        open: n instanceof HTMLDetailsElement ? n.open : undefined,
        top: n.scrollTop,
        left: n.scrollLeft,
        row: row?.dataset.row,
        rowOffset: row
          ? row.getBoundingClientRect().top - n.getBoundingClientRect().top
          : 0,
      });
    }
    paused = true;
    const active =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    return {
      anchor: anchor && { ...anchor },
      focus: active?.dataset.viewKey,
      summary:
        active?.tagName === "SUMMARY"
          ? active.parentElement?.dataset.viewKey
          : undefined,
    };
  }
  function restore(saved: ReadingCapture | null): string | undefined {
    keys();
    for (const n of root.querySelectorAll<HTMLElement>("[data-view-key]")) {
      let s = states.get(n.dataset.viewKey!);
      if ((!s || s.stamp !== stamp) && n.classList.contains("table-scroll")) {
        const id =
          n.closest<HTMLElement>("[data-record]")?.dataset.record || "";
        const preferred = states.get(lastTable.get(id) || "");
        s =
          (preferred?.stamp === stamp ? preferred : undefined) ||
          [...states].find(
            ([k, v]) =>
              k.startsWith(id + "|") &&
              k.includes(".table-scroll") &&
              v.stamp === stamp,
          )?.[1] ||
          s;
      }
      if (s) {
        if (n instanceof HTMLDetailsElement) n.open = s.open || false;
        n.scrollTop = s.top;
        n.scrollLeft = s.left;
        const row = s.row
          ? [...n.querySelectorAll<HTMLElement>("tr[data-row]")].find(
              (r) => r.dataset.row === s.row,
            )
          : null;
        if (row)
          n.scrollTop +=
            row.getBoundingClientRect().top -
            n.getBoundingClientRect().top -
            s.rowOffset;
      }
    }
    if (saved?.anchor) {
      const value = saved.anchor,
        card = cards().find((n) => n.dataset.record === value.id);
      if (card) {
        const offset = Math.max(
          -Math.max(0, card.offsetHeight - 100),
          value.offset,
        );
        window.scrollBy({
          top: card.getBoundingClientRect().top - offset,
          behavior: "instant",
        });
        anchor = { id: value.id, offset };
        card.focus({ preventScroll: true });
      }
    }
    const target = [
      ...root.querySelectorAll<HTMLElement>("[data-view-key]"),
    ].find((n) => n.dataset.viewKey === (saved?.focus || saved?.summary));
    if (target)
      (saved?.summary
        ? target.querySelector<HTMLElement>("summary")
        : target
      )?.focus({ preventScroll: true });
    paused = false;
    intentUntil = 0;
    return saved?.anchor?.id;
  }
  return {
    capture,
    restore,
    select(id: string) {
      anchor = { id, offset: readingTop() };
    },
    reset() {
      anchor = null;
      states.clear();
      lastTable.clear();
      paused = false;
    },
    forgetDetails() {
      for (const [k] of states) if (k.startsWith("context|")) states.delete(k);
    },
    dispose() {
      lifecycle.abort();
      states.clear();
      lastTable.clear();
    },
  };
}
