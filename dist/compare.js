// Pure read-only comparison. Never materializes a merged editor state.
export const LIMITS={nodes:12000,depth:32,text:240000,inlineCells:60000};
const base=['type','version','blockId'];
const element=['children','direction','format','indent'];
const fields={root:[...element],paragraph:[...element,'textFormat','textStyle'],heading:[...element,'tag'],text:['text','format','detail','mode','style'],linebreak:[],link:[...element,'url','rel','target','title'],quote:element,collapse:[...element,'title','collapsed'],table:[...element,'colWidths'],tablerow:[...element,'height'],tablecell:[...element,'headerState','colSpan','rowSpan','width','backgroundColor'],image:['src','alt','caption','assetVersion'],video:['src','title','poster','assetVersion'],mermaid:['source'],list:[...element,'listType','start','tag'],listitem:[...element,'value','checked'],code:[...element,'language'], 'code-highlight':['text','format','detail','mode','style','highlightType']};
export function canonical(x){if(Array.isArray(x))return '['+x.map(canonical).join(',')+']';if(x&&typeof x==='object')return '{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}';return JSON.stringify(x);}
export function contentKey(n){if(!n||typeof n!=='object')return canonical(n);const c={};for(const [k,v] of Object.entries(n)){if(k==='blockId')continue;if(k==='children'){const merged=[];for(const child of v){const prev=merged.at(-1);if(child.type==='text'&&prev?.type==='text'&&shallow(child,['text'])===shallow(prev,['text']))prev.text+=child.text;else merged.push({...child});}c[k]=merged.map(contentKey);}else c[k]=v;}return canonical(c);}
export function plain(n){if(!n)return '';if(['text','code-highlight'].includes(n.type))return n.text;if(n.type==='linebreak')return '\n';return (n.children||[]).map(plain).join('');}
export function unknown(n){if(!n)return false;const allowed=fields[n.type];const unsupportedPresentation=(n.direction!=null&&n.direction!=='ltr')||(n.indent??0)!==0||(n.type!=='text'&&n.format!==undefined&&n.format!=='')||(n.style??'')!==''||(n.textStyle??'')!==''||(n.textFormat??0)!==0||(n.type==='text'&&((n.format||0)>127||n.mode!=='normal'||n.detail!==0))||(n.type==='link'&&[n.rel,n.target,n.title].some(v=>v!=null))||(n.backgroundColor!=null)||(n.colWidths!=null)||(n.width!=null)||(n.height!=null);return (n.type==='list'&&!['number','bullet'].includes(n.listType))||(n.type==='listitem'&&n.checked!==undefined)||unsupportedPresentation||!allowed||n.version!==1||Object.keys(n).some(k=>!base.includes(k)&&!allowed.includes(k))||(n.children||[]).some(unknown);}
export function validate(snapshot){
 let size;try{size=JSON.stringify(snapshot).length;}catch{throw new Error('文件無法讀取，資料結構不完整。');}if(size>2000000)throw new Error('文件超出此原型的比較範圍。');
 const root=snapshot?.editorState?.root;
 if(!root||root.type!=='root'||!Array.isArray(root.children))throw new Error('無法讀取這份文件：缺少完整的文件內容。');
 let nodes=0,length=0;
 function visit(n,depth){if(!n||typeof n!=='object'||Array.isArray(n)||typeof n.type!=='string')throw new Error('文件包含無效區塊，尚未開始比較。');if(++nodes>LIMITS.nodes||depth>LIMITS.depth)throw new Error('文件超出此原型的比較範圍，請使用較小的版本對。');
 if(n.children!==undefined&&!Array.isArray(n.children))throw new Error('區塊內容格式不完整。');
 if(['root','paragraph','heading','link','quote','collapse','table','tablerow','tablecell','list','listitem','code'].includes(n.type)&&!Array.isArray(n.children))throw new Error('容器區塊缺少內容。');
 if(n.type==='table'&&n.children.some(c=>c.type!=='tablerow'))throw new Error('表格列結構不完整。');
 if(n.type==='tablerow'&&n.children.some(c=>c.type!=='tablecell'))throw new Error('表格儲存格結構不完整。');
 if(n.type==='tablecell'&&[n.rowSpan??1,n.colSpan??1].some(v=>!Number.isInteger(v)||v<1||v>100))throw new Error('表格合併範圍無法可靠顯示。');
 if(['text','code-highlight'].includes(n.type)&&typeof n.text!=='string')throw new Error('文字區塊缺少有效文字。');
 length+=typeof n.text==='string'?n.text.length:0;if(length>LIMITS.text)throw new Error('文件文字超出此原型的比較範圍。');
 for(const child of n.children||[])visit(child,depth+1);
 }visit(root,0);
 function checkGrid(n){if(n.type==='table'&&n.children.length){const grid=Array.from({length:n.children.length},()=>[]);let width=0,slots=0;for(let y=0;y<n.children.length;y++){let x=0;for(const c of n.children[y].children){while(grid[y][x])x++;const rs=c.rowSpan??1,cs=c.colSpan??1;if(y+rs>grid.length)throw new Error('表格合併範圍超出保存的列，無法可靠顯示。');for(let dy=0;dy<rs;dy++)for(let dx=0;dx<cs;dx++){if(++slots>60000)throw new Error('表格展開範圍過大，超出此原型的比較範圍。');if(grid[y+dy][x+dx])throw new Error('表格合併範圍重疊，無法可靠顯示。');grid[y+dy][x+dx]=true;}x+=cs;}width=Math.max(width,grid[y].length);}if(grid.some(r=>r.length!==width||Array.from({length:width},(_,i)=>!r[i]).some(Boolean)))throw new Error('表格列寬或合併結構不完整，無法可靠顯示。');}for(const c of n.children||[])checkGrid(c);}checkGrid(root);return root;
}
function identity(nodes){const ids=nodes.map(n=>n.blockId);return ids.every(id=>typeof id==='string'&&id.length>0)&&new Set(ids).size===ids.length;}
function shallow(n,omit=[]){return canonical(Object.fromEntries(Object.entries(n).filter(([k])=>k!=='blockId'&&!omit.includes(k))));}
function simpleText(n){return n?.children?.every(c=>c.type==='text'&&c.mode==='normal'&&c.detail===0&&c.style==='')&&n.children.every(c=>c.format===n.children[0]?.format);}
function spans(n){return n.children.every(r=>r.type==='tablerow'&&r.children.every(c=>c.type==='tablecell'&&(c.colSpan??1)===1&&(c.rowSpan??1)===1));}
export function tableChanges(a,b){
 if(!spans(a)||!spans(b)||!identity(a.children)||!identity(b.children)||shallow(a,['children'])!==shallow(b,['children']))return null;
 const width=a.children[0]?.children.length;
 if(!width||![...a.children,...b.children].every(r=>r.children.length===width&&identity(r.children)))return null;
 const am=new Map(a.children.map(r=>[r.blockId,r]));
 const commonA=a.children.filter(r=>b.children.some(x=>x.blockId===r.blockId)).map(r=>r.blockId).join('|');
 const commonB=b.children.filter(r=>am.has(r.blockId)).map(r=>r.blockId).join('|');if(commonA!==commonB)return null;
 const rows=[],bm=new Map(b.children.map(r=>[r.blockId,r]));
 const order=b.children.map(r=>r.blockId);
 for(let i=0;i<a.children.length;i++){const old=a.children[i];if(bm.has(old.blockId))continue;let previous=i-1;while(previous>=0&&!order.includes(a.children[previous].blockId))previous--;order.splice(previous>=0?order.indexOf(a.children[previous].blockId)+1:0,0,old.blockId);}
 for(const id of order){const r=bm.get(id),old=am.get(id);if(!r){rows.push({id,status:'removed',a:old,b:null});continue;}if(!old){rows.push({id:r.blockId,status:'added',a:null,b:r});continue;}
 if(shallow(old,['children'])!==shallow(r,['children'])||old.children.some((c,i)=>c.blockId!==r.children[i].blockId))return null;
 const cells=[];for(let i=0;i<r.children.length;i++){const x=old.children[i],y=r.children[i];if(shallow(x,['children'])!==shallow(y,['children'])||x.children.length!==1||y.children.length!==1||x.children[0].type!=='paragraph'||y.children[0].type!=='paragraph'||!simpleText(x.children[0])||!simpleText(y.children[0])||[...x.children[0].children,...y.children[0].children].some(t=>t.format!==0))return null;cells.push({a:x,b:y,changed:contentKey(x)!==contentKey(y)});}
 rows.push({id:r.blockId,status:cells.some(c=>c.changed)?'modified':'same',a:old,b:r,cells});
 }return rows;
}
function classify(a,b){
 const equal=contentKey(a)===contentKey(b),uncertain=unknown(a)||unknown(b);
 if(uncertain)return {kind:'unverified',changed:!equal,reason:equal?'保存資料相同，但此區塊的語意尚未驗證。':'此區塊含有尚未支援的內容；資料已變動，請核對前後內容。'};
 if(!a||!b){const containsOpaque=n=>['image','video','mermaid'].includes(n.type)||(n.children||[]).some(containsOpaque);const needsReview=containsOpaque(a||b);return {kind:a?'removed':'added',changed:true,needsReview,reason:needsReview?'已確認區塊的新增或刪除；其中媒體或流程的內容仍需人工核對。':''};}
 if(['image','video'].includes(a.type)||['image','video'].includes(b.type))return {kind:equal?'unverified':'coarse',changed:!equal,reason:equal?'保存資料相同；外部媒體內容仍無法僅憑網址確認。':'媒體來源或描述已變動；不代表已驗證影像或影片內的細節。'};
 const hasMedia=n=>n&&(['image','video','mermaid'].includes(n.type)||(n.children||[]).some(hasMedia));
 if(equal&&(hasMedia(a)||hasMedia(b)))return {kind:'unverified',changed:false,reason:'保存資料相同，但媒體或流程的預覽與語意仍未驗證。請核對來源。'};
 if(equal)return {kind:'same',changed:false,reason:''};
 if(a.type!==b.type)return {kind:'coarse',changed:true,reason:'區塊結構已改變，保留完整前後內容供核對。'};
 if(a.type==='table'){const rows=tableChanges(a,b);if(rows)return {kind:'table',rows,changed:true,reason:''};return {kind:'coarse',changed:true,reason:'表格結構或合併範圍改變，無法可靠對齊儲存格。請核對兩份完整表格。'};}
 if(['paragraph','heading'].includes(a.type)&&simpleText(a)&&simpleText(b)&&shallow(a,['children'])===shallow(b,['children'])){
 const af=a.children[0]?.format||0,bf=b.children[0]?.format||0;
 if(af!==bf)return {kind:plain(a)===plain(b)?'format':'coarse',changed:true,reason:'文字格式已改變，請對照前後樣式。'};
 return {kind:'text',changed:true,reason:''};
 }
 if(a.type==='paragraph'&&a.children.some(n=>n.type==='link')&&b.children.some(n=>n.type==='link'))return {kind:'link',changed:true,reason:'連結或其內容已變動；目的地列在文字下方。'};
 return {kind:'coarse',changed:true,reason:a.type==='collapse'?'收合內容或其設定已改變，展開後查看完整前後內容。':a.type==='mermaid'?'流程來源已變動；此原型未驗證圖形語意，請核對來源。':'此區塊已有變動，請核對完整前後內容。'};
}
export function compare(a,b){
 const ar=validate(a),br=validate(b);
 if(shallow(ar,['children'])!==shallow(br,['children']))return {records:[{id:'document',a:ar,b:br,kind:'unverified',changed:true,section:'文件內容',reason:'文件層級設定已改變，請核對完整保存資料與內容。'}],moved:false};
 if(unknown(ar)||unknown(br)){
 // Root metadata needs its own boundary; child unknowns are handled locally.
 const rootKnown=n=>!unknown({...n,children:[]});
 if(!rootKnown(ar)||!rootKnown(br))return {records:[{id:'document',a:ar,b:br,kind:'unverified',changed:contentKey(ar)!==contentKey(br),section:'文件內容',reason:'文件層級資料尚未支援，請核對完整前後內容。'}],moved:false};
 }
 if(!identity(ar.children)||!identity(br.children))return {records:[{id:'document',a:ar,b:br,kind:'unverified',changed:contentKey(ar)!==contentKey(br),section:'文件內容',reason:'區塊缺少唯一且穩定的識別資料，無法可靠配對；請核對完整前後內容。'}],moved:false};
 const am=new Map(ar.children.map(n=>[n.blockId,n])),bm=new Map(br.children.map(n=>[n.blockId,n]));
 const ca=ar.children.filter(n=>bm.has(n.blockId)).map(n=>n.blockId),cb=br.children.filter(n=>am.has(n.blockId)).map(n=>n.blockId);
 const moved=ca.join('|')!==cb.join('|');let section='文件內容';const records=[];
 // Preserve removed content near its preceding surviving block rather than append it out of context.
 const order=br.children.map(n=>n.blockId);
 for(let i=0;i<ar.children.length;i++){const id=ar.children[i].blockId;if(bm.has(id))continue;let previous=i-1;while(previous>=0&&!order.includes(ar.children[previous].blockId))previous--;const at=previous>=0?order.indexOf(ar.children[previous].blockId)+1:0;order.splice(at,0,id);}
 for(const id of order){const x=am.get(id)||null,y=bm.get(id)||null;if((y||x).type==='heading')section=plain(y||x);records.push({id,a:x,b:y,section,...classify(x,y)});}
 return {records,moved};
}
export function tokens(a,b){
 // Keep numeric values intact: 180→30 must not read as 18→3 followed by an unchanged 0.
 const split=s=>s.split(/(\d+(?:[.,]\d+)*(?:%)?)/u).filter(Boolean).flatMap(part=>/^\d/.test(part)?[part]:typeof Intl.Segmenter==='function'?[...new Intl.Segmenter('zh-Hant',{granularity:'grapheme'}).segment(part)].map(x=>x.segment):Array.from(part));
 const x=split(a),y=split(b);if(x.length*y.length>LIMITS.inlineCells)return [{type:'removed',text:a},{type:'added',text:b}];
 const dp=Array.from({length:x.length+1},()=>new Uint32Array(y.length+1));for(let i=x.length-1;i>=0;i--)for(let j=y.length-1;j>=0;j--)dp[i][j]=x[i]===y[j]?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]);
 const out=[];function push(type,text){if(out.at(-1)?.type===type)out.at(-1).text+=text;else out.push({type,text});}
 let i=0,j=0;while(i<x.length||j<y.length){if(i<x.length&&j<y.length&&x[i]===y[j]){push('same',x[i++]);j++;}else if(i<x.length&&(j===y.length||dp[i+1][j]>=dp[i][j+1]))push('removed',x[i++]);else push('added',y[j++]);}return out;
}
