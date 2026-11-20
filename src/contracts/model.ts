/** Saved data is untrusted until runtime validation. Unknown fields stay intact. */
export interface SavedNode {
  readonly type: string;
  readonly version: number;
  readonly blockId?: string;
  readonly children?: readonly SavedNode[];
  readonly text?: string;
  readonly format?: number | string;
  readonly detail?: number;
  readonly mode?: string;
  readonly style?: string;
  readonly direction?: string | null;
  readonly indent?: number;
  readonly textFormat?: number;
  readonly textStyle?: string;
  readonly tag?: string;
  readonly url?: string;
  readonly rel?: string | null;
  readonly target?: string | null;
  readonly title?: string | null;
  readonly collapsed?: boolean;
  readonly colSpan?: number;
  readonly rowSpan?: number;
  readonly headerState?: number;
  readonly width?: number | null;
  readonly height?: number | null;
  readonly backgroundColor?: string | null;
  readonly src?: string;
  readonly alt?: string;
  readonly caption?: string;
  readonly poster?: string;
  readonly assetVersion?: string;
  readonly source?: string;
  readonly listType?: string;
  readonly start?: number;
  readonly value?: number;
  readonly checked?: boolean;
  readonly language?: string | null;
  readonly [field: string]: unknown;
}
export interface Snapshot {
  readonly editorState: { readonly root: SavedNode };
  readonly documentId?: string;
  readonly revision?: string;
  readonly label?: string;
  readonly savedAt?: string;
  readonly identity?: {
    readonly version: 1;
    readonly namespace: string;
    readonly nodes: Readonly<Record<string, string>>;
  };
  readonly [field: string]: unknown;
}
export type ViewMode = "flow" | "split";
export interface Policy {
  readonly tablePrecision: "cells" | "whole-block";
  readonly mediaPreview: "reference-assets" | "off";
  readonly viewModes: readonly ViewMode[];
  readonly download: "enabled" | "disabled";
}
export interface EffectivePolicy extends Policy {
  readonly id: string;
  readonly notices: readonly string[];
}
export const reasonCodes = [
  "NONE",
  "UNKNOWN_CONTENT",
  "MEDIA_UNVERIFIED",
  "STRUCTURE_CHANGED",
  "TABLE_STRUCTURE",
  "FORMAT_CHANGED",
  "LINK_CHANGED",
  "WHOLE_BLOCK",
  "COLLAPSE_CHANGED",
  "MERMAID_UNVERIFIED",
  "ROOT_CHANGED",
  "ROOT_UNKNOWN",
  "IDENTITY_MISSING",
  "PRECISION_DISABLED",
  "RENDERER_UNAVAILABLE",
  "HANDLER_FAILED",
] as const;
export type ReasonCode = (typeof reasonCodes)[number];
export type Verification = "whole" | "media" | "unsupported" | "pairing";
export interface CellChange {
  readonly a: SavedNode;
  readonly b: SavedNode;
  readonly changed: boolean;
}
export interface RowChange {
  readonly id: string;
  readonly status: "same" | "added" | "removed" | "modified";
  readonly a: SavedNode | null;
  readonly b: SavedNode | null;
  readonly cells?: readonly CellChange[];
}
interface FindingBase {
  readonly changed: boolean;
  readonly reasonCode: ReasonCode;
  readonly verification: Verification | null;
  readonly needsReview?: boolean;
}
/** Payloads only exist for the kinds that can use them. */
export type Finding = FindingBase &
  (
    | { readonly kind: "table"; readonly rows: readonly RowChange[] }
    | {
        readonly kind:
          | "same"
          | "text"
          | "link"
          | "format"
          | "coarse"
          | "unverified"
          | "added"
          | "removed";
        readonly rows?: never;
      }
  );
export type ChangeRecord = Finding & {
  readonly id: string;
  readonly a: SavedNode | null;
  readonly b: SavedNode | null;
  readonly section: string;
};
export interface ComparisonReport {
  readonly records: readonly ChangeRecord[];
  readonly moved: boolean;
  readonly provenance: {
    readonly engine: string;
    readonly handlers: readonly string[];
    readonly policy: EffectivePolicy;
  };
}
export interface Handler {
  readonly type: string;
  readonly nodeVersion: number;
  readonly implementationVersion: string;
  readonly fields: readonly string[];
  readonly opaque?: boolean;
  readonly supports: (node: SavedNode) => boolean;
  readonly compare: (
    a: SavedNode,
    b: SavedNode,
    policy: EffectivePolicy,
  ) => Finding;
}
export interface Engine {
  readonly policy: EffectivePolicy;
  readonly rendererTypes: readonly string[];
  compare(a: unknown, b: unknown): ComparisonReport;
}
export interface Diagnostic {
  readonly code: string;
  readonly message: string;
  readonly paths?: readonly string[];
  readonly side?: "a" | "b";
}
export type RuntimeReport =
  | { readonly parsed: false }
  | {
      readonly parsed: true;
      readonly nodeCount: number;
      readonly textLength: number;
      readonly roundTripChanges: readonly string[];
    };
export interface Prepared {
  readonly snapshot: Snapshot;
  readonly runtime: RuntimeReport;
  readonly diagnostics: readonly Diagnostic[];
}
export type RuntimeResult =
  | (ComparisonReport & {
      readonly status: "ready" | "partial";
      readonly diagnostics: readonly Diagnostic[];
      readonly runtime: {
        readonly a: RuntimeReport;
        readonly b: RuntimeReport;
      };
      readonly snapshots: { readonly a: Snapshot; readonly b: Snapshot };
    })
  | {
      readonly status: "failed";
      readonly records: readonly [];
      readonly moved: false;
      readonly diagnostics: readonly Diagnostic[];
    };
export interface Pair {
  readonly documentId: string;
  readonly baselineRevision: string;
  readonly targetRevision: string;
}
export type SessionState =
  | { readonly kind: "loading"; readonly pair: Pair }
  | {
      readonly kind: "error";
      readonly pair: Pair;
      readonly message: string;
      readonly result?: RuntimeResult;
    }
  | {
      readonly kind: "ready" | "partial";
      readonly pair: Pair;
      readonly result: Extract<RuntimeResult, { status: "ready" | "partial" }>;
    };
export interface Scenario {
  readonly id: string;
  readonly title: string;
  readonly documentTitle?: string;
  readonly context?: string;
  readonly task: string;
  readonly group?: string;
  readonly a: Snapshot;
  readonly b: Snapshot;
  readonly savedA?: Snapshot;
  readonly savedB?: Snapshot;
  readonly expected?: {
    readonly changedIds?: readonly string[];
    readonly error?: boolean;
  };
  readonly provenance?: { readonly source: string; readonly license: string };
}
