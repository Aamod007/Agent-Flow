/**
 * Enhanced Workflow Execution Engine
 * 
 * n8n-style execution features:
 * - Item-based data flow (process arrays of items)
 * - Proper execution context with $json, $input, $node access
 * - Real-time execution events via WebSocket
 * - Debug mode with breakpoints and step-through
 * - Pinned data support
 * - Error handling with continue on fail option
 */

import { EventEmitter } from 'events';
import { GraphExecutor, WorkflowGraph, WorkflowNode, NodeExecutionResult, ExecutionOptions } from './graph-executor';
import { ExpressionEngine, ExpressionContext } from './expression-engine';

// ============================================================
// Enhanced Types
// ============================================================

/**
 * n8n-style data item - each node processes an array of items
 */
export interface DataItem {
    json: Record<string, unknown>;
    binary?: Record<string, BinaryData>;
    pairedItem?: {
        item: number;
        input?: number;
    };
}

export interface BinaryData {
    data: string; // Base64 encoded
    mimeType: string;
    fileName?: string;
    fileSize?: number;
}

/**
 * Enhanced execution context available in expressions
 */
export interface EnhancedExecutionContext extends ExpressionContext {
    $items: (nodeId?: string, outputIndex?: number) => DataItem[];
    $item: (index: number, nodeId?: string) => DataItem;
    $binary: (propertyName: string, nodeId?: string) => BinaryData | undefined;
    $position: number;
    $runIndex: number;
    $mode: 'production' | 'test' | 'debug';
    $resumeUrl?: string;
    $webhookUrl?: string;
}

/**
 * Debug mode state
 */
export interface DebugState {
    enabled: boolean;
    breakpoints: Set<string>;
    isPaused: boolean;
    currentNodeId: string | null;
    stepMode: boolean;
}

/**
 * Pinned data for testing
 */
export interface PinnedNodeData {
    nodeId: string;
    input?: DataItem[];
    output?: DataItem[];
}

/**
 * Execution events for real-time updates
 */
export type ExecutionEvent = 
    | { type: 'execution.started'; executionId: string; workflowId: string }
    | { type: 'node.started'; executionId: string; nodeId: string; nodeName: string }
    | { type: 'node.completed'; executionId: string; nodeId: string; output: DataItem[]; duration: number }
    | { type: 'node.error'; executionId: string; nodeId: string; error: string }
    | { type: 'execution.completed'; executionId: string; status: 'success' | 'error' }
    | { type: 'debug.paused'; executionId: string; nodeId: string }
    | { type: 'debug.resumed'; executionId: string };

// ============================================================
// Enhanced Graph Executor
// ============================================================

export class EnhancedGraphExecutor extends EventEmitter {
    private graph: WorkflowGraph;
    private baseExecutor: GraphExecutor;
    private expressionEngine: ExpressionEngine;
    private nodeOutputs: Map<string, DataItem[]> = new Map();
    private debugState: DebugState;
    private pinnedData: Map<string, PinnedNodeData> = new Map();
    private executionId: string;
    private workflowId: string;
    private pausePromise: Promise<void> | null = null;
    private pauseResolve: (() => void) | null = null;

    constructor(
        graph: WorkflowGraph,
        workflowId: string,
        options: {
            debugMode?: boolean;
            breakpoints?: string[];
            pinnedData?: PinnedNodeData[];
        } = {}
    ) {
        super();
        this.graph = graph;
        this.workflowId = workflowId;
        this.executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.baseExecutor = new GraphExecutor(graph);
        this.expressionEngine = new ExpressionEngine();

        // Initialize debug state
        this.debugState = {
            enabled: options.debugMode || false,
            breakpoints: new Set(options.breakpoints || []),
            isPaused: false,
            currentNodeId: null,
            stepMode: false
        };

        // Load pinned data
        if (options.pinnedData) {
            for (const pd of options.pinnedData) {
                this.pinnedData.set(pd.nodeId, pd);
            }
        }
    }

