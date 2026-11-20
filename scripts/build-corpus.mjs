import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {articleToLexical} from './article-to-lexical.mjs';
import {compareSnapshots} from '../dist/reference/index.js';
import {createReferenceEditor} from '../dist/reference/registry.js';
const root=new URL('../',import.meta.url),check=process.argv.includes('--check');
const read=p=>readFile(new URL(p,root),'utf8');
const save=async(p,data)=>{const text=typeof data==='string'?data:JSON.stringify(data,null,2)+'\n';if(check){if(await read(p)!==text)throw new Error('CORPUS_DRIFT:'+p);}else await writeFile(new URL(p,root),text);};
const sourceManifest=JSON.parse(await read('corpus/SOURCES.json'));
for(const s of sourceManifest.files){const bytes=await readFile(new URL('corpus/sources/'+s.file,root));if(createHash('sha256').update(bytes).digest('hex')!==s.sha256)throw new Error('SOURCE_HASH_MISMATCH:'+s.file);}
const preparation=[];
let tech=await read('corpus/sources/kubernetes-probes.md');
tech=tech.replace(/^---\n[\s\S]*?\n---\n/,'# Configure Liveness, Readiness and Startup Probes\n').replace(/<!--[^]*?-->/g,'');
for(const m of [...tech.matchAll(/\{\{% code_sample file="([^"]+)" %\}\}/g)])tech=tech.replace(m[0],'```yaml\n'+(await read('corpus/sources/'+m[1].split('/').at(-1))).trimEnd()+'\n```');
tech=tech.replace(/\{\{% heading "prerequisites" %\}\}/g,'Before you begin').replace(/\{\{% heading "whatsnext" %\}\}/g,"What's next");
tech=tech.replace(/\{\{< (note|caution) >\}\}([^]*?)\{\{< \/\1 >\}\}/g,(_,kind,body)=>('**'+kind+'**\n'+body.trim()).split('\n').map(line=>'> '+line).join('\n'));
tech=tech.replace(/\{\{[^\n]+\}\}/g,raw=>{preparation.push({type:'unresolved-website-template',source:raw});return '原文網站標記（未展開）：`'+raw+'`';});
const definitions=[
 {id:'article-tech',title:'技術文件 · Kubernetes 探針設定',text:tech,base:'https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/',source:'kubernetes-probes.md',task:'你正在審查一份操作指南修訂。請核對探針頻率、觀察時間、程式設定及 readiness 的適用期間是否一致。'},
 {id:'article-policy',title:'規範文件 · CNCF 社群行為準則',text:await read('corpus/sources/cncf-code-of-conduct-zh-tw.md'),base:'https://www.cncf.io/conduct/',source:'cncf-code-of-conduct-zh-tw.md',task:'你正在審查一份規範修訂。請核對回覆時限、保護條款、規範修訂權限及參考連結是否改變。'}
];
const scenarios=[],reports=[];
const plain=n=>n.type==='text'?n.text:(n.children||[]).map(plain).join('');
for(const d of definitions){
 const {json,warnings}=articleToLexical(d.text,d.base);if(d.id==='article-tech')warnings.push(...preparation);let count=0;
 function identify(n){if(!['text','linebreak','code-highlight'].includes(n.type))n.blockId=d.id+'-n'+String(++count).padStart(3,'0');for(const c of n.children||[])identify(c);}identify(json.root);
 const revised=structuredClone(json),answers=[];
 const all=n=>[n,...(n.children||[]).flatMap(all)];
 const change=(type,needle,before,after,label)=>{const matches=revised.root.children.filter(n=>n.type===type&&plain(n).includes(needle));if(matches.length!==1)throw new Error('AMBIGUOUS_TARGET:'+needle);const n=matches[0];const texts=all(n).filter(x=>x.type==='text'&&x.text.includes(before));if(texts.length!==1)throw new Error('AMBIGUOUS_TEXT:'+before);texts[0].text=texts[0].text.replace(before,after);answers.push({id:n.blockId,kind:type,before,after,label});};
 if(d.id==='article-tech'){
  change('paragraph','probe every 5 seconds','probe every 5 seconds','probe every 30 seconds','探針頻率5秒改30秒');
  change('code','name: liveness-exec','periodSeconds: 5','periodSeconds: 30','YAML探針頻率同步改30秒');
  change('paragraph','Within 30 seconds, view','30 seconds','90 seconds','觀察時間30秒改90秒');
  change('quote','Readiness probes run','during its whole lifecycle','only during startup','readiness適用期間被限縮；測試用錯誤修訂');
 }else{
  change('paragraph','對於在 Kubernetes 社群中發生的事件','三個工作天','十個工作天','回覆時限三天改十天');
  change('paragraph','依據 CNCF 章程','必須獲得技術監督委員會的批准','得由專案維護者自行核准','實質修訂核准權限改變');
  const list=revised.root.children.find(n=>n.type==='list'&&plain(n).includes('因某人舉報事件'));const removed=list.children.find(n=>plain(n).includes('因某人舉報事件'));list.children=list.children.filter(n=>n!==removed);answers.push({id:list.blockId,kind:'list',before:plain(removed),after:'',label:'刪除禁止報復條款'});
  const para=revised.root.children.find(n=>plain(n).includes('如需進一步瞭解本行為準則'));const link=all(para).find(n=>n.type==='link');const old=link.url;link.url='https://www.cncf.io/conduct/';answers.push({id:para.blockId,kind:'link',before:old,after:link.url,label:'FAQ目的地改為準則入口'});
 }
 function envelope(tree,revision,label){const editorState=structuredClone(tree),nodes={};const visit=(n,path)=>{if(n.blockId){nodes[path]=n.blockId;delete n.blockId;}for(const [i,c] of (n.children||[]).entries())visit(c,path+'/children/'+i);};visit(editorState.root,'/root');return {revision,label,savedAt:'2026-11-20 · 測試製作',editorState,identity:{version:1,namespace:'corpus:'+d.id,nodes},provenance:{sourceFile:d.source,revisionKind:revision==='source'?'public-source-transcription':'controlled-test-edit',notUpstreamHistory:true}};}
 const a=envelope(json,'source','公開原文轉錄'),b=envelope(revised,'exercise','測試用修訂（非上游版本）');
 await save('corpus/snapshots/'+d.id+'.a.json',a);await save('corpus/snapshots/'+d.id+'.b.json',b);await save('corpus/snapshots/'+d.id+'.answers.json',answers);
 const result=compareSnapshots(a,b,{createEditor:createReferenceEditor});if(result.status!=='ready')throw new Error('RUNTIME_NOT_CANONICAL:'+JSON.stringify(result.diagnostics));
 if(JSON.stringify(result.records.filter(r=>r.changed).map(r=>r.id).sort())!==JSON.stringify(answers.map(r=>r.id).sort()))throw new Error('ANSWER_MISMATCH:'+d.id);
 const context='公開文章轉錄與演練修訂 · 非原作者歷史版本 · 不可用作操作／規範依據';
 scenarios.push({id:d.id,title:d.title,documentTitle:d.title,group:'公開文章驗收',context,task:d.task,a:result.snapshots.a,b:result.snapshots.b,savedA:a,savedB:b,expected:{changedIds:answers.map(r=>r.id)},provenance:{...sourceManifest.files.find(s=>s.file===d.source),preparationWarnings:warnings}});
 reports.push({id:d.id,source:d.source,runtime:result.runtime,changedIds:answers.map(r=>r.id),warnings,bytes:{a:Buffer.byteLength(JSON.stringify(a)),b:Buffer.byteLength(JSON.stringify(b))},types:[...new Set(all(json.root).map(n=>n.type))]});
}
await save('fixtures/article-fixtures.js','// Generated by npm run corpus:build from pinned sources and real Lexical 0.18 JSON.\nexport const articleScenarios = '+JSON.stringify(scenarios,null,2)+';\n');
await save('corpus/runtime-report.json',reports);
console.log(JSON.stringify({check,articles:reports},null,2));
