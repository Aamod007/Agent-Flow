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
// New n8n-style nodes
import SetNode from '@/components/workflow/SetNode';
import WaitNode from '@/components/workflow/WaitNode';
import ErrorTriggerNode from '@/components/workflow/ErrorTriggerNode';
import RespondWebhookNode from '@/components/workflow/RespondWebhookNode';
import DatabaseNode from '@/components/workflow/DatabaseNode';
import StickyNoteNode from '@/components/workflow/StickyNoteNode';
import SubWorkflowNode from '@/components/workflow/SubWorkflowNode';
import GroupNode from '@/components/workflow/GroupNode';
// Custom edge types
import { MemoizedCustomEdge } from '@/components/workflow/ConnectionTypes';
// Additional dialogs and panels
import ImportExportDialog from '@/components/workflow/ImportExportDialog';
import CredentialManager from '@/components/workflow/CredentialManager';
import WebhookManager from '@/components/workflow/WebhookManager';
import ScheduleManager from '@/components/workflow/ScheduleManager';
import DebugPanel, { type Breakpoint } from '@/components/workflow/DebugPanel';
import PinDataPanel, { usePinnedData } from '@/components/workflow/PinDataPanel';
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
import { Save, Loader2, Play, RotateCcw, Activity, Download, Key, Webhook, Clock, Bug, Sparkles, ChevronLeft } from 'lucide-react';
import { toast } from "sonner";
import { api } from '@/lib/api';
import AIAssistant from '@/components/workflow/AIAssistant';
import { Link } from 'react-router-dom';

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
    // New n8n-style nodes
    set: SetNode,
    wait: WaitNode,
    errorTrigger: ErrorTriggerNode,
    respondWebhook: RespondWebhookNode,
    database: DatabaseNode,
    stickyNote: StickyNoteNode,
    subWorkflow: SubWorkflowNode,
    group: GroupNode,
};

