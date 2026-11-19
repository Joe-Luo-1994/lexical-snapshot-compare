# 擴充契約與 lint review

2026-11-20；reviewer：agent自行review，非獨立review。範圍：X1–X8契約、ESLint10、JS與新TS檔案架構保護、CI接線；完整TS遷移與設定resolver不在本次實作內。本階段總判定：**通過（限契約與lint機制）**，不能視為X1–X8全部能力已通過。

證據：npm run verify零lint warning，107/107 tests（原91＋16項lint正反例）；拒絕跨層static/re-export/dynamic/type import、require、未分類檔案、DOM、globalThis.fetch、亂數、參數寫入、UI環境flag、any、ts-ignore與inline-disable繞過；合法handler依contracts及adapter依Lexical通過。例外僅三條精確既有edge，不擴及新檔案。TS語法lint不是tsc；別名突變等語意不由此保證。

清理三個unused：app未使用import、tableDiff未使用index、CLI未輸出snapshot的解構變數；沒有設計變更。Windows Edge重載後實際定位release表格：支付授權15→60分鐘、全天→工作日與新增跨境服務仍正確，標頭與局部捲軸存在，無console error。[本輪畫面](../evidence/lint-table-regression.jpg)。本輪未重跑200%或所有互動；未改版面／閱讀邏輯，沿用81b22ea的[既有review](REVIEW.md)並保留其限制。

## X契約判定

| ID | 狀態 | 證據與剩餘工作 |
| --- | --- | --- |
| X1 | lint部分通過；遷移待驗證 | 依賴反例實際被拒；三條舊edge有移除條件 |
| X2 | lint部分通過；完整型別待驗證 | TS規則與純核心反例；tsc及alias mutation另需驗證 |
| X3 | 待驗證 | handler registry/conformance尚待實作 |
| X4 | lint部分通過；resolver待驗證 | 新UI讀process.env被拒；effective policy尚待實作 |
| X5 | 待驗證 | 尚未新增功能開關；不得宣稱停用fallback已實測 |
| X6 | 待驗證 | 契約已禁止略過；schema與host證據仍需補 |
| X7 | 待驗證 | 結構化code及投影抽離仍為TS遷移工作 |
| X8 | 待驗證 | Agent入口／契約／lint已交付；新增node接手演練未做 |

## 27條標準覆核

未改變的項目引用81b22ea既有證據，並非本輪重新全驗。下列「沿用」僅限原型P/D範圍；H/I未知維持未知。

| ID | 狀態 | 本輪依據 |
| --- | --- | --- |
| S1 | 通過P，I待驗 | 版本／controller未改；原測試通過 |
| S2 | 通過P | 未修改不確定性與範圍文案 |
| C1 | 通過P | 原91測試；表格畫面核對 |
| C2 | 通過P，I待驗 | 原欄位政策未改；新增契約禁止未知流失 |
| C3 | 通過P，I待驗 | 配對未改；原identity測試 |
| C4 | 通過P | 清理表格迴圈後實際舊新值核對 |
| C5 | 通過P，I待驗 | 媒體未改；沿用matrix反例 |
| C6 | 通過P，I待驗 | 原唯讀測試；新增靜態防線不取代host授權 |
| C7 | 通過P，I待驗 | 合成特殊node回歸通過 |
| U1 | 通過D/P，H待驗 | 畫面版本與任務層級維持 |
| U2 | 通過P，H待驗 | 本輪導覽抵達表格 |
| U3 | 通過P，H待驗 | 表格舊新值與上下文可見 |
| U4 | 通過P，H待驗 | 篩選未改；沿用既有證據 |
| U5 | 通過P，I待驗 | controller測試；未改復原邏輯 |
| U6 | 沿用限定P，I待驗 | 未改CSS／焦點；本輪未重測200% |
| U7 | 通過D/P，H待驗 | fallback未改，原案例通過 |
| V1 | 通過D，H待驗 | 本輪表格／側欄層級一致 |
| V2 | 通過D，H待驗 | 字體規則未改；密集表格文字可讀 |
| V3 | 通過D，H待驗 | 列欄對齊與局部捲動維持 |
| V4 | 沿用限定D/P | CSS未改，原對比證據；非完整WCAG |
| V5 | 通過D，H待驗 | 無新增UI元件；表格呈現一致 |
| V6 | 通過P，I待驗 | 複雜表格本輪走查；原壓力案例測試 |
| V7 | D紀錄完成，H待驗 | 本輪agent觀察；真人感受未知 |
| E1 | 待驗證H | 沒有新增真人試用 |
| E2 | 待驗證H | 不宣稱審查或維護效率提升 |
| E3 | lint切片通過P，擴充待驗證 | 107測試與CI接線；實際擴充演練仍待做 |
| E4 | 界線通過，I待驗 | host事實仍Unknown；契約明列未實作項 |

成本／總時間無完整統計。下一步依TS提案遷移並移除精確例外；實作開關時必補X5畫面與行為證據，不以本輪lint通過代替。
