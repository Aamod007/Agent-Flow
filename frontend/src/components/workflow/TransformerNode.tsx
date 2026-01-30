import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { Wand2, ArrowRightLeft, Trash2, Filter, Braces } from 'lucide-react';

export interface TransformOperation {
    type: 'set' | 'rename' | 'delete' | 'filter' | 'map' | 'pick' | 'omit';
    field?: string;
    value?: string;
    from?: string;
    to?: string;
}

export interface TransformerNodeData {
    label: string;
    operations: TransformOperation[];
    status?: 'idle' | 'running' | 'completed' | 'error';
    [key: string]: unknown;
}

const OPERATION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    'set': Braces,
    'rename': ArrowRightLeft,
    'delete': Trash2,
    'filter': Filter,
    'map': Wand2,
    'pick': Filter,
    'omit': Trash2,
};

const OPERATION_COLORS: Record<string, string> = {
    'set': 'text-blue-400',
    'rename': 'text-purple-400',
    'delete': 'text-red-400',
    'filter': 'text-amber-400',
    'map': 'text-emerald-400',
    'pick': 'text-cyan-400',
    'omit': 'text-orange-400',
};

function TransformerNode({ data, selected }: NodeProps) {
    const nodeData = data as unknown as TransformerNodeData;
    const operations = nodeData.operations || [];
    const status = nodeData.status || 'idle';

    return (
        <div
            className={cn(
                'relative min-w-[200px] rounded-lg border-2 shadow-lg transition-all duration-200',
                'bg-[hsl(225_10%_11%)]',
                selected
                    ? 'border-violet-500 shadow-[0_0_20px_rgba(139,92,246,0.4)]'
                    : 'border-[hsl(225_7%_26%)] hover:border-violet-500/50',
                'hover:shadow-xl hover:-translate-y-0.5'
            )}
        >
            {/* Input Handle */}
            <Handle
                type="target"
                position={Position.Left}
                className="!w-3 !h-3 !bg-[hsl(225_12%_8%)] !border-2 !border-violet-500 hover:!scale-125 transition-transform"
            />

            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[hsl(225_8%_18%)] bg-[hsl(225_12%_8%)] rounded-t-lg">
                <div className="w-8 h-8 flex items-center justify-center rounded-md text-white bg-violet-600">
                    <Wand2 className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[hsl(220_13%_91%)] truncate">
                        {nodeData.label || 'Transform'}
                    </div>
                    <div className="text-xs text-[hsl(220_9%_63%)]">
                        Data Transformer
                    </div>
                </div>
                <div
                    className={cn(
                        'w-2.5 h-2.5 rounded-full',
                        status === 'idle' && 'bg-slate-500',
                        status === 'running' && 'bg-violet-500 animate-pulse',
                        status === 'completed' && 'bg-emerald-500',
                        status === 'error' && 'bg-red-500'
                    )}
                />
            </div>

            {/* Body - Operations List */}
            <div className="p-3">
                {operations.length > 0 ? (
                    <div className="space-y-1 max-h-[100px] overflow-y-auto">
                        {operations.slice(0, 5).map((op, index) => {
                            const Icon = OPERATION_ICONS[op.type] || Wand2;
                            const color = OPERATION_COLORS[op.type] || 'text-slate-400';

                            return (
                                <div
                                    key={index}
                                    className="flex items-center gap-2 text-xs bg-[hsl(225_15%_5%)] px-2 py-1 rounded"
                                >
                                    <Icon className={cn('w-3 h-3', color)} />
                                    <span className={color}>{op.type}</span>
                                    {op.field && (
                                        <span className="text-slate-500 truncate">
                                            {op.field}
                                        </span>
                                    )}
                                    {op.from && op.to && (
                                        <span className="text-slate-500 truncate">
                                            {op.from} → {op.to}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                        {operations.length > 5 && (
                            <div className="text-[10px] text-slate-500 text-center">
                                +{operations.length - 5} more
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-xs text-slate-500 text-center py-2 bg-[hsl(225_15%_5%)] rounded">
                        No operations defined
                    </div>
                )}
            </div>

            {/* Output Handle */}
            <Handle
                type="source"
                position={Position.Right}
                className="!w-3 !h-3 !bg-[hsl(225_12%_8%)] !border-2 !border-violet-500 hover:!scale-125 transition-transform"
            />
        </div>
    );
}

export default memo(TransformerNode);
