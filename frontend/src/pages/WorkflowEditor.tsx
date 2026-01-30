import { useCallback, useRef, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    addEdge,
    type Connection,
    type Node,
    type Edge,
    type OnNodesChange,
    ReactFlowProvider,
    useReactFlow,
    type ReactFlowInstance,
    BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import Sidebar from '@/components/workflow/Sidebar';
import PropertiesPanel from '@/components/workflow/PropertiesPanel';
import ExecutionMonitor from '@/components/workflow/ExecutionMonitor';
import AgentNode, { type AgentNodeData } from '@/components/workflow/AgentNode';
import ConditionNode from '@/components/workflow/ConditionNode';
import SwitchNode from '@/components/workflow/SwitchNode';
import LoopNode from '@/components/workflow/LoopNode';
import MergeNode from '@/components/workflow/MergeNode';
import HttpNode from '@/components/workflow/HttpNode';
import TransformerNode from '@/components/workflow/TransformerNode';
import TriggerNode from '@/components/workflow/TriggerNode';
import CodeNode from '@/components/workflow/CodeNode';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Save, Loader2, Play, RotateCcw, Activity, MessageSquare } from 'lucide-react';
import { toast } from "sonner";
import { api } from '@/lib/api';

let id = 0;
const getId = () => `agent_${id++}`;

// Register custom node types
const nodeTypes = {
    agent: AgentNode,
    condition: ConditionNode,
    switch: SwitchNode,
    loop: LoopNode,
    merge: MergeNode,
    http: HttpNode,
    transformer: TransformerNode,
    trigger: TriggerNode,
    code: CodeNode,
};

// Define the node type for this workflow
type WorkflowNode = Node<AgentNodeData>;
type WorkflowEdge = Edge;

