# 維護與擴充指南（v0.2）

目標是讓下一位開發者能局部改動、知道何時退回完整核對，並重跑相同證據。這是可執行的參考設計；公司接手效率仍待驗證。

## 來源與責任

| 來源 | 責任／主要所有者 | 驗證 |
| --- | --- | --- |
| src/contracts/model.ts | JSON、結果聯集、policy、handler、session 型別；核心維護者 | typings / extensions tests |
| src/core | 配對、輸入限制、fallback、集中設定；核心維護者 | compare / extensions / architecture tests |
| src/handlers | 每種 node 的欄位、支援條件與比較策略；node 維護者 | 原案例及新增 handler 反例 |
| src/adapters/lexical018 | 真正解析、round-trip 診斷；host 接入者 | runtime tests＋公司 registry |
| src/application | 非同步生命週期、固定版本；host 接入者 | controller tests |
| src/presentation | code→文案、導覽與分類；產品介面維護者 | presentation tests |
| src/ui | DOM、局部閱讀狀態、renderer；產品介面維護者 | 真實瀏覽器與驗收契約 |
| src/reference | 示範組裝、stock registry、callout；範例維護者 | 擴充演練，不代替公司事實 |
| fixtures / corpus / public | 固定測資、授權原文、HTML/CSS/資產 | corpus:check、畫面 review |

核心不讀 DOM、Lexical、網路、環境變數或 storage。application 只注入 loadSnapshot/compare/onState ports。UI 不修改 report；模式、格式與展開是局部閱讀狀態。依賴矩陣由 ESLint 強制，不提供遷移例外。

## 使用入口

```ts
import { compareSnapshots, createReferenceEngine, presets } from '@snapshot-compare/portable';
import { createReferenceEditor } from '@snapshot-compare/portable/reference-registry';

const engine = createReferenceEngine({
  policy: presets.standard,
  hostPolicy: { mediaPreview: 'off', download: 'disabled' },
});
const result = compareSnapshots(savedA, savedB, {
  engine,
  createEditor: createReferenceEditor, // 公司需換成實際 registry factory
});
// failed 不顯示成功結果；partial 必須呈現 diagnostics。
// ready 仍需呈現各 record 的 verification / reasonCode。
```

以上 package 名稱適用於安裝此 repository 的 package；本機範例可用 `./dist/reference/index.js`。先 `npm ci && npm run build`，exports 與 d.ts 均由 TS 產生。尚未發布 npm registry 套件。

## 新增一個 node

先取得公司 importJSON/exportJSON、node version、允許的 children、readonly renderer 證據。參考 [callout handler](../src/reference/callout.ts)、[renderer](../src/reference/callout-renderer.ts)、[組裝](../src/reference/browser.ts) 與 [conformance tests](../tests/extensions.test.mjs)。

1. 宣告 Handler 的 type、nodeVersion、implementationVersion、fields、supports、compare。fields 是允許且已處理欄位；未知欄位預設不支援，不可無條件刪掉。
2. supports 限定可保真的內容形狀；文字可比較不代表 style、巢狀內容也可比較。callout 只有單一簡單段落、相同標題與 tone 時精準比較，其他變動整區核對。
3. 明確組裝 `handlers: [...builtinHandlers, myHandler]` 與 renderer type 清單；重複 type/version 立即失敗。缺 renderer 不可取得假精準結果。
4. UI 注入同名 NodeRenderer；使用安全 DOM API、保留原始證據。UI 組裝宣稱支援 renderer 卻沒有提供時立即失敗；renderer 執行失敗顯示保存 payload。可信擴充程式不是安全沙箱。
5. 必測新增／刪除／修改／相同／反向、未知欄位與版本／未知子node、缺ID／缺renderer、輸入不變、設定關閉。重跑 X1–X8 與受影響畫面。

callout 演練只增加專屬 handler、renderer、組裝與測試，沒有修改配對核心；它使用合成 schema，不是原生 Lexical callout class。正式接入仍需公司 disposable registry 的真正 parse 測試。現行通用輸入 validator 對已知欄位型別有基本限制；若新 schema 使用同名但不同型別欄位，須明確調整 validator 與反例，不能靠強制轉型掩蓋。

## 功能開關

| 設定 | 值 | 縮減時保留 |
| --- | --- | --- |
| tablePrecision | cells / whole-block | 完整前後表格、變動、設定限制原因 |
| mediaPreview | reference-assets / off | 來源、描述、版本與未驗證提示；reference-assets 僅示範 allowlist |
| viewModes | 非空 flow / split 子集 | 至少一種閱讀方式；不可用按鈕隱藏並說明 |
| download | enabled / disabled | 畫面內原始證據；此開關不是存取控制 |

schema、defaults、presets 與交集規則都在 core/policy.ts。hostPolicy 只能縮減 requested 能力，空 mode 交集／非法值／未知鍵失敗；沒有 skipValidation 或 ignoreUnknown。輸入驗證、可靠配對、未知提示、原始資料、唯讀、資源上限沒有關閉選項。

每個 engine 建立一次 immutable effective policy；report.provenance 保存 engine、handler 版本與 policy。修改外部 config 不影響現有 session。遠端 flags 請由 host 組裝層先解決再注入，不在比較中途讀取。

demo 的側欄 preset 透過 URL 建立新 session，重設閱讀位置但保留案例；不是產品 flag 服務或權限來源。同 session 的閱讀模式、格式篩選、交換方向才保留閱讀 anchor。產品若要保留跨政策位置，須另定 session 遷移契約。

## 開發與相容性

`npm run verify` = lint＋格式＋strict typecheck＋corpus 再生檢查＋行為／型別／主題／壓力測試。`npm run build` 清理並重新生成 dist；`npm start` 先 build 再啟動 demo。CI 另檢查提交的 dist 與重建結果一致。新增引擎行為後更新 implementationVersion、測資、契約與 review，不把測試通過當真人理解證據。

v0.1 → v0.2：移除手寫 src/*.mjs 入口，改用 package exports 或 dist/reference/index.js；比較 record 的中文 reason 改為 reasonCode，文案由 src/presentation/changes.ts 的 changeReason 產生；verification 是結構化分類。report 及其內部資料現在深凍結，UI 必須建立局部 projection，不可直接改 rows。增加 provenance。compareSnapshots 與 createComparisonController 的使用方式保留，可額外注入 engine；純 createController 接受 compare port。dist/compare.js 等少數舊 demo 入口仍生成相容 re-export，不應作為新的深層 API 依賴。

readonly 及 lint 無法證明任意 handler 的語意正確性。不要把外部提供的 JS 當不可信 plugin 執行，也不能以關閉下載代替 server 授權。公司 registry、資產歷史、ID 保存交易、React 整合與真人價值仍是待驗證 gate。

最新編輯壓力、ID持久化方案與dark mode限制見 [STRESS-REVIEW.md](STRESS-REVIEW.md)。主題為純呈現偏好，以CSS tokens及prefers-color-scheme控制，不加入引擎policy。
