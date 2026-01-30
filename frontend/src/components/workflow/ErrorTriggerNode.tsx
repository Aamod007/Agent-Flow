/**
 * Error Trigger Node - Catches errors from workflow execution
 */

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { ShieldAlert, Bug } from 'lucide-react';

export interface ErrorTriggerNodeData {
    label: string;
    errorTypes: ('all' | 'timeout' | 'validation' | 'execution' | 'network')[];
    retryOnError?: boolean;
    maxRetries?: number;
    notifyOnError?: boolean;
    status?: 'idle' | 'triggered' | 'error';
    lastError?: {
        message: string;
        nodeId: string;
        timestamp: string;
    };
    [key: string]: unknown;
}

function ErrorTriggerNode({ data, selected }: NodeProps) {
    const nodeData = data as unknown as ErrorTriggerNodeData;
    const status = nodeData.status || 'idle';
    const errorTypes = nodeData.errorTypes || ['all'];

    return (
        <div
            className={cn(
                'relative min-w-[240px] rounded-lg border-2 shadow-lg transition-all duration-200',
                'bg-card',
                selected
                    ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                    : 'border-border hover:border-red-500/50',
                'hover:shadow-xl hover:-translate-y-0.5'
            )}
        >
            {/* Error Input Handle (catches errors) */}
            <Handle
                type="target"
                position={Position.Left}
                id="error-in"
                className="!w-3 !h-3 !bg-background !border-2 !border-red-500 hover:!scale-125 transition-transform"
                style={{ top: '50%' }}
            />

            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-red-500/5 rounded-t-lg">
                <div className="w-8 h-8 flex items-center justify-center rounded-md bg-red-600 text-white">
                    <ShieldAlert className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">
                        {nodeData.label || 'Error Trigger'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                        Catch & Handle Errors
                    </div>
                </div>
                <div
                    className={cn(
                        'w-2.5 h-2.5 rounded-full',
                        status === 'idle' && 'bg-slate-500',
                        status === 'triggered' && 'bg-red-500 animate-pulse',
                        status === 'error' && 'bg-red-600'
                    )}
                />
            </div>

            {/* Body */}
            <div className="p-3 space-y-2">
                {/* Error Types */}
                <div className="flex flex-wrap gap-1">
                    {errorTypes.map((type) => (
                        <span
                            key={type}
                            className="px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded text-[10px] font-medium capitalize"
                        >
                            {type}
                        </span>
                    ))}
                </div>

                {/* Config Summary */}
                <div className="bg-muted/50 rounded p-2 space-y-1 text-[10px]">
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Retry:</span>
                        <span className={nodeData.retryOnError ? 'text-emerald-400' : 'text-red-400'}>
                            {nodeData.retryOnError ? `Yes (${nodeData.maxRetries || 3}x)` : 'No'}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Notify:</span>
                        <span className={nodeData.notifyOnError ? 'text-emerald-400' : 'text-muted-foreground'}>
                            {nodeData.notifyOnError ? 'Yes' : 'No'}
                        </span>
                    </div>
                </div>

                {/* Last Error */}
                {nodeData.lastError && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded p-2">
                        <div className="flex items-start gap-2">
                            <Bug className="w-3 h-3 text-red-400 mt-0.5" />
                            <div className="flex-1 min-w-0">
                                <div className="text-[10px] text-red-400 truncate">
                                    {nodeData.lastError.message}
                                </div>
                                <div className="text-[9px] text-red-400/60">
                                    Node: {nodeData.lastError.nodeId}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Output Handle */}
            <Handle
                type="source"
                position={Position.Right}
                className="!w-3 !h-3 !bg-background !border-2 !border-red-500 hover:!scale-125 transition-transform"
            />
        </div>
    );
}

export default memo(ErrorTriggerNode);
