import { TreeItem, TreeItemCollapsibleState } from 'vscode';
import { BaseNode, PerformanceBaseNode } from './basenode';

export class PerformanceCountersNode extends PerformanceBaseNode {
    public myTreeItem: TreeItem;

    constructor(private label: string, protected children: PerformanceBaseNode[]) {
        super();

        this.myTreeItem = new TreeItem(
            this.label,
            this.expanded ? TreeItemCollapsibleState.Expanded : TreeItemCollapsibleState.Collapsed
        );
        this.myTreeItem.contextValue = 'counters';
    }

    /**
     * Returns the children of the performance counter node.
     */
    public getChildren(): PerformanceBaseNode[] | Promise<PerformanceBaseNode[]> {
        return this.children;
    }

    /**
     * Returns the display element of the performance counter node.
     */
    public getTreeItem(): TreeItem | Promise<TreeItem> {
        return this.myTreeItem;
    }

    /**
     * Used when clicking the copy value button.
     */
    public getCopyValue(): string | undefined {
        return undefined;
    }

    /**
     * Update each performance counter data.
     */
    public async updateData(): Promise<void> {
        if (!this.expanded) {
            return;
        }

        await Promise.all(this.children.map((performanceNode) => performanceNode.updateData()));
    }

    /**
     * Clears each children's counter values.
     */
    public async clearValue(): Promise<void> {
        await Promise.all(this.children.map((performanceNode) => performanceNode.clearValue()));
    }
}
