import {articleScenarios} from './article-fixtures.js';
// Synthetic Lexical 0.18-shaped snapshots. blockId is a proposed host adapter field.
export const text = (value, format=0) => ({type:'text',version:1,text:value,format,detail:0,mode:'normal',style:''});
const element = (type, children=[], extra={}) => ({type,version:1,children,direction:null,format:'',indent:0,...extra});
export const p = (id,value,extra={}) => element('paragraph',[text(value)],{blockId:id,...extra});
export const h = (id,value) => element('heading',[text(value)],{blockId:id,tag:'h2'});
export const clone = value => structuredClone(value);
export const doc = (children, revision='r12') => ({revision,label:revision==='r12'?'調整前':'調整後',savedAt:revision==='r12'?'2026-11-18 10:00':'2026-11-19 14:30',schema:'snapshot-demo-v1',editorState:{root:element('root',children)}});
export const cell = (id,value,extra={}) => element('tablecell',[p(`${id}-p`,value)],{blockId:id,headerState:0,colSpan:1,rowSpan:1,width:null,backgroundColor:null,...extra});
export const row = (id,values) => element('tablerow',values.map((v,i)=>cell(`${id}-${i}`,v)),{blockId:id,height:null});
export const table = (id,rows) => element('table',rows,{blockId:id});
export const special = (type,id,extra={}) => ({type,version:1,blockId:id,...extra});
export const container = (type,id,children,extra={}) => element(type,children,{blockId:id,...extra});
const before = [
 h('scope','文件適用範圍'),
 p('intro','本規範適用於正式環境的服務上線、備份與維運。請依服務等級確認承諾，並在上線前完成復原演練。'),
 h('backup-heading','備份與資料刪除'),
 p('retention','正式環境的備份應保留 30 天，並每日確認備份可讀取。'),
 p('approval','刪除前須經資料擁有人核准。'),
 p('backup-context','備份作業於每日凌晨執行。維運人員應保留執行紀錄；若備份失敗，請在交班前通知服務負責人並補做備份。'),
 h('sla-heading','服務等級與回應承諾'),
 table('sla',[row('head',['服務','首次回應','支援時段']),row('payment',['付款服務','4 小時','全天']),row('search',['搜尋服務','8 小時','工作日']),row('report',['報表服務','1 工作日','工作日'])]),
 h('ref-heading','操作依據'),
 element('paragraph',[text('上線前請閱讀 '),element('link',[text('正式環境操作手冊')],{url:'https://docs.example.com/production/runbook',rel:null,target:null,title:null}),text('，並確認操作對象。')],{blockId:'reference'}),
 h('rollback-heading','失敗處理'),
 p('rollback','部署失敗時必須回復至上一個穩定版本，並通知值班人員。'),
 p('end','完成處理後，請在交班紀錄留下原因、影響範圍與後續追蹤事項。')
];
before.find(n=>n.blockId==='sla').children[0].children.forEach(n=>n.headerState=1);
const edited = clone(before);
edited.find(n=>n.blockId==='retention').children[0].text='正式環境的備份應保留 7 天，並每日確認備份可讀取。';
edited.splice(edited.findIndex(n=>n.blockId==='approval'),1);
const t = edited.find(n=>n.blockId==='sla');
t.children[1].children[1].children[0].children[0].text='8 小時';
t.children[1].children[2].children[0].children[0].text='工作日';
t.children.splice(2,0,row('notify',['通知服務','2 小時','全天']));
edited.find(n=>n.blockId==='reference').children[1].url='https://docs.example.com/staging/runbook';
edited.find(n=>n.blockId==='rollback').children[0].text='部署失敗時可以回復至上一個穩定版本，並通知值班人員。';
export const scenarios=[];
function add(id,title,kicker,task,a,b, expected){scenarios.push({id,title,kicker,task,a:doc(a),b:doc(b,'r13'),expected});}
add('review','上線規範修訂','開始體驗','這次修訂改了哪些保留期限、服務承諾與操作依據？',before,edited,{changedIds:['retention','approval','sla','reference','rollback']});
add('C1','期限與核准條件','文字與刪除','備份要保留多久？資料刪除是否仍需核准？',before, before.map(n=>n.blockId==='retention'?p('retention','正式環境的備份應保留 7 天，並每日確認備份可讀取。'):clone(n)).filter(n=>n.blockId!=='approval'),{changedIds:['retention','approval']});
add('C2','服務承諾變更','表格','哪項服務的承諾改變？新增服務是否影響其他列？',before, before.map(n=>n.blockId==='sla'?clone(t):clone(n)),{changedIds:['sla']});
add('C3','操作依據變更','連結','手冊名稱沒有變，操作依據還是原來那一份嗎？',before,before.map(n=>n.blockId==='reference'?clone(edited.find(x=>x.blockId==='reference')):clone(n)),{changedIds:['reference']});
const noise=clone(before);
noise.find(n=>n.blockId==='rollback').children[0].text='部署失敗時可以回復至上一個穩定版本，並通知值班人員。';
noise.find(n=>n.blockId==='intro').children[0].format=1;
const moved=noise.splice(noise.findIndex(n=>n.blockId==='end'),1)[0];noise.splice(2,0,moved);
add('C4','整理中藏著規則變更','格式與位置','這次只是整理文件，還是改了處理規則？',before,noise,{changedIds:['intro','rollback'],moved:true});
const complexA=[h('process','部署與核准流程'),special('mermaid','diagram',{source:'flowchart LR\n  A[提出部署] --> B[主管核准]\n  B --> C[正式上線]'}),special('approvalWidget','widget',{policy:'雙人核准',owners:['維運','服務負責人']}),p('note','請在變更窗口內執行部署。')];
const complexB=clone(complexA);complexB[1].source='flowchart LR\n  A[提出部署] --> C[正式上線]';complexB[2].policy='單人核准';
add('C5','流程與未驗證內容','需要人工核對','哪些內容已改變？哪些仍需要人工確認？',complexA,complexB,{changedIds:['diagram','widget'],unverified:['diagram','widget']});
add('C0','沒有內容變更','相同版本內容','這兩版的文件內容是否有改變？',before,clone(before),{changedIds:[]});
const mediaA=[h('media-h','操作圖與教學影片'),special('image','screen',{src:'assets/screen-before.svg',alt:'正式環境操作截圖',caption:'執行前確認環境',assetVersion:'demo-image-v1'}),special('video','video',{src:'https://media.example.com/training-v1.mp4',title:'正式環境部署教學',assetVersion:'training-v1'})];
const mediaB=clone(mediaA);mediaB[1]={...mediaB[1],src:'assets/screen-after.svg',caption:'執行前確認目標服務',assetVersion:'demo-image-v2'};mediaB[2]={...mediaB[2],src:'https://media.example.com/training-v2.mp4',title:'新版部署教學',assetVersion:'training-v2'};
add('media','操作媒體被替換','圖片與影片','操作圖與教學影片還適用嗎？有哪些證據無法取得？',mediaA,mediaB,{changedIds:['screen','video']});
const mergedA=table('merged',[row('mh',['環境','核准條件','時段']),row('m1',['正式環境','雙人核准','夜間']),row('m2',['測試環境','單人核准','全天'])]);
const mergedB=clone(mergedA);mergedB.children[1].children[0].rowSpan=2;mergedB.children[2].children.shift();mergedB.children[2].children[0].children[0].children[0].text='無須核准';
add('merged','合併表格的適用範圍','結構需核對','合併儲存格後，核准規則適用在哪些環境？',[h('mh-title','環境核准條件'),mergedA],[h('mh-title','環境核准條件'),mergedB],{changedIds:['merged'],coarse:['merged']});
const nestedA=[h('nest-h','部署注意事項'),container('collapse','details',[container('quote','quote',[p('quoted','例外情況仍須取得主管核准。')]),mergedA,special('video','nested-video',{src:'https://media.example.com/retired.mp4',title:'舊版作業說明'})],{title:'進階規則與例外',collapsed:true}),p('outside','部署前請提前 2 天通知值班人員。')];
const nestedB=clone(nestedA);nestedB[1].children[0].children[0].children[0].text='例外情況可由值班人員自行決定。';nestedB[1].children[1]=mergedB;nestedB[2]=p('outside','部署前請提前 5 天通知值班人員。');
add('nested','收合內容裡的修改','巢狀內容','收起的進階規則改了什麼？外部通知期限是否也改了？',nestedA,nestedB,{changedIds:['details','outside'],coarse:['details']});
add('quote','引用變成正文','引用歸屬','文字相同，但它仍是引用內容嗎？',[h('qh','外部規範'),container('quote','q',[p('qp','上線前須完成風險評估。')])],[h('qh','外部規範'),p('q','上線前須完成風險評估。')],{changedIds:['q'],coarse:['q']});
// Expectations below are editorial requirements, independently specified before comparison.
const releaseA=[];
const sections=[
 ['scope','發布範圍與決策摘要','本次窗口涵蓋支付授權、訂單確認與退款排程。客服、帳務及值班團隊應使用同一份版本化操作計畫；演練記錄可作為參考，但不能取代本次變更窗口的核准。'],
 ['owners','值班分工與交接','事件指揮負責啟動或中止窗口，支付組負責路由切換，資料組核對重放佇列；客服依已確認的影響範圍更新公告。所有決策記錄使用 Asia/Taipei 時區，避免跨日交接誤判。'],
 ['checks','上線前檢查','確認流量鏡像、金鑰到期日、備份完整性與退款佇列均通過檢查。若任一項沒有可追溯的結果，保持原環境服務，並通知事件指揮重新安排窗口。'],
 ['sla','服務承諾與責任範圍','以下服務矩陣是值班與客服的共同依據。首次回應不是修復完成時間；支援時段只影響通知方式，不得解讀為可忽略資料一致性問題。'],
 ['cutover','切換窗口與監控','23:30 開始凍結設定，23:45 由支付組確認訂單基準量。00:00 逐步導入流量；每個階段應同時觀察成功率、重試率與帳務一致性，不能只看綠色儀表板。'],
 ['rollback','中止與復原條件','復原前先暫停非必要批次工作，保留事件時間軸與未完成交易清單。復原後仍須完成帳務抽查，不能以 HTTP 回應恢復正常作為事件結束的唯一依據。'],
 ['exceptions','例外核准與地區限制','例外只適用於表格明列的環境與區域。共同欄位跨列合併時，應確認核准條件是否真的涵蓋兩列；請勿把測試環境規則直接套用到正式環境。'],
 ['assets','操作依據與教學材料','操作圖用於確認執行對象，影片只提供教育訓練。值班人員仍須核對當次保存的文件版本；外部內容若無歷史副本，不能用現在看到的內容證明當時的操作步驟。'],
 ['retention','事件證據與保存政策','每次切換應保存請求識別碼、核准記錄、錯誤樣本與事件時間軸。匯出資料不得包含完整付款憑證；交班包應保留可追查的遮罩欄位。'],
 ['communication','客戶通知與事件公告','公告需區分已確認事實、調查中影響與下一次更新時間。客服不得把內部恢復預估當作對外承諾；若影響範圍擴大，須同步通知企業客戶窗口。'],
 ['reconcile','翌日對帳與結案','隔日 09:00 由帳務組核對授權、請款及退款總量。重複交易需逐筆追蹤，不能以總額相抵消結案；未完成事項必須留下負責角色、期限與事件連結。'],
 ['appendix','交接附件與檢查紀錄','本附件保存本次窗口的共同用語及查證路徑。範例識別碼皆為合成資料；真正上線前仍須由各角色確認自己的當班窗口、接手對象與可用權限。']
];
const checklist={
scope:['變更單 CHG-2026-1120 僅涵蓋新路由規則與退款排程參數，不包含資料庫 schema 遷移。商家後台與既有 API 回應格式維持原契約。','適用區域為台灣、日本與新加坡；各區域窗口以台北時間記錄，對外通知另附客戶當地時間。跨區交易以授權發生區域判定責任組。','本版審查須包含附錄與預設收合的例外規則。只核對文件摘要，不足以確認重複扣款處理與歷史證據保存政策。','核准後若再次修改上線門檻、核准方式或服務承諾，需重新標示修訂版本。不得沿用前一版的核准狀態直接開始窗口。','演練環境使用去識別化樣本；測試結果應附環境名稱與執行批次。沒有保存環境資訊的截圖，只能列為待補證據。'],
owners:['事件指揮：整合各組狀態，記錄切換、中止與結案決策；代理人只在交班確認完成後接手。群組內的口頭同意需補入事件紀錄。','支付組：維護路由比例與交易重試策略；切換前由另一位值班人員覆核環境與商家範圍。覆核人不得與執行人相同。','平台組：確認負載、憑證、連線池與監控資料是否完整；若監控缺頁或資料延遲，須明確說明不能觀察的服務範圍。','帳務組：核對授權、請款、退款及對帳批次。尚未完成的交易需以唯一識別碼列冊，不能只交付一個未清筆數。','客服與商家窗口：依事件指揮確認的影響範圍發出通知，保留公告版本與發送時間。交班時須說明下一次更新承諾。'],
checks:['備份檢查：資料組提供最近一次完整備份與增量備份的識別碼、完成時間及還原抽查結果。只有備份工作顯示成功，不能取代還原證據。','流量檢查：記錄過去七日同時段基準與當日峰值；若外部促銷已造成流量異常，重新評估是否仍能以原門檻判斷切換影響。','權限檢查：執行人確認正式環境唯讀查詢與受控切換權限可用；不在群組訊息貼上完整 token、金鑰或客戶付款資料。','佇列檢查：退款、重試及通知佇列分別記錄積壓量與最老訊息時間。不得將三種不同佇列加總後宣稱已恢復正常。','演練檢查：保留中止與復原流程的實際執行紀錄，列出當時與本次窗口不同的環境參數；不適用的證據需說明原因。'],
sla:['首次回應時間由事件被確認並派送至值班角色時起算；自動回覆不等於已接手。若通知服務故障，改用備援聯絡路徑並記錄時間。','復原目標用於內部協調，並非對外保證。對客戶的服務承諾仍以已確認的合約與公告為準，不能從此表自行推論。','跨境交易可能同時涉及付款區與清算區。第一線值班角色需先保留共同交易識別碼，再將事件交給對應區域，不得重複建立退款。','表格列被移除時，需確認服務真的停用或只是改名；沒有找到接手範圍前，不能將該列視為無須支援。','新增服務列的責任角色、監控入口與交班注意事項必須同時填寫。僅有服務名稱與回應時間，不足以供當班人員執行。'],
cutover:['23:30：事件指揮確認所有角色已報到；平台組凍結非必要設定。保留凍結前後版本識別碼與仍在執行的排程工作。','23:45：支付組核對舊路由交易基準；帳務組抽查最後一批已完成訂單。若基準資料缺失，窗口保持待命，不進入流量導入。','00:00：先導入少量流量並觀察交易成功率、逾時率與重試放大。任何跨區異常需分區記錄，不能只看全站平均。','00:15：確認付款結果與訂單狀態一致後再擴大比例。若第三方結果仍在回補，須保留等待名單，避免把暫態延遲當作失敗重送。','01:30：結束窗口前確認設定版本、待處理交易與交班負責人。尚未完成的對帳工作移交翌日清單，不能因窗口結束而直接結案。'],
rollback:['復原決策需同時考量交易一致性與服務可用性。單純切回路由不會撤銷已送出的第三方請款，也不能自動消除重複交易。','執行前保留目前路由版本、受影響商家範圍與最後成功交易時間；復原命令由第二位值班人員核對，再由執行人操作。','停止重放後保留佇列偏移量與訊息識別碼。重新啟動時先抽查冪等鍵，避免從錯誤位置重送已完成的扣款。','復原後至少觀察一個完整對帳週期；客服公告應區分已恢復服務與仍待處理的個別交易，不使用「全部恢復」掩蓋未清案件。','高風險例外保存在下方收合區域。其內容屬正式操作依據；標題相同不代表內部規則未修改，交班前仍須核對。'],
exceptions:['環境欄位若跨列合併，核准條件與時段的適用範圍可能改變。reviewer 應同時閱讀表格形狀與文字，而不是只核對文字清單。','第三方支付商的維護窗口不一定與本平台相同。遇到逾時時先確認上游公告及交易查詢結果，不能直接套用一般重試規則。','跨日批次的事件時間、營業日與清算日應分開記錄。台北時間跨日不代表所有區域已切換至新的營業日。','若當班主管無法取得聯繫，保留原狀並由事件指揮指定備援窗口。臨時聯絡方式只能補充通報，不能替代保存的核准紀錄。','例外核准在本次窗口結束後失效；下一次窗口需重新評估。歷史核准可作為背景，不能當作持續授權。'],
assets:['控制台截圖應包含環境與服務名稱，敏感交易資料應遮罩。圖中按鈕的位置可能隨產品更新，請以保存版本的操作依據為準。','教學影片不是不可變的歷史證據。同一網址可能被更新；只有來源網址而沒有資產版本時，應保留無法確認的標示。','操作手冊標題可能相同而目的地不同。執行前確認完整網址中的 production／staging、版本與區域參數，不只核對連結文字。','流程圖以保存來源為準，圖形渲染失敗時仍保留來源供核對。不同排版不應被解讀為流程邏輯改變。','外部文件或影片無法取得時，記錄缺失項目與接手角色；不得載入現行資產冒充本次核准稿的歷史內容。'],
retention:['事件證據應包含可追查但已遮罩的交易識別碼；禁止把完整卡號、憑證或秘密資料附在交班文件。截圖與匯出資料同樣適用。','保存期的起算點為事件結案時間；若事件重新開啟，需留下新的狀態與原因。不得以最後編輯文件時間覆蓋事件生命週期。','證據存放位置與存取角色需隨交班移交。文件能開啟，不代表連結的附件與影片仍有權限或仍保存相同內容。','清除前核對是否存在未完成的客訴、對帳或調查需求。刪除作業應留下清單與執行結果，不只保留排程成功訊息。','分析用統計與可追查的原始事件資料分開管理；去識別化是否足夠須由產品現行政策判定，不能由本比較原型自行推定。'],
communication:['初次公告包含已知影響、目前處理狀態及下一次更新時間。尚未確認的原因應標示調查中，不從單一錯誤訊息推論根因。','若影響跨區，只對已確認受影響的範圍發出對應通知。企業客戶的專屬窗口應取得同一個事件識別碼，避免資訊版本不一致。','每次更新保留前一版內容與發送時間。數字更正需說明更正項目，不悄悄改寫先前已發出的影響範圍。','客服若收到與監控不一致的回報，保留交易時間與遮罩識別碼交由支付組核對；不要要求客戶重複付款來驗證恢復。','公告頻率與核准方式保存在下方自訂區塊。此類資料的實際語意由產品 adapter 定義，原型只呈現保存資料與未驗證界線。'],
reconcile:['09:00 首次對帳分開列出已完成、結果未知、待退款與人工處理案件。各類筆數需能回查至明細，不以單一總數表示全部狀態。','09:30 帳務組與客服核對仍有對外承諾的案件。已修復服務但尚未處理完畢的退款，仍保留在追蹤清單。','重複扣款調查需比對冪等鍵、第三方交易識別碼與訂單狀態。不能僅依付款金額與時間接近，就把兩筆交易認為同一筆。','結案紀錄包含根因已知程度、修復版本、待辦負責角色與驗證入口。尚未確認的根因保留未知，不為結案而填入推測。','本次窗口的改進事項帶入下一版演練計畫；只有完成並有證據的項目才能標示已處理。交班完成不代表長期改善完成。'],
appendix:['共同用語：授權指上游接受付款請求，請款指後續資金流程，退款指獨立的反向交易。這些狀態不能在審查時互換使用。','查證順序：先確認文件版本與區域，再核對交易識別碼、事件時間和外部狀態；最後才判斷需要重試、等待或人工處理。','交班紀錄欄位：事件識別碼、當班角色、執行版本、已確認結果、尚待查證問題、下一步與預定更新時間。','附件清單：核准紀錄、備份還原證據、路由設定、監控截圖、對帳明細與客服公告。附件不存在時明示缺失，不能留下看似有效的空連結。','本文件為合成審查情境，角色與網址均為示意。它用來測試閱讀、差異辨識與保守降級，不提供實際支付平台的操作授權。']
};
for(const [id,title,body] of sections){releaseA.push(h('release-h-'+id,title),p('release-'+id,body));checklist[id].forEach((content,i)=>releaseA.push(p(`release-${id}-check-${i+1}`,content)));}
function insertAfter(id,...nodes){releaseA.splice(releaseA.findIndex(n=>n.blockId===id)+1,0,...nodes);}
const services=['支付授權','訂單確認','退款排程','電子發票','帳務對帳','會員驗證','風險評分','商家結算','通知派送','報表查詢','交易搜尋','優惠核銷'];
const serviceRows=[row('ops-head',['服務 / 區域','責任角色','首次回應','支援時段','復原目標','核准方式','監控依據','交班注意事項'])];
serviceRows[0].children.forEach(c=>c.headerState=1);
for(let i=0;i<36;i++)serviceRows.push(row('ops-'+i,[services[i%12]+' / '+['台灣','日本','新加坡'][Math.floor(i/12)],['支付組','平台組','帳務組'][i%3],i%3===0?'15 分鐘':'30 分鐘','全天',i%4===0?'60 分鐘':'120 分鐘','雙人確認','成功率、延遲與佇列積壓','需核對 '+services[i%12]+' 的事件記錄與重試結果；有差異時保留原始證據。']));
insertAfter('release-sla',table('ops-matrix',serviceRows));
insertAfter('release-cutover',p('release-threshold','連續 5 分鐘支付成功率低於 99.5% 時，必須中止切換並恢復原路由。'),special('mermaid','release-flow',{source:'flowchart TD\n  Freeze[凍結設定] --> Check[核對監控與備份]\n  Check --> Approve{事件指揮與支付組雙人核准}\n  Approve -->|通過| Canary[導入 5% 流量]\n  Canary --> Observe[觀察 15 分鐘]\n  Observe --> Expand[擴大到 50%]\n  Expand --> Full[切換全部流量]\n  Observe -->|異常| Rollback[回復原路由並保留證據]'}));
insertAfter('release-rollback',container('collapse','release-runbook',[p('runbook-intro','下列例外預設收合，仍屬本次審查範圍。'),container('quote','release-quote',[p('quote-rule','第三方支付回覆逾時時，除非已取得交易唯一識別碼，不得自動重送扣款。')]),container('collapse','release-inner',[p('release-inner-rule','佇列延遲超過 120 秒且持續 10 分鐘時，停止重放並通知帳務組。'),clone(mergedA),special('video','release-old-video',{src:'https://media.example.com/archived/payment-recovery-v7.mp4',title:'支付復原演練：舊版教學已無歷史副本'})],{title:'重放佇列與歷史演練證據',collapsed:true})],{title:'高風險例外：重複扣款與重放佇列',collapsed:true}));
const regionTable=clone(mergedA);regionTable.blockId='release-regions';insertAfter('release-exceptions',regionTable);
insertAfter('release-assets',special('image','release-screen',{src:'assets/screen-before.svg',alt:'付款服務路由切換控制台（合成示意）',caption:'執行前須核對正式環境與目標服務',assetVersion:'console-v12'}),element('paragraph',[text('當班請依照「'),element('link',[text('支付平台正式切換操作手冊')],{url:'https://docs.example.com/platform/payments/production/cutover/2026-11-20?region=tw&window=2330-0130&revision=approved-v12&checklist=authorization-reconciliation-and-duplicate-payment-prevention',rel:null,target:null,title:null}),text('」執行，網址中的環境與版本也屬審查範圍。')],{blockId:'release-link'}));
insertAfter('release-retention',p('release-days','事件原始證據應保存 180 天；已去識別化的統計資料可另依分析政策保存。'),p('release-delete-approval','刪除事件原始證據前，須取得資料擁有人與帳務組雙方核准。'));
insertAfter('release-communication',special('approvalWidget','release-unknown',{policy:'重大事件公告須經事件指揮核准',audiences:['企業客戶','客服值班'],deadlineMinutes:30}));
const releaseB=clone(releaseA),findRelease=id=>releaseB.find(n=>n.blockId===id);
findRelease('release-threshold').children[0].text='連續 10 分鐘支付成功率低於 98.5% 時，可以中止切換並恢復原路由。';
findRelease('release-days').children[0].text='事件原始證據應保存 30 天；已去識別化的統計資料可另依分析政策保存。';
releaseB.splice(releaseB.findIndex(n=>n.blockId==='release-delete-approval'),1);
const dense=findRelease('ops-matrix');dense.children[1].children[2].children[0].children[0].text='60 分鐘';dense.children[1].children[3].children[0].children[0].text='工作日 09:00–18:00';dense.children.splice(18,0,row('ops-new',['跨境爭議處理 / 日本','帳務組','4 小時','工作日','次一工作日','事件指揮確認','爭議案件數與待補證據','窗口結束後仍需保留客服與商家通知的對應記錄。']));dense.children.splice(dense.children.findIndex(n=>n.blockId==='ops-25'),1);
findRelease('release-flow').source=findRelease('release-flow').source.replace('Check --> Approve{事件指揮與支付組雙人核准}\n  Approve -->|通過| Canary','Check --> Canary');
findRelease('release-runbook').children[1].children[0].children[0].text='第三方支付回覆逾時時，可自動重送扣款。';findRelease('release-runbook').children[2].children[0].children[0].text='佇列延遲超過 300 秒且持續 20 分鐘時，停止重放並通知帳務組。';
findRelease('release-regions').children=clone(mergedB.children);
Object.assign(findRelease('release-screen'),{src:'assets/screen-after.svg',caption:'改由服務群組執行路由切換',assetVersion:'console-v13'});
findRelease('release-link').children[1].url=findRelease('release-link').children[1].url.replace('/production/','/staging/').replace('approved-v12','draft-v13');
findRelease('release-unknown').deadlineMinutes=60;
findRelease('release-owners').children[0].format=1;
add('release','檔期上線計畫 · 完整審查','複雜文件','你是今晚的發布審查者。請確認上線門檻、服務承諾、重複扣款處理與證據保存是否被放寬；哪些內容仍不能確認？',releaseA,releaseB,{changedIds:['ops-matrix','release-threshold','release-flow','release-runbook','release-regions','release-screen','release-link','release-days','release-delete-approval','release-unknown','release-owners']});
const release=scenarios.at(-1);release.documentTitle='支付平台檔期上線與復原計畫';release.context='發布審查 · CHG-2026-1120 · 台灣／日本／新加坡 · 23:30–01:30（Asia/Taipei）';release.a.label='跨組核准稿';release.b.label='窗口前修訂稿';release.a.savedAt='2026-11-18 16:40';release.b.savedAt='2026-11-19 21:15';scenarios.splice(scenarios.indexOf(release),1);scenarios.unshift(release);
// UI regression matrix: actual JSON -> same engine -> actual renderer, no mocked result.
const matrixNodes=[clone(mediaA[1]),clone(mediaA[2]),clone(mergedB),clone(complexA[1]),container('quote','matrix-quote',[p('mq','例外仍須經事件指揮核准。')]),clone(nestedA[1])];
for(const [i,node] of matrixNodes.entries())for(const operation of ['added','removed','modified','same']){const n=clone(node),changed=clone(n);if(changed.children)changed.children.push(p('matrix-extra','新增例外：夜間窗口須由當班主管覆核。'));else if(changed.type==='mermaid')changed.source+='\n B --> D[人工覆核]';else changed[changed.type==='image'?'caption':'title']='夜間窗口操作依據（新版）';if(changed.type==='table'){changed.children=clone(mergedA.children);}
 const id=`matrix-${i}-${operation}`,a=operation==='added'?[]:[n],b=operation==='removed'?[]:[operation==='modified'?changed:clone(n)];add(id,`${['圖片','影片','合併表格','流程來源','引用','收合區塊'][i]} · ${{added:'新增',removed:'刪除',modified:'修改',same:'相同'}[operation]}`,'驗收案例','核對區塊的身分、前後內容與比較界線。',[h('matrix-heading','操作依據與核准規則'),...a],[h('matrix-heading','操作依據與核准規則'),...b],{changedIds:operation==='same'?[]:[n.blockId]});scenarios.at(-1).group='特殊內容驗收';}
