import { useState, useEffect, memo, type ReactElement } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    X,
    ChevronLeft,
    ChevronRight,
    Clock,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Copy,
    Download,
    Pin,
    PinOff,
    RotateCcw,
    Loader2,
    ArrowRight,
    Braces,
    FileJson
} from 'lucide-react';
import { toast } from 'sonner';

interface ExecutionData {
    nodeId: string;
    nodeName: string;
    nodeType: string;
    status: 'pending' | 'running' | 'success' | 'error' | 'skipped';
    startTime?: string;
    endTime?: string;
    duration?: number;
    input?: any;
    output?: any;
    error?: string;
    items?: number;
}

interface NodeExecutionPanelProps {
    executions: ExecutionData[];
    selectedNodeId?: string;
    onSelectNode: (nodeId: string) => void;
    onClose: () => void;
    onPinData: (nodeId: string, data: any) => void;
    onReRunNode: (nodeId: string, input?: any) => void;
    pinnedNodes?: Set<string>;
}

function JsonViewer({ data, maxHeight = 300 }: { data: any; maxHeight?: number }) {
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    const toggleExpand = (path: string) => {
        const newExpanded = new Set(expanded);
        if (newExpanded.has(path)) {
            newExpanded.delete(path);
        } else {
            newExpanded.add(path);
        }
        setExpanded(newExpanded);
    };

    const renderValue = (value: any, path: string, depth: number = 0): ReactElement => {
        if (value === null) {
            return <span className="text-orange-400">null</span>;
        }
        if (value === undefined) {
            return <span className="text-gray-500">undefined</span>;
        }
        if (typeof value === 'boolean') {
            return <span className="text-purple-400">{value.toString()}</span>;
        }
        if (typeof value === 'number') {
            return <span className="text-cyan-400">{value}</span>;
        }
        if (typeof value === 'string') {
            const truncated = value.length > 100 ? value.slice(0, 100) + '...' : value;
            return <span className="text-green-400">"{truncated}"</span>;
        }
        if (Array.isArray(value)) {
            const isExpanded = expanded.has(path);
            return (
                <span>
                    <button
                        onClick={() => toggleExpand(path)}
                        className="text-yellow-400 hover:underline"
                    >
                        [{isExpanded ? '' : `${value.length} items`}
                    </button>
                    {isExpanded && (
                        <div className="pl-4 border-l border-[hsl(225_8%_25%)] ml-2">
                            {value.map((item, index) => (
                                <div key={index} className="py-0.5">
                                    <span className="text-gray-500">{index}: </span>
                                    {renderValue(item, `${path}[${index}]`, depth + 1)}
                                </div>
                            ))}
                        </div>
                    )}
                    {isExpanded && <span className="text-yellow-400">]</span>}
                    {!isExpanded && <span className="text-yellow-400">]</span>}
                </span>
            );
        }
        if (typeof value === 'object') {
            const keys = Object.keys(value);
            const isExpanded = expanded.has(path);
            return (
                <span>
                    <button
                        onClick={() => toggleExpand(path)}
                        className="text-yellow-400 hover:underline"
                    >
                        {'{'}
                        {!isExpanded && `${keys.length} keys`}
                    </button>
                    {isExpanded && (
                        <div className="pl-4 border-l border-[hsl(225_8%_25%)] ml-2">
                            {keys.map((key) => (
                                <div key={key} className="py-0.5">
                                    <span className="text-blue-400">{key}</span>
                                    <span className="text-gray-500">: </span>
                                    {renderValue(value[key], `${path}.${key}`, depth + 1)}
                                </div>
                            ))}
                        </div>
                    )}
                    <span className="text-yellow-400">{'}'}</span>
                </span>
            );
        }
        return <span className="text-gray-400">{String(value)}</span>;
    };

    return (
        <div
            className="font-mono text-xs overflow-auto bg-[hsl(225_12%_6%)] rounded-lg p-3"
            style={{ maxHeight }}
        >
            {renderValue(data, 'root', 0)}
        </div>
    );
}

