# 公開可攜版本 Review

後續擴充契約與lint機制的範圍、107項測試及畫面回歸見 [REVIEW-LINT.md](REVIEW-LINT.md)。本頁保留81b22ea交付當時的91項證據，不混算為已完成TS重寫。

日期：2026-11-20。Reviewer：實作 agent 自行尋找反例與操作走查，**不是獨立或真人 review**。範圍：本目錄 v0.1.0、兩篇公開原文的受控修訂＋45組合成情境。結論：可以作為公司接入候選與真人試用；不宣稱已可上線、優於現有方式或公司 custom nodes 已相容。

## 本輪發現與修正

真實 CNCF 段落把三個工作天改成十個工作天，原版只因段落含連結就標「連結變更」，會讓 reviewer 追錯重點。現在區分「含連結段落變更」與「連結目的地變更」，前者導覽呈現三→十；加入回歸測試。程式碼與清單採原生 Lexical node，修改時完整前後閱讀，不假裝逐行／逐項精準。

實際 0.18 runtime 還證明 table-cell 某些 format 在再序列化時可能丟失。本套件保留原始 JSON，回報 RUNTIME_ROUNDTRIP_CHANGED；不把 runtime 輸出拿來消除差異。這是 reference registry 的反例，不是公司問題診斷。

## 證據入口

