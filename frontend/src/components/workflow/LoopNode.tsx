import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { Repeat } from 'lucide-react';

export interface LoopNodeData {
    label: string;
    iterateOver: string;
    itemVariable: string;
    indexVariable: string;
    maxIterations?: number;
    status?: 'idle' | 'running' | 'completed' | 'error';
    currentIndex?: number;
    totalItems?: number;
    [key: string]: unknown;
}

function LoopNode({ data, selected }: NodeProps) {
    const nodeData = data as unknown as LoopNodeData;
    const status = nodeData.status || 'idle';
    const progress = nodeData.totalItems
        ? Math.round(((nodeData.currentIndex || 0) / nodeData.totalItems) * 100)
        : 0;

    return (
        <div
            className={cn(
                'relative min-w-[200px] rounded-lg border-2 shadow-lg transition-all duration-200',
                'bg-[hsl(225_10%_11%)]',
                selected
                    ? 'border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                    : 'border-[hsl(225_7%_26%)] hover:border-cyan-500/50',
                'hover:shadow-xl hover:-translate-y-0.5'
            )}
        >
            {/* Input Handle */}
            <Handle
                type="target"
                position={Position.Left}
                className="!w-3 !h-3 !bg-[hsl(225_12%_8%)] !border-2 !border-cyan-500 hover:!scale-125 transition-transform"
            />

            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[hsl(225_8%_18%)] bg-[hsl(225_12%_8%)] rounded-t-lg">
                <div className="w-8 h-8 flex items-center justify-center rounded-md text-white bg-cyan-600">
                    <Repeat className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[hsl(220_13%_91%)] truncate">
                        {nodeData.label || 'Loop'}
                    </div>
                    <div className="text-xs text-[hsl(220_9%_63%)]">
                        For Each
                    </div>
                </div>
                <div
                    className={cn(
                        'w-2.5 h-2.5 rounded-full',
                        status === 'idle' && 'bg-slate-500',
                        status === 'running' && 'bg-cyan-500 animate-pulse',
                        status === 'completed' && 'bg-emerald-500',
                        status === 'error' && 'bg-red-500'
                    )}
                />
            </div>

            {/* Body */}
            <div className="p-3 space-y-2">
                <div className="font-mono text-xs text-[hsl(220_9%_63%)] bg-[hsl(225_15%_5%)] p-2 rounded">
                    <div>
                        <span className="text-cyan-400">for</span>
                        <span className="text-white"> (</span>
                        <span className="text-amber-400">{nodeData.itemVariable || 'item'}</span>
                        <span className="text-white">, </span>
                        <span className="text-purple-400">{nodeData.indexVariable || 'i'}</span>
                        <span className="text-white">)</span>
                    </div>
                    <div>
                        <span className="text-cyan-400">in</span>
                        <span className="text-emerald-400 ml-1">{nodeData.iterateOver || 'items'}</span>
                    </div>
                </div>

                {/* Progress indicator when running */}
                {status === 'running' && nodeData.totalItems && (
                    <div className="space-y-1">
                        <div className="h-1 bg-[hsl(225_15%_15%)] rounded-full overflow-hidden">
                            <div
                                className="h-full bg-cyan-500 transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <div className="text-[10px] text-[hsl(220_9%_63%)] text-center">
                            {nodeData.currentIndex || 0} / {nodeData.totalItems}
                        </div>
                    </div>
                )}

                {nodeData.maxIterations && (
                    <div className="text-[10px] text-amber-400 text-center">
                        Max: {nodeData.maxIterations} iterations
                    </div>
                )}
            </div>

            {/* Output Handles */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-8">
                {/* Loop Body Handle */}
                <div className="relative">
                    <Handle
                        type="source"
                        position={Position.Right}
                        id="loop"
                        className="!w-3 !h-3 !bg-cyan-500 !border-2 !border-cyan-400 hover:!scale-125 transition-transform"
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] text-cyan-400 font-medium">
                        EACH
                    </span>
                </div>
                {/* Completed Handle */}
                <div className="relative">
                    <Handle
                        type="source"
                        position={Position.Right}
                        id="done"
                        className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-emerald-400 hover:!scale-125 transition-transform"
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] text-emerald-400 font-medium">
                        DONE
                    </span>
                </div>
            </div>
        </div>
    );
}

export default memo(LoopNode);
