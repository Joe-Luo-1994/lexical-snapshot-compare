> 歷史提案 review；實作結果與後續證據見 [REVIEW-TYPESCRIPT.md](REVIEW-TYPESCRIPT.md)。

# TypeScript 提案 review

日期：2026-11-20；reviewer：實作agent自行review；階段：方案。對象：[TYPESCRIPT-DESIGN](TYPESCRIPT-DESIGN.md)。總判定：**證據不足**（設計已記錄，尚無TS實作／開關操作證據，不能宣稱重構驗收通過）。本輪沒有變更介面或重跑畫面，既有畫面僅作不退步基準；不計為本輪視覺驗收。沒有公司程式存取權。

| ID | 狀態 | 提案對應／所需證據 |
| --- | --- | --- |
| S1 | 待驗證 | session固定revision與effective policy；需切換競態測試 |
| S2 | 待驗證 | 能力停用有reason code；需關閉後UI證據 |
| C1 | 待驗證 | 沿用獨立答案；需TS全套回歸 |
| C2 | 待驗證 | handler欄位政策；未知欄位不可消失 |
| C3 | 待驗證 | core集中身分驗證；不得由plugin猜配對 |
| C4 | 待驗證 | table關閉精準仍完整對照；link另有策略 |
| C5 | 待驗證 | 關預覽仍顯示來源及限制；host資產未知 |
| C6 | 待驗證 | 唯讀／驗證不可關；需實測與host授權證據 |
| C7 | 待驗證 | 特殊node conformance與容器fallback |
| U1 | 待驗證 | effective能力／模式要可理解；需畫面 |
| U2 | 待驗證 | 結構化導覽資料；需長文定位 |
| U3 | 待驗證 | renderer不可省略舊新全文；需實際閱讀 |
| U4 | 待驗證 | 偏好僅改projection；需篩選後找回內容 |
| U5 | 待驗證 | session聯集與無效設定；需錯誤復原 |
| U6 | 待驗證 | 原有鍵盤與200%要求維持；需重跑 |
| U7 | 待驗證 | disabled／unsupported fallback需同等閱讀品質 |
| V1 | 待驗證 | 不改現有層級；重構後畫面回歸 |
| V2 | 待驗證 | 真實文章字體與行長回歸 |
| V3 | 待驗證 | 模式關閉／切換後分組與位置回歸 |
| V4 | 待驗證 | 保留顏色與文字標記；實際狀態對比檢查 |
| V5 | 待驗證 | reason code統一文案；fallback一致性 |
| V6 | 待驗證 | 長文、長URL、表格與缺renderer反例 |
| V7 | 待驗證 | 新實作agent視覺觀察及真人感受均未取得 |
| E1 | 待驗證 | 仍需真人無提示任務 |
| E2 | 待驗證 | 不宣稱省時或維護效率已提升 |
| E3 | 待驗證 | 單package與局部擴充；需新增node演練及效能回歸 |
| E4 | 待驗證 | 公司registry／flags／框架皆Unknown，提供ports不虛構實作 |

主要反例：開關讓資料消失、未知欄位被策略吃掉、registry衝突、只靠文字推斷分類、遠端flag在比較中途變動。提案已明確禁止或定義處理方式，但測試與操作證據尚待實作。未新增能力前先保住原有體驗；完整條件沿用ACCEPTANCE及F01–F25。時間／成本無完整統計。
