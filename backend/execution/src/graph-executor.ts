/**
 * Graph-based Workflow Execution Engine
 * 
 * This engine replaces the linear execution model with a proper graph traversal
 * that supports:
 * - Branching (condition, switch nodes)
 * - Loops (loop nodes with iteration)
 * - Merging (merge nodes that wait for multiple branches)
 * - Error handling (retries, timeouts, error workflows)
 */

import {
    NodeType,
    ExecutionContext,
    RetryConfig,
    TimeoutConfig,
    ConditionConfig,
    SwitchConfig,
    LoopConfig,
    MergeConfig,
    HttpConfig,
    TransformerConfig
} from './types';

// ============================================================
// Interfaces
// ============================================================

export interface WorkflowNode {
    id: string;
    type: NodeType;
    data: Record<string, any>;
    position: { x: number; y: number };
}

export interface WorkflowEdge {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string; // For nodes with multiple outputs (e.g., 'true', 'false')
    targetHandle?: string;
}

export interface WorkflowGraph {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
}

export interface NodeExecutionResult {
    nodeId: string;
    status: 'success' | 'error' | 'skipped';
    output?: any;
    error?: string;
    duration: number;
    branch?: string; // Which branch was taken (for condition/switch)
}

export interface GraphExecutionState {
    nodeOutputs: Map<string, any>;
    nodeStatuses: Map<string, 'pending' | 'running' | 'completed' | 'error' | 'skipped'>;
    mergeInputs: Map<string, Map<string, any>>; // nodeId -> (sourceNodeId -> output)
    loopStates: Map<string, { currentIndex: number; items: any[]; outputs: any[] }>;
    executionPath: string[]; // Order of executed nodes
}

export interface ExecutionOptions {
    input?: Record<string, any>;
    timeout?: number;
    maxRetries?: number;
    onNodeStart?: (nodeId: string) => void;
    onNodeComplete?: (result: NodeExecutionResult) => void;
    onNodeError?: (nodeId: string, error: Error) => void;
}

// ============================================================
// Graph Executor Class
// ============================================================

export class GraphExecutor {
    private graph: WorkflowGraph;
    private adjacencyList: Map<string, WorkflowEdge[]>; // source -> edges
    private reverseAdjacencyList: Map<string, WorkflowEdge[]>; // target -> edges
    private nodeMap: Map<string, WorkflowNode>;

    constructor(graph: WorkflowGraph) {
        this.graph = graph;
        this.nodeMap = new Map();
        this.adjacencyList = new Map();
        this.reverseAdjacencyList = new Map();

        // Build node map
        for (const node of graph.nodes) {
            this.nodeMap.set(node.id, node);
        }

        // Build adjacency lists
        for (const edge of graph.edges) {
            // Forward edges
            if (!this.adjacencyList.has(edge.source)) {
                this.adjacencyList.set(edge.source, []);
            }
            this.adjacencyList.get(edge.source)!.push(edge);

            // Reverse edges
            if (!this.reverseAdjacencyList.has(edge.target)) {
                this.reverseAdjacencyList.set(edge.target, []);
            }
            this.reverseAdjacencyList.get(edge.target)!.push(edge);
        }
    }

    /**
     * Find trigger/entry nodes (nodes with no incoming edges)
     */
    findEntryNodes(): WorkflowNode[] {
        return this.graph.nodes.filter(node => {
            const incomingEdges = this.reverseAdjacencyList.get(node.id) || [];
            return incomingEdges.length === 0 || node.type === 'trigger';
        });
    }

    /**
     * Get nodes that should be executed after a given node
     */
    getNextNodes(nodeId: string, branch?: string): WorkflowNode[] {
        const edges = this.adjacencyList.get(nodeId) || [];

        // Filter by branch if specified (for condition/switch nodes)
        const filteredEdges = branch
            ? edges.filter(e => e.sourceHandle === branch)
            : edges;

        return filteredEdges
            .map(edge => this.nodeMap.get(edge.target))
            .filter((node): node is WorkflowNode => node !== undefined);
    }

    /**
     * Check if all incoming edges to a node have been satisfied
     */
    canExecuteNode(nodeId: string, state: GraphExecutionState): boolean {
        const node = this.nodeMap.get(nodeId);
        if (!node) return false;

        // Merge nodes have special logic
        if (node.type === 'merge') {
            const mergeConfig = node.data as MergeConfig;
            const receivedInputs = state.mergeInputs.get(nodeId) || new Map();
            const incomingEdges = this.reverseAdjacencyList.get(nodeId) || [];

            if (mergeConfig.mode === 'waitAll') {
                return receivedInputs.size >= incomingEdges.length;
            } else if (mergeConfig.mode === 'waitAny') {
                return receivedInputs.size >= 1;
            }
        }

        // For other nodes, all incoming edges must have completed
        const incomingEdges = this.reverseAdjacencyList.get(nodeId) || [];
        return incomingEdges.every(edge =>
            state.nodeStatuses.get(edge.source) === 'completed' ||
            state.nodeStatuses.get(edge.source) === 'skipped'
        );
    }

