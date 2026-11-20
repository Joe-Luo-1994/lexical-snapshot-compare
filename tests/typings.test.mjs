import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import ts from 'typescript';

// Compile in memory against the actual public TS entry; no ts-ignore/expect-error escapes.
function diagnostics(source) {
  const file=path.resolve('src/reference/__contract_probe__.ts');
  const options={strict:true,noEmit:true,skipLibCheck:true,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.NodeNext,moduleResolution:ts.ModuleResolutionKind.NodeNext};
  const host=ts.createCompilerHost(options),read=host.getSourceFile.bind(host);
  host.getSourceFile=(name,language,...rest)=>path.resolve(name)===file?ts.createSourceFile(name,source,language,true):read(name,language,...rest);
  return ts.getPreEmitDiagnostics(ts.createProgram([file],options,host)).filter(d=>d.file&&path.resolve(d.file.fileName)===file);
}
test('public types reject invalid payloads and readonly evidence writes',()=>{
 const errors=diagnostics(`import type {Finding,ChangeRecord,Policy} from './index.js';
 const bad: Finding={kind:'table',changed:true,reasonCode:'NONE',verification:null};
 declare const r: ChangeRecord; r.changed=false;
 const policy: Policy={tablePrecision:'ignore',mediaPreview:'off',viewModes:['flow'],download:'disabled'};
 void bad; void policy;`);
 assert.equal(errors.length,3,errors.map(d=>ts.flattenDiagnosticMessageText(d.messageText,' ')).join('\n'));
 assert.ok(errors.some(d=>d.code===2540));
});
test('public types accept an explicit handler and exhaustive finding projection',()=>{
 const errors=diagnostics(`import type {Finding,Handler} from './index.js';
 const handler: Handler={type:'example',nodeVersion:1,implementationVersion:'1',fields:[],supports:()=>true,compare:()=>({kind:'coarse',changed:true,reasonCode:'WHOLE_BLOCK',verification:'whole'})};
 function project(r: Finding): number {if(r.kind==='table')return r.rows.length;return r.changed?1:0;}
 void handler; void project;`);
 assert.equal(errors.length,0,errors.map(d=>ts.flattenDiagnosticMessageText(d.messageText,' ')).join('\n'));
});
