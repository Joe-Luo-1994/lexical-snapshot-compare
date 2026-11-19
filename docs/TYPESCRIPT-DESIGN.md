# TypeScript 重構提案

2026-11-20；狀態：提案，未實作。目的：公司 Agent 新增 node 或開關時，可局部修改、知道影響及驗收方式；保留目前 reviewer 的閱讀能力與不誤導原則。依據目前 compare.js、presentation.js、app.js、runtime adapter、controller 與27條驗收標準。公司實際 registry、框架與 feature flag 服務仍 Unknown。

## 邊界與依賴

先維持單一 npm package，依目錄及 public exports 劃分：

```
src/contracts/             JSON、結果、診斷、設定與 host ports
src/core/                  配對、比較流程、限制、fallback（純函式）
src/handlers/              text、link、table、opaque 等策略
src/adapters/lexical018/   真正 parse / round-trip 檢查
src/application/           請求生命週期與比較 session
src/presentation/          結果投影、導覽、文案及閱讀 anchors
src/ui/                    參考 DOM renderer 與檢視狀態
src/reference/             明示為範例的 registry、設定與組裝
```

core只依賴contracts，不依賴Lexical、DOM、網路或公司flag服務；application組合ports，UI不回頭修改比較結果。dist改為生成輸出，停止手改。沿用現在介面，不同時改框架。先用strict TypeScript與runtime邊界驗證；外部JSON為unknown，驗證後才縮窄，未知欄位原樣保留。Readonly型別不等同深層runtime不可變，繼續測輸入不被修改。

## 擴充方式

使用Adapter隔離host資料、runtime與renderer；使用Strategy＋明確Registry選擇node比較器；使用可辨識聯集描述結果及session狀態。不採深層class繼承、全域service locator或自動掃描plugins。

每個handler宣告type／node version、欄位政策及支援條件；流程先驗輸入與身分，再分派策略。版本衝突／重複註冊在組裝時失敗，不以註冊順序決勝。跨type改變、未知欄位或不符合支援條件回到完整前後對照。handler結果為精準資料或結構化fallback要求；無renderer時也不可靜默漏項。可注入的handler是可信程式碼，不是安全沙箱。

新增特殊node通常涉及：專屬handler、renderer登錄（若需要）、測資與契約測試、顯式registry設定；不得要求修改配對演算法。未知子node的限制向上傳播到明確容器邊界。欄位只有在具有證據與測試時才可忽略，預設不忽略。

結果獨立描述：資料是否不同、可提供的比較精度、未驗證原因、原始證據引用、呈現payload。原因使用穩定code和參數，中文文案由presentation產生；禁止再用reason字串regex判斷分類。保存資料相同與媒體內容尚未驗證可同時成立；型別以discriminated unions限制非法payload組合。

## 開關語意

開關分成三種：

1. 精準比較策略：例如table為cells或whole-block。關閉精準策略仍顯示完整前後表格，保留變動與能力限制。
2. 呈現能力：split view、media preview、raw download。關預覽仍有來源與metadata；關下載仍保留可授權存取的證據入口。不能因此隱藏整塊內容。
3. 使用者檢視偏好：只看變動、顯示格式、展開上下文。只影響projection，不改immutable report；隱藏數量與未驗證項仍可找回。

唯讀、輸入驗證、原始資料保留、未知內容警告、可靠配對、資源上限是固定不變條件，不提供略過開關。host授權由server決定；UI旗標不等同授權。

建議設定用enum和明確preset，而不是散落boolean：table precision、media preview、allowed view modes、download availability。每個比較session開始解析一次requested config＋已註冊能力＋host政策，產生effective config與不可用原因；無效設定啟動失敗，不能偷偷忽略。policy變更會建立新session／重新比較，不在半份結果中熱切換。純view偏好可以即時切換並保留閱讀anchor。未來接遠端flags也只在組裝邊界注入resolved config。

每份report附engine版本、handler版本與effective policy識別，便於重現。config開關不更動輸入snapshot；能力縮減不得把原本應核對的內容變成「無變更」。

## 讓 Agent 能局部工作

每目錄短說明責任、依賴與禁止事項；public contracts及新增node範例是入口。提供handler conformance suite：新增／刪除／修改／相同、未知欄位、未知版本、缺ID、無renderer、停用策略、輸入不變。功能設定集中schema／defaults／相依性，不分散判斷。

測試層次：原有獨立答案與91測試；型別錯誤案例；handler契約；設定合法性與關鍵交互（不全枚舉2^N）；三個代表preset的公開文章與複雜文件；實際UI鍵盤、縮放、閱讀位置。migration對照舊新結果可找意外漂移，但舊實作不是oracle；已知誤導應以獨立答案修正。

## 分段遷移

1. 凍結現有行為與輸出契約，搬core與runtime到TS，維持外部API相容；dist由build產生。
2. 用text、link、table與opaque策略取代集中分支；錯誤與限制改為code；維持既有UI。
3. 加集中policy resolver；實作table precision、media preview與allowed modes三項開關，補關閉後fallback驗收。
4. UI／reading轉TS，明確拆report、projection與ViewState；完成真實文章＋複雜文件畫面回歸，再更新公司交接。

每步維持可啟動、可比較、可回歸；尚不增加monorepo、多個發佈包或通用plugin框架。TypeScript本身不證明更好維護，需以「新增一個node／關掉精準表格」演練實際改動範圍，並請公司開發者或Agent接手驗證。
