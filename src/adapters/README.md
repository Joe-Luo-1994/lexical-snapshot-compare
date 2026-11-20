# adapters

責任：Lexical runtime 與 host 邊界。

依賴：contracts/core/adapters；外部相依集中在此。實際允許矩陣以 tooling/architecture.mjs 為準。

驗證：runtime.test.mjs；公司實際 registry gate；共同執行 `npm run verify`，新增能力依 docs/EXTENSION-CONTRACT.md。dist 為生成物，不可手改。