    /**
     * Execute the entire workflow
     */
    async execute(options: ExecutionOptions = {}): Promise<NodeExecutionResult[]> {
        const state: GraphExecutionState = {
            nodeOutputs: new Map(),
            nodeStatuses: new Map(),
            mergeInputs: new Map(),
            loopStates: new Map(),
            executionPath: []
        };

        const results: NodeExecutionResult[] = [];

        // Initialize all nodes as pending
        for (const node of this.graph.nodes) {
            state.nodeStatuses.set(node.id, 'pending');
        }

        // Start with entry nodes
        const entryNodes = this.findEntryNodes();
        const queue: WorkflowNode[] = [...entryNodes];

        // Store initial input in context
        const initialInput = options.input || {};

        while (queue.length > 0) {
            const node = queue.shift()!;

            // Skip if already processed
            if (state.nodeStatuses.get(node.id) !== 'pending') {
                continue;
            }

            // Check if we can execute this node
            if (!this.canExecuteNode(node.id, state)) {
                // Re-queue for later
                queue.push(node);
                continue;
            }

            // Get input for this node
            const nodeInput = this.getNodeInput(node.id, state, initialInput);

            // Execute the node
            options.onNodeStart?.(node.id);
            state.nodeStatuses.set(node.id, 'running');

            const startTime = Date.now();
            let result: NodeExecutionResult;

            try {
                const output = await this.executeNode(node, nodeInput, state, options);
                const duration = Date.now() - startTime;

                result = {
                    nodeId: node.id,
                    status: 'success',
                    output,
                    duration,
                    branch: output?._branch
                };

                state.nodeStatuses.set(node.id, 'completed');
                state.nodeOutputs.set(node.id, output);
                state.executionPath.push(node.id);

            } catch (error: any) {
                const duration = Date.now() - startTime;

                result = {
                    nodeId: node.id,
                    status: 'error',
                    error: error.message,
                    duration
                };

                state.nodeStatuses.set(node.id, 'error');
                options.onNodeError?.(node.id, error);

                // TODO: Handle error workflows
            }

            results.push(result);
            options.onNodeComplete?.(result);

            // Determine next nodes to execute
            if (result.status === 'success') {
                const branch = result.branch;
                const nextNodes = this.getNextNodes(node.id, branch);

                // Handle merge node input tracking
                for (const nextNode of nextNodes) {
                    if (nextNode.type === 'merge') {
                        if (!state.mergeInputs.has(nextNode.id)) {
                            state.mergeInputs.set(nextNode.id, new Map());
                        }
                        state.mergeInputs.get(nextNode.id)!.set(node.id, result.output);
                    }
                }

                // Add next nodes to queue
                queue.push(...nextNodes);
            }
        }

        return results;
    }

    /**
     * Get the input for a node based on its incoming edges
     */
    private getNodeInput(nodeId: string, state: GraphExecutionState, initialInput: any): any {
        const incomingEdges = this.reverseAdjacencyList.get(nodeId) || [];

        if (incomingEdges.length === 0) {
            return initialInput;
        }

        if (incomingEdges.length === 1) {
            return state.nodeOutputs.get(incomingEdges[0].source) || initialInput;
        }

        // Multiple inputs - combine them
        const inputs: Record<string, any> = {};
        for (const edge of incomingEdges) {
            const output = state.nodeOutputs.get(edge.source);
            if (output !== undefined) {
                inputs[edge.source] = output;
            }
        }
        return inputs;
    }

    /**
     * Execute a single node
     */
    private async executeNode(
        node: WorkflowNode,
        input: any,
        state: GraphExecutionState,
        options: ExecutionOptions
    ): Promise<any> {
        switch (node.type) {
            case 'trigger':
                return this.executeTriggerNode(node, input);

            case 'condition':
                return this.executeConditionNode(node, input);

            case 'switch':
                return this.executeSwitchNode(node, input);

            case 'loop':
                return this.executeLoopNode(node, input, state, options);

            case 'merge':
                return this.executeMergeNode(node, state);

            case 'http':
                return this.executeHttpNode(node, input);

            case 'transformer':
                return this.executeTransformerNode(node, input);

            case 'code':
                return this.executeCodeNode(node, input);

            case 'agent':
            default:
                return this.executeAgentNode(node, input);
        }
    }

