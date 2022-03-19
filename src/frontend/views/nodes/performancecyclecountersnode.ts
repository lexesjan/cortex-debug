import { DebugSession } from 'vscode';
import { AddrRange } from '../../addrranges';
import { MemReadUtils } from '../../memreadutils';
import { BaseNode } from './basenode';
import { MessageNode } from './messagenode';
import { PerformanceCounterNode } from './performancecounternode';
import { PerformanceCountersNode } from './performancecountersnode';

// DWT register addresses.
const DWT_CTRL = 0xe0001000;
const DWT_CYCCNT = 0xe0001004;
const DWT_LSUCNT = 0xe0001014;

export class PerformanceCycleCountersNode extends PerformanceCountersNode {
    constructor(private session: DebugSession) {
        super('Cycle counters', [
            new PerformanceCounterNode(session, 'Total count', DWT_CYCCNT),
            new PerformanceCounterNode(session, 'Load / store count', DWT_LSUCNT),
        ]);
    }

    /**
     * Returns the performance counter nodes if the DWT is present.
     */
    public getChildren(): BaseNode[] | Promise<BaseNode[]> {
        // Use nested function to use async function with a Thenable return type.
        return (async () => {
            const memReadResult: number[] = [];
            await MemReadUtils.readMemoryChunks(this.session, DWT_CTRL, [new AddrRange(DWT_CTRL, 4)], memReadResult);

            const memReadResultBytes = new Uint8Array(memReadResult);
            const buffer = Buffer.from(memReadResultBytes);
            const control = buffer.readInt32LE(0);

            if (!control) {
                return [new MessageNode('No DWT present')];
            }

            return this.children;
        })();
    }
}
