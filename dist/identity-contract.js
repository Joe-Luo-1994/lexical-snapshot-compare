// Reference lifecycle contract for newly created snapshots; not a Lexical plugin.
// Runtime node keys are deliberately never used. Host adoption must bind these
// semantics to actual create/paste/split/merge transactions and persisted fields.
export function freshSubtree(node, allocate){
 const copy=structuredClone(node);
 function visit(n){if(n.type!=='text'&&n.type!=='linebreak')n.blockId=allocate();else delete n.blockId;for(const c of n.children||[])visit(c);}
 visit(copy);return copy;
}
export function splitParagraph(node, offset, allocate){
 if(node.type!=='paragraph'||node.children.length!==1||node.children[0].type!=='text')throw new Error('Reference split supports one text run only');
 const a=structuredClone(node),b=freshSubtree(node,allocate);const text=node.children[0].text;
 if(!Number.isInteger(offset)||offset<0||offset>text.length)throw new Error('Invalid split offset');
 a.children[0].text=text.slice(0,offset);b.children[0].text=text.slice(offset);return [a,b];
}
export function mergeParagraphs(left,right){
 if([left,right].some(n=>n.type!=='paragraph'||n.children.length!==1||n.children[0].type!=='text')||left.children[0].format!==right.children[0].format)throw new Error('Reference merge requires equivalent simple text formatting');
 const result=structuredClone(left);result.children[0].text+=right.children[0].text;return result;
}