function StatusBadge({ status }: { status: ExecutionData['status'] }) {
    const config = {
        pending: { icon: Clock, color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', label: 'Pending' },
        running: { icon: Loader2, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'Running' },
        success: { icon: CheckCircle, color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', label: 'Success' },
        error: { icon: XCircle, color: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Error' },
        skipped: { icon: AlertTriangle, color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', label: 'Skipped' },
    };

    const { icon: Icon, color, label } = config[status];

    return (
        <Badge className={cn('gap-1 border', color)}>
            <Icon className={cn('w-3 h-3', status === 'running' && 'animate-spin')} />
            {label}
        </Badge>
    );
}

function NodeExecutionCard({
    execution,
    isSelected,
    isPinned,
    onClick,
}: {
    execution: ExecutionData;
    isSelected: boolean;
    isPinned: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                'w-full text-left p-3 rounded-lg border transition-all duration-200',
                'hover:bg-[hsl(225_9%_15%)]',
                isSelected
                    ? 'bg-indigo-500/10 border-indigo-500/50'
                    : 'bg-[hsl(225_10%_11%)] border-[hsl(225_8%_18%)]'
            )}
        >
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[hsl(220_13%_91%)] truncate max-w-[150px]">
                        {execution.nodeName}
                    </span>
                    {isPinned && <Pin className="w-3 h-3 text-amber-400" />}
                </div>
                <StatusBadge status={execution.status} />
            </div>
            <div className="flex items-center gap-2 text-xs text-[hsl(220_7%_45%)]">
                <span className="px-1.5 py-0.5 bg-[hsl(225_8%_18%)] rounded">
                    {execution.nodeType}
                </span>
                {execution.duration !== undefined && (
                    <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {execution.duration}ms
                    </span>
                )}
                {execution.items !== undefined && (
                    <span className="flex items-center gap-1">
                        <Braces className="w-3 h-3" />
                        {execution.items} items
                    </span>
                )}
            </div>
        </button>
    );
}

function NodeExecutionPanel({
    executions,
    selectedNodeId,
    onSelectNode,
    onClose,
    onPinData,
    onReRunNode,
    pinnedNodes = new Set(),
}: NodeExecutionPanelProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const selectedExecution = selectedNodeId
        ? executions.find((e) => e.nodeId === selectedNodeId)
        : executions[currentIndex];

    const handleCopyData = (data: any, label: string) => {
        navigator.clipboard.writeText(JSON.stringify(data, null, 2));
        toast.success(`${label} copied to clipboard`);
    };

    const handleDownloadData = (data: any, filename: string) => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
            if (executions[currentIndex - 1]) {
                onSelectNode(executions[currentIndex - 1].nodeId);
            }
        }
    };

    const handleNext = () => {
        if (currentIndex < executions.length - 1) {
            setCurrentIndex(currentIndex + 1);
            if (executions[currentIndex + 1]) {
                onSelectNode(executions[currentIndex + 1].nodeId);
            }
        }
    };

    useEffect(() => {
        if (selectedNodeId) {
            const index = executions.findIndex((e) => e.nodeId === selectedNodeId);
            if (index !== -1) {
                setCurrentIndex(index);
            }
        }
    }, [selectedNodeId, executions]);

    if (executions.length === 0) {
        return (
            <div className="w-96 bg-[hsl(225_12%_8%)] border-l border-[hsl(225_8%_18%)] flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-[hsl(225_8%_18%)]">
                    <h3 className="font-semibold text-[hsl(220_13%_91%)]">Execution Data</h3>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>
                <div className="flex-1 flex items-center justify-center p-8 text-center">
                    <div>
                        <FileJson className="w-12 h-12 text-[hsl(220_7%_45%)] mx-auto mb-3" />
                        <p className="text-[hsl(220_9%_63%)]">No execution data yet</p>
                        <p className="text-xs text-[hsl(220_7%_45%)] mt-1">
                            Execute the workflow to see node data
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-96 bg-[hsl(225_12%_8%)] border-l border-[hsl(225_8%_18%)] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[hsl(225_8%_18%)]">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-[hsl(220_13%_91%)]">Execution Data</h3>
                    <Badge variant="secondary" className="bg-[hsl(225_8%_18%)] text-[hsl(220_9%_63%)]">
                        {executions.length} nodes
                    </Badge>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="w-4 h-4" />
                </Button>
            </div>

            {/* Node Navigation */}
            <div className="flex items-center justify-between p-3 border-b border-[hsl(225_8%_18%)] bg-[hsl(225_10%_11%)]">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePrevious}
                    disabled={currentIndex === 0}
                    className="h-8"
                >
                    <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="text-center">
                    <p className="text-sm font-medium text-[hsl(220_13%_91%)]">
                        {selectedExecution?.nodeName || 'No node selected'}
                    </p>
                    <p className="text-xs text-[hsl(220_7%_45%)]">
                        {currentIndex + 1} of {executions.length}
                    </p>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleNext}
                    disabled={currentIndex === executions.length - 1}
                    className="h-8"
                >
                    <ChevronRight className="w-4 h-4" />
                </Button>
            </div>

            {/* Execution Details */}
            {selectedExecution && (
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Status & Actions */}
                    <div className="p-3 border-b border-[hsl(225_8%_18%)] space-y-3">
                        <div className="flex items-center justify-between">
                            <StatusBadge status={selectedExecution.status} />
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => onPinData(selectedExecution.nodeId, selectedExecution.output)}
                                    title={pinnedNodes.has(selectedExecution.nodeId) ? 'Unpin data' : 'Pin data'}
                                >
                                    {pinnedNodes.has(selectedExecution.nodeId) ? (
                                        <PinOff className="w-4 h-4 text-amber-400" />
                                    ) : (
                                        <Pin className="w-4 h-4" />
                                    )}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => onReRunNode(selectedExecution.nodeId, selectedExecution.input)}
                                    title="Re-run node"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Timing info */}
                        {selectedExecution.duration !== undefined && (
                            <div className="flex items-center gap-4 text-xs text-[hsl(220_9%_63%)]">
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {selectedExecution.duration}ms
                                </span>
                                {selectedExecution.items !== undefined && (
                                    <span className="flex items-center gap-1">
                                        <ArrowRight className="w-3 h-3" />
                                        {selectedExecution.items} items output
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Error message */}
                        {selectedExecution.status === 'error' && selectedExecution.error && (
                            <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                                <p className="text-xs text-red-400">{selectedExecution.error}</p>
                            </div>
                        )}
                    </div>

                    {/* Data Tabs */}
                    <Tabs defaultValue="output" className="flex-1 flex flex-col overflow-hidden">
                        <TabsList className="mx-3 mt-3 bg-[hsl(225_10%_11%)]">
                            <TabsTrigger value="input" className="flex-1">
                                Input
                            </TabsTrigger>
                            <TabsTrigger value="output" className="flex-1">
                                Output
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="input" className="flex-1 overflow-hidden m-0 p-3">
                            <div className="h-full flex flex-col">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-[hsl(220_9%_63%)]">Input Data</span>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() => handleCopyData(selectedExecution.input, 'Input data')}
                                        >
                                            <Copy className="w-3 h-3" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() =>
                                                handleDownloadData(
                                                    selectedExecution.input,
                                                    `${selectedExecution.nodeName}-input.json`
                                                )
                                            }
                                        >
                                            <Download className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-auto">
                                    {selectedExecution.input ? (
                                        <JsonViewer data={selectedExecution.input} maxHeight={400} />
                                    ) : (
                                        <p className="text-xs text-[hsl(220_7%_45%)] text-center py-8">
                                            No input data
                                        </p>
                                    )}
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="output" className="flex-1 overflow-hidden m-0 p-3">
                            <div className="h-full flex flex-col">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-[hsl(220_9%_63%)]">Output Data</span>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() => handleCopyData(selectedExecution.output, 'Output data')}
                                        >
                                            <Copy className="w-3 h-3" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() =>
                                                handleDownloadData(
                                                    selectedExecution.output,
                                                    `${selectedExecution.nodeName}-output.json`
                                                )
                                            }
                                        >
                                            <Download className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-auto">
                                    {selectedExecution.output ? (
                                        <JsonViewer data={selectedExecution.output} maxHeight={400} />
                                    ) : (
                                        <p className="text-xs text-[hsl(220_7%_45%)] text-center py-8">
                                            No output data
                                        </p>
                                    )}
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            )}

            {/* Node List (collapsible) */}
            <div className="border-t border-[hsl(225_8%_18%)]">
                <div className="h-48 overflow-auto">
                    <div className="p-3 space-y-2">
                        {executions.map((execution) => (
                            <NodeExecutionCard
                                key={execution.nodeId}
                                execution={execution}
                                isSelected={execution.nodeId === selectedExecution?.nodeId}
                                isPinned={pinnedNodes.has(execution.nodeId)}
                                onClick={() => onSelectNode(execution.nodeId)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default memo(NodeExecutionPanel);
