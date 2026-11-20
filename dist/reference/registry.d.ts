import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { LinkNode } from "@lexical/link";
import { ListNode, ListItemNode } from "@lexical/list";
import { CodeNode, CodeHighlightNode } from "@lexical/code";
import { TableNode, TableRowNode, TableCellNode } from "@lexical/table";
export declare const referenceNodes: (typeof HeadingNode | typeof QuoteNode | typeof LinkNode | typeof ListNode | typeof ListItemNode | typeof CodeNode | typeof CodeHighlightNode | typeof TableNode | typeof TableRowNode | typeof TableCellNode)[];
export declare function createReferenceEditor(onError?: (error: Error) => void): import("lexical").LexicalEditor;