export const defaultScenario = articleScenarios[0];
// Recoverable failure story: incomplete persisted input must never look like no changes.
const broken={id:'incomplete',title:'資料不完整的版本',kicker:'比較未完成',task:'版本資料不完整時，系統是否仍讓你以為已完成比較？',a:doc(before),b:{revision:'r13',label:'內容尚未取得',savedAt:'2026-11-19 14:30',schema:'snapshot-demo-v1',editorState:null},expected:{error:true}};
scenarios.push(broken);
function counterexample(id,title,a,b,changedIds){add(id,title,'邊界案例','請核對已知資料差異，以及系統仍無法證明的內容。',a,b,{changedIds});scenarios.at(-1).group='邊界與故障驗收';}
const externalImage=special('image','external-image',{src:'https://media.example.com/live/console.png',alt:'當前操作畫面',caption:'共用網址，沒有歷史資產版本'});
counterexample('edge-media-same','媒體同網址 · 歷史不可證明',[externalImage],[clone(externalImage)],[]);
counterexample('edge-image-alt','圖片只改替代文字',[externalImage],[{...externalImage,alt:'測試環境操作畫面'}],['external-image']);
const poster=special('video','poster',{src:'https://media.example.com/training.mp4',title:'值班教學',poster:'https://media.example.com/poster-v1.jpg'});
counterexample('edge-video-poster','影片只改封面來源',[poster],[{...poster,poster:'https://media.example.com/poster-v2.jpg'}],['poster']);
counterexample('edge-mermaid-invalid','流程來源錯誤 · 不假造預覽',[special('mermaid','m',{source:'flowchart LR\n A[提案]-->B[核准]'})],[special('mermaid','m',{source:'flowchart LR\n A[提案 --> ??? invalid'})],['m']);
counterexample('edge-quote-exception','引用刪除例外條件',[container('quote','eq',[p('eqp','維護窗口可暫停通知；但付款異常仍須即時通報。')])],[container('quote','eq',[p('eqp','維護窗口可暫停通知。')])],['eq']);
const boldA=p('bold-rule','備份保留 180 天。'),boldB=p('bold-rule','備份保留 30 天。');boldA.children[0].format=1;boldB.children[0].format=1;counterexample('edge-bold-text','粗體規則的數字修改',[boldA],[boldB],['bold-rule']);
const rootUnknown=doc([p('unknown-root','文件方向尚未支援')]);rootUnknown.editorState.root.direction='rtl';scenarios.push({id:'edge-root',title:'文件設定未支援 · 相同仍須核對',group:'邊界與故障驗收',task:'保存資料相同，是否代表所有內容都已驗證？',a:rootUnknown,b:clone(rootUnknown),expected:{changedIds:[]}});
const malformed=doc([table('invalid-span',[row('ir',['正式環境','須核准'])])]);malformed.editorState.root.children[0].children[0].children[0].rowSpan=2;scenarios.push({id:'edge-invalid-table',title:'合併表格資料損壞',group:'邊界與故障驗收',task:'合併範圍超出資料時，是否清楚表示比較失敗？',a:malformed,b:clone(malformed),expected:{error:true}});

scenarios.unshift(...articleScenarios);