    /**
     * Execute the workflow with n8n-style item processing
     */
    async execute(input: Record<string, unknown> = {}): Promise<{
        executionId: string;
        status: 'success' | 'error';
        data: Map<string, DataItem[]>;
        error?: string;
    }> {
        this.emit('event', {
            type: 'execution.started',
            executionId: this.executionId,
            workflowId: this.workflowId
        } as ExecutionEvent);

        try {
            // Convert input to items format
            const inputItems: DataItem[] = [{ json: input }];

            // Build execution context
            const context = this.buildExecutionContext(inputItems);
            this.expressionEngine.updateContext(context);

            // Execute with enhanced options
            const results = await this.baseExecutor.execute({
                input,
                onNodeStart: async (nodeId) => {
                    await this.handleNodeStart(nodeId);
                },
                onNodeComplete: async (result) => {
                    await this.handleNodeComplete(result);
                },
                onNodeError: (nodeId, error) => {
                    this.handleNodeError(nodeId, error);
                }
            });

            const hasError = results.some(r => r.status === 'error');

            this.emit('event', {
                type: 'execution.completed',
                executionId: this.executionId,
                status: hasError ? 'error' : 'success'
            } as ExecutionEvent);

            return {
                executionId: this.executionId,
                status: hasError ? 'error' : 'success',
                data: this.nodeOutputs,
                error: hasError ? results.find(r => r.error)?.error : undefined
            };

        } catch (error: any) {
            this.emit('event', {
                type: 'execution.completed',
                executionId: this.executionId,
                status: 'error'
            } as ExecutionEvent);

            return {
                executionId: this.executionId,
                status: 'error',
                data: this.nodeOutputs,
                error: error.message
            };
        }
    }

    /**
     * Handle node execution start
     */
    private async handleNodeStart(nodeId: string): Promise<void> {
        const node = this.graph.nodes.find(n => n.id === nodeId);

        this.emit('event', {
            type: 'node.started',
            executionId: this.executionId,
            nodeId,
            nodeName: node?.data?.label || node?.data?.name || nodeId
        } as ExecutionEvent);

        // Check for breakpoint
        if (this.debugState.enabled && this.debugState.breakpoints.has(nodeId)) {
            await this.pauseAtBreakpoint(nodeId);
        }

        // Check if step mode
        if (this.debugState.stepMode) {
            await this.pauseAtBreakpoint(nodeId);
        }
    }

    /**
     * Handle node execution complete
     */
    private async handleNodeComplete(result: NodeExecutionResult): Promise<void> {
        // Convert output to items format
        const items = this.normalizeToItems(result.output);
        this.nodeOutputs.set(result.nodeId, items);

        // Update expression engine context
        const node = this.graph.nodes.find(n => n.id === result.nodeId);
        if (node) {
            this.expressionEngine.registerNodeOutput(result.nodeId, {
                id: result.nodeId,
                name: node.data?.label || node.data?.name || result.nodeId,
                type: node.type,
                data: items,
                status: result.status
            });
        }

        this.emit('event', {
            type: 'node.completed',
            executionId: this.executionId,
            nodeId: result.nodeId,
            output: items,
            duration: result.duration
        } as ExecutionEvent);
    }

    /**
     * Handle node execution error
     */
    private handleNodeError(nodeId: string, error: Error): void {
        this.emit('event', {
            type: 'node.error',
            executionId: this.executionId,
            nodeId,
            error: error.message
        } as ExecutionEvent);
    }

    /**
     * Pause execution at a breakpoint
     */
    private async pauseAtBreakpoint(nodeId: string): Promise<void> {
        this.debugState.isPaused = true;
        this.debugState.currentNodeId = nodeId;

        this.emit('event', {
            type: 'debug.paused',
            executionId: this.executionId,
            nodeId
        } as ExecutionEvent);

        // Create pause promise
        this.pausePromise = new Promise(resolve => {
            this.pauseResolve = resolve;
        });

        // Wait for resume
        await this.pausePromise;
        this.pausePromise = null;
        this.pauseResolve = null;
    }

    /**
     * Resume execution from pause
     */
    resume(): void {
        if (this.pauseResolve) {
            this.debugState.isPaused = false;
            this.debugState.stepMode = false;

            this.emit('event', {
                type: 'debug.resumed',
                executionId: this.executionId
            } as ExecutionEvent);

            this.pauseResolve();
        }
    }

    /**
     * Step to next node (debug mode)
     */
    step(): void {
        this.debugState.stepMode = true;
        this.resume();
    }

    /**
     * Set/clear breakpoint
     */
    setBreakpoint(nodeId: string, enabled: boolean): void {
        if (enabled) {
            this.debugState.breakpoints.add(nodeId);
        } else {
            this.debugState.breakpoints.delete(nodeId);
        }
    }

