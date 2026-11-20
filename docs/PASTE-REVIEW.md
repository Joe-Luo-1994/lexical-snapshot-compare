# v0.3 複製貼上與降級 Review

2026-11-20，agent自行實作與review；基線61b6d3e。D/P參考切片；H真人理解、I公司整合仍待驗。使用者確認新增ACCEPTANCE第8節P1–P4與F28；這是有授權的配對策略調整，不是降低未知內容標準。

## 結果與證據

| 案例 | 獨立預期與實際結果 | 畫面 |
| --- | --- | --- |
| P1 原樣整頁貼回 | 30個頂層區塊ID全換；完整保存內容／順序相同，0內容變更，註明身分重建。媒體／unknown另測仍未驗證 | [相同內容](../evidence/paste-identical.jpg) |
| P2 貼回後改一句 | 29個全文件唯一且完整相同的區塊建立內容對應；剩餘前後各1個完整核對，必須→無須可讀，不畫逐字差異 | [降級畫面](../evidence/paste-edit-downgrade.jpg) |
| P3 原文仍在、加副本 | 原30個共同ID保持；另30個新ID的完整副本仍是新增，沒有去重、沒有假搬移 | [DOM紀錄](../evidence/paste-ui-measurements.json) extra-status |
| P4 重複條款改一條 | 12對12整區核對；不依位置推定配對。30→7天及必須→無須留在原文中，0個逐字標記 | [重複條款](../evidence/paste-repeated.jpg) |

可操作入口：npm ci、npm run verify、npm start；UI情境選單最後的四種貼上演練。前三種沿用固定CNCF公開規範文章，受控B版不是上游修訂；第四種為刻意重複的合成條款。來源授權保留，不把原文當公司規範。

- **165/165測試**：原149項＋16項貼上／反例。三preset、反向、輸入不變、重複內容全文件唯一性、原ID優先、額外副本、格式／未知欄位不誤當相同、unknown／媒體相同仍未驗證、容器不亂配、缺ID／重複ID降級、深巢狀與真正Lexical0.18解析。
- [paste.test.mjs](../tests/paste.test.mjs) 驗證 `savedA/savedB` 原生JSON＋同版sidecar，parse/re-export ready，下載測資與UI比較投影結果一致。公司registry仍Unknown。
- [DOM紀錄](../evidence/paste-ui-measurements.json)：P2完整文字與0個逐字標記，交換後前後方向正確；P4保留12/12條款；390px內容寬375且scrollWidth375，鍵盤焦點為record-unpaired-content。瀏覽器console無error。
- [窄版鍵盤](../evidence/paste-narrow.jpg)：兩側改為垂直閱讀，原因與完整句意可見。明／暗主題均看過；本輪沒有重新執行200%或screen reader，沿用上一輪未變布局的200%證據，非宣稱本輪新測。
- [既有複雜文件效能](../evidence/paste-performance.json)：原1181/1176 nodes、25次暖機、原p95≤250ms預算通過。新增內容鍵不使用逐層字串轉義，避免深巢狀時中間字串膨脹。

## 設計與實作邊界

1. 有效共同ID優先，絕不因文字交換而改用內容錨點。缺ID、重複ID、未知root設定、跨namespace等原邊界保留。
2. 沒有共同ID且整份JSON內容及順序完全相同（僅忽略node blockId），可證明保存內容相同；這不是身分延續。不得忽略style、未知欄位、URL或容器結構。
3. 內容對應只接受兩側完整頂層列表都唯一、序列化內容完全相同的未配對區塊。不是在消耗掉ID配對後才計唯一性，避免重複文字被錯當唯一。沒有相似度閾值或位置猜測。
4. 偵測到內容對應／完全無共同ID後，兩側都剩餘的內容集合保留各自原始順序，集中一個未配對區域；不宣稱逐段對齊。只有一側剩餘則保留該側新增／刪除。完整文件入口始終可用。
5. 只保留部分共同ID、其餘沒有相同內容錨點的情況，仍按ID呈現新增／刪除；不能知道是替換還是刪後重貼。未實作文字相似度、跨容器推測或無ID歷史回補。
6. `moved`仍是共同ID相對順序改變；內容對應順序變化用`pairing.contentOrderChanged`，UI不會以內容零變更掩蓋順序核對。不是編輯操作紀錄。

API：report新增可選pairing（mode、exactMatches、unresolvedA/B、contentOrderChanged）；record新增可選pairingBasis（stable-id、exact-content、document-content、unpaired）。同側只存在的新增／刪除無雙側pairingBasis。whole-content equality的exactMatches是完整內容中區塊數，不代表重複區塊各自唯一。host必須讀mode；不能把所有exactMatches當身分配對。未配對區域reasonCode=IDENTITY_REBUILT，verification=pairing。現有ready僅代表runtime檢查就緒，不代表精準配對。

