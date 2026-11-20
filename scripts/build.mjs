import {execFileSync} from 'node:child_process';
import {cp, mkdir, readFile, writeFile, rm} from 'node:fs/promises';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const repository=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const output=resolve(repository,'dist');
if(resolve(process.cwd())!==repository || dirname(output)!==repository)throw new Error('BUILD_REQUIRES_REPOSITORY_ROOT');
// Only the verified generated-output directory is removed; source and fixtures are separate.
await rm(output,{recursive:true,force:true});
execFileSync(process.execPath,['node_modules/typescript/bin/tsc'],{stdio:'inherit'});
await cp('public','dist',{recursive:true});
const fixtures=await readFile('fixtures/scenarios.js','utf8');
await mkdir('dist/reference',{recursive:true});
await writeFile('dist/fixtures.js',fixtures);
await writeFile('dist/reference/scenarios.js',fixtures.replace("'./article-fixtures.js'","'../article-fixtures.js'"));
await cp('fixtures/article-fixtures.js','dist/article-fixtures.js');
for(const [name,target] of Object.entries({compare:'reference/engine',presentation:'presentation/changes',reading:'ui/reading','identity-contract':'reference/identity'}))await writeFile(`dist/${name}.js`,`// Generated compatibility entry. Edit src/, never dist/.\nexport * from './${target}.js';\n`);
await writeFile('dist/app.js',"// Generated browser entry.\nimport './reference/browser.js';\n");
