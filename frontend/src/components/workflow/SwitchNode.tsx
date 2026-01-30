import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { Route } from 'lucide-react';

export interface SwitchCase {
    id: string;
    label: string;
    value: string;
}

export interface SwitchNodeData {
    label: string;
    field: string;
    cases: SwitchCase[];
    status?: 'idle' | 'running' | 'completed' | 'error';
    activeCase?: string;
    [key: string]: unknown;
}

const CASE_COLORS = [
    'bg-blue-500 border-blue-400',
    'bg-purple-500 border-purple-400',
    'bg-pink-500 border-pink-400',
    'bg-cyan-500 border-cyan-400',
    'bg-orange-500 border-orange-400',
];

function SwitchNode({ data, selected }: NodeProps) {
    const nodeData = data as unknown as SwitchNodeData;
    const cases = nodeData.cases || [
        { id: 'case1', label: 'Case 1', value: 'value1' },
        { id: 'case2', label: 'Case 2', value: 'value2' },
    ];
    const status = nodeData.status || 'idle';

    return (
        <div
            className={cn(
                'relative min-w-[220px] rounded-lg border-2 shadow-lg transition-all duration-200',
                'bg-[hsl(225_10%_11%)]',
                selected
                    ? 'border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                    : 'border-[hsl(225_7%_26%)] hover:border-purple-500/50',
                'hover:shadow-xl hover:-translate-y-0.5'
            )}
        >
            {/* Input Handle */}
            <Handle
                type="target"
                position={Position.Left}
                className="!w-3 !h-3 !bg-[hsl(225_12%_8%)] !border-2 !border-purple-500 hover:!scale-125 transition-transform"
            />

            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[hsl(225_8%_18%)] bg-[hsl(225_12%_8%)] rounded-t-lg">
                <div className="w-8 h-8 flex items-center justify-center rounded-md text-white bg-purple-600">
                    <Route className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[hsl(220_13%_91%)] truncate">
                        {nodeData.label || 'Switch'}
                    </div>
                    <div className="text-xs text-[hsl(220_9%_63%)]">
                        Switch on: {nodeData.field || 'field'}
                    </div>
                </div>
                <div
                    className={cn(
                        'w-2.5 h-2.5 rounded-full',
                        status === 'idle' && 'bg-slate-500',
                        status === 'running' && 'bg-purple-500 animate-pulse',
                        status === 'completed' && 'bg-emerald-500',
                        status === 'error' && 'bg-red-500'
                    )}
                />
            </div>

            {/* Cases */}
            <div className="p-3 space-y-2">
                {cases.map((c, index) => (
                    <div
                        key={c.id}
                        className={cn(
                            'text-xs px-2 py-1 rounded flex items-center justify-between',
                            'bg-[hsl(225_15%_5%)]',
                            nodeData.activeCase === c.id && 'ring-1 ring-purple-500'
                        )}
                    >
                        <span className="text-[hsl(220_9%_63%)]">{c.label}</span>
                        <span className="text-purple-400 font-mono">{c.value}</span>
                    </div>
                ))}
                {/* Default case */}
                <div className="text-xs px-2 py-1 rounded bg-[hsl(225_15%_5%)] flex items-center justify-between opacity-60">
                    <span className="text-[hsl(220_9%_63%)]">Default</span>
                    <span className="text-slate-400 font-mono">*</span>
                </div>
            </div>

            {/* Output Handles */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col" style={{ gap: `${Math.max(20, 60 / (cases.length + 1))}px` }}>
                {cases.map((c, index) => (
                    <div key={c.id} className="relative">
                        <Handle
                            type="source"
                            position={Position.Right}
                            id={c.id}
                            className={cn(
                                '!w-3 !h-3 hover:!scale-125 transition-transform',
                                CASE_COLORS[index % CASE_COLORS.length]
                            )}
                        />
                        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 font-medium whitespace-nowrap">
                            {c.label}
                        </span>
                    </div>
                ))}
                {/* Default handle */}
                <div className="relative">
                    <Handle
                        type="source"
                        position={Position.Right}
                        id="default"
                        className="!w-3 !h-3 !bg-slate-500 !border-2 !border-slate-400 hover:!scale-125 transition-transform"
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 font-medium">
                        Default
                    </span>
                </div>
            </div>
        </div>
    );
}

export default memo(SwitchNode);