// Custom edge types
const edgeTypes = {
    custom: MemoizedCustomEdge,
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
    // New dialog states
    const [showImportExport, setShowImportExport] = useState(false);
    const [showCredentials, setShowCredentials] = useState(false);
    const [showWebhooks, setShowWebhooks] = useState(false);
    const [showSchedules, setShowSchedules] = useState(false);
    const [showDebugPanel, setShowDebugPanel] = useState(false);
    const [showAIAssistant, setShowAIAssistant] = useState(false);
    const [_breakpoints, setBreakpoints] = useState<Map<string, Breakpoint>>(new Map());
    const [_highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);
    const [showPinPanel, setShowPinPanel] = useState(false);
    const [pinPanelNodeId, _setPinPanelNodeId] = useState<string | null>(null);
    const { pinData, unpinData, getPinnedData } = usePinnedData();
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
                    // New n8n-style nodes
                    case 'set':
                        return 'set';
                    case 'wait':
                        return 'wait';
                    case 'error-trigger':
                        return 'errorTrigger';
                    case 'respond-webhook':
                        return 'respondWebhook';
                    case 'database':
                        return 'database';
                    case 'sticky-note':
                        return 'stickyNote';
                    case 'sub-workflow':
                    case 'execute-workflow':
                        return 'subWorkflow';
                    case 'group':
                        return 'group';
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
            } else if (nodeType === 'set') {
                nodeData = { ...nodeData, mode: 'manual', fields: [], keepOnlySet: false };
            } else if (nodeType === 'wait') {
                nodeData = { ...nodeData, waitType: 'time', duration: 5, unit: 'seconds' };
            } else if (nodeType === 'errorTrigger') {
                nodeData = { ...nodeData, errorTypes: ['all'], retryEnabled: false, retryAttempts: 3 };
            } else if (nodeType === 'respondWebhook') {
                nodeData = { ...nodeData, responseCode: 200, responseBody: '{ "success": true }', contentType: 'application/json' };
            } else if (nodeType === 'database') {
                nodeData = { ...nodeData, operation: 'select', connection: '', table: '' };
            } else if (nodeType === 'stickyNote') {
                nodeData = { ...nodeData, content: 'Add your notes here...', color: 'yellow', fontSize: 'medium' };
            } else if (nodeType === 'subWorkflow') {
                nodeData = { ...nodeData, workflowId: '', workflowName: '', waitForCompletion: true, inputMapping: {}, outputMapping: {} };
            } else if (nodeType === 'group') {
                nodeData = { ...nodeData, label: 'New Group', description: '', color: 'gray', collapsed: false, childNodeIds: [], width: 400, height: 300 };
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
        <div className="flex flex-col h-full w-full bg-zinc-950">
            {/* Header - n8n style */}
            <div className="border-b border-zinc-800/60 px-4 py-2 flex items-center justify-between bg-zinc-900/80 backdrop-blur-sm shrink-0">
                <div className="flex items-center gap-4">
                    <Link 
                        to="/dashboard/workflows"
                        className="p-2 rounded-lg hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-200 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <div className="h-6 w-px bg-zinc-800" />
                    <div>
                        <h2 className="text-sm font-semibold text-zinc-100">
                            {workflowName || "Untitled Workflow"}
                        </h2>
                        <p className="text-[10px] text-zinc-500">
                            {nodes.length} agents • {edges.length} connections
                        </p>
                    </div>
                </div>

                {/* Centered toolbar */}
                <div className="flex items-center gap-1 bg-zinc-900/50 border border-zinc-800/50 rounded-lg p-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => fitView({ padding: 0.2 })}
                        className="h-8 px-3 text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
                    >
                        <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                        Reset
                    </Button>
                    <div className="h-5 w-px bg-zinc-800" />
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowMonitor(!showMonitor)}
                        className={`h-8 px-3 text-xs ${showMonitor ? 'text-purple-400 bg-purple-500/10' : 'text-zinc-400'} hover:text-purple-400 hover:bg-purple-500/10`}
                    >
                        <Activity className="w-3.5 h-3.5 mr-1.5" />
                        Monitor
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowCredentials(true)}
                        className="h-8 px-3 text-xs text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10"
                    >
                        <Key className="w-3.5 h-3.5 mr-1.5" />
                        Credentials
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowWebhooks(true)}
                        className="h-8 px-3 text-xs text-zinc-400 hover:text-purple-400 hover:bg-purple-500/10"
                    >
                        <Webhook className="w-3.5 h-3.5 mr-1.5" />
                        Webhooks
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowSchedules(true)}
                        className="h-8 px-3 text-xs text-zinc-400 hover:text-orange-400 hover:bg-orange-500/10"
                    >
                        <Clock className="w-3.5 h-3.5 mr-1.5" />
                        Schedules
                    </Button>
                    <div className="h-5 w-px bg-zinc-800" />
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDebugPanel(!showDebugPanel)}
                        className={`h-8 px-3 text-xs ${showDebugPanel ? 'text-red-400 bg-red-500/10' : 'text-zinc-400'} hover:text-red-400 hover:bg-red-500/10`}
                    >
                        <Bug className="w-3.5 h-3.5 mr-1.5" />
                        Debug
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowImportExport(true)}
                        className="h-8 px-3 text-xs text-zinc-400 hover:text-cyan-400 hover:bg-cyan-500/10"
                    >
                        <Download className="w-3.5 h-3.5 mr-1.5" />
                        Import
                    </Button>
                </div>

                {/* Right side actions */}
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAIAssistant(!showAIAssistant)}
                        className={`h-8 px-3 text-xs ${showAIAssistant ? 'text-purple-400 bg-purple-500/10' : 'text-zinc-400'} hover:text-purple-400 hover:bg-purple-500/10`}
                    >
                        <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                        AI Help
                    </Button>
                    <div className="h-5 w-px bg-zinc-800" />
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleExecuteClick}
                        disabled={executing || nodes.length === 0}
                        className="h-8 px-3 text-xs text-emerald-400 hover:text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-50"
                    >
                        {executing ? (
                            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        ) : (
                            <Play className="w-3.5 h-3.5 mr-1.5" />
                        )}
                        Execute
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        size="sm"
                        className="h-8 px-4 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                        {saving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                        <Save className="mr-1.5 h-3.5 w-3.5" />
                        Save
                    </Button>
                </div>
            </div>

            {/* Editor Body */}
            <div className="flex flex-1 overflow-hidden min-h-0">
                <Sidebar />

                <div className="flex-1 h-full min-h-0" ref={reactFlowWrapper}>
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
                        edgeTypes={edgeTypes}
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
                <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Play className="w-5 h-5 text-emerald-400" />
                            Execute Workflow
                        </DialogTitle>
                        <DialogDescription className="text-zinc-500">
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

            {/* Import/Export Dialog */}
            <ImportExportDialog
                isOpen={showImportExport}
                onClose={() => setShowImportExport(false)}
                onImport={(data) => {
                    setNodes(data.nodes as WorkflowNode[]);
                    setEdges(data.edges);
                    if (data.name) setWorkflowName(data.name);
                    toast.success('Workflow imported successfully');
                }}
                currentWorkflow={{
                    name: workflowName,
                    version: '1.0.0',
                    nodes: nodes as any[],
                    edges: edges as any[],
                }}
            />

            {/* Credentials Manager */}
            <CredentialManager
                isOpen={showCredentials}
                onClose={() => setShowCredentials(false)}
            />

            {/* Webhook Manager */}
            {workflowId && (
                <WebhookManager
                    workflowId={workflowId}
                    isOpen={showWebhooks}
                    onClose={() => setShowWebhooks(false)}
                />
            )}

            {/* Schedule Manager */}
            {workflowId && (
                <ScheduleManager
                    workflowId={workflowId}
                    isOpen={showSchedules}
                    onClose={() => setShowSchedules(false)}
                />
            )}

            {/* Debug Panel */}
            {showDebugPanel && workflowId && (
                <div className="absolute right-0 top-0 bottom-0 z-50">
                    <DebugPanel
                        workflowId={workflowId}
                        nodes={nodes.map(n => ({ id: n.id, data: n.data as any }))}
                        isOpen={showDebugPanel}
                        onClose={() => setShowDebugPanel(false)}
                        onBreakpointChange={setBreakpoints}
                        onNodeHighlight={(nodeId) => {
                            setHighlightedNodeId(nodeId);
                            if (nodeId) {
                                const node = nodes.find(n => n.id === nodeId);
                                if (node && reactFlowInstance) {
                                    reactFlowInstance.fitView({ 
                                        nodes: [{ id: nodeId }], 
                                        padding: 0.5,
                                        duration: 500
                                    });
                                }
                            }
                        }}
                    />
                </div>
            )}

            {/* Pin Data Panel */}
            {showPinPanel && pinPanelNodeId && workflowId && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowPinPanel(false)}>
                    <div onClick={e => e.stopPropagation()}>
                        <PinDataPanel
                            workflowId={workflowId}
                            nodeId={pinPanelNodeId}
                            nodeName={nodes.find(n => n.id === pinPanelNodeId)?.data?.label || pinPanelNodeId}
                            pinnedData={getPinnedData(pinPanelNodeId)}
                            onPin={(data) => pinData(pinPanelNodeId, data)}
                            onUnpin={() => unpinData(pinPanelNodeId)}
                            onClose={() => setShowPinPanel(false)}
                        />
                    </div>
                </div>
            )}

            {/* AI Assistant */}
            {showAIAssistant && (
                <AIAssistant
                    onClose={() => setShowAIAssistant(false)}
                    currentNodes={nodes}
                    currentEdges={edges}
                />
            )}
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
