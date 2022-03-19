import { DebugSession } from 'vscode';
import { AddrRange } from '../../addrranges';
import { MemReadUtils } from '../../memreadutils';
import { PerformanceBaseNode } from './basenode';
import { MessageNode } from './messagenode';
import { PerformanceCounterNode } from './performancecounternode';
import { PerformanceCountersNode } from './performancecountersnode';
import { PerformanceInstructionGroupNode } from './performanceinstructiongroupnode';

// InstCounter addresses.
const IC_CTRL = 0xe0003000;

// Move instructions.
const IC_MOV = 0xe0003004;

// Add instructions.
const IC_ADD = 0xe0003008;
const IC_ADC = 0xe000300c;

// Subtract instructions.
const IC_SUB = 0xe0003010;
const IC_SBC = 0xe0003014;
const IC_RSB = 0xe0003018;

// Multiply instructions.
const IC_MUL = 0xe000301c;

// Divide instructions.
const IC_SDIV = 0xe0003020;
const IC_UDIV = 0xe0003024;

// Compare instructions.
const IC_CMP = 0xe0003028;
const IC_CMN = 0xe000302c;

// Logical instructions.
const IC_AND = 0xe0003030;
const IC_EOR = 0xe0003034;
const IC_ORR = 0xe0003038;
const IC_ORN = 0xe000303c;
const IC_BIC = 0xe0003040;
const IC_MVN = 0xe0003044;
const IC_TST = 0xe0003048;
const IC_TEQ = 0xe000304c;

// Shift instructions.
const IC_LSL = 0xe0003050;
const IC_LSR = 0xe0003054;
const IC_ASR = 0xe0003058;

// Rotate instructions.
const IC_ROR = 0xe000305c;
const IC_RRX = 0xe0003060;

// Load instructions.
const IC_LDR = 0xe0003064;
const IC_LDRH = 0xe0003068;
const IC_LDRB = 0xe000306c;
const IC_LDRSH = 0xe0003070;
const IC_LDRSB = 0xe0003074;
const IC_LDRD = 0xe0003078;
// gem5 LDM variants (e.g. LDMFD) are given the same name.
const IC_LDM = 0xe000307c;

// Store instructions.
const IC_STR = 0xe0003080;
const IC_STRH = 0xe0003084;
const IC_STRB = 0xe0003088;
const IC_STRSH = 0xe000308c;
const IC_STRSB = 0xe0003090;
const IC_STRD = 0xe0003094;
// gem5 STM variants (e.g. STMFD) are given the same name.
const IC_STM = 0xe0003098;

// Branch instructions.
const IC_BL = 0xe000309c;
const IC_BX = 0xe00030a0;
// gem5 conditional instructions are given the same name.
const IC_B = 0xe00030a4;

