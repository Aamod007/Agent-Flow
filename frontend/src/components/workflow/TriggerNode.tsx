import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { Webhook, Clock, Play } from 'lucide-react';

export interface TriggerNodeData {
    label: string;
    triggerType: 'webhook' | 'schedule' | 'manual';
    webhookPath?: string;
    webhookMethod?: string;
    cronExpression?: string;
    timezone?: string;
    status?: 'idle' | 'waiting' | 'triggered' | 'error';
    lastTriggered?: string;
    [key: string]: unknown;
}

const TRIGGER_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    'webhook': Webhook,
    'schedule': Clock,
    'manual': Play,
};

const TRIGGER_COLORS: Record<string, string> = {
    'webhook': 'bg-orange-600',
    'schedule': 'bg-blue-600',
    'manual': 'bg-slate-600',
};

function TriggerNode({ data, selected }: NodeProps) {
    const nodeData = data as unknown as TriggerNodeData;
    const triggerType = nodeData.triggerType || 'manual';
    const status = nodeData.status || 'idle';
    const Icon = TRIGGER_ICONS[triggerType] || Play;
    const colorClass = TRIGGER_COLORS[triggerType] || 'bg-slate-600';

    return (
        <div
            className={cn(
                'relative min-w-[220px] rounded-lg border-2 shadow-lg transition-all duration-200',
                'bg-[hsl(225_10%_11%)]',
                selected
                    ? 'border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.4)]'
                    : 'border-[hsl(225_7%_26%)] hover:border-orange-500/50',
                'hover:shadow-xl hover:-translate-y-0.5'
            )}
        >
            {/* Header - No input handle for triggers */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[hsl(225_8%_18%)] bg-[hsl(225_12%_8%)] rounded-t-lg">
                <div className={cn('w-8 h-8 flex items-center justify-center rounded-md text-white', colorClass)}>
                    <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[hsl(220_13%_91%)] truncate">
                        {nodeData.label || 'Trigger'}
                    </div>
                    <div className="text-xs text-[hsl(220_9%_63%)] capitalize">
                        {triggerType} Trigger
                    </div>
                </div>
                <div
                    className={cn(
                        'w-2.5 h-2.5 rounded-full',
                        status === 'idle' && 'bg-slate-500',
                        status === 'waiting' && 'bg-orange-500 animate-pulse',
                        status === 'triggered' && 'bg-emerald-500',
                        status === 'error' && 'bg-red-500'
                    )}
                />
            </div>

            {/* Body - Trigger details */}
            <div className="p-3 space-y-2">
                {triggerType === 'webhook' && (
                    <div className="bg-[hsl(225_15%_5%)] p-2 rounded space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-blue-100">
                                {nodeData.webhookMethod || 'POST'}
                            </span>
                            <span className="text-[10px] text-slate-500">Webhook</span>
                        </div>
                        <div className="font-mono text-xs text-orange-400 truncate">
                            /webhook/{nodeData.webhookPath || 'xxx'}
                        </div>
                    </div>
                )}

                {triggerType === 'schedule' && (
                    <div className="bg-[hsl(225_15%_5%)] p-2 rounded space-y-1">
                        <div className="font-mono text-xs text-blue-400">
                            {nodeData.cronExpression || '0 9 * * *'}
                        </div>
                        <div className="text-[10px] text-slate-500">
                            {nodeData.timezone || 'UTC'}
                        </div>
                    </div>
                )}

                {triggerType === 'manual' && (
                    <div className="bg-[hsl(225_15%_5%)] p-2 rounded">
                        <div className="text-xs text-slate-500 text-center">
                            Click "Execute" to run
                        </div>
                    </div>
                )}

                {nodeData.lastTriggered && (
                    <div className="text-[10px] text-slate-500 text-center">
                        Last: {new Date(nodeData.lastTriggered).toLocaleString()}
                    </div>
                )}
            </div>

            {/* Output Handle - Triggers only have output */}
            <Handle
                type="source"
                position={Position.Right}
                className="!w-3 !h-3 !bg-[hsl(225_12%_8%)] !border-2 !border-orange-500 hover:!scale-125 transition-transform"
            />
        </div>
    );
}

export default memo(TriggerNode);
