import { TreeItem, TreeItemCollapsibleState, TreeItemLabel } from 'vscode';
import { BaseNode, PerformanceBaseNode } from './basenode';
import { PerformanceCounterNode } from './performancecounternode';

export class PerformanceInstructionGroupNode extends PerformanceBaseNode {
    private previousTotalCount: number;

    constructor(private label: string, protected children: PerformanceCounterNode[]) {
        super();

        this.previousTotalCount = 0;
    }

    /**
     * Returns the children of the performance instruction group node.
     */
    public getChildren(): PerformanceBaseNode[] | Promise<PerformanceBaseNode[]> {
        // Remove instruction groups with no counts.
        const filteredChildren = this.children.filter((performanceNode) => performanceNode.getCurrentCount() !== 0);

        return filteredChildren;
    }

    /**
     * Returns the display element of the performance instruction group node.
     */
    public getTreeItem(): TreeItem | Promise<TreeItem> {
        const totalCount = this.getTotalCount();

        // Highlight total count on change.
        const label: TreeItemLabel = { label: `${this.label}: ${totalCount}` };
        if (this.previousTotalCount !== totalCount) {
            label.highlights = [[this.label.length + 2, label.label.length]];
        }

        const item = new TreeItem(
            label,
            this.expanded ? TreeItemCollapsibleState.Expanded : TreeItemCollapsibleState.Collapsed
        );
        item.contextValue = 'counters';

        this.previousTotalCount = totalCount;

        return item;
    }

    /**
     * Used when clicking the copy value button.
     */
    public getCopyValue(): string | undefined {
        return undefined;
    }

    /**
     * Update each performance instruction group data.
     */
    public async updateData(): Promise<void> {
        await Promise.all(this.children.map((performanceNode) => performanceNode.updateData()));
    }

    /**
     * Returns the total instruction count of the instruction group.
     */
    public getTotalCount(): number {
        return this.children.reduce(
            (accumulator, performanceNode) => accumulator + performanceNode.getCurrentCount(),
            0
        );
    }

    /**
     * Clears each children's counter values.
     */
    public async clearValue(): Promise<void> {
        await Promise.all(this.children.map((performanceNode) => performanceNode.clearValue()));
    }
}
