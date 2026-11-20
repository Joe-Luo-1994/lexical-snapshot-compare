# TypeScript v0.2 實作 Review

- 日期／reviewer：2026-11-20，實作 agent 自行 review，非獨立真人審查。
- 基線：83988f1；本輪版本 package 0.2.0；固定公開 corpus 與原45組合成案例不變，新增 callout 演練。
- 階段：D／P 參考實作；H 真人價值與 I 公司整合仍待驗證。
- 入口：npm ci、npm run verify、npm start；localhost:4175，三種能力設定。
- 範圍：strict TS、層次邊界、策略 registry、集中 policy、結果／投影分離、同等閱讀能力。配對仍要求可靠持久身分；不回補歷史或推測配對。
- 環境：Windows Edge，正常 viewport 約1232×1226；390×844 override（實際內容寬375）；原生200%縮放（內容寬608）。只保存測試頁面，不保存瀏覽器私人分頁資訊。
- 總判定：**本輪 D／P 參考實作通過；H／I 待驗證**。代表畫面與行為足以交付試用，不能宣稱公司可直接無調整上線或更快審查。
- 成本：沒有可信的完整人時／token成本紀錄，Unknown。

## 證據索引

- `npm run verify`：125/125，包括 ESLint 架構拒絕案例、strict 型別正反例、既有比較／runtime／controller／identity、callout conformance、三preset全47組原案例獨立答案。
- [新擴充與設定測試](../tests/extensions.test.mjs)、[型別正反例](../tests/typings.test.mjs)、[架構測試](../tests/architecture.test.mjs)。三preset保留 changed IDs，不把標籤完全相同當準確性證明。
- [原生 JSON runtime 測試](../tests/runtime.test.mjs) 與 corpus:check：真正 stock Lexical0.18解析、re-export診斷、原文與sidecar保留。UI 是參考投影，沒有宣稱在瀏覽器安裝公司 custom registry。
- [閱讀位置與窄版測量](../evidence/ts-ui-measurements.json)：release第3項模式前後與交換後 top 均88.229px；交換後原文10分鐘／98.5%／可以，目標5分鐘／99.5%／必須；焦點保持。390px及200%無全頁水平溢出。
- [標準表格](../evidence/ts-standard-table.jpg)、[保守表格](../evidence/ts-conservative-table.jpg)、[媒體關閉](../evidence/ts-media-off.jpg)、[精簡窄版](../evidence/ts-compact-narrow.jpg)、[callout](../evidence/ts-callout.jpg)、[技術文章](../evidence/ts-tech-code.jpg)、[規範文章200%](../evidence/ts-policy-200.jpg)。瀏覽器回報無 console error。
- [效能](../evidence/ts-performance.json)：原release兩版1181／1176 nodes，25次warm比較，預先設定p95≤250ms。這是引擎計算，不是審查者效率或完整產品延遲。
- 沿用 [原交付 Review](REVIEW.md) 的案例與視覺語言依據；原 fixtures、獨立答案、CSS主體與閱讀演算法保留並在TS版重跑測試。本輪重走高風險變動面，沒有將所有歷史截圖冒稱為本輪新拍。

## X1–X8

| ID | 判定 | 本輪證據／限制 |
| --- | --- | --- |
| X1 | P通過 | 來源分層、零遷移例外；ESLint涵蓋靜態／動態／type／require／re-export拒絕案例 |
| X2 | P通過 | strict tsc、禁止any/ts-ignore；輸入clone/freeze、不變性測試、生成d.ts；不是任意plugin安全沙箱 |
| X3 | P通過 | callout新增／刪除／修改／相同／反向、未知欄位／版本／子node、缺handler／renderer／ID；未改配對核心；公司node相容未知 |
| X4 | P通過 | resolver集中schema/default/preset，非法鍵值拒絕、host交集、session不可變、provenance；demo切preset建立新session |
| X5 | P通過 | 三preset全47原案例答案；整表37/37列完整對照、來源metadata保留、compact關閉按鈕確實不可見；不等於保守模式提供精準C2體驗 |
| X6 | P通過／I待驗 | 無略過驗證開關；非法設定測試；host授權尚未接入，download不是安全邊界 |
| X7 | P通過 | reasonCode與verification結構化、readonly report／局部projection、table discriminated union、閱讀位置實測 |
| X8 | P通過／I待驗 | 分層README、MAINTENANCE、擴充範例、版本provenance、build/lint/typecheck；公司接手成本與維護效果待驗 |

## 27條驗收

以下「P通過」限定本參考切片與證據範圍；H／I不隱含通過。

