> v0.2 每項驗收與沿用依據見 [TypeScript Review](REVIEW-TYPESCRIPT.md)。三種能力設定受 [X1–X8](EXTENSION-CONTRACT.md) 約束；關閉功能不得漏資料。

# 現行功能檢核表

擴充與開關必須另填 [X1–X8契約](EXTENSION-CONTRACT.md)。目前已啟用架構lint；handler registry、policy resolver與完整TS重寫尚待實作，不列為已交付功能。

每次 review 必須同時填 [27條驗收標準](ACCEPTANCE.md) 與下表。不可用「測試通過」取代瀏覽器觀察；涉及公司或真人的欄位未取得證據時標 Unknown。變更相關項必須重跑；其餘可引用同版本未受影響的證據。D/P 是 agent 證據，H/I 分別是人與產品整合證據。

| ID／現行能力 | 可接受 | 不符合標準 | 證據與公司調整入口 |
| --- | --- | --- | --- |
| F01 固定版本、方向、交換 | 顯示 A/B 身分；交換後舊新正確 | 指向浮動最新版；交換僅改標題 | compare / controller tests；host immutable revision API |
| F02 具體導覽與上下項 | 顯示實際變動值、章節與種類；跳到對應卡片並聚焦 | 全部叫「文字修改」；跳錯、被 sticky 蓋住 | presentation tests＋瀏覽器長文走查 |
| F03 連續／前後閱讀 | 兩模式保有同一原文與完整句意 | 只剩碎字；前後方向不一致 | 兩種畫面；公司 renderer |
| F04 閱讀位置 | 模式、格式篩選、交換後保留區塊與相對位置；被篩掉時告知 | 回到頂端；找不到目前項目 | src/ui/reading.ts；真人操作前後 DOM 位置與畫面 |
| F05 展開狀態 | 保留上下文、fallback、表格展開；交換按 snapshot 恢復 | 所有 details 被關閉；不同版本套錯 | 長文＋表格實際操作 |
| F06 格式／上下文 | 格式可找回；隱藏數量與狀態可見；未變可展開 | 篩選後宣稱零變更；限制消失 | compare tests＋篩選畫面 |
| F07 文字與格式 | 數字、否定、義務、刪除完整可讀；格式單獨處理 | 漏字、漏條款；不保留必要格式 | compare tests、policy 修訂權限案例 |
| F08 連結 | URL 全文可看；目的地與含連結段落文字變更分開標示 | 同文字不同 URL 算相同；期限改變卻宣稱目的地改變 | presentation regression；policy 第2/3項 |
| F09 簡單表格 | 有穩定列身分；顯示正確列欄舊新值；未變列可展開 | 插列導致全部錯配；對錯服務 | compare tests、release 36×8表格 |
| F10 寬表格閱讀 | 表格局部水平捲動；切模式保留列身分／捲動 | 全頁溢出；跳回表頭丟掉所在列 | src/ui/reading.ts＋瀏覽器壓力操作 |
| F11 合併表格 | 結構保留、整區核對、完整前後內容 | 合併格拆平後假精準；遺失 rowspan/colspan | matrix scenarios；host 真實 table schema 必驗 |
| F12 Image / video / Mermaid | 資料差異與內容未驗證分開；來源可查、預覽失敗有 fallback | 同 URL 保證圖像相同；聲稱已比較流程語意 | matrix / fault tests；公司資產版本及 renderer Unknown |
| F13 Quote / collapse / 巢狀 | 完整前後閱讀；隱藏內容有導覽入口 | 收合內容漏掉；未知子節點當相同 | matrix tests；公司 node registry 必驗 |
| F14 四類不確定性 | 整區、媒體、未支援、配對不足分開；資料相同仍可未驗證 | 全部變成「不支援」或「已變更」 | presentation tests＋分類提示 |
| F15 Code / list | 原生程式碼、語言、清單結構可讀；變更採整區核對 | 硬扁平為段落；假稱逐行／逐項精準 | runtime tests；tech YAML、policy 刪除條款 |
| F16 無變更／錯誤／部分成功 | 不同狀態、原因與復原路徑；限制一直可見 | 空白當成功；只看 changed count | compare / runtime / controller tests＋錯誤情境 |
| F17 真正 Lexical 解析 | 原始 JSON 交給 registry 的 parseEditorState；檢查再序列化差異 | 只 JSON.parse 就宣稱相容；把被丟欄位抹掉 | runtime tests、runtime-report；公司 factories 必填 |
| F18 可靠身分 | ID 與版本同時保存；namespace、唯一性、路徑驗證；無身分退回核對 | 跨版本用位置生成 ID；複製時重複 ID | identity / runtime tests；新增複製拆合重載 I 待驗 |
| F19 非同步與存取 | loading；忽略過期回覆；revision 與 documentId 一致；dispose | 快速選版顯示舊回覆；無權讀歷史仍顯示 | controller tests；授權由 host 實作 |
| F20 唯讀與安全 | 原始資料保留；文字安全渲染；URL 有限制；不執行 Mermaid | 改寫現行 editor；執行不可信 HTML/SVG | immutable / adversarial tests；host security review |
| F21 原始證據與下載 | 完整文件、來源、保存 JSON 入口；下載原生 state＋身分 sidecar | 畫面投影冒充保存資料；過濾後證據消失 | app savedA/savedB；corpus:check |
| F22 可達性與視覺 | 鍵盤、焦點、200%、390px可操作；顏色之外有文字；層級一致 | 只能滑鼠／紅綠辨認；重疊與截斷 | U6/V1–V7走查；不等於 WCAG 認證 |
| F23 長文件與限制 | 已定大小上限、超限明確失敗；代表文件量測 | 無界運算；拿短句宣稱大文可用 | compare boundary tests、PERFORMANCE-BUDGET、measure.mjs |
| F24 真實文章可追溯 | 固定來源、授權、SHA、實際JSON與獨立答案；B明示測試修訂 | 宣稱真實作者歷史；未轉錄部分靜默省略 | corpus:check、SOURCES、THIRD-PARTY-NOTICES |
| F25 可攜與持續驗收 | clean checkout npm ci/verify/start；Node22/24 CI；失敗 exit code | 依賴原工作區或私有服務；只有截圖無程式 | GitHub CI、CLI、AGENT-HANDOFF |

以上是**現行能力的驗收界線**，不是宣稱已完成 host 的任選版本 picker、React component、權限系統、資產保存或 custom-node registry。參照 UI 使用預設成對案例；host 可用 controller 接入自選兩個 immutable revisions。

## F26 主題與 F27 編輯壓力（新增必要檢核）

| ID | 可接受 | 不符合 | 證據 |
| --- | --- | --- | --- |
| F26 主題 | 明亮／深色／跟隨系統；正文、diff、表格、fallback、焦點可讀；換主題不重建或改位置 | 只反轉顏色、白底殘留、刪除標記消失、回到頂端；以主題選項當功能授權 | theme.test.mjs＋實際畫面與縮放；OS主題變更事件需host驗證 |
| F27 編輯壓力 | 插入不冒充搬移；順序與內容分開；拷貝新ID；重複文字／拆合／刪光／Unicode不漏；錯誤身份降級 | 每次保存重生ID；按位置補配對；純重排宣稱沒有任何變更；看不見搬移中的規則修改 | editing-stress.test.mjs、identity.test.mjs、STRESS-REVIEW.md；有效但錯配的sidecar仍須host交易保證 |
