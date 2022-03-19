import { TreeItem, DebugSession, debug } from 'vscode';
import { AddrRange } from '../../addrranges';
import { MemReadUtils } from '../../memreadutils';
import { PerformanceBaseNode } from './basenode';

export class PerformanceCycleCounterNode extends PerformanceBaseNode {
    private currentCount: number;
    private memoryReadAddressRange: AddrRange[];

    constructor(private session: DebugSession, private label: string, private baseAddress: number) {
        super();

        this.currentCount = 0;
        // Read 4 bytes.
        this.memoryReadAddressRange = [new AddrRange(baseAddress, 4)];
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
        const label = `${this.label}: ${this.currentCount}`;

        const item = new TreeItem(label);
        item.contextValue = 'counter';

        return item;
    }

    /**
     * Used when clicking the copy value button.
     */
    public getCopyValue(): string | undefined {
        return undefined;
    }

    /**
     * Reads the current count in memory.
     */
    public async updateData(): Promise<void> {
        const memReadResult: number[] = [];
        await MemReadUtils.readMemoryChunks(this.session, this.baseAddress, this.memoryReadAddressRange, memReadResult);

        const memReadResultBytes = new Uint8Array(memReadResult);
        const buffer = Buffer.from(memReadResultBytes);

        this.currentCount = buffer.readInt32LE(0);
    }

    /**
     * Applies the reset value to the performance cycle counter.
     */
    public async clearValue(): Promise<void> {
        this.currentCount = 0;
        return debug.activeDebugSession.customRequest('write-memory', { address: this.baseAddress, data: '00000000' });
    }
}
