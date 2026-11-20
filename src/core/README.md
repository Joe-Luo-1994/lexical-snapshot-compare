# core

責任：輸入驗證、可靠配對、fallback 與設定解析。

依賴：contracts/core；不得讀 DOM、時間、亂數、環境或網路。實際允許矩陣以 tooling/architecture.mjs 為準。

驗證：compare.test.mjs、extensions.test.mjs；共同執行 `npm run verify`，新增能力依 docs/EXTENSION-CONTRACT.md。dist 為生成物，不可手改。
