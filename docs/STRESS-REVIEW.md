# 最後一輪：編輯壓力與主題驗收

2026-11-20；agent自行實作／review，基線01598c7。階段D/P；H真人理解、I公司整合仍待驗。固定比較版本、不回補舊歷史；本輪沒有擴大精準diff或虛構編輯歷程。

## 1. 到底依賴哪種ID？

**依賴持久的區塊身分，不使用Lexical runtime node key跨版本配對。** 本套件讀同一revision保存的identity sidecar，將ID加到比較副本，原始Lexical JSON不改寫。只有同版path定位，兩版配對靠ID。缺ID或重複ID退回完整核對；不同namespace拒絕比較。

[Lexical官方key說明](https://lexicaljs.org/docs/concepts/key-management)指出runtime keys不序列化、反序列化會重新建立。本輪另用已鎖定的**0.18實際parse**，證實同份JSON兩次解析的keys不同、JSON相同，sidecar則保持配對；不以最新版文件推論0.18功能。見 [editing-stress.test.mjs](../tests/editing-stress.test.mjs)。沒有引進新版本NodeState API。

穩定不是從內容算出一個每次相同的hash，而是建立身分後持續保存：

| 編輯動作 | 持久身分規則 | 本輪／公司證據 |
| --- | --- | --- |
| 新區塊／首次啟用 | host產生UUID；同namespace不得重複；只對啟用後歷史保證 | 真正0.18建立節點＋UUID範例測試；公司plugin未實作 |
| 修改文字／格式／同文件移位 | 保留原ID，更新本版path | 真正edit／append移位與sidecar保存測試 |
| 複製／貼上副本 | 新ID，包含所有有身分的子node；跨文件不能沿用對方namespace | 真正新副本＋freshSubtree參考測試；公司clipboard流程待驗 |
| 段落拆分 | 左側保留，右側新ID | 單純text run參考測試；公司rich text拆分待驗 |
| 合併 | 保留約定存活側ID；另一ID退休 | 單純text run參考測試；不可由結果宣稱還原split/merge操作 |
| 保存／重載 | JSON與sidecar同一immutable revision原子提交；重載以同版path將保存ID綁到新runtime keys | 本輪真的parse、重載重綁、再保存ID不變；公司交易待驗 |
| undo/redo／協作 | 身分狀態需隨相同history／協作交易還原，防止ID重用／並發衝突 | **Unknown**，公司必補，不能由隨機UUID代替 |

host可在活躍editor維持runtime-key→persistent-ID對照；runtime key只在當次editor使用。序列化時由同一EditorState捕捉原JSON及重新定位的sidecar，保存成功後才形成新revision。載入時必須先確認文件、namespace、revision、完整性，再由該bundle重建對照。另一方案是公司自訂node持久欄位，但必須實作clone/importJSON/exportJSON與全部編輯生命週期，不能直接把blockId塞進stock節點。

**不能自行保證的邊界**：如果host把舊sidecar套到新JSON，而且paths與ID格式仍合法，引擎沒有證據知道配錯；UUID只解決分配，不證明關聯正確。host必須以原子revision envelope、儲存完整性檢查／需要時的內容雜湊綁定與交易測試保證。不允許根據位置、文字相似度或每次保存重生ID來修補。所有這些是產品接入gate，並未完成公司驗證。

## 2. 插入、搬移與其他編輯

| 場景／獨立答案 | 結果 | 限制 |
| --- | --- | --- |
| 160條中間插入80條 | 恰80個新增，原160條same，moved=false；三preset一致 | 有可靠ID才能保證 |
| 將第101–140條放到第20條後，再改第118條 | moved=true，只有rule-117內容變更；義務必須→可以、30→7仍可讀 | moved只證明共同ID相對順序改變，不聲稱作者實際搬哪40條 |
| 純重排40條 | 0個內容變動＋1個順序核對提示；提供完整前後順序 | 尚無逐段「從第X移到第Y」導覽；原始順序仍需人工核對 |
| 500個相同段落刪指定一段 | 只刪正確ID，不錯配鄰段 | 文字完全相同仍不拿文字當ID |
| 複製與剪下重排 | 新ID→新增；保留ID換相對順序→順序變動 | 跨容器保守處理，不猜跨容器搬移 |
| 500段全刪／整份替換、反向比較 | 每個刪除／新增完整保留 | 整份重建ID本來就會新增／刪除，不自動猜相同 |
| 段內大量插字 | 保留完整原文／目標與義務修改，工作量上限仍有效 | 超出細分能力可整區核對 |
| 跨quote邊界、表格重排兼改數值 | 容器變動可見，表格不把數值指派給別的服務 | 複雜順序／結構可coarse |
| 否定、換行、NBSP、emoji、全形數字、Unicode組合字 | 原文逐份保留，不靜默正規化為相同 | 沒有宣稱語言學語意diff |
| 30組固定seed插入／刪除／改寫／旋轉順序 | 比對獨立編輯操作集合，全部一致 | 受控隨機測試不代表所有真實編輯 |
| 損壞／重複／缺ID、未知node與資源上限 | 原反例重跑，缺配對退回完整文件 | 有效但錯配的sidecar仍由host保證 |

新增21個編輯壓力測試，其中三preset×三大型情境、真正0.18解析／UUID生命週期、30組固定seed迴圈。原拆合／未知節點／特殊node／輸入上限測試保留。三個大型案例已放入UI選單，不需要讀test code才能試用。

## 3. Dark mode

原版沒有；本輪補上**明亮／深色／跟隨系統**。主題是呈現偏好，不是引擎功能開關，切換不重算report。預設跟隨prefers-color-scheme；手動選擇只在本頁保留，重新載入回到系統，不讀寫產品flags或storage。

所有元件顏色改用語意token，媒體原圖不反轉。正文、輔助字、增刪標記、表格、警告、原始碼、dialog、焦點均共用配色。新增3項theme測試保護兩主題文字／背景≥4.5:1、焦點對surface≥3:1，以及禁止新元件直接寫入不受主題管理的色碼（陰影透明色除外）。不宣稱完整WCAG認證。

## 實際體驗證據

- [深色搬移兼改義務](../evidence/stress-dark-move.jpg)：順序提示與唯一內容修改分開，原文／目標句意完整。
- [深色密集表格](../evidence/stress-dark-table.jpg)：刪線、±、欄位與舊新值可辨識，局部水平捲動。
- [明亮大量插入](../evidence/stress-light-insert.jpg)：第40/80項的完整新增附則，原有內容未誤標。
- [深色390px](../evidence/stress-dark-narrow.jpg)、[深色200%與鍵盤焦點](../evidence/stress-dark-200.jpg)：主題控制與文章可操作。
- [DOM測量](../evidence/stress-ui-measurements.json)：換主題前後record-new-39頂部均88.25px；完整順序面板各160段；窄版無全頁水平溢出；system移除強制theme並回復系統配色。瀏覽器無console error。沒有修改OS主題來測系統變更事件。
- [引擎量測](../evidence/stress-performance.json)：25次暖機樣本，插入p95約4.8ms、重排／修改約3.1ms，均低於預先設定250ms。DOM首次move畫面render-to-frame約59.8ms，非真人操作時間。

視覺結論（agent）：深色將內容放在較亮surface，警告使用低彩度背景，新增與刪除依文字標記和色彩共同辨識；窄版外觀選單與標題不互相遮擋。未取得真人舒適度或效率證據。

## 逐項Review

依REVIEW-TEMPLATE及27條ACCEPTANCE；沿用 [TypeScript Review](REVIEW-TYPESCRIPT.md) 的未變runtime、controller、特殊node契約，本輪對所有行為重跑verify並重走改動的主題／長文面。P通過不代表H或I通過。

| ID | 本輪判定與證據 |
| --- | --- |
| S1 | P通過：固定revision、反向比較、真實重載；公司API待驗 |
| S2 | P通過：內容／順序／unknown分開；純重排不顯示全無變更 |
| C1 | P通過：21項新編輯反例與原獨立答案 |
| C2 | P通過：原欄位政策未擴大；新增測資補齊stock0.18 textStyle預設 |
| C3 | P通過：重複段落、插入、重排、copy、ID缺失；host身分完整性待驗 |
| C4 | P通過：表格重排兼數值修改測試、深色表格實際畫面 |
| C5 | P通過：原媒體／未知契約重跑，主題不反轉或替換資產 |
| C6 | P通過／I待驗：input不變，主題不改report；host權限待驗 |
| C7 | P通過：原matrix加跨容器反例；公司schema待驗 |
| U1 | D/P通過：明示順序與內容數量、主題選單有名稱 |
| U2 | P通過：80項第40項、鍵盤Enter、正確焦點 |
| U3 | P通過：前後義務／期限、完整順序各160段 |
| U4 | P通過：原160段未因插入變成修改噪音；上下文可展開 |
| U5 | P通過：原狀態／復原測試保留；沒有新loading流程 |
| U6 | P通過：深色390px／200%、鍵盤焦點與局部表格捲動 |
| U7 | P通過：純順序完整對照、未知容器原fallback不變 |
| V1 | D/P通過：深色內容與輔助訊息層級一致 |
| V2 | D/P通過：規範長句、數值、密集表格實際查看 |
| V3 | D/P通過：舊新列欄與間距保留，主題切換位置不動 |
| V4 | D/P通過：兩主題對比測試、±／刪線、焦點 |
| V5 | D/P通過：色彩token涵蓋元件；媒體不做顏色反轉 |
| V6 | P通過：大量導覽、窄版、200%、長文切換不溢出 |
| V7 | D通過／H待驗：agent具體視覺觀察；真人舒適度未知 |
| E1 | H待驗：未邀代表reviewer無提示完成任務 |
| E2 | H待驗：計算延遲不等於審查更快 |
| E3 | P通過／I待驗：149測試、語意tokens、壓力預算；公司負載未知 |
| E4 | I待驗：公司ID交易、undo/redo、協作、registry仍Unknown |

X1–X8：P通過，未新增架構例外。X1/X2由lint/strict型別／純核心原測試守住；X3 handler未變；X4/X5三preset新壓力案例保留同一答案；X6無關閉身分或驗證的選項；X7主題僅CSS，閱讀位置不變；X8測資、維護交接與CI量測同步。H/I維護價值仍未知。

F01–F25沿用上一輪契約，全部原測試重跑；受影響F01/F02/F04/F07–F11/F18/F22/F23以本輪新增反例及畫面補充。新增F26主題、F27編輯壓力成為必要驗收；未知不是通過。

## 發現與收尾

新合成paragraph原本省略stock0.18的textStyle，真正runtime檢查回報partial；補齊測資的標準欄位後才符合ready，沒有放寬diagnostic。主題換色時短暫CSS transition不作最終截圖證據，等待下一次觀察確認穩定狀態；原始動畫不影響資料。未發現新增、重排、刪除或文字變更漏報。

總判定：D/P壓力切片通過，可供顧客試用。停止擴張演算法；公司接手優先證明ID保存交易與編輯生命週期，之後才決定是否值得補逐段搬移導覽。任意歷史的無ID資料仍採保守fallback，不將合成壓力成功宣稱為所有文章或協作編輯皆已驗證。
