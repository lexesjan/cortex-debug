import { Range, TextEditorDecorationType, Uri, window } from 'vscode';
import * as path from 'path';
import { CortexDebugExtension } from '../extension';

type HSL = [number, number, number];

export class Heatmap {
    private map: Record<number, TextEditorDecorationType>;
    public isShown: boolean;

    constructor() {
        this.map = {};
        this.isShown = true;
    }

    /**
     * Calculates a heat map color (1 is red, 0 is blue).
     *
     * @param value Value ranging from 0 to 1.
     */
    private static calculateHeatMapColourForValue(value: number): HSL {
        // Ensure that the colour is red at 0.25 or above.
        const scaledValue = Math.min(value * 3, 1);
        const h = (1.0 - scaledValue) * 240;
        return [h, 100, 50];
    }

    /**
     * Calculates the heatmap colours for the current file.
     */
    public async calculate(): Promise<boolean> {
        this.map = {};

        const session = CortexDebugExtension.getActiveCDSession();
        if (!session) {
            return;
        }

        const filename = path.basename(window.activeTextEditor.document.fileName);
        const lineCounts = (await session.customRequest('read-line-counts', { filename })) as Record<number, number>;
        if (!lineCounts) {
            window.showErrorMessage('Current open file is not being debugged!');
            return false;
        }

        const lineCountPairs = Object.entries(lineCounts);
        const totalInstructionCount = lineCountPairs.reduce((acc, [_line, count]) => acc + count, 0) || 1;

        lineCountPairs.forEach(([line, count]) => {
            // Skip not executed instructions.
            if (count === 0) {
                return;
            }

            const hitPercentage = count / totalInstructionCount;
            const [h, s, l] = Heatmap.calculateHeatMapColourForValue(hitPercentage);

            const decorationType = window.createTextEditorDecorationType({
                gutterIconPath: Uri.parse(
                    `data:image/svg+xml,${encodeURIComponent(
                        `<svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 18 18'><rect fill='hsl(${h},${s}%,${l}%)' x='0' y='0' width='2' height='18'/></svg>`
                    )}`
                ),
                gutterIconSize: 'contain',
            });

            this.map[line] = decorationType;
        });

        return true;
    }

    /**
     * Shows the heatmap of the current file.
     */
    public show(): void {
        Object.entries(this.map).forEach(([lineString, decorationType]) => {
            const line = parseInt(lineString) - 1;
            const ranges = [new Range(line, 0, line, 0)];
            window.activeTextEditor.setDecorations(decorationType, ranges);
        });
    }

    /**
     * Hides the heatmap.
     */
    public hide(): void {
        Object.entries(this.map).forEach(([_lineString, decorationType]) => {
            const ranges = [];
            window.activeTextEditor.setDecorations(decorationType, ranges);
        });
    }

    /**
     * Hides the heatmap on termination.
     */
    public debugSessionTerminated(): void {
        this.hide();
    }

    /**
     * Updates the heatmap on stop event.
     */
    public async debugStopped(): Promise<void> {
        if (!this.isShown) {
            return;
        }

        this.hide();
        await this.calculate();
        this.show();
    }

    /**
     * Hide the heatmap on continue event.
     */
    public debugContinued(): void {
        this.hide();
    }
}
