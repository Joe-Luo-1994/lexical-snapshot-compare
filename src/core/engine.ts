import { reasonCodes } from "../contracts/model.js";
import type {
  ChangeRecord,
  PairingEvidence,
  CellChange,
  RowChange,
  ComparisonReport,
  EffectivePolicy,
  Engine,
  Finding,
  Handler,
  SavedNode,
  Verification,
} from "../contracts/model.js";
import { contentKey, identity, plain, shallow, validate } from "./data.js";
import { exactNodeKey, recoverContentPairs } from "./pairing.js";
import { resolvePolicy } from "./policy.js";

export function freeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) freeze(child);
  }
  return value;
}
export const fallback = (
  changed: boolean,
  reasonCode: Finding["reasonCode"],
  verification: Verification = "whole",
): Finding => ({
  kind:
    verification === "unsupported" || verification === "pairing"
      ? "unverified"
      : "coarse",
  changed,
  reasonCode,
  verification,
});

function validFinding(value: Finding): boolean {
  if (
    !value ||
    value.changed !== true ||
    !["text", "link", "table", "format", "coarse", "unverified"].includes(
      value.kind,
    ) ||
    !reasonCodes.includes(value.reasonCode) ||
    ![null, "whole", "media", "unsupported", "pairing"].includes(
      value.verification,
    )
  )
    return false;
  if (value.kind === "coarse" && !value.verification) return false;
  if (value.kind === "unverified" && !value.verification) return false;
  if (value.kind === "table")
    return (
      Array.isArray(value.rows) &&
      value.rows.every(
        (row: RowChange) =>
          row &&
          typeof row.id === "string" &&
          ["same", "added", "removed", "modified"].includes(row.status) &&
          !!(row.a || row.b) &&
          (!row.cells ||
            (Array.isArray(row.cells) &&
              row.cells.every(
                (cell: CellChange) =>
                  cell && typeof cell.changed === "boolean" && cell.a && cell.b,
              ))),
      )
    );
  return value.rows === undefined;
}

