import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {compareSnapshots} from '../src/index.mjs';
import {createReferenceEditor} from '../src/reference-registry.mjs';
const [aPath,bPath,...flags]=process.argv.slice(2);
if(!aPath||!bPath){console.error('Usage: npm run compare -- a.json b.json [--registry ./host-registry.mjs]');process.exitCode=2;}
else {
 try{let createEditor=createReferenceEditor;if(flags.length){if(flags.length!==2||flags[0]!=='--registry')throw new Error('UNKNOWN_ARGUMENT');const module=await import(pathToFileURL(resolve(flags[1])));if(typeof module.createEditor!=='function')throw new Error('Registry module must export createEditor(onError)');createEditor=module.createEditor;}
 const result=compareSnapshots(await readFile(aPath,'utf8'),await readFile(bPath,'utf8'),{createEditor});
 const {snapshots:_snapshots,...report}=result;console.log(JSON.stringify(report,null,2));process.exitCode=result.status==='failed'?2:result.status==='partial'?3:0;
 }catch(error){console.error(error.message);process.exitCode=2;}
}
