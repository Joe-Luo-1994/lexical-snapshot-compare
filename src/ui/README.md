# ui

責任：參考 DOM renderer、互動與局部閱讀記憶。

依賴：contracts/application/presentation/ui；不改 report、不讀產品 flags。實際允許矩陣以 tooling/architecture.mjs 為準。

驗證：實際瀏覽器依 ACCEPTANCE；reading 與畫面證據；共同執行 `npm run verify`，新增能力依 docs/EXTENSION-CONTRACT.md。dist 為生成物，不可手改。
