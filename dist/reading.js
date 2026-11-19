// Ephemeral view state only. Snapshot data is never written.
export function readingMemory(root){
 let anchor=null,paused=false,intentUntil=0,stamp=0;
 const states=new Map();
 const lastTable=new Map();
 const readingTop=()=>document.querySelector('.review-toolbar').offsetHeight+24;
 const cards=()=>[...root.querySelectorAll('[data-record]')];
 function observe(){if(paused||performance.now()>intentUntil)return;const candidates=cards().filter(n=>{const r=n.getBoundingClientRect();return r.bottom>readingTop()&&r.top<innerHeight-140;});if(candidates.length){const n=candidates[0];anchor={id:n.dataset.record,offset:Math.min(readingTop(),n.getBoundingClientRect().top)};}}
 const intent=()=>{intentUntil=performance.now()+700;};
 window.addEventListener('wheel',intent,{passive:true});window.addEventListener('touchmove',intent,{passive:true});window.addEventListener('keydown',e=>{if(['PageDown','PageUp','ArrowDown','ArrowUp','Home','End',' '].includes(e.key))intent();});
 window.addEventListener('pointerdown',e=>{if(e.target===document.documentElement)intent();else intentUntil=0;},true);
 window.addEventListener('scroll',observe,{passive:true});
 root.addEventListener('focusin',e=>{if(paused)return;const n=e.target.closest('[data-record]');if(n){anchor={id:n.dataset.record,offset:Math.min(readingTop(),n.getBoundingClientRect().top)};if(e.target.classList.contains('table-scroll'))lastTable.set(n.dataset.record,e.target.dataset.viewKey);}});
 root.addEventListener('scroll',e=>{if(!paused&&performance.now()<=intentUntil&&e.target.classList?.contains('table-scroll'))lastTable.set(e.target.closest('[data-record]').dataset.record,e.target.dataset.viewKey);},true);
 function keys(){for(const card of cards()){
  for(const scope of card.querySelectorAll('[data-snapshot]'))for(const selector of ['details','.table-scroll'])scope.querySelectorAll(selector).forEach((n,i)=>n.dataset.viewKey=card.dataset.record+'|'+scope.dataset.snapshot+'|'+selector+'|'+i);
  for(const selector of ['details','.table-scroll'])[...card.querySelectorAll(selector)].filter(n=>!n.closest('[data-snapshot]')).forEach((n,i)=>n.dataset.viewKey=card.dataset.record+'|shared|'+selector+'|'+i);
 }}
 function capture(){keys();stamp++;for(const n of root.querySelectorAll('[data-view-key]')){const row=n.classList.contains('table-scroll')?[...n.querySelectorAll('tr[data-row]')].find(r=>r.getBoundingClientRect().bottom>n.getBoundingClientRect().top+60):null;states.set(n.dataset.viewKey,{stamp,open:n.open,top:n.scrollTop,left:n.scrollLeft,row:row?.dataset.row,rowOffset:row?row.getBoundingClientRect().top-n.getBoundingClientRect().top:0});}paused=true;return {anchor:anchor&&{...anchor},focus:document.activeElement?.dataset.viewKey,summary:document.activeElement?.tagName==='SUMMARY'?document.activeElement.parentElement.dataset.viewKey:null};}
 function restore(saved){keys();for(const n of root.querySelectorAll('[data-view-key]')){let s=states.get(n.dataset.viewKey);if((!s||s.stamp!==stamp)&&n.classList.contains('table-scroll')){const id=n.closest('[data-record]').dataset.record;const preferred=states.get(lastTable.get(id));s=(preferred?.stamp===stamp?preferred:null)||[...states].find(([k,v])=>k.startsWith(id+'|')&&k.includes('.table-scroll')&&v.stamp===stamp)?.[1]||s;}if(s){if(n.tagName==='DETAILS')n.open=s.open;n.scrollTop=s.top;n.scrollLeft=s.left;const row=s.row?[...n.querySelectorAll('tr[data-row]')].find(r=>r.dataset.row===s.row):null;if(row)n.scrollTop+=row.getBoundingClientRect().top-n.getBoundingClientRect().top-s.rowOffset;}}
  if(saved?.anchor){const card=cards().find(n=>n.dataset.record===saved.anchor.id);if(card){const offset=Math.max(-Math.max(0,card.offsetHeight-100),saved.anchor.offset);window.scrollBy({top:card.getBoundingClientRect().top-offset,behavior:'instant'});anchor={id:saved.anchor.id,offset};card.focus({preventScroll:true});}}
  const target=[...root.querySelectorAll('[data-view-key]')].find(n=>n.dataset.viewKey===(saved?.focus||saved?.summary));if(target)(saved.summary?target.querySelector('summary'):target)?.focus({preventScroll:true});
  paused=false;intentUntil=0;return saved?.anchor?.id;
 }
 return {capture,restore,select(id){anchor={id,offset:readingTop()};},reset(){anchor=null;states.clear();lastTable.clear();paused=false;},forgetDetails(){for(const [k] of states)if(k.startsWith('context|'))states.delete(k);}};
}
