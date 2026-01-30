import { create } from 'zustand';
import type { Node, Edge } from '@xyflow/react';
import type { AgentNodeData } from '@/components/workflow/AgentNode';

export interface WorkflowDefinition {
    id: string;
    name: string;
    description: string;
    nodes: Node<AgentNodeData>[];
    edges: Edge[];
    status: 'draft' | 'active' | 'running' | 'completed' | 'failed';
    createdAt: string;
    updatedAt: string;
}

export interface ExecutionLog {
    id: string;
    agentId: string;
    agentName: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    input?: unknown;
    output?: unknown;
    error?: string;
    startedAt?: string;
    completedAt?: string;
    tokensUsed?: number;
    cost?: number;
}

export interface Execution {
    id: string;
    workflowId: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    startedAt: string;
    completedAt?: string;
    logs: ExecutionLog[];
    totalTokens?: number;
    totalCost?: number;
}

interface WorkflowState {
    // Current workflow being edited
    currentWorkflow: WorkflowDefinition | null;
    nodes: Node<AgentNodeData>[];
    edges: Edge[];
    selectedNodeId: string | null;
    isDirty: boolean;

    // Execution state
    currentExecution: Execution | null;
    executionHistory: Execution[];
    isExecuting: boolean;

    // Actions
    setCurrentWorkflow: (workflow: WorkflowDefinition | null) => void;
    setNodes: (nodes: Node<AgentNodeData>[]) => void;
    setEdges: (edges: Edge[]) => void;
    addNode: (node: Node<AgentNodeData>) => void;
    updateNode: (nodeId: string, data: Partial<AgentNodeData>) => void;
    removeNode: (nodeId: string) => void;
    selectNode: (nodeId: string | null) => void;
    setDirty: (isDirty: boolean) => void;

    // Execution actions
    setCurrentExecution: (execution: Execution | null) => void;
    updateExecutionLog: (log: ExecutionLog) => void;
    setExecuting: (isExecuting: boolean) => void;
    addExecutionToHistory: (execution: Execution) => void;

    // Reset
    reset: () => void;
}

const initialState = {
    currentWorkflow: null,
    nodes: [],
    edges: [],
    selectedNodeId: null,
    isDirty: false,
    currentExecution: null,
    executionHistory: [],
    isExecuting: false,
};

export const useWorkflowStore = create<WorkflowState>((set) => ({
    ...initialState,

    setCurrentWorkflow: (workflow) => set(() => ({
        currentWorkflow: workflow,
        nodes: workflow?.nodes || [],
        edges: workflow?.edges || [],
        isDirty: false,
    })),

    setNodes: (nodes) => set({ nodes, isDirty: true }),

    setEdges: (edges) => set({ edges, isDirty: true }),

    addNode: (node) => set((state) => ({
        nodes: [...state.nodes, node],
        isDirty: true,
    })),

    updateNode: (nodeId, data) => set((state) => ({
        nodes: state.nodes.map((node) =>
            node.id === nodeId
                ? { ...node, data: { ...node.data, ...data } }
                : node
        ),
        isDirty: true,
    })),

    removeNode: (nodeId) => set((state) => ({
        nodes: state.nodes.filter((node) => node.id !== nodeId),
        edges: state.edges.filter(
            (edge) => edge.source !== nodeId && edge.target !== nodeId
        ),
        selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
        isDirty: true,
    })),

    selectNode: (nodeId) => set({ selectedNodeId: nodeId }),

    setDirty: (isDirty) => set({ isDirty }),

    setCurrentExecution: (execution) => set({ currentExecution: execution }),

    updateExecutionLog: (log) => set((state) => {
        if (!state.currentExecution) return state;

        const existingIndex = state.currentExecution.logs.findIndex(
            (l) => l.id === log.id
        );

        const updatedLogs = existingIndex >= 0
            ? state.currentExecution.logs.map((l, i) =>
                i === existingIndex ? log : l
            )
            : [...state.currentExecution.logs, log];

        return {
            currentExecution: {
                ...state.currentExecution,
                logs: updatedLogs,
            },
        };
    }),

    setExecuting: (isExecuting) => set({ isExecuting }),

    addExecutionToHistory: (execution) => set((state) => ({
        executionHistory: [execution, ...state.executionHistory].slice(0, 50),
    })),

    reset: () => set(initialState),
}));

// Selector hooks for performance optimization
export const useNodes = () => useWorkflowStore((state) => state.nodes);
export const useEdges = () => useWorkflowStore((state) => state.edges);
export const useSelectedNode = () => {
    const nodes = useWorkflowStore((state) => state.nodes);
    const selectedNodeId = useWorkflowStore((state) => state.selectedNodeId);
    return nodes.find((node) => node.id === selectedNodeId) || null;
};
export const useIsExecuting = () => useWorkflowStore((state) => state.isExecuting);
export const useCurrentExecution = () => useWorkflowStore((state) => state.currentExecution);
