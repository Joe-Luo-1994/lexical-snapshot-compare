import { createHeadlessEditor } from "@lexical/headless";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { LinkNode, AutoLinkNode } from "@lexical/link";
import { ListNode, ListItemNode } from "@lexical/list";
import { CodeNode, CodeHighlightNode } from "@lexical/code";
import { TableNode, TableRowNode, TableCellNode } from "@lexical/table";
export const referenceNodes = [
    HeadingNode,
    QuoteNode,
    LinkNode,
    AutoLinkNode,
    ListNode,
    ListItemNode,
    CodeNode,
    CodeHighlightNode,
    TableNode,
    TableRowNode,
    TableCellNode,
];
// Stock 0.18 nodes only. Company custom nodes are deliberately NOT guessed here.
export function createReferenceEditor(onError = (error) => {
    throw error;
}) {
    return createHeadlessEditor({
        namespace: "SnapshotCompareReference018",
        nodes: referenceNodes,
        onError,
    });
}
