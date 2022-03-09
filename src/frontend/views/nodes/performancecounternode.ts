import { TreeItem, DebugSession } from 'vscode';
import { AddrRange } from '../../addrranges';
import { MemReadUtils } from '../../memreadutils';
import { BaseNode } from './basenode';

export class PerformanceCounterNode extends BaseNode {
    private currentCount: number;
    private memoryReadAddressRange: AddrRange[];

    constructor(private session: DebugSession, private label: string, private baseAddress: number) {
        super();

        this.currentCount = 0;
        // Read 4 bytes.
        this.memoryReadAddressRange = [new AddrRange(baseAddress, 4)];
    }

    /**
     * Returns the children of the performance counter.
     */
    public getChildren(): BaseNode[] | Promise<BaseNode[]> {
        return [];
    }

    /**
     * Returns the display element of the performance counter.
     */
    public getTreeItem(): TreeItem | Promise<TreeItem> {
        const label = `${this.label}: ${this.currentCount}`;

        return new TreeItem(label);
    }

    /**
     * Used when clicking the value button.
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
}
