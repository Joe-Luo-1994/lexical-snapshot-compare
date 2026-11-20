import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../public/styles.css',import.meta.url),'utf8');
const theme=selector=>Object.fromEntries([...css.match(selector)[1].matchAll(/--theme-([\w-]+):#([\da-f]{6})/g)].map(m=>[m[1],m[2]]));
const light=theme(/:root\{color-scheme:light;([^}]+)\}/),dark=theme(/:root\[data-theme="dark"\]\{color-scheme:dark;([^}]+)\}/);
const luminance=h=>{const c=h.match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722};
const ratio=(a,b)=>(Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);
for(const [name,palette] of Object.entries({light,dark}))test(name+' theme text and diff/background pairs meet 4.5:1',()=>{
 for(const [fg,bg] of [['ink','surface'],['muted','canvas'],['muted','subtle'],['accent','accent-soft'],['add-ink','add-fill'],['delete-ink','delete-fill'],['warn-ink','warn-fill'],['surface','accent']])assert.ok(ratio(palette[fg],palette[bg])>=4.5,`${name} ${fg}/${bg}: ${ratio(palette[fg],palette[bg])}`);
 assert.ok(ratio(palette.focus,palette.surface)>=3);
});
test('theme tokens cover all component colors and system mode is explicit',()=>{
 assert.deepEqual(Object.keys(light).sort(),Object.keys(dark).sort());
 assert.match(css,/@media\(prefers-color-scheme:dark\)/);
 const components=css.replace(/:root\{color-scheme:light;[^}]*\}/,'').replace(/:root\[data-theme="dark"\]\{[^}]*\}/,'').replace(/@media\(prefers-color-scheme:dark\)\{[^}]+\}\}/,'');
 assert.equal((components.match(/#[\da-f]{3,6}\b/g)||[]).length,0,'new component color must use semantic theme token');
});