| ID | 狀態 | 證據／觀察 | 缺口 |
| --- | --- | --- | --- |
| S1 | P通過 | controller版本核對、交換方向與位置實測 | 公司immutable revision API待驗 |
| S2 | P通過 | code分類；整區、媒體、unsupported與pairing分開；policy限制可見 | 真人能否理解待驗 |
| C1 | P通過 | 47原案例獨立答案、文章期限與權限、callout30→7 | 公司資料待驗 |
| C2 | P通過 | builtin欄位白名單、未知欄位／version／children反例 | 公司序列化政策待驗 |
| C3 | P通過 | identity／插刪列／缺ID與反向測試；不猜配對 | 公司ID生命週期待驗 |
| C4 | P通過 | 標準表格細格、保守整表、規範文章完整URL與三→十工作天 | 保守設定是明示能力縮減 |
| C5 | P通過 | media-off來源／描述／assetVersion，來源相同仍unverified | 真實資產歷史待驗 |
| C6 | P通過／I待驗 | 原文不變、深凍結、DOM文字呈現、無任意SVG執行 | server授權、安全renderer待驗 |
| C7 | P通過 | 原N1–N7反例與matrix重跑；未知子node傳遞fallback | 公司特殊schema待驗 |
| U1 | D/P通過 | 版本、情境、變動與限制；callout首屏與文章畫面 | 無提示真人定向待驗 |
| U2 | P通過 | 長文nav跳轉、200%鍵盤Enter聚焦正確record | 公司設備待驗 |
| U3 | P通過 | 原文／目標句意完整；code保留換行；全文入口 | 真人閱讀理解待驗 |
| U4 | P通過 | 原格式／上下文契約保留；設定說明合併中性段落 | 未重拍每個舊篩選組合 |
| U5 | P通過 | failed/partial/ready與競態測試、無效preset提供回復連結 | loading接公司API需走查 |
| U6 | P通過 | 390px、原生200%、Enter導覽與可見焦點、局部表格捲動 | 不等於完整WCAG／螢幕閱讀器驗證 |
| U7 | P通過 | 整表、code、媒體均可看完整前後證據；修正表格擠壓 | 未知公司node仍需host renderer |
| V1 | D/P通過 | 設定資訊不再用多張警告卡；真正核對區域保留警告層級 | 真人視覺感受待驗 |
| V2 | D/P通過 | 繁中規範、英文技術、程式碼、數字均實際走查 | 未覆蓋所有語言 |
| V3 | D/P通過 | 前後標籤一致；完整表格每欄最小9rem避免直排 | 超寬表需局部橫移，不宣稱免捲動 |
| V4 | D/P通過 | 保留原變更色、±／刪線；[主要色票對比重測](../evidence/ts-contrast.json)，包含新增設定文字 | 真人色覺與完整無障礙待驗 |
| V5 | D/P通過 | 標準／fallback／off一致措辭與樣式；恢復入口 | 公司設計系統適配待驗 |
| V6 | P通過 | 長release、技術code、窄版與縮放無全頁溢出 | 公司真實大小分布待驗 |
| V7 | D通過／H待驗 | 記錄欄位直排與警告過多的具體反例並修正 | 未取得代表reviewer新評價 |
| E1 | 待驗證H | 本輪僅agent走查 | 代表reviewer無提示任務 |
| E2 | 待驗證H | 沒有更快／更好理解主張 | 相當任務對照與原始紀錄 |
| E3 | P通過／I待驗 | 層次、擴充、上限、效能預算及125測試 | 真實設備／維護成本待驗 |
| E4 | 待驗證I | 公司無repo存取；盤點列Unknown | 公司精確來源與runtime證據 |

## 功能與案例覆蓋

| 功能 | 本輪驗收／沿用理由 |
| --- | --- |
| F01–F03 | controller/compare/presentation重跑；release交換、雙模式、正確焦點新實測 |
| F04–F06 | reading.ts沿用原演算法；本輪模式／交換位置新測，其他展開／篩選沿用REVIEW.md互動證據；局部projection不改report |
| F07–F08 | 原文、數字、否定、完整URL測試與policy文章新走查 |
| F09–F11 | table fixtures重跑；標準精準與保守整表新畫面，欄寬修正 |
| F12–F15 | matrix/unknown/presentation重跑；media-off與tech code新畫面；原容器renderer轉TS未改語意 |
| F16–F20 | runtime/controller/identity/安全反例重跑；新增policy/handler失敗測試；host權限仍Unknown |
| F21 | 保存JSON/sidecar下載路徑保留；compact關閉下載、原始證據仍在文件內；關下載非授權 |
| F22 | 新窄版、200%、鍵盤／焦點與對比；原視覺規則保留 |
| F23 | 原上限反例＋ts-performance新量測 |
| F24 | 同一固定來源／授權／SHA與受控B版；corpus:check無漂移 |
| F25 | strict build與125測試、獨立checkout重建與CI；結果見GitHub該commit的Verify工作流程 |

案例C1/C2/C3/C4/C5/C0與N1–N7仍使用原 fixtures 的獨立答案、compare.test.mjs斷言及REVIEW.md案例表。所有原47情境在三preset執行；C1數值與刪除條件、C3目的地不漏，C2標準精準，conservative明確整區。N1/N2/N4相同保存資料仍未證明媒體／流程內容相同；N3合併拓撲整區；N5/N6保留容器；N7未知child不隱藏外部變更。六類特殊node的新增／刪除／修改／相同matrix保持。新增callout五種基本行為與失敗界線單獨測試。

## 發現、修正與停止理由

1. 保守表格在側並視圖被壓成單字直排：補最小欄寬、保留各表局部捲動，重新查看37列前後完整表。這是實際畫面發現，單元測試不會替代。
2. 每個停用能力一張黃色卡，干擾差異閱讀：合併為中性設定段落；保留真正資料限制的警告分類。
3. 原CSS可能覆蓋hidden：明定hidden不顯示，實測compact無split／download且無水平頁面溢出。
4. preset物件只有readonly型別：補runtime freeze與未來session預設不受突變測試。
5. 所有unverified區塊提供raw入口，避免新code/list未知欄位只剩部分預覽。

這輪已將可自行查證的TS、架構、設定、擴充與代表畫面缺口補齊。未知項明確留在H／I，不再以增加合成測試冒充公司或真人證據。下次公司Agent先依MAINTENANCE與AGENT-HANDOFF接一份固定revision文件，驗證registry／ID／權限／renderer，再邀reviewer無提示試用。
