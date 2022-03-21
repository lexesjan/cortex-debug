import { Addr2Line } from 'addr2line';
import { parseHexOrDecInt } from '../../common';
import { hexFormat } from '../../frontend/utils';

export class HeatmapInfo {
    private addrResolver: any;
    private executedInstructionsCounters: Record<string, Record<number, number>>;
    private addressCounters: Record<number, number>;
    private isInitialised = false;

    private executedInstructionAddressPattern = /Instruction executed: ((0[xX])?[a-fA-F0-9]+)/;

    constructor(elfFilePath: string) {
        this.addrResolver = new Addr2Line([elfFilePath], {
            inlines: false,
            basenames: true,
            functions: false,
            demangle: false,
        });
        this.executedInstructionsCounters = {};
        this.addressCounters = {};
        this.isInitialised = false;
    }

    /**
     * Initialises the valid instruction counters to zero since not every line
     * in the source file is an instruction.
     *
     * @param startingInstructionAddress First executed instruction address.
     */
    private async initialiseCounters(startingInstructionAddress: number): Promise<void> {
        if (this.isInitialised) {
            return;
        }

        // Traverse backwards.
        let address = startingInstructionAddress;
        while (true) {
            const result = await this.addrResolver.resolve(hexFormat(address));
            if (result === null) {
                break;
            }

            const counters = this.executedInstructionsCounters[result.filename] || {};
            counters[result.line] = 0;
            this.executedInstructionsCounters[result.filename] = counters;
            // Arm instructions are either 2 or 4 bytes wide.
            address -= 2;
        }

        // Traverse forwards.
        address = startingInstructionAddress;
        while (true) {
            const result = await this.addrResolver.resolve(hexFormat(address));
            if (result === null) {
                break;
            }

            const counters = this.executedInstructionsCounters[result.filename] || {};
            counters[result.line] = 0;
            this.executedInstructionsCounters[result.filename] = counters;
            // Arm instructions are either 2 or 4 bytes wide.
            address += 2;
        }

        this.isInitialised = true;
    }

    /**
     * Parses a stdout line and increments the counters.
     */
    private parseLine(line: string): void {
        const matches = line.match(this.executedInstructionAddressPattern);

        if (!matches) {
            return;
        }

        const instructionAddress = parseHexOrDecInt(matches[1]);
        const addressCount = this.addressCounters[instructionAddress] ?? 0;
        this.addressCounters[instructionAddress] = addressCount + 1;
    }

    /**
     * Parses stdout.
     *
     * @param data Data emitted by stdout.
     */
    public onStdout(data: string): void {
        data.trim()
            .split('\n')
            .forEach((line) => this.parseLine(line));
    }

    /**
     * Returns the executed instruction counts.
     *
     * @param filename Name of the file to retrieve the line counts.
     */
    public async getExecutedInstructionCounts(filename: string): Promise<Record<number, number>> {
        const addressCountPairs = Object.entries(this.addressCounters);
        await this.initialiseCounters(parseInt(addressCountPairs[0][0]) ?? 0);

        await Promise.all(
            addressCountPairs.map(async ([addressString, count]) => {
                const address = parseInt(addressString);
                const result = await this.addrResolver.resolve(hexFormat(address));
                this.executedInstructionsCounters[result.filename][result.line] += count;
            })
        );

        this.addressCounters = {};
        return this.executedInstructionsCounters[filename];
    }
}
