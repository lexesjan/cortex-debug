import { TreeItem, DebugSession, debug, TreeItemLabel } from 'vscode';
import { AddrRange } from '../../addrranges';
import { MemReadUtils } from '../../memreadutils';
import { BaseNode, PerformanceBaseNode } from './basenode';

export class PerformanceCounterNode extends PerformanceBaseNode {
    private currentCount: number;
    private previousCount: number;

    constructor(private session: DebugSession, private label: string, private baseAddress: number) {
        super();

        this.currentCount = 0;
        this.previousCount = 0;
    }

    /**
     * Returns the children of the performance cycle counter.
     */
    public getChildren(): PerformanceBaseNode[] | Promise<PerformanceBaseNode[]> {
        return [];
    }

    /**
     * Returns the display element of the performance cycle counter.
     */
    public getTreeItem(): TreeItem | Promise<TreeItem> {
        // Highlight counter on change.
        const label: TreeItemLabel = { label: `${this.label}: ${this.currentCount}` };
        if (this.previousCount !== this.currentCount) {
            label.highlights = [[this.label.length + 2, label.label.length]];
        }

        const item = new TreeItem(label);
        item.contextValue = 'counter';

        this.previousCount = this.currentCount;

        return item;
    }

    /**
     * Used when clicking the copy value button.
     */
    public getCopyValue(): string | undefined {
        return undefined;
    }

    /**
     * Returns the current count.
     */
    public getCurrentCount(): number {
        return this.currentCount;
    }

    /**
     * Reads the current count in memory.
     */
    public async updateData(): Promise<void> {
        const memReadResult: number[] = [];
        await MemReadUtils.readMemoryChunks(
            this.session,
            this.baseAddress,
            [new AddrRange(this.baseAddress, 4)],
            memReadResult
        );

        const memReadResultBytes = new Uint8Array(memReadResult);
        const buffer = Buffer.from(memReadResultBytes);

        this.currentCount = buffer.readInt32LE(0);
    }

    /**
     * Applies the reset value to the performance cycle counter.
     */
    public async clearValue(): Promise<void> {
        if (this.currentCount === 0) {
            return;
        }

        this.currentCount = 0;
        return debug.activeDebugSession.customRequest('write-memory', { address: this.baseAddress, data: '00000000' });
    }
}