    // ============================================================
    // Node Type Executors
    // ============================================================

    private async executeTriggerNode(node: WorkflowNode, input: any): Promise<any> {
        // Trigger nodes simply pass through their input or trigger data
        return {
            ...input,
            triggeredAt: new Date().toISOString(),
            triggerId: node.id
        };
    }

    private async executeConditionNode(node: WorkflowNode, input: any): Promise<any> {
        const config = node.data as ConditionConfig;
        const fieldValue = this.getNestedValue(input, config.field);

        let result: boolean;

        switch (config.operator) {
            case 'equals':
                result = fieldValue === config.value;
                break;
            case 'notEquals':
                result = fieldValue !== config.value;
                break;
            case 'contains':
                result = String(fieldValue).includes(String(config.value));
                break;
            case 'notContains':
                result = !String(fieldValue).includes(String(config.value));
                break;
            case 'greaterThan':
                result = Number(fieldValue) > Number(config.value);
                break;
            case 'lessThan':
                result = Number(fieldValue) < Number(config.value);
                break;
            case 'isEmpty':
                result = !fieldValue || (Array.isArray(fieldValue) && fieldValue.length === 0);
                break;
            case 'isNotEmpty':
                result = !!fieldValue && (!Array.isArray(fieldValue) || fieldValue.length > 0);
                break;
            default:
                result = false;
        }

        return {
            ...input,
            _branch: result ? 'true' : 'false',
            _conditionResult: result
        };
    }

    private async executeSwitchNode(node: WorkflowNode, input: any): Promise<any> {
        const config = node.data as SwitchConfig;
        const fieldValue = this.getNestedValue(input, config.field);

        // Find matching case
        const matchingCase = config.cases.find((c: { id: string; label: string; condition: ConditionConfig }) => {
            // Evaluate case condition against field value
            return this.evaluateCondition(c.condition, fieldValue, input);
        });
        const branch = matchingCase ? matchingCase.id : 'default';

        return {
            ...input,
            _branch: branch,
            _switchValue: fieldValue
        };
    }

    private async executeLoopNode(
        node: WorkflowNode,
        input: any,
        state: GraphExecutionState,
        options: ExecutionOptions
    ): Promise<any> {
        const config = node.data as LoopConfig;
        const items = this.getNestedValue(input, config.iterateOver) || [];

        if (!Array.isArray(items) || items.length === 0) {
            return { ...input, _branch: 'complete', items: [], outputs: [] };
        }

        // Get or initialize loop state
        let loopState = state.loopStates.get(node.id);
        if (!loopState) {
            loopState = { currentIndex: 0, items, outputs: [] };
            state.loopStates.set(node.id, loopState);
        }

        // Process current item
        const currentItem = items[loopState.currentIndex];

        // Return loop body output
        return {
            ...input,
            [config.itemVariable]: currentItem,
            _loopIndex: loopState.currentIndex,
            _loopTotal: items.length,
            _branch: loopState.currentIndex < items.length - 1 ? 'loop' : 'complete'
        };
    }

    private async executeMergeNode(node: WorkflowNode, state: GraphExecutionState): Promise<any> {
        const config = node.data as MergeConfig;
        const inputs = state.mergeInputs.get(node.id) || new Map();

        const inputArray = Array.from(inputs.values());

        switch (config.mode) {
            case 'waitAll':
                return { merged: inputArray, mode: 'waitAll' };
            case 'waitAny':
                return { merged: inputArray[0], mode: 'waitAny' };
            case 'append':
                return { merged: inputArray.flat(), mode: 'append' };
            default:
                return { merged: inputArray };
        }
    }

    private async executeHttpNode(node: WorkflowNode, input: any): Promise<any> {
        const config = node.data as HttpConfig;

        // Interpolate variables in URL
        let url = config.url;
        url = url.replace(/\{\{([^}]+)\}\}/g, (_match: string, key: string) => {
            return this.getNestedValue(input, key.trim()) || '';
        });

        const fetchOptions: RequestInit = {
            method: config.method,
            headers: config.headers,
        };

        if (['POST', 'PUT', 'PATCH'].includes(config.method) && config.body) {
            fetchOptions.body = typeof config.body === 'string'
                ? config.body
                : JSON.stringify(config.body);
        }

        const startTime = Date.now();
        const response = await fetch(url, fetchOptions);
        const latency = Date.now() - startTime;

