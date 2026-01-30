import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { Merge as MergeIcon } from 'lucide-react';

export interface MergeNodeData {
    label: string;
    mode: 'waitAll' | 'waitAny' | 'append';
    inputCount: number;
    status?: 'idle' | 'waiting' | 'running' | 'completed' | 'error';
    receivedInputs?: number;
    [key: string]: unknown;
}

const MODE_LABELS: Record<string, string> = {
    'waitAll': 'Wait for All',
    'waitAny': 'Wait for Any',
    'append': 'Append All',
};

function MergeNode({ data, selected }: NodeProps) {
    const nodeData = data as unknown as MergeNodeData;
    const mode = nodeData.mode || 'waitAll';
    const inputCount = nodeData.inputCount || 2;
    const status = nodeData.status || 'idle';
    const receivedInputs = nodeData.receivedInputs || 0;

    return (
        <div
            className={cn(
                'relative min-w-[180px] rounded-lg border-2 shadow-lg transition-all duration-200',
                'bg-[hsl(225_10%_11%)]',
                selected
                    ? 'border-pink-500 shadow-[0_0_20px_rgba(236,72,153,0.4)]'
                    : 'border-[hsl(225_7%_26%)] hover:border-pink-500/50',
                'hover:shadow-xl hover:-translate-y-0.5'
            )}
        >
            {/* Multiple Input Handles */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col" style={{ gap: `${Math.max(15, 50 / inputCount)}px` }}>
                {Array.from({ length: inputCount }, (_, i) => (
                    <div key={i} className="relative">
                        <Handle
                            type="target"
                            position={Position.Left}
                            id={`input-${i}`}
                            className={cn(
                                '!w-3 !h-3 hover:!scale-125 transition-transform',
                                i < receivedInputs
                                    ? '!bg-emerald-500 !border-emerald-400'
                                    : '!bg-[hsl(225_12%_8%)] !border-pink-500',
                                '!border-2'
                            )}
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[9px] text-slate-400">
                            {i + 1}
                        </span>
                    </div>
                ))}
            </div>

            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[hsl(225_8%_18%)] bg-[hsl(225_12%_8%)] rounded-t-lg ml-4">
                <div className="w-8 h-8 flex items-center justify-center rounded-md text-white bg-pink-600">
                    <MergeIcon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[hsl(220_13%_91%)] truncate">
                        {nodeData.label || 'Merge'}
                    </div>
                    <div className="text-xs text-[hsl(220_9%_63%)]">
                        {MODE_LABELS[mode]}
                    </div>
                </div>
                <div
                    className={cn(
                        'w-2.5 h-2.5 rounded-full',
                        status === 'idle' && 'bg-slate-500',
                        status === 'waiting' && 'bg-amber-500 animate-pulse',
                        status === 'running' && 'bg-pink-500 animate-pulse',
                        status === 'completed' && 'bg-emerald-500',
                        status === 'error' && 'bg-red-500'
                    )}
                />
            </div>

            {/* Body */}
            <div className="p-3 ml-4">
                <div className="text-xs text-[hsl(220_9%_63%)] bg-[hsl(225_15%_5%)] p-2 rounded text-center">
                    <span className="text-pink-400">{receivedInputs}</span>
                    <span className="text-white"> / </span>
                    <span className="text-slate-400">{inputCount}</span>
                    <span className="text-slate-500 ml-1">inputs received</span>
                </div>
            </div>

            {/* Output Handle */}
            <Handle
                type="source"
                position={Position.Right}
                className="!w-3 !h-3 !bg-[hsl(225_12%_8%)] !border-2 !border-pink-500 hover:!scale-125 transition-transform"
            />
        </div>
    );
}

export default memo(MergeNode);
