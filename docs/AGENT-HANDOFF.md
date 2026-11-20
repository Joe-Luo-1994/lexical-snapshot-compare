# 給公司內 Agent 的執行指令

新增node、比較策略、renderer或功能開關時，先讀 [EXTENSION-CONTRACT.md](EXTENSION-CONTRACT.md)，逐項驗收X1–X8；不得以修改lint規則替代處理架構問題。strict TypeScript、集中policy resolver與handler registry已實作；先讀 [MAINTENANCE.md](MAINTENANCE.md) 的擴充演練與 [REVIEW-TYPESCRIPT.md](REVIEW-TYPESCRIPT.md) 的證據界線。

可將下面段落連同 repository 一起交給公司 Agent。不需要重做本套件的探索；先確認產品差異，再完成最小可驗證接入。

> 你要將此 Snapshot Compare 成果接入我們現有的 Lexical 文件產品。使用情境是 reviewer 比較兩份保存版本，辨識變更與尚不能確認的部分。請先讀 README、INTEGRATION、FEATURE-CHECKLIST、ACCEPTANCE 與 REVIEW，執行 npm ci、npm run verify 及公開文章試用。既有成果不是公司產品事實；請查閱公司 repo 的實際檔案與 runtime，不要臆測 node schema、版本 API 或權限。不要升級 Lexical，不要把 JSON 轉成 HTML／Markdown 再比較，不要寫回保存版本。先產出有證據的盤點與最小接入方案，接著實作、實際 UI review、修正，最後提供顧客試用。已明確且可逆的工作可自行完成；只有會改變範圍、成功條件或授權的缺口才詢問使用者。

## 1. 先建立產品事實表

每項填 Observed／Inferred／Unknown、**實際檔案路徑與行號或 runtime 證據**，以及影響。下列初始均為 Unknown；不可用本套件的 reference class 補成 Observed。

| 必查項目 | 必須取得的證據 |
| --- | --- |
| Lexical 與全部@lexical版本 | lockfile、runtime版本及重複套件檢查 |
| snapshot envelope／不可變revision | 儲存與讀取程式、兩版匿名化樣本、revision不變證據 |
| node registry與每種序列化欄位 | importJSON/exportJSON、節點版本、允許的巢狀 |
| persistent ID或可存sidecar的位置 | 建立／複製貼上／拆分／合併／刪除／重載與保存交易 |
| 既有readonly renderer | 樣式、表格span、collapse、Mermaid失敗、資產來源／歷史 |
| 歷史內容存取權 | API授權、跨文件拒絕、權限撤銷、404／403行為 |
| 版本挑選與非同步更新 | 可用配對規則、loading、過期回覆、切換中止 |
| 內容規模與支援設備 | 匿名化文件大小分布、語言、瀏覽器、實際渲染延遲 |

## 2. 先做一條完整路徑

選一份有代表性的公司匿名化文件與兩份固定revision，至少包含普通文字、一個table、一個特殊node。保持公司原JSON。提供 disposable editor factory 給 `compareSnapshots`；檢查每個 round-trip diagnostic，不以 re-export 清洗原始JSON。接入現有的歷史授權 API 與 readonly renderer；UI完整呈現版本、變動、限制及查證入口。

沒有可靠 ID 時，先展示「未能可靠配對」與完整前後內容。不要為了讓demo變漂亮而按index補相同ID。如果要啟用新版本ID，明確限定啟用後的歷史，並測保存、paste／split／merge／reload；舊歷史不強制回補。

## 3. 依差異調整，不重寫全部

- registry不同：實作對應adapter／欄位政策，保留原raw JSON，新增來源樣本與反例。
- frontend為React：沿用host renderer，重現功能檢核表中的布局、導覽、限制、焦點與閱讀記憶契約；不要照搬全域DOM IDs當React架構。
- API非同步：可使用 `createComparisonController`；loading／error時不可保留上一組可核准的假結果。驗證公司實際授權，控制器的revision核對不能取代授權。
- 媒體無不可變資產版本：只說保存資料相同／變動，不能說影像或影片內容已確認相同。
- node不能精準比較：保留完整前後容器與具體原因；不要靜默忽略它。
- 不同Lexical版本：先補相容性測試與診斷。不要以本套件的0.18測試推論新版可用。

## 4. 必交成果與決策

1. 產品盤點、精確來源與Unknown清單。
2. 本套件每項現有功能對應到產品實作或明確待補差異；填 FEATURE-CHECKLIST 與27條ACCEPTANCE，不只報test green。
3. 實際使用公司registry的匿名化JSON樣本，雙向比較／相同／失敗反例、輸入不變性、ID生命週期、權限與過期請求測試。
4. 實際畫面與操作紀錄：普通與複雜文件、長URL、表格、巢狀collapse、200%、鍵盤、切換保持閱讀位置。
5. Review缺陷、修正與重測；D/P與H/I分開。
6. Go／Adjust／Stop，以及每個未通過gate的原因、所需證據與下一個最小步驟。只有代表性真人任務能支持更好理解／更快的價值主張。

不要將公司來源、文件、tokens或權限資料上傳到此公開repo。公司內保存的fixture與證據用公司既有管道管理。
