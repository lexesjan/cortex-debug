import {
    TreeItem,
    TreeDataProvider,
    EventEmitter,
    Event,
    ProviderResult,
    DebugSession,
    TreeItemCollapsibleState,
} from 'vscode';
import { BaseNode, PerformanceBaseNode } from './nodes/basenode';
import { MessageNode } from './nodes/messagenode';
import { PerformanceCycleCounterNode } from './nodes/performancecyclecounternode';
import { PerformanceNode } from './nodes/performancenode';

// DWT register addresses.
const DWT_CYCCNT = 0xe0001004;
const DWT_LSUCNT = 0xe0001014;

/**
 * Per session performance info tab.
 */
export class PerformanceTreeForSession extends PerformanceBaseNode {
    public myTreeItem: TreeItem;
    public performanceNodes: PerformanceBaseNode[];

    constructor(private session: DebugSession, public state: TreeItemCollapsibleState) {
        super();

        this.myTreeItem = new TreeItem(session.id, state);
        this.performanceNodes = [];
    }

    /**
     * Returns the children of the session performance info tab.
     */
    public getChildren(): BaseNode[] | Promise<BaseNode[]> {
        return this.performanceNodes;
    }

    /**
     * Returns this element's tree item.
     */
    public getTreeItem(): TreeItem | Promise<TreeItem> {
        return this.myTreeItem;
    }

    /**
     * Used when clicking the value button.
     */
    public getCopyValue(): string | undefined {
        throw new Error('Method not implemented.');
    }

    /**
     * Initialise the performance counter tabs on startup.
     */
    public debugSessionStarted(): void {
        // Initialise cycle counter nodes.
        const performanceCycleCounterNodes = [
            new PerformanceCycleCounterNode(this.session, 'Total count', DWT_CYCCNT),
            new PerformanceCycleCounterNode(this.session, 'Load / store count', DWT_LSUCNT),
        ];
        const performanceCycleNode = new PerformanceNode('Cycle counters', performanceCycleCounterNodes);
        this.performanceNodes.push(performanceCycleNode);
    }

    /**
     * Update each performance counter data.
     */
    public async updateData(): Promise<void> {
        await Promise.all(this.performanceNodes.map((performanceNode) => performanceNode.updateData()));
    }

    /**
     * Clears each performance counter values.
     */
    public async clearValue(): Promise<void> {
        await Promise.all(this.performanceNodes.map((performanceNode) => performanceNode.clearValue()));
    }
}

/**
 * Root performance information tab.
 */
export class PerformanceTreeProvider implements TreeDataProvider<BaseNode> {
    // tslint:disable-next-line:variable-name
    public _onDidChangeTreeData: EventEmitter<BaseNode | undefined> = new EventEmitter<BaseNode | undefined>();
    public readonly onDidChangeTreeData: Event<BaseNode | undefined> = this._onDidChangeTreeData.event;
    protected sessionPerformanceInfoMap = new Map<string, PerformanceTreeForSession>();

    /**
     * Rerenders the VSCode DOM.
     */
    public refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }

    /**
     * Updates the performance counter data.
     */
    public async updateData(): Promise<void> {
        await Promise.all(
            Array.from(this.sessionPerformanceInfoMap.values()).map((performanceTreeForSession) =>
                performanceTreeForSession.updateData()
            )
        );
    }

    /**
     * Returns the tree item from the currently selected element.
     *
     * @param element Element selected.
     */
    public getTreeItem(element: PerformanceBaseNode): TreeItem | Promise<TreeItem> {
        return element.getTreeItem();
    }

    /**
     * Returns the children of the currently selected element.
     *
     * @param element Element selected.
     */
    public getChildren(element?: BaseNode): ProviderResult<BaseNode[]> {
        const values = Array.from(this.sessionPerformanceInfoMap.values());
        if (element) {
            return element.getChildren();
        } else if (values.length === 0) {
            return [new MessageNode('No debug sessions detected')];
        } else if (values.length === 1) {
            return values[0].getChildren(); // Don't do root nodes at top-level if there is only one root.
        } else {
            return values;
        }
    }

    /**
     * Adds a performance info element.
     *
     * @param session Debug session which was started.
     */
    public debugSessionStarted(session: DebugSession): void {
        if (this.sessionPerformanceInfoMap.get(session.id)) {
            return;
        }

        // Determine if the new performance info tree be collapsed or expanded.
        const performanceInfoState =
            this.sessionPerformanceInfoMap.size === 0
                ? TreeItemCollapsibleState.Expanded
                : TreeItemCollapsibleState.Collapsed;

        const performanceCounters = new PerformanceTreeForSession(session, performanceInfoState);
        performanceCounters.debugSessionStarted();

        this.sessionPerformanceInfoMap.set(session.id, performanceCounters);
        this.refresh();
    }

    /**
     * Removes a performance info element.
     *
     * @param session Debug session which was terminated.
     */
    public debugSessionTerminated(session: DebugSession): void {
        if (!this.sessionPerformanceInfoMap.get(session.id)) {
            return;
        }

        this.sessionPerformanceInfoMap.delete(session.id);
        this.refresh();
    }

    /**
     * Updates performance info when debug session stops (hit a breakpoint).
     *
     * @param session Debug session which was stopped.
     */
    public async debugStopped(session: DebugSession): Promise<void> {
        const performanceInfo = this.sessionPerformanceInfoMap.get(session.id);
        await performanceInfo?.updateData();
        this.refresh();
    }

    /**
     * Clears the value of the counter.
     */
    public async clearValue(node: PerformanceBaseNode): Promise<void> {
        node.clearValue();
    }
}