- `npm run verify`：來源SHA與再生物一致；**91/91 tests**。包括47組情境、identity、原始資料保留、runtime、非同步競態、navigation分類等；不是91位使用者或91份公司文件。
- 獨立安裝：從 Git archive 解壓後 `npm ci --ignore-scripts` 與verify皆通過；GitHub Linux clean checkout 的 Node22／24亦通過verify、CLI smoke與效能預算。可查 [CI紀錄](https://github.com/Joe-Luo-1994/lexical-snapshot-compare/actions/workflows/verify.yml)。
- [Runtime report](../corpus/runtime-report.json)：技術文章 A/B各347個真正 Lexical nodes；規範文章133→131個。四份皆 parse 成功、re-export無差異。Kubernetes四個未展開網站標記保留警示，不能宣稱完全複製網站。
- CLI：policy A/B以reference registry比較，exit0、ready；不存在registry與malformed等錯誤有測試；partial exit3／failed exit2，見CLI與runtime tests。ready不代表所有內容都精準。
- `node tests/measure.mjs`：Node22.21.1，合成長文A1181/B1176nodes，25次；p50 14.52ms、p95 15.68ms，預設預算250ms。純比較核心，不含host網路、runtime建立、渲染或人類審查時間。
- Windows Edge實際操作：寬版2514×1234及1232×1226附近、390×844 viewport、原生200%下616×613。畫面證據：以下連結。不同截圖可有不同viewport，不以拼接圖當操作紀錄。
- [技術文章入口](../evidence/article-tech-entry.jpg)、[完整 YAML 舊新](../evidence/article-tech-code.jpg)、[規範條款刪除](../evidence/article-policy-entry.jpg)、[期限與完整URL](../evidence/article-policy-deadline.jpg)、[390px閱讀](../evidence/article-policy-narrow.jpg)、[長表格](../evidence/release-table.jpg)、[200%鍵盤焦點](../evidence/release-200-keyboard.jpg)。
- policy第2項切換連續→前後，卡片top維持87.97px。200% release第3項以Enter導覽，焦點在正確卡片；切模式前88.85px、後89.07px，沒有跳到起點。完整表格在模式切換後兩份各38列，展開保留。水平捲動與細節記憶實作沿用reading.js，host需重驗。
- browser console觀察無error。無完整screen-reader測試或WCAG認證。

## 全部27條標準

「通過(P/D)」僅對本輪界線；產品整合、真人理解與價值仍分別待驗。功能逐項可接受／不可接受見 [F01–F25](FEATURE-CHECKLIST.md)。

| ID | 本輪判定 | 證據與保留事項 |
| --- | --- | --- |
| S1 | 通過P；I待驗 | 明示A/B與受控修訂；controller拒絕revision不符及過期回覆；host任選版本UI待接 |
| S2 | 通過P | 四類限制保留；ready與每區塊精準度不同，文件已說明 |
| C1 | 通過P | 獨立answers、91測試、三→十與權限刪改、技術5→30核對 |
| C2 | 通過P；I待驗 | compare欄位政策與未知欄位反例；runtime丟欄位不抹除原始證據 |
| C3 | 通過P；I待驗 | 重複／缺ID／namespace／插列tests；公司複製拆合ID生命週期待驗 |
| C4 | 通過P | release列欄與長URL；policy目的地與文字變更已分開 |
| C5 | 通過P；I待驗 | 媒體來源／描述／相同URL仍未驗證的合成tests；資產內容未驗 |
| C6 | 通過P；I待驗 | immutable、URL／未知欄位反例；reference不執行HTML/Mermaid；公司授權待驗 |
| C7 | 通過P；I待驗 | 特殊node新增刪除修改相同matrix；全部是合成schema，非host registry |
| U1 | 通過D/P；H待驗 | 首屏A/B、任務、4項變更及範圍可見 |
| U2 | 通過P；H待驗 | 具體值導覽、實際點擊與Enter，焦點在正確條款 |
| U3 | 通過P；H待驗 | 刪除禁報復條款仍在A；完整句子、YAML前後及展開入口 |
| U4 | 通過P；H待驗 | 格式／未變內容控制、合成分類tests；整體限制獨立呈現 |
| U5 | 通過P；I待驗 | failed/partial/ready與controller loading/競態/拒絕/取消tests；host UI狀態待驗 |
| U6 | 通過限定P；I待驗 | 390px、200%核心按鈕可操作；Enter定位與焦點；完整輔具支援未知 |
| U7 | 通過D/P；H待驗 | YAML/list/quote整區核對可讀、保留舊新；未知schema仍需熟悉者核對 |
| V1 | 通過D；H待驗 | 標題→版本→摘要→導覽／正文層級；警示不覆蓋原文 |
| V2 | 通過D；H待驗 | 繁中規範、英文長文與YAML可讀；程式碼採保留空白並可換行，非語法高亮 |
| V3 | 通過D；H待驗 | A/B標籤同組；大表格局部捲動；窄屏堆疊仍保方向 |
| V4 | 通過限定D/P | 核心色對比見下；非全頁每個狀態的WCAG稽核；未做真人色覺驗證 |
| V5 | 通過D；H待驗 | 連結誤標修正；一般與fallback共用卡片與文案層級 |
| V6 | 通過P；I待驗 | 真實長度文章、長URL、38列、200%、91反例；公司大型文件仍待量測 |
| V7 | D紀錄完成；H待驗 | agent觀察為層級一致、舊新分組可讀；沒有真人感受資料 |
| E1 | 待驗H | 尚無未參與設計的reviewer無提示任務證據 |
| E2 | 待驗H | 沒有與目前方法的平衡比較；不宣稱省時或提升正確率 |
| E3 | 通過P；I待驗 | 純核心／runtime／controller分離、大小上限與預算；host設備分布未知 |
| E4 | 界線通過；I待驗 | host無存取權，所有公司registry/render/權限事實皆Unknown；conditional接入指引 |

核心色對比（依styles.css指定的sRGB色計算）：正文#24343b／白12.89:1；次要字#57676e／#f3f5f7為5.38:1；新增7.48:1、刪除6.15:1、警示6.59:1、主要按鈕7.02:1。新增／刪除另有文字、符號與方向標籤。未進行完整灰階／色覺模擬稽核，V4的完整產品證據仍需host補充。

## 公司接手與真人試用

先依 [AGENT-HANDOFF](AGENT-HANDOFF.md) 做一份真實匿名化JSON的最小切片，再驗最難custom node與歷史資產。既有歷史可不提供精準比較，不能捏造ID補救。UI範例使用預先驗證的資料投影；實際runtime解析在可呼叫API／CLI／離線corpus檢查，不宣稱瀏覽器內載入了Lexical registry。

顧客試用任務：不先看answers，指出CNCF時限、被刪保護條款、權限與目的地四項變更；技術文章核對文字與YAML探針值、觀察時間與readiness適用期間；指出仍不能精準判斷的部分。記錄錯誤、求助與主觀閱讀感受，不只問喜不喜歡。

本次agent總耗時與成本未有完整可取得統計，標Unknown。後續改動須更新此review及F01–F25，涉及renderer／reading時重新做真實畫面走查。