## 發現與修正

- 原整份替換測試要求500刪＋500增。兩版完全沒有共同ID時，這輪改為完整未配對區域；修正測試為核對兩側500個原區塊完整保留，沒有放棄內容保真。
- 新案例最初沿用舊sidecar但替換投影ID：補產生**已知受控編輯**的原生savedA/savedB，並真正解析下載版本驗證。不把fixture轉換當公司身分演算法。
- 全文相同原本仍顯示黃色警告與重複「1個未變區塊」：改中性身分說明、0內容變動，保留單一完整文件入口。
- 全新ID且唯一內容只重排時，不應顯示一般「沒有內容變更」成功空狀態；另顯示內容對應順序不同與完整順序入口，已有反例測試。
- 巢狀內容鍵改為先建結構再canonical一次，原contentKey的相鄰相同格式text-run正規化仍保留；新exactNodeKey不做該正規化，採更嚴格的內容錨點。22層容器回歸通過。

## 27條標準

依REVIEW-TEMPLATE逐項記錄。沿用前輪未變功能證據時，以本輪完整verify重跑守住邊界；P通過不等於H/I。

| ID | 判定與本輪證據／缺口 |
| --- | --- |
| S1 | P通過：版本標籤、交換方向；公司immutable API仍待驗 |
| S2 | P通過：身分重建／內容錨點／未配對明示；媒體未知保留 |
| C1 | P通過：P1–P4及原內容答案，不吃掉副本或義務修改 |
| C2 | P通過：exactNodeKey只忽略node blockId；未知欄位／格式反例 |
| C3 | P通過：ID優先、全文件唯一錨點、重複內容不按位置配對 |
| C4 | P通過：原表格／URL測試重跑，內容鍵涵蓋全部欄位 |
| C5 | P通過：媒體／unknown全文相同仍unverified |
| C6 | P通過／I待驗：原始JSON與輸入不變；host權限未知 |
| C7 | P通過：原特殊node matrix＋跨容器／深巢狀反例；公司schema未知 |
| U1 | D/P通過：原因、配對數、剩餘數及下一步入口可見 |
| U2 | P通過：未配對導覽、鍵盤抵達正確record |
| U3 | P通過：完整義務句意與12/12條款保留 |
| U4 | P通過：P2排除29個已知相同區塊；P1不製造整頁變動噪音 |
| U5 | P通過：原failed/partial控制器測試；降級不冒充解析失敗 |
| U6 | P通過（範圍限定）：390px／鍵盤新測；200%沿用上一輪布局證據 |
| U7 | P通過：明示左右不代表逐段配對，保留內容與raw入口 |
| V1 | D/P通過：相同內容用中性說明，需核對區域保留警示 |
| V2 | D/P通過：長句與重複條款仍按原節奏閱讀；沒有碎字假差異 |
| V3 | D/P通過：前後標籤、窄版垂直布局、完整未配對區域 |
| V4 | P通過：既有雙主題token／對比測試，沒有新硬編碼色彩 |
| V5 | D/P通過：降級卡片沿用正式fallback樣式，非debug堆疊 |
| V6 | P通過：P4密集條款、原長文與限制測試、窄版無水平溢出 |
| V7 | D通過／H待驗：agent記錄警示矛盾並修正；真人舒適度未驗 |
| E1 | H待驗：未做代表reviewer無提示任務 |
| E2 | H待驗：不宣稱真人更快或理解更好 |
| E3 | P通過／I待驗：分層pairing模組、165測試、效能；公司維護成本未知 |
| E4 | I待驗：公司儲存交易、undo/redo、協作與registry仍Unknown |

X1–X8：P通過。X1依賴方向無例外；X2 strict/readonly與輸入不變；X3 handler欄位規則未放寬；X4/X5三preset的P1–P4一致；X6沒有skipValidation或ignoreUnknown；X7配對依據及reasonCode結構化；X8公開API、指南、測資與契約同步。公司接手成效仍待驗。

F01–F27原功能測試全部重跑；F01/F02/F04/F14/F18/F21/F22/F27受本輪影響，以新反例、原生下載測資與畫面補充。新增F28及P1–P4為後續必驗，不刪除原驗收項目。

## 結論與下一步

D/P參考切片通過，可交顧客試用；H/I保持待驗。這輪不繼續加入模糊配對。公司接手須呈現pairing metadata，並完成ID保存、存取權與真實renderer證據；可合法但錯配的sidecar仍無法由比較器自行識破。下一步真人測P2能否理解「資料有變，但沒有可靠逐段對應」，不能用test green代替該證據。時間／成本沒有完整可靠紀錄，Unknown。
