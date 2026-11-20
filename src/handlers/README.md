# handlers

責任：各 node 的欄位政策與比較策略。

依賴：contracts/core/handlers；新增 node 不改配對核心。實際允許矩陣以 tooling/architecture.mjs 為準。

驗證：extensions.test.mjs 及對應 fixtures；共同執行 `npm run verify`，新增能力依 docs/EXTENSION-CONTRACT.md。dist 為生成物，不可手改。