function EditorContent() {
    const { id: workflowId } = useParams<{ id: string }>();
    const [nodes, setNodes, onNodesChange] = useNodesState<WorkflowNode>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<WorkflowEdge>([]);
    const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [executing, setExecuting] = useState(false);
    const [workflowName, setWorkflowName] = useState("");
    const [selectedNode, setSelectedNode] = useState<Node<AgentNodeData> | null>(null as any);
    const [showProperties, setShowProperties] = useState(false);
    const [showMonitor, setShowMonitor] = useState(false);
    const [currentExecutionId, setCurrentExecutionId] = useState<string | null>(null);
    const [showInputDialog, setShowInputDialog] = useState(false);
    const [workflowInput, setWorkflowInput] = useState("");
    const { fitView } = useReactFlow();

    const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

    // Load Workflow
    useEffect(() => {
        if (!workflowId) return;
        const load = async () => {
            try {
                const wf = await api.getWorkflow(workflowId);
                setWorkflowName(wf.name);
                if (wf.definition && wf.definition !== "{}") {
                    const flow = JSON.parse(wf.definition);
                    if (flow.nodes) {
                        // Migrate old nodes to new format
                        const migratedNodes = flow.nodes.map((node: any) => ({
                            ...node,
                            type: 'agent',
                            data: {
                                ...node.data,
                                agentType: node.data.agentType || 'default',
                                status: node.data.status || 'idle',
                                config: node.data.config || {}
                            }
                        }));
                        setNodes(migratedNodes);
                        // Update ID counter to avoid collisions
                        const maxId = migratedNodes.reduce((max: number, node: any) => {
                            const nodeNum = parseInt(node.id.replace('agent_', '').replace('dndnode_', ''));
                            return isNaN(nodeNum) ? max : Math.max(max, nodeNum);
                        }, 0);
                        id = maxId + 1;
                    }
                    if (flow.edges) setEdges(flow.edges);
                }
            } catch (err) {
                console.error("Failed to load", err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [workflowId, setNodes, setEdges]);

    // Handle node selection
    const onSelectionChange = useCallback(({ nodes }: { nodes: Node[] }) => {
        if (nodes.length === 1) {
            setSelectedNode(nodes[0] as unknown as Node<AgentNodeData>);
            setShowProperties(true);
        } else {
            setSelectedNode(null);
        }
    }, []);

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            if (!reactFlowWrapper.current || !reactFlowInstance) {
                return;
            }

            const type = event.dataTransfer.getData('application/reactflow');
            const agentType = event.dataTransfer.getData('application/agenttype');
            const label = event.dataTransfer.getData('application/label');

            if (typeof type === 'undefined' || !type) {
                return;
            }

            const position = reactFlowInstance.screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            // Determine the node type based on the agentType
            const getNodeType = (agentType: string): string => {
                switch (agentType) {
                    case 'condition':
                        return 'condition';
                    case 'switch':
                        return 'switch';
                    case 'loop':
                        return 'loop';
                    case 'merge':
                        return 'merge';
                    case 'http':
                        return 'http';
                    case 'transformer':
                    case 'filter':
                    case 'mapper':
                        return 'transformer';
                    case 'trigger-webhook':
                    case 'trigger-schedule':
                    case 'trigger-manual':
                        return 'trigger';
                    case 'code':
                        return 'code';
                    default:
                        return 'agent';
                }
            };

            const nodeType = getNodeType(agentType);

            // Build node data based on type
            let nodeData: any = {
                label: label || 'New Node',
                status: 'idle',
            };

            // Add type-specific default data
            if (nodeType === 'condition') {
                nodeData = { ...nodeData, field: 'data.value', operator: 'equals', value: '' };
            } else if (nodeType === 'switch') {
                nodeData = { ...nodeData, field: 'data.type', cases: [{ value: 'A', label: 'Case A' }] };
            } else if (nodeType === 'loop') {
                nodeData = { ...nodeData, arrayField: 'data.items', itemVariable: 'item' };
            } else if (nodeType === 'merge') {
                nodeData = { ...nodeData, mode: 'waitAll', inputCount: 2 };
            } else if (nodeType === 'http') {
                nodeData = { ...nodeData, method: 'GET', url: '' };
            } else if (nodeType === 'transformer') {
                nodeData = { ...nodeData, operations: [] };
            } else if (nodeType === 'trigger') {
                const triggerType = agentType.replace('trigger-', '') as 'webhook' | 'schedule' | 'manual';
                nodeData = { ...nodeData, triggerType };
            } else if (nodeType === 'code') {
                nodeData = { ...nodeData, code: '// Your JavaScript code here\nreturn { output: input };', language: 'javascript' };
            } else {
                // Agent node
                nodeData = {
                    ...nodeData,
                    agentType: agentType || 'default',
                    config: {
                        model: 'gemini-2.0-flash',
                        temperature: 0.7,
                        maxTokens: 2048,
                        systemPrompt: ''
                    }
                };
            }

            const newNode: Node<any> = {
                id: getId(),
                type: nodeType,
                position,
                data: nodeData,
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [reactFlowInstance, setNodes],
    );

    const handleSave = async () => {
        if (!reactFlowInstance || !workflowId) return;
        setSaving(true);
        const flow = reactFlowInstance.toObject();
        try {
            await api.saveWorkflow(workflowId, { definition: flow });
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    const handleExecuteClick = () => {
        setShowInputDialog(true);
    };

    const handleExecute = async () => {
        if (!workflowId) return;

        setShowInputDialog(false);

        // Save first
        if (reactFlowInstance) {
            const flow = reactFlowInstance.toObject();
            await api.saveWorkflow(workflowId, { definition: flow });
        }

        setExecuting(true);
        setShowMonitor(true);

        try {
            // Pass the workflow input to the execution
            const input = workflowInput.trim() ? { prompt: workflowInput } : {};
            const result = await api.executeWorkflow(workflowId, input);
            setCurrentExecutionId(result.executionId);

            // Update node statuses to running
            setNodes((nds) =>
                nds.map((node) => ({
                    ...node,
                    data: { ...node.data, status: 'running' }
                }))
            );
        } catch (e: any) {
            console.error('Execution failed:', e);
            toast.error(e.message || 'Failed to execute workflow');
        } finally {
            setExecuting(false);
        }
    };

    const handleUpdateNode = useCallback((nodeId: string, data: Partial<AgentNodeData>) => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === nodeId) {
                    return {
                        ...node,
                        data: { ...node.data, ...data }
                    };
                }
                return node;
            })
        );
        // Update selected node reference
        setSelectedNode((prev) => {
            if (prev && prev.id === nodeId) {
                return { ...prev, data: { ...prev.data, ...data } };
            }
            return prev;
        });
    }, [setNodes]);

    const handleDeleteNode = useCallback((nodeId: string) => {
        setNodes((nds) => nds.filter((node) => node.id !== nodeId));
        setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
        setSelectedNode(null);
        setShowProperties(false);
    }, [setNodes, setEdges]);

    const handleDuplicateNode = useCallback((nodeId: string) => {
        const nodeToDuplicate = nodes.find((node) => node.id === nodeId);
        if (nodeToDuplicate) {
            const newNode: Node<AgentNodeData> = {
                ...nodeToDuplicate,
                id: getId(),
                position: {
                    x: nodeToDuplicate.position.x + 50,
                    y: nodeToDuplicate.position.y + 50,
                },
                data: { ...nodeToDuplicate.data as AgentNodeData },
                selected: false,
            };
            setNodes((nds) => nds.concat(newNode));
        }
    }, [nodes, setNodes]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-[hsl(225_15%_5%)]">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-4" />
                    <p className="text-[hsl(220_9%_63%)]">Loading workflow...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[hsl(225_15%_5%)]">
            {/* Header */}
            <div className="border-b border-[hsl(225_8%_18%)] px-4 py-3 flex items-center justify-between bg-[hsl(225_12%_8%)]">
                <div className="flex items-center gap-4">
                    <div>
                        <h2 className="text-lg font-semibold text-[hsl(220_13%_91%)]">
                            {workflowName || "Untitled Workflow"}
                        </h2>
                        <p className="text-xs text-[hsl(220_7%_45%)]">
                            {nodes.length} agents • {edges.length} connections
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fitView({ padding: 0.2 })}
                        className="bg-transparent border-[hsl(225_8%_18%)] text-[hsl(220_13%_91%)] hover:bg-[hsl(225_9%_15%)]"
                    >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reset View
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowMonitor(!showMonitor)}
                        className="bg-transparent border-[hsl(225_8%_18%)] text-purple-400 hover:bg-purple-500/10 hover:text-purple-400"
                    >
                        <Activity className="w-4 h-4 mr-2" />
                        Monitor
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExecuteClick}
                        disabled={executing || nodes.length === 0}
                        className="bg-transparent border-[hsl(225_8%_18%)] text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-400"
                    >
                        {executing ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Play className="w-4 h-4 mr-2" />
                        )}
                        Execute
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Save className="mr-2 h-4 w-4" />
                        Save
                    </Button>
                </div>
            </div>

            {/* Editor Body */}
            <div className="flex flex-1 overflow-hidden">
                <Sidebar />

                <div className="flex-1 h-full" ref={reactFlowWrapper}>
                    <ReactFlow
                        nodes={nodes as Node[]}
                        edges={edges}
                        onNodesChange={onNodesChange as OnNodesChange<Node>}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onInit={setReactFlowInstance}
                        onDrop={onDrop}
                        onDragOver={onDragOver}
                        onSelectionChange={onSelectionChange}
                        nodeTypes={nodeTypes}
                        fitView
                        proOptions={{ hideAttribution: true }}
                        defaultEdgeOptions={{
                            style: { stroke: 'hsl(239, 84%, 67%)', strokeWidth: 2 },
                            type: 'smoothstep',
                        }}
                    >
                        <Background
                            variant={BackgroundVariant.Dots}
                            gap={24}
                            size={1}
                            color="hsl(225, 8%, 18%)"
                        />
                        <Controls
                            className="!bg-[hsl(225_10%_11%)] !border-[hsl(225_8%_18%)] !rounded-lg"
                        />
                        <MiniMap
                            className="!bg-[hsl(225_12%_8%)] !border-[hsl(225_8%_18%)]"
                            nodeColor={(node) => {
                                const agentType = node.data?.agentType as string;
                                switch (agentType) {
                                    case 'web-scraper':
                                    case 'research':
                                    case 'news-monitor':
                                        return '#2563eb'; // blue-600
                                    case 'data-analyst':
                                    case 'sentiment':
                                    case 'trend':
                                        return '#059669'; // emerald-600
                                    case 'writer':
                                    case 'editor':
                                    case 'summarizer':
                                        return '#9333ea'; // purple-600
                                    case 'code-generator':
                                    case 'code-reviewer':
                                        return '#ea580c'; // orange-600
                                    default:
                                        return '#4f46e5'; // indigo-600 (default)
                                }
                            }}
                            maskColor="rgba(0, 0, 0, 0.7)"
                        />
                    </ReactFlow>
                </div>

                {showProperties && (
                    <PropertiesPanel
                        selectedNode={selectedNode}
                        onClose={() => {
                            setShowProperties(false);
                            setSelectedNode(null);
                        }}
                        onUpdateNode={handleUpdateNode}
                        onDeleteNode={handleDeleteNode}
                        onDuplicateNode={handleDuplicateNode}
                    />
                )}
            </div>

            {/* Execution Monitor */}
            {showMonitor && workflowId && (
                <ExecutionMonitor
                    workflowId={workflowId}
                    executionId={currentExecutionId}
                    onClose={() => setShowMonitor(false)}
                    onExecute={handleExecute}
                />
            )}

            {/* Input Dialog */}
            <Dialog open={showInputDialog} onOpenChange={setShowInputDialog}>
                <DialogContent className="bg-[hsl(225_12%_8%)] border-[hsl(225_8%_18%)] text-[hsl(220_13%_91%)]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-indigo-400" />
                            Execute Workflow
                        </DialogTitle>
                        <DialogDescription className="text-[hsl(220_9%_63%)]">
                            Provide input for the workflow. This will be passed to the first agent.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="workflow-input" className="text-[hsl(220_9%_63%)]">
                                Input Prompt
                            </Label>
                            <textarea
                                id="workflow-input"
                                value={workflowInput}
                                onChange={(e) => setWorkflowInput(e.target.value)}
                                placeholder="Enter your prompt or input text..."
                                rows={4}
                                className="w-full px-3 py-2 text-sm rounded-md resize-none bg-[hsl(225_10%_11%)] border border-[hsl(225_8%_18%)] text-[hsl(220_13%_91%)] placeholder:text-[hsl(220_7%_45%)] focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/25 focus:outline-none"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowInputDialog(false)}
                            className="bg-transparent border-[hsl(225_8%_18%)] text-[hsl(220_13%_91%)]"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleExecute}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            <Play className="w-4 h-4 mr-2" />
                            Execute
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function WorkflowEditor() {
    return (
        <ReactFlowProvider>
            <EditorContent />
        </ReactFlowProvider>
    );
}
