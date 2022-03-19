import { TreeItem, TreeItemCollapsibleState } from 'vscode';
import { BaseNode, PerformanceBaseNode } from './basenode';
import { PerformanceCounterNode } from './performancecounternode';

export class PerformanceInstructionGroupNode extends PerformanceBaseNode {
    constructor(private label: string, protected children: PerformanceCounterNode[]) {
        super();
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
        const item = new TreeItem(
            this.label,
            this.expanded ? TreeItemCollapsibleState.Expanded : TreeItemCollapsibleState.Collapsed
        );
        item.label = `${this.label}: ${this.getTotalCount()}`;
        item.contextValue = 'counters';

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
