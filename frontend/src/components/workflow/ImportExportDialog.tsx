import { useState, memo, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Download,
    Upload,
    FileJson,
    CheckCircle,
    AlertTriangle,
    Copy,
    Loader2,
    FileCode,
    Braces,
    ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import type { Node, Edge } from '@xyflow/react';

interface WorkflowData {
    name: string;
    version: string;
    description?: string;
    nodes: Node[];
    edges: Edge[];
    settings?: Record<string, any>;
}

interface N8nWorkflow {
    name: string;
    nodes: Array<{
        id: string;
        name: string;
        type: string;
        typeVersion: number;
        position: [number, number];
        parameters: Record<string, any>;
        credentials?: Record<string, any>;
    }>;
    connections: Record<string, {
        main: Array<Array<{
            node: string;
            type: string;
            index: number;
        }>>;
    }>;
    settings?: Record<string, any>;
}

interface ImportExportDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (data: WorkflowData) => void;
    currentWorkflow: WorkflowData;
}

// Convert n8n workflow to Agent-Flow format
function convertFromN8n(n8nWorkflow: N8nWorkflow): WorkflowData {
    const nodeTypeMap: Record<string, string> = {
        'n8n-nodes-base.start': 'trigger',
        'n8n-nodes-base.manualTrigger': 'trigger',
        'n8n-nodes-base.webhook': 'trigger',
        'n8n-nodes-base.scheduleTrigger': 'trigger',
        'n8n-nodes-base.httpRequest': 'http',
        'n8n-nodes-base.code': 'code',
        'n8n-nodes-base.if': 'condition',
        'n8n-nodes-base.switch': 'switch',
        'n8n-nodes-base.merge': 'merge',
        'n8n-nodes-base.set': 'set',
        'n8n-nodes-base.wait': 'wait',
        'n8n-nodes-base.errorTrigger': 'errorTrigger',
        'n8n-nodes-base.respondToWebhook': 'respondWebhook',
        'n8n-nodes-base.postgres': 'database',
        'n8n-nodes-base.mysql': 'database',
        'n8n-nodes-base.stickyNote': 'stickyNote',
    };

    const nodes: Node[] = n8nWorkflow.nodes.map((n8nNode) => {
        const nodeType = nodeTypeMap[n8nNode.type] || 'agent';
        
        return {
            id: n8nNode.id || n8nNode.name.replace(/\s+/g, '_'),
            type: nodeType,
            position: {
                x: n8nNode.position[0],
                y: n8nNode.position[1],
            },
            data: {
                label: n8nNode.name,
                status: 'idle',
                ...n8nNode.parameters,
            },
        };
    });

    // Convert connections to edges
    const edges: Edge[] = [];
    let edgeId = 0;

    Object.entries(n8nWorkflow.connections).forEach(([sourceNodeName, connectionData]) => {
        const sourceNode = nodes.find((n) => n.data.label === sourceNodeName);
        if (!sourceNode || !connectionData.main) return;

        connectionData.main.forEach((outputs, outputIndex) => {
            outputs.forEach((connection) => {
                const targetNode = nodes.find((n) => n.data.label === connection.node);
                if (!targetNode) return;

                edges.push({
                    id: `edge_${edgeId++}`,
                    source: sourceNode.id,
                    target: targetNode.id,
                    sourceHandle: outputIndex > 0 ? `output_${outputIndex}` : undefined,
                    targetHandle: connection.index > 0 ? `input_${connection.index}` : undefined,
                });
            });
        });
    });

    return {
        name: n8nWorkflow.name,
        version: '1.0.0',
        description: `Imported from n8n`,
        nodes,
        edges,
        settings: n8nWorkflow.settings,
    };
}

