/**
 * Wait Node - Pause execution for a specified time or condition
 */

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { Clock, Timer, CalendarClock } from 'lucide-react';

export interface WaitNodeData {
    label: string;
    waitType: 'time' | 'datetime' | 'webhook';
    amount?: number;
    unit?: 'seconds' | 'minutes' | 'hours' | 'days';
    resumeAt?: string; // ISO datetime for datetime wait
    webhookId?: string; // For webhook resume
    status?: 'idle' | 'running' | 'waiting' | 'success' | 'error';
    waitingUntil?: string;
    [key: string]: unknown;
}

function WaitNode({ data, selected }: NodeProps) {
    const nodeData = data as unknown as WaitNodeData;
    const status = nodeData.status || 'idle';
    const waitType = nodeData.waitType || 'time';

    const getWaitDescription = () => {
        if (waitType === 'time') {
            return `${nodeData.amount || 0} ${nodeData.unit || 'seconds'}`;
        }
        if (waitType === 'datetime') {
            return nodeData.resumeAt 
                ? new Date(nodeData.resumeAt).toLocaleString() 
                : 'Not set';
        }
        if (waitType === 'webhook') {
            return 'Wait for webhook';
        }
        return 'Configure wait';
    };

    const Icon = waitType === 'datetime' ? CalendarClock : waitType === 'webhook' ? Timer : Clock;

    return (
        <div
            className={cn(
                'relative min-w-[220px] rounded-lg border-2 shadow-lg transition-all duration-200',
                'bg-card',
                selected
                    ? 'border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                    : 'border-border hover:border-amber-500/50',
                'hover:shadow-xl hover:-translate-y-0.5'
            )}
        >
            {/* Input Handle */}
            <Handle
                type="target"
                position={Position.Left}
                className="!w-3 !h-3 !bg-background !border-2 !border-amber-500 hover:!scale-125 transition-transform"
            />

            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/50 rounded-t-lg">
                <div className="w-8 h-8 flex items-center justify-center rounded-md bg-amber-600 text-white">
                    <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">
                        {nodeData.label || 'Wait'}
                    </div>
                    <div className="text-xs text-muted-foreground capitalize">
                        {waitType} Wait
                    </div>
                </div>
                <div
                    className={cn(
                        'w-2.5 h-2.5 rounded-full',
                        status === 'idle' && 'bg-slate-500',
                        status === 'running' && 'bg-amber-500 animate-pulse',
                        status === 'waiting' && 'bg-amber-400 animate-pulse',
                        status === 'success' && 'bg-emerald-500',
                        status === 'error' && 'bg-red-500'
                    )}
                />
            </div>

            {/* Body */}
            <div className="p-3 space-y-2">
                <div className="bg-muted/50 rounded p-2">
                    <div className="flex items-center gap-2">
                        <Timer className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-xs text-foreground font-medium">
                            {getWaitDescription()}
                        </span>
                    </div>
                </div>

                {status === 'waiting' && nodeData.waitingUntil && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded p-2">
                        <div className="text-[10px] text-amber-400">
                            Waiting until: {new Date(nodeData.waitingUntil).toLocaleString()}
                        </div>
                    </div>
                )}
            </div>

            {/* Output Handle */}
            <Handle
                type="source"
                position={Position.Right}
                className="!w-3 !h-3 !bg-background !border-2 !border-amber-500 hover:!scale-125 transition-transform"
            />
        </div>
    );
}

export default memo(WaitNode);