export class PerformanceInstructionCountersNode extends PerformanceCountersNode {
    constructor(private session: DebugSession) {
        super('Instruction counters', [
            new PerformanceInstructionGroupNode('Move', [new PerformanceCounterNode(session, 'MOV', IC_MOV)]),
            new PerformanceInstructionGroupNode('Add', [
                new PerformanceCounterNode(session, 'ADD', IC_ADD),
                new PerformanceCounterNode(session, 'ADC', IC_ADC),
            ]),
            new PerformanceInstructionGroupNode('Subtract', [
                new PerformanceCounterNode(session, 'SUB', IC_SUB),
                new PerformanceCounterNode(session, 'SBC', IC_SBC),
                new PerformanceCounterNode(session, 'RSB', IC_RSB),
            ]),
            new PerformanceInstructionGroupNode('Multiply', [new PerformanceCounterNode(session, 'MUL', IC_MUL)]),
            new PerformanceInstructionGroupNode('Divide', [
                new PerformanceCounterNode(session, 'SDIV', IC_SDIV),
                new PerformanceCounterNode(session, 'UDIV', IC_UDIV),
            ]),
            new PerformanceInstructionGroupNode('Load', [
                new PerformanceCounterNode(session, 'LDR', IC_LDR),
                new PerformanceCounterNode(session, 'LDRH', IC_LDRH),
                new PerformanceCounterNode(session, 'LDRB', IC_LDRB),
                new PerformanceCounterNode(session, 'LDRSH', IC_LDRSH),
                new PerformanceCounterNode(session, 'LDRSB', IC_LDRSB),
                new PerformanceCounterNode(session, 'LDRD', IC_LDRD),
                new PerformanceCounterNode(session, 'LDM', IC_LDM),
            ]),
            new PerformanceInstructionGroupNode('Store', [
                new PerformanceCounterNode(session, 'STR', IC_STR),
                new PerformanceCounterNode(session, 'STRH', IC_STRH),
                new PerformanceCounterNode(session, 'STRB', IC_STRB),
                new PerformanceCounterNode(session, 'STRSH', IC_STRSH),
                new PerformanceCounterNode(session, 'STRSB', IC_STRSB),
                new PerformanceCounterNode(session, 'STRD', IC_STRD),
                new PerformanceCounterNode(session, 'STM', IC_STM),
            ]),
            new PerformanceInstructionGroupNode('Branch', [
                new PerformanceCounterNode(session, 'BL', IC_BL),
                new PerformanceCounterNode(session, 'BX', IC_BX),
                new PerformanceCounterNode(session, 'B', IC_B),
            ]),
            new PerformanceInstructionGroupNode('Compare', [
                new PerformanceCounterNode(session, 'CMP', IC_CMP),
                new PerformanceCounterNode(session, 'CMN', IC_CMN),
            ]),
            new PerformanceInstructionGroupNode('Logical', [
                new PerformanceCounterNode(session, 'CMP', IC_AND),
                new PerformanceCounterNode(session, 'EOR', IC_EOR),
                new PerformanceCounterNode(session, 'ORR', IC_ORR),
                new PerformanceCounterNode(session, 'ORN', IC_ORN),
                new PerformanceCounterNode(session, 'BIC', IC_BIC),
                new PerformanceCounterNode(session, 'MVN', IC_MVN),
                new PerformanceCounterNode(session, 'TST', IC_TST),
                new PerformanceCounterNode(session, 'TEQ', IC_TEQ),
            ]),
            new PerformanceInstructionGroupNode('Shift', [
                new PerformanceCounterNode(session, 'LSL', IC_LSL),
                new PerformanceCounterNode(session, 'LSR', IC_LSR),
                new PerformanceCounterNode(session, 'ASR', IC_ASR),
            ]),
            new PerformanceInstructionGroupNode('Rotate', [
                new PerformanceCounterNode(session, 'ROR', IC_ROR),
                new PerformanceCounterNode(session, 'RRX', IC_RRX),
            ]),
        ]);
    }

    /**
     * Returns the performance counter nodes if the DWT is present.
     */
    public getChildren(): PerformanceBaseNode[] | Promise<PerformanceBaseNode[]> {
        // Use nested function to use async function with a Thenable return type.
        return (async () => {
            const memReadResult: number[] = [];
            await MemReadUtils.readMemoryChunks(this.session, IC_CTRL, [new AddrRange(IC_CTRL, 4)], memReadResult);

            const memReadResultBytes = new Uint8Array(memReadResult);
            const buffer = Buffer.from(memReadResultBytes);
            const control = buffer.readInt32LE(0);

            if (!control) {
                return [new MessageNode('No instruction counter present') as unknown as PerformanceBaseNode];
            }

            const totalCount = this.children.reduce(
                (accumulator, performanceNode) =>
                    accumulator + (performanceNode as PerformanceInstructionGroupNode).getTotalCount(),
                0
            );

            // Remove instruction groups with no counts.
            const filteredChildren = this.children.filter(
                (performanceNode) => (performanceNode as PerformanceInstructionGroupNode).getTotalCount() !== 0
            );

            return [
                ...filteredChildren,
                new MessageNode(`Total count: ${totalCount}`) as unknown as PerformanceBaseNode,
            ];
        })();
    }
}
