import {compareSnapshots} from './lexical-adapter.mjs';

// Host owns authorization and data retrieval. This guards stale replies, not access rights.
export function createComparisonController({loadSnapshot,createEditor,onState}){
 let generation=0,abort=null;
 return {
  async select(pair){
   const id=++generation;abort?.abort();abort=new AbortController();const signal=abort.signal;
   const selected={documentId:pair.documentId,baselineRevision:pair.baselineRevision,targetRevision:pair.targetRevision};
   if(Object.values(selected).some(v=>typeof v!=='string'||!v)){onState({kind:'error',pair:selected,message:'EXPLICIT_DOCUMENT_AND_REVISIONS_REQUIRED'});return;}
   onState({kind:'loading',pair:selected});
   try{
    const [a,b]=await Promise.all([selected.baselineRevision,selected.targetRevision].map(revision=>loadSnapshot({documentId:selected.documentId,revision,signal})));
    if(id!==generation)return;
    for(const [value,revision] of [[a,selected.baselineRevision],[b,selected.targetRevision]])if(value.documentId!==selected.documentId||value.revision!==revision)throw new Error('SNAPSHOT_IDENTITY_MISMATCH');
    const result=compareSnapshots(a,b,{createEditor});
    onState({kind:result.status==='failed'?'error':result.status,pair:selected,result});
   }catch(error){if(id===generation)onState({kind:'error',pair:selected,message:String(error.message||error)});}
  },
  dispose(){generation++;abort?.abort();}
 };
}