// Convert Agent-Flow workflow to n8n format
function convertToN8n(workflow: WorkflowData): N8nWorkflow {
    const nodeTypeMapReverse: Record<string, string> = {
        'trigger': 'n8n-nodes-base.manualTrigger',
        'http': 'n8n-nodes-base.httpRequest',
        'code': 'n8n-nodes-base.code',
        'condition': 'n8n-nodes-base.if',
        'switch': 'n8n-nodes-base.switch',
        'merge': 'n8n-nodes-base.merge',
        'set': 'n8n-nodes-base.set',
        'wait': 'n8n-nodes-base.wait',
        'errorTrigger': 'n8n-nodes-base.errorTrigger',
        'respondWebhook': 'n8n-nodes-base.respondToWebhook',
        'database': 'n8n-nodes-base.postgres',
        'stickyNote': 'n8n-nodes-base.stickyNote',
        'agent': 'n8n-nodes-base.code', // Map AI agents to code nodes
    };

    const n8nNodes = workflow.nodes.map((node) => ({
        id: node.id,
        name: (node.data?.label as string) || node.id,
        type: nodeTypeMapReverse[node.type || 'agent'] || 'n8n-nodes-base.noOp',
        typeVersion: 1,
        position: [node.position.x, node.position.y] as [number, number],
        parameters: {
            ...node.data,
            label: undefined,
            status: undefined,
        },
    }));

    // Build connections
    const connections: N8nWorkflow['connections'] = {};

    workflow.edges.forEach((edge) => {
        const sourceNode = workflow.nodes.find((n) => n.id === edge.source);
        const targetNode = workflow.nodes.find((n) => n.id === edge.target);
        if (!sourceNode || !targetNode) return;

        const sourceName = ((sourceNode.data?.label as string) || sourceNode.id) as string;
        const targetName = ((targetNode.data?.label as string) || targetNode.id) as string;

        if (!connections[sourceName]) {
            connections[sourceName] = { main: [[]] };
        }

        const outputIndex = edge.sourceHandle ? parseInt(edge.sourceHandle.replace('output_', '')) || 0 : 0;
        const inputIndex = edge.targetHandle ? parseInt(edge.targetHandle.replace('input_', '')) || 0 : 0;

        while (connections[sourceName].main.length <= outputIndex) {
            connections[sourceName].main.push([]);
        }

        connections[sourceName].main[outputIndex].push({
            node: targetName,
            type: 'main',
            index: inputIndex,
        });
    });

    return {
        name: workflow.name,
        nodes: n8nNodes,
        connections,
        settings: workflow.settings,
    };
}

function ImportExportDialog({
    isOpen,
    onClose,
    onImport,
    currentWorkflow,
}: ImportExportDialogProps) {
    const [activeTab, setActiveTab] = useState<'import' | 'export'>('export');
    const [importText, setImportText] = useState('');
    const [exportFormat, setExportFormat] = useState<'agent-flow' | 'n8n'>('agent-flow');
    const [importing, setImporting] = useState(false);
    const [validationResult, setValidationResult] = useState<{
        valid: boolean;
        message: string;
        nodeCount?: number;
        edgeCount?: number;
    } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            setImportText(content);
            validateImport(content);
        };
        reader.readAsText(file);
    };

    const validateImport = (text: string) => {
        try {
            const data = JSON.parse(text);

            // Check if it's n8n format
            if (data.nodes && Array.isArray(data.nodes) && data.connections) {
                const converted = convertFromN8n(data as N8nWorkflow);
                setValidationResult({
                    valid: true,
                    message: 'n8n workflow detected - will be converted',
                    nodeCount: converted.nodes.length,
                    edgeCount: converted.edges.length,
                });
                return;
            }

            // Check if it's Agent-Flow format
            if (data.nodes && data.edges) {
                setValidationResult({
                    valid: true,
                    message: 'Valid Agent-Flow workflow',
                    nodeCount: data.nodes.length,
                    edgeCount: data.edges.length,
                });
                return;
            }

            setValidationResult({
                valid: false,
                message: 'Unknown workflow format',
            });
        } catch (error) {
            setValidationResult({
                valid: false,
                message: 'Invalid JSON format',
            });
        }
    };

    const handleImport = async () => {
        if (!validationResult?.valid) return;

        setImporting(true);
        try {
            const data = JSON.parse(importText);

            let workflowData: WorkflowData;

            // Check format and convert if needed
            if (data.connections) {
                workflowData = convertFromN8n(data as N8nWorkflow);
            } else {
                workflowData = data as WorkflowData;
            }

            onImport(workflowData);
            toast.success(`Imported ${workflowData.nodes.length} nodes and ${workflowData.edges.length} connections`);
            onClose();
        } catch (error) {
            toast.error('Failed to import workflow');
        } finally {
            setImporting(false);
        }
    };

    const getExportData = (): string => {
        if (exportFormat === 'n8n') {
            return JSON.stringify(convertToN8n(currentWorkflow), null, 2);
        }
        return JSON.stringify(currentWorkflow, null, 2);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(getExportData());
        toast.success('Copied to clipboard');
    };

    const handleDownload = () => {
        const data = getExportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentWorkflow.name || 'workflow'}-${exportFormat}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Downloaded workflow');
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileJson className="w-5 h-5 text-indigo-400" />
                        Import / Export Workflow
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Import workflows from JSON or export your current workflow
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'import' | 'export')}>
                    <div className="flex w-full bg-zinc-900/50 p-1 rounded-lg border border-zinc-800">
                        <button
                            onClick={() => setActiveTab('export')}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors",
                                activeTab === 'export' 
                                    ? "bg-zinc-800 text-zinc-100" 
                                    : "text-zinc-500 hover:text-zinc-300"
                            )}
                        >
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                        <button
                            onClick={() => setActiveTab('import')}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors",
                                activeTab === 'import' 
                                    ? "bg-zinc-800 text-zinc-100" 
                                    : "text-zinc-500 hover:text-zinc-300"
                            )}
                        >
                            <Upload className="w-4 h-4" />
                            Import
                        </button>
                    </div>
                    <TabsList className="hidden" />

                    {/* Export Tab */}
                    <TabsContent value="export" className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="flex-1 space-y-2">
                                <Label className="text-zinc-400">Export Format</Label>
                                <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as any)}>
                                    <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-100">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
                                        <SelectItem value="agent-flow" className="text-zinc-100 focus:bg-zinc-800 focus:text-zinc-100">
                                            <span className="flex items-center gap-2">
                                                <Braces className="w-4 h-4 text-indigo-400" />
                                                Agent-Flow (Native)
                                            </span>
                                        </SelectItem>
                                        <SelectItem value="n8n" className="text-zinc-100 focus:bg-zinc-800 focus:text-zinc-100">
                                            <span className="flex items-center gap-2">
                                                <FileCode className="w-4 h-4 text-orange-400" />
                                                n8n Compatible
                                            </span>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-zinc-400">Quick Actions</Label>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleCopy}
                                        className="bg-transparent border-zinc-800 text-zinc-100 hover:bg-zinc-800"
                                    >
                                        <Copy className="w-4 h-4 mr-2" />
                                        Copy
                                    </Button>
                                    <Button size="sm" onClick={handleDownload} className="bg-indigo-600 hover:bg-indigo-500">
                                        <Download className="w-4 h-4 mr-2" />
                                        Download
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-zinc-400">Preview</Label>
                                <span className="text-xs text-zinc-500">
                                    {currentWorkflow.nodes.length} nodes, {currentWorkflow.edges.length} connections
                                </span>
                            </div>
                            <ScrollArea className="h-[300px] rounded-lg border border-zinc-800">
                                <pre className="p-4 text-xs font-mono text-zinc-400 bg-zinc-900">
                                    {getExportData()}
                                </pre>
                            </ScrollArea>
                        </div>
                    </TabsContent>

                    {/* Import Tab */}
                    <TabsContent value="import" className="space-y-4">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-zinc-400">Import from File or Paste JSON</Label>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    accept=".json"
                                    className="hidden"
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="bg-transparent border-zinc-800 text-zinc-100 hover:bg-zinc-800"
                                >
                                    <Upload className="w-4 h-4 mr-2" />
                                    Upload File
                                </Button>
                            </div>
                            <Textarea
                                value={importText}
                                onChange={(e) => {
                                    setImportText(e.target.value);
                                    if (e.target.value) {
                                        validateImport(e.target.value);
                                    } else {
                                        setValidationResult(null);
                                    }
                                }}
                                placeholder='Paste workflow JSON here or upload a file...
                                
