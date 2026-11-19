import {plain,tokens,unknown,canonical} from './compare.js';
export function linkDestinationChanged(r){const urls=n=>n?[...(n.type==='link'?[n.url]:[]),...(n.children||[]).flatMap(urls)]:[];return canonical(urls(r.a))!==canonical(urls(r.b));}
export function linkChangeName(r){return linkDestinationChanged(r)?'連結目的地變更':'含連結段落變更';}
const clip=(value,n=36)=>{const a=Array.from(String(value||'').replace(/\s+/g,' ').trim());return a.length>n?a.slice(0,n).join('')+'…':a.join('');};
const typeName={image:'圖片',video:'影片',mermaid:'流程來源',table:'表格',quote:'引用',collapse:'收合內容',root:'文件'};
export function navigationLabel(r){
 const n=r.b||r.a,subject=n?.title||n?.caption||n?.alt||(n?.type==='table'?'表格結構與儲存格':plain(n))||typeName[n?.type]||n?.type||'內容';
 if(r.kind==='text'){
  const groups=[];let group=[];for(const p of tokens(plain(r.a),plain(r.b))){if(p.type==='same'){if(group.length){groups.push(group.join(' ')+(p.text.match(/^\s*(分鐘|小時|天|日|個|次)/)?.[0]||''));group=[];}}else group.push((p.type==='removed'?'−「':'＋「')+clip(p.text,18)+'」');}if(group.length)groups.push(group.join(' '));
  return groups.slice(0,3).join('；')+(groups.length>3?' · 另有變動':'');
 }
 if(r.kind==='table'){const rows=r.rows.filter(x=>x.status!=='same');return `${rows.length} 列變動 · ${rows.slice(0,2).map(x=>clip(plain((x.b||x.a).children[0]),16)).join('、')}${rows.length>2?'等':''}`;}
 if(r.kind==='link')return linkChangeName(r)+' · '+(plain(r.a)!==plain(r.b)?navigationLabel({...r,kind:'text'}):clip(subject,28));
 if(r.kind==='format')return '樣式調整 · '+clip(subject,28);
 if(['added','removed'].includes(r.kind))return (r.kind==='added'?'新增 · ':'刪除 · ')+clip(subject);
 return (r.changed?'資料變動 · ':'資料相同 · ')+clip(subject);
}
export const verificationCategories={
 whole:{label:'整區核對',help:'已知資料有變動，尚無可靠的逐項對應。',action:'展開前後內容'},
 media:{label:'媒體／流程待驗證',help:'只能比較保存資料，尚未確認媒體內容或流程語意。',action:'查看內容與來源'},
 unsupported:{label:'尚未支援',help:'有尚未支援的欄位或內容，請核對完整保存資料。',action:'查看保存資料'},
 pairing:{label:'未能可靠配對',help:'區塊身分不足，無法可靠指出哪一段對應哪一段。',action:'查看完整前後內容'}
};
export function verification(r){
 if(r.id==='document'&&/身分|識別|身份|ID/.test(r.reason||''))return 'pairing';
 if(unknown(r.a)||unknown(r.b)||r.id==='document')return 'unsupported';
 if(['image','video','mermaid'].includes((r.b||r.a)?.type)||r.needsReview||r.kind==='unverified')return 'media';
 return r.kind==='coarse'?'whole':null;
}
