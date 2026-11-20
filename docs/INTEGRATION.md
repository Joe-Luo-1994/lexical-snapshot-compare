# 接入契約與調整標準

## 交付範圍

比較核心、runtime解析與diagnostic、參考registry、非同步控制器、完整DOM介面、固定測資與檢核契約可直接帶走。正式產品的registry、資料API、身分持久化、renderer、權限與資產歷史由host提供。此文件是沒有公司repo存取權時的條件式接入方案，不是已完成整合的宣告。

| 所有者 | 入口 | 契約 |
| --- | --- | --- |
| 比較核心 | src/core/engine.ts | 純函式、不寫入輸入；精準文字／連結資料／簡單表格；結構不明退回完整對照 |
| runtime接入 | src/adapters/lexical018/runtime.ts | 真正parseEditorState；保留raw輸入；重新序列化差異列入diagnostics |
| host registry | createEditor(onError) | 每次建立disposable editor；全部真實node版本、factory與onError必須正確接線 |
| host資料／授權 | loadSnapshot({documentId,revision,signal}) | 回傳這一文件、這一不可變revision的完整JSON；服務端檢查歷史存取權 |
| 請求競態 | src/application/controller.ts | 新請求取消舊signal、忽略晚回覆、核對documentId及revision；不取代host授權 |
| 產品UI | src/ui/app.ts等為參考 | 先顯示loading/error/partial；診斷不能只進console；沿用功能檢核與視覺契約 |

## 保存格式與身分

```json
{
  "documentId": "host-document-id",
  "revision": "immutable-revision",
  "label": "審查者看得懂的版本名稱",
  "savedAt": "host-timestamp",
  "editorState": {"root": {}},
  "identity": {
    "version": 1,
    "namespace": "host-document-id-and-identity-generation",
    "nodes": {"/root/children/0": "persisted-stable-id"}
  }
}
```

上例root省略，不是可執行樣本；可執行樣本在corpus/snapshots。Sidecar與JSON必須同一保存交易、同一revision。namespace必須跨同文件同代版本穩定，不同文件或重新建立身分代必須不同；跨namespace明確失敗。path只定位本版node，不能拿相同path當兩版相同身分的證明。

公司已有正確持久ID時可映射到比較副本；不要用Lexical runtime node key。原型的 `identity-contract.js` 只證明建立、paste、split、merge、reload的參考語意，**不是已安裝的Lexical plugin**。stock0.18一般節點會丟棄額外blockId；這是採sidecar並檢查round-trip的原因。若選擇自訂節點持久欄位，必須連同clone/importJSON/exportJSON與所有建立／貼上交易完成測試。

ID規則：新區塊與貼上的副本取新ID；內容修改保留；拆分保留左側ID、右側取新ID；合併保留既定存活側ID；重載保留。這是候選規則，若產品有不同語意需記錄並用反例驗證，不能靜默替換。缺ID允許完整文件fallback，不允許假精準比較。任選歷史版本仍須受支援邊界與權限限制。

## 結果解讀

- `failed`：無有效比較結果。不能顯示「沒有變更」。
- `partial`：有runtime或身分診斷；保留可比較的raw資料，但須顯示受影響版本與原因。`LEXICAL_PARSE_FAILED` 不可當成功重開文件。
- `ready`：runtime檢查就緒；**仍須逐區塊檢查kind、needsReview與verification分類**。它不是「所有語意都理解」或核准訊號。
- `RUNTIME_ROUNDTRIP_CHANGED`：列出被runtime改寫／捨棄的paths。調查是defaults、版本相容性或真實內容遺失；只有有產品證據時才能制定可忽略政策。不能直接把exported JSON拿去比較而消除警告。
- 區塊`coarse`＝整區對照；媒體／流程待驗證與unknown schema分開；缺配對則未能可靠配對。保存資料相同不代表外部媒體相同。

## 欄位與renderer政策

可機器核對的完整欄位白名單在 `src/handlers/builtins.ts` 的欄位政策。新增欄位不會自動被接受；unknown欄位、節點版本或未支援呈現會降級。變更這份政策必須新增正反例。

| 類型 | 目前比較／呈現 | host調整與必測 |
| --- | --- | --- |
| root／paragraph／heading／text／linebreak | 普通文字精準；同格式保留；數值完整分詞 | direction、indent、style、mode等未支援呈現不可靜默清掉；混合格式整區對照 |
| link | 完整目的地與標籤；安全HTTP(S)可點，其餘保留可讀字串 | rel／target／title非預設政策、mailto／相對URL／安全基底由host確認 |
| table／row／cell | 穩定列格ID、簡單同寬表精準；插刪列保留鄰近位置；合併／結構變動完整對照 | span拓撲、欄寬、背景、alignment；stock0.18 cell對齊重載遺失已有反例測試 |
| quote／collapse | 保留容器、標題、層級、保存開合語意；互動開合只改檢視 | 真實collapse欄位、巢狀限制、刪除容器、媒體失效 |
| image／video | 來源／alt／caption／poster／assetVersion；歷史不可驗證就明示 | 原型自訂schema不是host schema；資產不可變性與實際安全renderer |
| Mermaid | 保存來源前後核對，沒有圖形語意推論 | host validator／restricted preview與失敗回復；布局不能當邏輯變動 |
| list／listitem | 標準有序／無序清單可讀；變更整區對照 | checked/task狀態未支援，保留unknown；不可跨項目錯配 |
| code／code-highlight | 語言、原文與行縮排保留；變更完整前後對照，絕不執行 | host語言欄位、highlight版本；不宣稱AST或語意diff |
| 未知node／欄位／version | 保存payload與具體限制，未知相同仍未驗證 | 取得公司export/import與renderer證據後才加adapter |

## 最小接入與發布門檻

1. 依AGENT-HANDOFF盤點host，先跑本套件。保持公司Lexical0.18與原儲存格式。
2. 實作disposable registry與匿名化公司JSON測試；對照全部原始欄位，檢查round-trip變化。
3. 明確保存ID方案與新歷史邊界；沒有ID的舊資料使用fallback。
4. 接固定A/B的readonly歷史API及controller；實測拒絕存取、切換競態、revision不符。
5. 用既有安全renderer呈現比較資料，完成每個FEATURE-CHECKLIST項目；字體／留白／對比／焦點／閱讀記憶同樣驗收。
6. 以公司真實長度匿名化文件完成D/P/I，再以代表性reviewer任務驗證H。未通過不得把本套件狀態升級成production-ready。

不必把原型全域DOM IDs移植到React；可以替換UI實作，但不能以換框架為由丟掉已驗收的使用者能力。無公司存取權的Agent應交付conditional plan與Unknown清單，而不是虛構產品檔案路徑。

## TypeScript 與能力注入

v0.2 的型別、集中設定、handler／renderer 範例、API 遷移說明見 [MAINTENANCE.md](MAINTENANCE.md)。先 build 再用 package exports，禁止依賴已刪除的 src/*.mjs。UI 參考程式只讀 demo 的比較投影；正式產品須將 compareSnapshots 的 diagnostics、runtime 狀態與原始 snapshots 一起接入，不能跳過 runtime adapter。