Supported formats:
• Agent-Flow native format
• n8n workflow export'
                                className="min-h-[250px] font-mono text-xs bg-zinc-900 border-zinc-800 text-zinc-100 resize-none placeholder:text-zinc-600"
                            />
                        </div>

                        {/* Validation Result */}
                        {validationResult && (
                            <div
                                className={cn(
                                    'flex items-start gap-3 p-4 rounded-lg border',
                                    validationResult.valid
                                        ? 'bg-emerald-500/10 border-emerald-500/30'
                                        : 'bg-red-500/10 border-red-500/30'
                                )}
                            >
                                {validationResult.valid ? (
                                    <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5" />
                                ) : (
                                    <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
                                )}
                                <div>
                                    <p
                                        className={cn(
                                            'text-sm font-medium',
                                            validationResult.valid ? 'text-emerald-300' : 'text-red-300'
                                        )}
                                    >
                                        {validationResult.message}
                                    </p>
                                    {validationResult.valid && (
                                        <p className="text-xs text-zinc-400 mt-1">
                                            {validationResult.nodeCount} nodes, {validationResult.edgeCount} connections
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Import Warnings */}
                        <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                            <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5" />
                            <div className="text-xs text-amber-200">
                                Importing will replace your current workflow. Make sure to save or export first.
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="bg-transparent border-zinc-800 text-zinc-100 hover:bg-zinc-800"
                    >
                        Cancel
                    </Button>
                    {activeTab === 'import' && (
                        <Button
                            onClick={handleImport}
                            disabled={!validationResult?.valid || importing}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white"
                        >
                            {importing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            <ArrowRight className="w-4 h-4 mr-2" />
                            Import Workflow
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default memo(ImportExportDialog);
