import { memo, useState, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Workflow,
    ChevronRight,
    Loader2,
    CheckCircle,
    XCircle,
    Settings,
    ExternalLink,
    Clock
} from 'lucide-react';
import { api } from '@/lib/api';

export interface SubWorkflowNodeData {
    label: string;
    status: 'idle' | 'running' | 'success' | 'error' | 'waiting';
    workflowId?: string;
    workflowName?: string;
    waitForCompletion: boolean;
    inputMapping?: Record<string, string>;
    outputMapping?: Record<string, string>;
    executionId?: string;
    lastExecutionTime?: number;
    mode: 'workflow' | 'expression';
}

interface SubWorkflowNodeProps {
    id: string;
    data: SubWorkflowNodeData;
    selected?: boolean;
}

function SubWorkflowNode({ data, selected, id }: SubWorkflowNodeProps) {
    const [_workflows, setWorkflows] = useState<Array<{ id: string; name: string }>>([]);
    const [_loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchWorkflows = async () => {
            try {
                setLoading(true);
                const wfs = await api.getWorkflows();
                setWorkflows(wfs.map((wf: any) => ({ id: wf.id, name: wf.name })));
            } catch (error) {
                // Use mock data
                setWorkflows([
                    { id: 'wf-1', name: 'Process Payment' },
                    { id: 'wf-2', name: 'Send Notification' },
                    { id: 'wf-3', name: 'Data Validation' },
                ]);
            } finally {
                setLoading(false);
            }
        };
        fetchWorkflows();
    }, []);

    const getStatusIcon = () => {
        switch (data.status) {
            case 'running':
                return <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />;
            case 'success':
                return <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />;
            case 'error':
                return <XCircle className="w-3.5 h-3.5 text-red-400" />;
            case 'waiting':
                return <Clock className="w-3.5 h-3.5 text-amber-400" />;
            default:
                return null;
        }
    };

    const getStatusColor = () => {
        switch (data.status) {
            case 'running':
                return 'border-blue-500/50 shadow-blue-500/20';
            case 'success':
                return 'border-emerald-500/50 shadow-emerald-500/20';
            case 'error':
                return 'border-red-500/50 shadow-red-500/20';
            case 'waiting':
                return 'border-amber-500/50 shadow-amber-500/20';
            default:
                return 'border-[hsl(225_8%_18%)]';
        }
    };

    return (
        <div
            className={cn(
                'min-w-[280px] rounded-xl overflow-hidden transition-all duration-300',
                'bg-gradient-to-br from-[hsl(225_12%_10%)] to-[hsl(225_15%_8%)]',
                'border-2 shadow-lg',
                selected ? 'border-purple-500/70 shadow-purple-500/30' : getStatusColor()
            )}
        >
            {/* Input Handle */}
            <Handle
                type="target"
                position={Position.Left}
                className={cn(
                    'w-3 h-3 border-2 transition-all',
                    'bg-[hsl(225_12%_10%)] border-purple-500',
                    'hover:scale-125 hover:shadow-[0_0_8px_rgba(168,85,247,0.5)]'
                )}
            />

            {/* Header */}
            <div className="px-4 py-3 bg-purple-500/10 border-b border-purple-500/20">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                        <Workflow className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-[hsl(220_13%_91%)] truncate">
                                {data.label || 'Execute Workflow'}
                            </span>
                            {getStatusIcon()}
                        </div>
                        <span className="text-xs text-[hsl(220_7%_45%)]">Sub-workflow</span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
                {/* Selected Workflow */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-[hsl(220_9%_63%)] font-medium">Workflow</span>
                        {data.workflowId && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5"
                                onClick={() => window.open(`/workflow/${data.workflowId}`, '_blank')}
                            >
                                <ExternalLink className="w-3 h-3" />
                            </Button>
                        )}
                    </div>
                    
                    {data.workflowId ? (
                        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[hsl(225_10%_11%)] border border-[hsl(225_8%_18%)]">
                            <Workflow className="w-4 h-4 text-purple-400" />
                            <span className="text-sm text-[hsl(220_13%_91%)] flex-1 truncate">
                                {data.workflowName || 'Selected Workflow'}
                            </span>
                            <ChevronRight className="w-4 h-4 text-[hsl(220_7%_45%)]" />
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[hsl(225_10%_11%)] border border-dashed border-[hsl(225_8%_25%)] text-[hsl(220_7%_45%)]">
                            <Settings className="w-4 h-4" />
                            <span className="text-sm">Select a workflow...</span>
                        </div>
                    )}
                </div>

                {/* Execution Mode */}
                <div className="flex items-center justify-between text-xs">
                    <span className="text-[hsl(220_9%_63%)]">Execution Mode</span>
                    <Badge
                        variant="secondary"
                        className={cn(
                            'text-[10px]',
                            data.waitForCompletion
                                ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        )}
                    >
                        {data.waitForCompletion ? 'Wait for completion' : 'Fire and forget'}
                    </Badge>
                </div>

                {/* Input/Output Mapping Indicators */}
                {(data.inputMapping || data.outputMapping) && (
                    <div className="flex items-center gap-2">
                        {data.inputMapping && Object.keys(data.inputMapping).length > 0 && (
                            <Badge
                                variant="secondary"
                                className="text-[10px] bg-[hsl(225_8%_18%)] text-[hsl(220_9%_63%)]"
                            >
                                {Object.keys(data.inputMapping).length} input mappings
                            </Badge>
                        )}
                        {data.outputMapping && Object.keys(data.outputMapping).length > 0 && (
                            <Badge
                                variant="secondary"
                                className="text-[10px] bg-[hsl(225_8%_18%)] text-[hsl(220_9%_63%)]"
                            >
                                {Object.keys(data.outputMapping).length} output mappings
                            </Badge>
                        )}
                    </div>
                )}

                {/* Execution Info */}
                {data.status !== 'idle' && (
                    <div className={cn(
                        'p-2.5 rounded-lg border',
                        data.status === 'running' && 'bg-blue-500/10 border-blue-500/30',
                        data.status === 'success' && 'bg-emerald-500/10 border-emerald-500/30',
                        data.status === 'error' && 'bg-red-500/10 border-red-500/30',
                        data.status === 'waiting' && 'bg-amber-500/10 border-amber-500/30',
                    )}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {getStatusIcon()}
                                <span className={cn(
                                    'text-xs font-medium',
                                    data.status === 'running' && 'text-blue-300',
                                    data.status === 'success' && 'text-emerald-300',
                                    data.status === 'error' && 'text-red-300',
                                    data.status === 'waiting' && 'text-amber-300',
                                )}>
                                    {data.status === 'running' && 'Executing sub-workflow...'}
                                    {data.status === 'success' && 'Completed'}
                                    {data.status === 'error' && 'Failed'}
                                    {data.status === 'waiting' && 'Waiting for result...'}
                                </span>
                            </div>
                            {data.lastExecutionTime && (
                                <span className="text-[10px] text-[hsl(220_7%_45%)]">
                                    {data.lastExecutionTime}ms
                                </span>
                            )}
                        </div>
                        {data.executionId && (
                            <div className="mt-1.5 text-[10px] text-[hsl(220_7%_45%)] font-mono truncate">
                                ID: {data.executionId}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 bg-[hsl(225_10%_7%)] border-t border-[hsl(225_8%_18%)] flex items-center justify-between">
                <span className="text-[10px] text-[hsl(220_7%_45%)] font-mono">{id}</span>
                <div className="flex items-center gap-1">
                    <div className={cn(
                        'w-1.5 h-1.5 rounded-full',
                        data.status === 'idle' && 'bg-gray-500',
                        data.status === 'running' && 'bg-blue-500 animate-pulse',
                        data.status === 'success' && 'bg-emerald-500',
                        data.status === 'error' && 'bg-red-500',
                        data.status === 'waiting' && 'bg-amber-500',
                    )} />
                    <span className="text-[10px] text-[hsl(220_7%_45%)] capitalize">
                        {data.status}
                    </span>
                </div>
            </div>

            {/* Output Handle */}
            <Handle
                type="source"
                position={Position.Right}
                className={cn(
                    'w-3 h-3 border-2 transition-all',
                    'bg-[hsl(225_12%_10%)] border-purple-500',
                    'hover:scale-125 hover:shadow-[0_0_8px_rgba(168,85,247,0.5)]'
                )}
            />

            {/* Error output handle */}
            <Handle
                type="source"
                position={Position.Right}
                id="error"
                className={cn(
                    'w-2.5 h-2.5 border-2 transition-all !top-3/4',
                    'bg-[hsl(225_12%_10%)] border-red-500',
                    'hover:scale-125 hover:shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                )}
            />
        </div>
    );
}

export default memo(SubWorkflowNode);
