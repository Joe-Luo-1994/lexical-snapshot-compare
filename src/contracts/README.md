# contracts

責任：共同型別與資料契約。

依賴：僅 contracts；不依 runtime 或 UI。實際允許矩陣以 tooling/architecture.mjs 為準。

驗證：typings.test.mjs、extensions.test.mjs；共同執行 `npm run verify`，新增能力依 docs/EXTENSION-CONTRACT.md。dist 為生成物，不可手改。
