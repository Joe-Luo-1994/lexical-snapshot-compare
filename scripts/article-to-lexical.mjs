// Corpus preparation ONLY. Production comparison consumes saved JSON, not Markdown.
import {fromMarkdown} from 'mdast-util-from-markdown';
import {gfm} from 'micromark-extension-gfm';
import {gfmFromMarkdown} from 'mdast-util-gfm';
import {$createParagraphNode,$createTextNode,$createLineBreakNode,$getRoot} from 'lexical';
import {$createHeadingNode,$createQuoteNode} from '@lexical/rich-text';
import {$createLinkNode} from '@lexical/link';
import {$createListNode,$createListItemNode} from '@lexical/list';
import {$createCodeNode} from '@lexical/code';
import {$createTableNode,$createTableRowNode,$createTableCellNode} from '@lexical/table';
import {createReferenceEditor} from '../src/reference-registry.mjs';

export function articleToLexical(markdown,baseURL){
 const tree=fromMarkdown(markdown,{extensions:[gfm()],mdastExtensions:[gfmFromMarkdown()]}),warnings=[];
 const definitions=new Map(tree.children.filter(n=>n.type==='definition').map(n=>[n.identifier,n]));
 const inline=(nodes,formats=[])=>nodes.flatMap(n=>{
  if(n.type==='text'||n.type==='inlineCode'){const x=$createTextNode(n.value);for(const f of [...formats,...(n.type==='inlineCode'?['code']:[])])x.toggleFormat(f);return [x];}
  if(['strong','emphasis','delete'].includes(n.type))return inline(n.children,[...formats,{strong:'bold',emphasis:'italic',delete:'strikethrough'}[n.type]]);
  if(n.type==='break')return [$createLineBreakNode()];
  if(n.type==='link'||n.type==='linkReference'){const def=n.type==='link'?n:definitions.get(n.identifier);if(!def)throw new Error('MISSING_REFERENCE:'+n.identifier);return [$createLinkNode(new URL(def.url,baseURL).href).append(...inline(n.children,formats))];}
  warnings.push({type:n.type,line:n.position.start.line});return [$createTextNode(markdown.slice(n.position.start.offset,n.position.end.offset))];
 });
 const blocks=nodes=>nodes.filter(n=>n.type!=='definition').map(n=>{
  if(n.type==='heading')return $createHeadingNode('h'+n.depth).append(...inline(n.children));
  if(n.type==='paragraph')return $createParagraphNode().append(...inline(n.children));
  if(n.type==='blockquote')return $createQuoteNode().append(...blocks(n.children));
  if(n.type==='code')return $createCodeNode(n.lang||undefined).append($createTextNode(n.value));
  if(n.type==='list'){const list=$createListNode(n.ordered?'number':'bullet',n.start||1);for(const item of n.children){const li=$createListItemNode();for(const child of item.children)li.append(...(child.type==='paragraph'?inline(child.children):blocks([child])));list.append(li);}return list;}
  if(n.type==='table'){const t=$createTableNode();n.children.forEach((row,ri)=>{const r=$createTableRowNode();row.children.forEach(cell=>r.append($createTableCellNode(ri===0?1:0).append($createParagraphNode().append(...inline(cell.children)))));t.append(r);});return t;}
  warnings.push({type:n.type,line:n.position.start.line});return $createParagraphNode().append($createTextNode(markdown.slice(n.position.start.offset,n.position.end.offset)));
 });
 const editor=createReferenceEditor();editor.update(()=>{$getRoot().append(...blocks(tree.children));},{discrete:true});
 const json=editor.getEditorState().toJSON();const reopened=createReferenceEditor().parseEditorState(JSON.stringify(json)).toJSON();
 return {json:reopened,warnings};
}
