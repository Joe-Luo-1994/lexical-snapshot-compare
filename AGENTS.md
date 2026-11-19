# Snapshot Compare agent entry

Read README.md, docs/AGENT-HANDOFF.md, docs/INTEGRATION.md, docs/ACCEPTANCE.md, and docs/FEATURE-CHECKLIST.md before adoption or behavioral changes.

- Stored Lexical 0.18 JSON is canonical; no upgrade, HTML intermediate, or Markdown round-trip assumption.
- Never infer persistent identity from runtime keys, current array position, or mutable text. Corpus sidecars belong to a controlled edit lineage, not an identity matching algorithm.
- Keep original snapshots; runtime re-export is diagnostic evidence, never a sanitizer that silently drops unknown fields.
- Unknown schemas, renderer gaps, asset history gaps, and failed parsing must remain visible. No false precision.
- Verify existing functionality using the feature checklist and all27 acceptance standards. Unit tests do not substitute for browser evidence or human/host validation.
- Run npm run verify. For UI changes inspect representative real articles and complex synthetic cases, keyboard, narrow width and200% zoom; record exact evidence and remaining gaps in docs/REVIEW.md.
- Company files and snapshots stay in the company environment. Record host facts as Observed only with actual product file/runtime references; otherwise Unknown. Do not present reference registry tests as host compatibility.
- Preserve source licenses, pinned hashes, controlled-revision labeling and failure cases. Reuse current decisions; do not add unrelated features or silently weaken acceptance.
- This is an independent portable repository. Do not copy Sites credentials, hosting IDs, unrelated labs, node_modules or machine-local evidence into publication.