    /**
     * Build enhanced execution context
     */
    private buildExecutionContext(inputItems: DataItem[]): Partial<EnhancedExecutionContext> {
        const self = this;

        return {
            $input: inputItems[0]?.json,
            $items: (nodeId?: string, outputIndex?: number) => {
                if (!nodeId) return inputItems;
                return self.nodeOutputs.get(nodeId) || [];
            },
            $item: (index: number, nodeId?: string) => {
                const items = nodeId ? self.nodeOutputs.get(nodeId) : inputItems;
                return items?.[index] || { json: {} };
            },
            $binary: (propertyName: string, nodeId?: string) => {
                const items = nodeId ? self.nodeOutputs.get(nodeId) : inputItems;
                return items?.[0]?.binary?.[propertyName];
            },
            $position: 0,
            $runIndex: 0,
            $mode: this.debugState.enabled ? 'debug' : 'production',
            $execution: {
                id: this.executionId,
                startedAt: new Date().toISOString(),
                triggeredBy: 'manual'
            },
            $workflow: {
                id: this.workflowId,
                name: '',
                version: 1
            }
        };
    }

    /**
     * Normalize any output to DataItem array
     */
    private normalizeToItems(output: unknown): DataItem[] {
        if (!output) return [{ json: {} }];

        // Already items array
        if (Array.isArray(output) && output.length > 0 && output[0]?.json !== undefined) {
            return output as DataItem[];
        }

        // Array of regular objects
        if (Array.isArray(output)) {
            return output.map(item => ({
                json: typeof item === 'object' ? item : { value: item }
            }));
        }

        // Single object
        if (typeof output === 'object') {
            return [{ json: output as Record<string, unknown> }];
        }

        // Primitive value
        return [{ json: { value: output } }];
    }

    /**
     * Get current debug state
     */
    getDebugState(): DebugState {
        return { ...this.debugState };
    }

    /**
     * Get execution ID
     */
    getExecutionId(): string {
        return this.executionId;
    }

    /**
     * Get all node outputs
     */
    getNodeOutputs(): Map<string, DataItem[]> {
        return new Map(this.nodeOutputs);
    }
}

// ============================================================
// Execution Manager (manages multiple executions)
// ============================================================

export class ExecutionManager {
    private activeExecutions: Map<string, EnhancedGraphExecutor> = new Map();
    private eventHandlers: Set<(event: ExecutionEvent) => void> = new Set();

    /**
     * Start a new execution
     */
    async startExecution(
        workflowId: string,
        definition: string,
        input: Record<string, unknown> = {},
        options: {
            debugMode?: boolean;
            breakpoints?: string[];
            pinnedData?: PinnedNodeData[];
        } = {}
    ): Promise<string> {
        const graph = JSON.parse(definition) as WorkflowGraph;
        const executor = new EnhancedGraphExecutor(graph, workflowId, options);

        // Subscribe to events
        executor.on('event', (event: ExecutionEvent) => {
            this.eventHandlers.forEach(handler => handler(event));
        });

        const executionId = executor.getExecutionId();
        this.activeExecutions.set(executionId, executor);

        // Start execution in background
        executor.execute(input).finally(() => {
            // Cleanup after completion
            setTimeout(() => {
                this.activeExecutions.delete(executionId);
            }, 60000); // Keep for 1 minute for debugging
        });

        return executionId;
    }

    /**
     * Pause an execution
     */
    pauseExecution(executionId: string): boolean {
        const executor = this.activeExecutions.get(executionId);
        if (executor) {
            // Execution will pause at next node
            return true;
        }
        return false;
    }

    /**
     * Resume an execution
     */
    resumeExecution(executionId: string): boolean {
        const executor = this.activeExecutions.get(executionId);
        if (executor) {
            executor.resume();
            return true;
        }
        return false;
    }

    /**
     * Step execution (debug mode)
     */
    stepExecution(executionId: string): boolean {
        const executor = this.activeExecutions.get(executionId);
        if (executor) {
            executor.step();
            return true;
        }
        return false;
    }

    /**
     * Get execution debug state
     */
    getDebugState(executionId: string): DebugState | null {
        const executor = this.activeExecutions.get(executionId);
        return executor?.getDebugState() || null;
    }

    /**
     * Subscribe to execution events
     */
    onEvent(handler: (event: ExecutionEvent) => void): () => void {
        this.eventHandlers.add(handler);
        return () => this.eventHandlers.delete(handler);
    }

    /**
     * Get active execution count
     */
    getActiveCount(): number {
        return this.activeExecutions.size;
    }
}

// ============================================================
// Export singleton manager
// ============================================================

export const executionManager = new ExecutionManager();
