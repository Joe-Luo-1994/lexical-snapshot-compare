# 擴充與功能設定契約

本契約是 ACCEPTANCE、FEATURE-CHECKLIST 的必要補充；適用於每次新增node、比較策略、renderer、功能開關與TypeScript遷移。TYPESCRIPT-DESIGN描述目標結構；契約不代表該結構已全數實作。

| ID | 可接受 | 不符合標準 | 保護與必要證據 |
| --- | --- | --- | --- |
| X1 依賴方向 | core只依contracts/core；handler依contracts/core/handlers；application依ports；presentation不依UI；host依賴在adapters/reference | 核心引用DOM、Lexical、網路、UI或公司API；隱藏動態載入；新增檔案未歸層 | architecture/boundaries：static import、re-export、dynamic import、TS import type及require反例測試 |
| X2 純度與型別 | 外部JSON為unknown，驗證後縮窄；原始資料保留；核心可重現 | any、ts-ignore逃避型別；核心讀環境／DOM／時間／亂數；直接寫參數 | ESLint純核心規則及TS規則；輸入不變／runtime測試。別名突變與完整型別正確性仍需測試及tsc |
| X3 node擴充 | 明示type/version/欄位政策、支援條件、fallback；重複註冊失敗；跨type保守處理 | 註冊順序決定行為；未知欄位或子node消失；新增node需改配對核心 | handler conformance suite＋新增node演練；目前registry抽離尚待TS遷移，不算已完成 |
| X4 功能設定集中 | schema/defaults/presets集中；session固定effective policy與不可用原因；host從組裝邊界注入 | UI/core自行讀env或storage當產品開關；比較中途改策略 | ESLint阻止新模組直接讀process/storage；resolver、競態、policy版本測試待實作。不能靠lint保證所有任意boolean都已集中 |
| X5 關閉不漏資料 | 關精準表格→整區對照；關預覽→來源／metadata；缺renderer→可讀fallback | 關功能就漏變更、宣稱相同或隱藏限制 | 每開關on/off契約測試、公開文章／複雜文件實際畫面；不可用lint取代 |
| X6 固定安全條件 | 唯讀、輸入驗證、原文保留、未知提示、可靠配對、資源上限不可停用 | skipValidation／ignoreUnknown等配置；UI開關冒充授權 | 設定schema拒絕未定義鍵、失敗測試、host授權證據；schema待實作 |
| X7 結果與閱讀分離 | 結果以code／結構化證據表示；view偏好只改投影，保留閱讀位置與展開狀態 | 依中文reason猜分類；篩選改report；模式切換跳頂 | discriminated unions／exhaustiveness／行為及UI回歸；舊presentation文字分類是明列遷移欠項 |
| X8 可維護與可重現 | 擴充範例、契約測試、所有者、engine/handler/policy版本、交接入口同步 | 只加if、只補快樂路徑；移除lint讓CI過；通過測試就宣稱易維護 | 新增node＋關閉精準表格演練；公司接手證據仍Unknown |

## 目前可執行的 lint

`npm run lint` 使用ESLint flat config、零warning；`npm run verify`先lint再驗corpus及測試，既有Node22/24 CI自動執行。ESLint 10要求本專案Node22.13+（或受支援的24+），已鎖定依賴。TS parser可檢查新增.ts/.tsx，但**目前尚未完成TS改寫、沒有聲稱已有tsc完整型別檢查**。TS遷移時須新增strict typecheck至verify。

新目錄依賴矩陣在 `tooling/architecture.mjs`；ESLint配置在 `eslint.config.mjs`。相對路徑先解析成實際目錄再判斷，禁止非adapter/reference的外部import與alias，不允許靠 `../../` 或re-export繞過。這是靜態架構防線，不是惡意程式安全沙箱；別名／反射等語意仍靠review和行為測試。

既有檔案精確映射到新責任層；僅以下三條既有依賴暫時例外：

- src/controller.mjs → src/lexical-adapter.mjs：TS application改為注入port後移除。
- dist/app.js → dist/compare.js：移至application/presentation後移除。
- dist/app.js → dist/fixtures.js：參考組裝移至reference後移除。

不使用整目錄忽略掩蓋遷移。現在dist包含手寫來源，所以仍lint；僅排除生成的article-fixtures.js（由corpus:check保護）、node_modules與.local。完成TS build後才把dist整體改為生成物。內嵌eslint-disable無效；更改規則或例外須提供受影響契約ID、理由、反例測試與移除條件。

## 擴充時必跑

1. 執行npm run verify，包含lint本身的正反例。
2. handler至少測新增／刪除／修改／相同／未知欄位／版本／缺ID／缺renderer／策略停用／輸入不變。
3. 設定測合法與非法值、相依能力、關鍵交互；每個preset跑代表文件，不盲目全枚舉2^N。
4. 受影響介面實際走查；逐項填X1–X8與27條標準，不適用須說明，未知不算通過。

官方工具依據：[ESLint configuration](https://eslint.org/docs/latest/use/configure/configuration-files)、[restricted globals](https://eslint.org/docs/latest/rules/no-restricted-globals)。標準restricted-imports只處理static imports，因此本專案另用可測的規則涵蓋dynamic import與TS邊界。