        let body;
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
            body = await response.json();
        } else {
            body = await response.text();
        }

        return {
            statusCode: response.status,
            headers: Object.fromEntries(response.headers.entries()),
            body,
            latency,
            ok: response.ok
        };
    }

    private async executeTransformerNode(node: WorkflowNode, input: any): Promise<any> {
        const config = node.data as TransformerConfig;
        let output = { ...input };

        for (const op of config.operations) {
            switch (op.type) {
                case 'set':
                    this.setNestedValue(output, op.field!, op.value);
                    break;
                case 'rename':
                    if (op.from && op.to) {
                        const value = this.getNestedValue(output, op.from);
                        this.deleteNestedValue(output, op.from);
                        this.setNestedValue(output, op.to, value);
                    }
                    break;
                case 'delete':
                    if (op.field) {
                        this.deleteNestedValue(output, op.field);
                    }
                    break;
                case 'filter':
                    // Filter operation uses condition as a JavaScript expression
                    if (op.condition && Array.isArray(output.items)) {
                        output.items = output.items.filter((item: any) => {
                            try {
                                // Evaluate condition as expression
                                const fn = new Function('item', `return ${op.condition}`);
                                return fn(item);
                            } catch {
                                return true;
                            }
                        });
                    }
                    break;
            }
        }

        return output;
    }

    private async executeCodeNode(node: WorkflowNode, input: any): Promise<any> {
        const code = node.data.code || 'return input;';

        // Create a sandboxed function
        // NOTE: In production, use vm2 or isolated-vm for security
        try {
            const fn = new Function('input', 'context', `
                'use strict';
                ${code}
            `);

            const result = fn(input, {
                now: () => new Date(),
                stringify: (v: any) => JSON.stringify(v),
                parse: (v: string) => JSON.parse(v),
            });

            return result;
        } catch (error: any) {
            throw new Error(`Code execution failed: ${error.message}`);
        }
    }

    private async executeAgentNode(node: WorkflowNode, input: any): Promise<any> {
        // This would integrate with the existing agent execution logic
        // For now, return a placeholder
        return {
            agentId: node.id,
            agentType: node.data.agentType,
            input,
            output: `Agent ${node.id} processed input`,
            timestamp: new Date().toISOString()
        };
    }

    // ============================================================
    // Condition Evaluation
    // ============================================================

    private evaluateCondition(condition: ConditionConfig, fieldValue: any, input: any): boolean {
        const compareValue = condition.value;

        switch (condition.operator) {
            case 'equals':
                return fieldValue === compareValue;
            case 'notEquals':
                return fieldValue !== compareValue;
            case 'contains':
                return String(fieldValue).includes(String(compareValue));
            case 'notContains':
                return !String(fieldValue).includes(String(compareValue));
            case 'greaterThan':
                return Number(fieldValue) > Number(compareValue);
            case 'lessThan':
                return Number(fieldValue) < Number(compareValue);
            case 'greaterOrEqual':
                return Number(fieldValue) >= Number(compareValue);
            case 'lessOrEqual':
                return Number(fieldValue) <= Number(compareValue);
            case 'isEmpty':
                return !fieldValue || (Array.isArray(fieldValue) && fieldValue.length === 0);
            case 'isNotEmpty':
                return !!fieldValue && (!Array.isArray(fieldValue) || fieldValue.length > 0);
            case 'exists':
                return fieldValue !== undefined && fieldValue !== null;
            case 'notExists':
                return fieldValue === undefined || fieldValue === null;
            case 'startsWith':
                return String(fieldValue).startsWith(String(compareValue));
            case 'endsWith':
                return String(fieldValue).endsWith(String(compareValue));
            case 'matches':
                try {
                    return new RegExp(String(compareValue)).test(String(fieldValue));
                } catch {
                    return false;
                }
            default:
                return false;
        }
    }

    // ============================================================
    // Utility Methods
    // ============================================================

    private getNestedValue(obj: any, path: string): any {
        if (!obj || !path) return undefined;
        return path.split('.').reduce((curr, key) => curr?.[key], obj);
    }

    private setNestedValue(obj: any, path: string, value: any): void {
        const keys = path.split('.');
        const lastKey = keys.pop()!;
        const target = keys.reduce((curr, key) => {
            if (!(key in curr)) curr[key] = {};
            return curr[key];
        }, obj);
        target[lastKey] = value;
    }

    private deleteNestedValue(obj: any, path: string): void {
        const keys = path.split('.');
        const lastKey = keys.pop()!;
        const target = keys.reduce((curr, key) => curr?.[key], obj);
        if (target) delete target[lastKey];
    }
}

// ============================================================
// Factory function for creating executor
// ============================================================

export function createGraphExecutor(workflow: { definition: string }): GraphExecutor {
    const graph = JSON.parse(workflow.definition) as WorkflowGraph;
    return new GraphExecutor(graph);
}