export function createEngine(options: {
  handlers: readonly Handler[];
  policy?: unknown;
  hostPolicy?: unknown;
  renderers: readonly string[];
}): Engine {
  const registry = new Map<string, Handler>();
  for (const source of options.handlers) {
    if (
      !source.type ||
      !Number.isInteger(source.nodeVersion) ||
      !source.implementationVersion ||
      !Array.isArray(source.fields) ||
      typeof source.compare !== "function" ||
      typeof source.supports !== "function"
    )
      throw new Error("INVALID_HANDLER");
    const key = `${source.type}@${source.nodeVersion}`;
    if (registry.has(key)) throw new Error("DUPLICATE_HANDLER:" + key);
    registry.set(
      key,
      Object.freeze({ ...source, fields: Object.freeze([...source.fields]) }),
    );
  }
  const renderers = new Set(options.renderers);
  const policy: EffectivePolicy = resolvePolicy(
    options.policy,
    options.hostPolicy,
  );
  const get = (n: SavedNode) => registry.get(`${n.type}@${n.version}`);
  function unsupported(n: SavedNode | null, recursive = true): boolean {
    if (!n) return false;
    const handler = get(n);
    if (!handler || !renderers.has(n.type)) return true;
    try {
      return (
        Object.keys(n).some(
          (k) =>
            !["type", "version", "blockId"].includes(k) &&
            !handler.fields.includes(k),
        ) ||
        !handler.supports(n) ||
        (recursive && (n.children || []).some((c) => unsupported(c)))
      );
    } catch {
      return true;
    }
  }
  const opaque = (n: SavedNode | null): boolean =>
    !!n && (!!get(n)?.opaque || (n.children || []).some(opaque));
  function classify(a: SavedNode | null, b: SavedNode | null): Finding {
    const equal = contentKey(a) === contentKey(b);
    if (unsupported(a) || unsupported(b))
      return fallback(
        !equal,
        [a, b].some((n) => n && !renderers.has(n.type))
          ? "RENDERER_UNAVAILABLE"
          : "UNKNOWN_CONTENT",
        "unsupported",
      );
    if (!a || !b)
      return {
        kind: a ? "removed" : "added",
        changed: true,
        reasonCode: opaque(a || b) ? "MEDIA_UNVERIFIED" : "NONE",
        verification: opaque(a || b) ? "media" : null,
        needsReview: opaque(a || b),
      };
    if (equal)
      return opaque(a)
        ? {
            kind: "unverified",
            changed: false,
            reasonCode: "MEDIA_UNVERIFIED",
            verification: "media",
          }
        : {
            kind: "same",
            changed: false,
            reasonCode: "NONE",
            verification: null,
          };
    if (a.type !== b.type || a.version !== b.version)
      return fallback(true, "STRUCTURE_CHANGED");
    try {
      const finding = get(a)!.compare(a, b, policy);
      // A strategy cannot erase a known raw change or claim equality after accepting input.
      if (!validFinding(finding))
        return fallback(true, "HANDLER_FAILED", "unsupported");
      return finding;
    } catch {
      return fallback(true, "HANDLER_FAILED", "unsupported");
    }
  }
  function compare(left: unknown, right: unknown): ComparisonReport {
    // Validate before cloning and freeze private inputs so trusted extensions cannot accidentally mutate snapshots.
    validate(left);
    validate(right);
    const ar = freeze(structuredClone(validate(left))),
      br = freeze(structuredClone(validate(right)));
    const provenance = {
      engine: "snapshot-compare/0.3.0",
      handlers: [...registry.values()]
        .map((h) => `${h.type}@${h.nodeVersion}:${h.implementationVersion}`)
        .sort(),
      policy,
    };
    const whole = (reason: Finding["reasonCode"], category: Verification) =>
      freeze({
        records: [
          {
            id: "document",
            a: ar,
            b: br,
            section: "文件內容",
            ...fallback(contentKey(ar) !== contentKey(br), reason, category),
          },
        ],
        moved: false,
        provenance,
      });
    if (shallow(ar, ["children"]) !== shallow(br, ["children"]))
      return whole("ROOT_CHANGED", "unsupported");
    if (unsupported(ar, false) || unsupported(br, false))
      return whole("ROOT_UNKNOWN", "unsupported");
    const a = ar.children || [],
      b = br.children || [];
    if (!identity(a) || !identity(b))
      return whole("IDENTITY_MISSING", "pairing");
    const am = new Map(a.map((n) => [n.blockId!, n])),
      bm = new Map(b.map((n) => [n.blockId!, n]));
    const ca = a.filter((n) => bm.has(n.blockId!)).map((n) => n.blockId!),
      cb = b.filter((n) => am.has(n.blockId!)).map((n) => n.blockId!);
    const moved = JSON.stringify(ca) !== JSON.stringify(cb);
    let pairing: PairingEvidence | undefined;
    let unresolved: ChangeRecord | undefined;
    const recovered =
      ca.length < a.length && cb.length < b.length
        ? recoverContentPairs(a, b)
        : [];
    // Equality is a statement about saved content, never evidence of node lineage.
    if (
      !ca.length &&
      a.length &&
      b.length &&
      exactNodeKey(ar) === exactNodeKey(br)
    ) {
      return freeze({
        records: [
          {
            id: "document",
            a: ar,
            b: br,
            section: "完整保存內容",
            pairingBasis: "document-content",
            ...classify(ar, br),
          },
        ],
        moved: false,
        provenance,
        pairing: {
          mode: "content-equal",
          exactMatches: a.length,
          unresolvedA: 0,
          unresolvedB: 0,
          contentOrderChanged: false,
        },
      });
    }
    const bKeys = new Map(b.map((n) => [n.blockId!, n.blockId!]));
    if (recovered.length || (!ca.length && a.length && b.length)) {
      for (const [x, y] of recovered) {
        bm.delete(y.blockId!);
        bm.set(x.blockId!, y);
        bKeys.set(y.blockId!, x.blockId!);
      }
      const leftOver = a.filter((n) => !bm.has(n.blockId!));
      const rightOver = b.filter((n) => !am.has(bKeys.get(n.blockId!)!));
      const before = a.filter((n) => bm.has(n.blockId!)).map((n) => n.blockId!);
      const after = b
        .filter((n) => am.has(bKeys.get(n.blockId!)!))
        .map((n) => bKeys.get(n.blockId!)!);
      pairing = {
        mode: recovered.length ? "content-anchors" : "unresolved",
        exactMatches: recovered.length,
        unresolvedA: leftOver.length,
        unresolvedB: rightOver.length,
        contentOrderChanged: JSON.stringify(before) !== JSON.stringify(after),
      };
      if (leftOver.length && rightOver.length) {
        let id = "unpaired-content";
        while (am.has(id) || bm.has(id)) id += "-";
        unresolved = {
          id,
          a: { ...ar, children: leftOver },
          b: { ...br, children: rightOver },
          section: "未配對內容 · 各版原始順序",
          pairingBasis: "unpaired",
          ...fallback(
            exactNodeKey({ ...ar, children: leftOver }) !==
              exactNodeKey({ ...br, children: rightOver }),
            "IDENTITY_REBUILT",
            "pairing",
          ),
        };
        for (const n of leftOver) am.delete(n.blockId!);
        for (const n of rightOver) bm.delete(bKeys.get(n.blockId!)!);
      }
    }
    const order = b
      .map((n) => bKeys.get(n.blockId!)!)
      .filter((id) => bm.has(id));
    for (let i = 0; i < a.length; i++) {
      const id = a[i].blockId!;
      if (bm.has(id) || !am.has(id)) continue;
      let previous = i - 1;
      while (previous >= 0 && !order.includes(a[previous].blockId!)) previous--;
      order.splice(
        previous >= 0 ? order.indexOf(a[previous].blockId!) + 1 : 0,
        0,
        id,
      );
    }
    let section = "文件內容";
    const records: ChangeRecord[] = [];
    for (const id of order) {
      const x = am.get(id) || null,
        y = bm.get(id) || null;
      if ((y || x)!.type === "heading") section = plain(y || x);
      records.push({
        id,
        a: x,
        b: y,
        section,
        ...(x && y
          ? {
              pairingBasis:
                x.blockId === y.blockId
                  ? ("stable-id" as const)
                  : ("exact-content" as const),
            }
          : {}),
        ...classify(x, y),
      });
    }
    if (unresolved) records.push(unresolved);
    return freeze({
      records,
      moved,
      provenance,
      ...(pairing ? { pairing } : {}),
    });
  }
  return Object.freeze({
    policy,
    compare,
    rendererTypes: Object.freeze([...renderers]),
  });
}
