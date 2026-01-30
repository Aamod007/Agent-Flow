import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { GitBranch } from 'lucide-react';

export type ConditionStatus = 'idle' | 'running' | 'true' | 'false' | 'error';

export interface ConditionNodeData {
    label: string;
    field: string;
    operator: string;
    value: string;
    status?: ConditionStatus;
    [key: string]: unknown;
}

const OPERATORS: Record<string, string> = {
    'equals': '==',
    'notEquals': '!=',
    'contains': '∋',
    'greaterThan': '>',
    'lessThan': '<',
    'greaterOrEqual': '>=',
    'lessOrEqual': '<=',
    'exists': '∃',
    'isEmpty': '∅',
};

function StatusIndicator({ status }: { status: ConditionStatus }) {
    return (
        <div
            className={cn(
                'w-2.5 h-2.5 rounded-full',
                status === 'idle' && 'bg-slate-500',
                status === 'running' && 'bg-purple-500 animate-pulse',
                status === 'true' && 'bg-emerald-500',
                status === 'false' && 'bg-amber-500',
                status === 'error' && 'bg-red-500'
            )}
        />
    );
}

function ConditionNode({ data, selected }: NodeProps) {
    const nodeData = data as unknown as ConditionNodeData;
    const status: ConditionStatus = nodeData.status || 'idle';
    const operatorSymbol = OPERATORS[nodeData.operator] || nodeData.operator;

    return (
        <div
            className={cn(
                'relative min-w-[200px] rounded-lg border-2 shadow-lg transition-all duration-200',
                'bg-[hsl(225_10%_11%)]',
                selected
                    ? 'border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                    : 'border-[hsl(225_7%_26%)] hover:border-amber-500/50',
                'hover:shadow-xl hover:-translate-y-0.5'
            )}
        >
            {/* Input Handle */}
            <Handle
                type="target"
                position={Position.Left}
                className="!w-3 !h-3 !bg-[hsl(225_12%_8%)] !border-2 !border-amber-500 hover:!scale-125 transition-transform"
            />

            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[hsl(225_8%_18%)] bg-[hsl(225_12%_8%)] rounded-t-lg">
                <div className="w-8 h-8 flex items-center justify-center rounded-md text-white bg-amber-600">
                    <GitBranch className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[hsl(220_13%_91%)] truncate">
                        {nodeData.label || 'Condition'}
                    </div>
                    <div className="text-xs text-[hsl(220_9%_63%)]">
                        IF / ELSE
                    </div>
                </div>
                <StatusIndicator status={status} />
            </div>

            {/* Body - Condition Preview */}
            <div className="p-3">
                <div className="font-mono text-xs text-[hsl(220_9%_63%)] bg-[hsl(225_15%_5%)] p-2 rounded">
                    <span className="text-amber-400">{nodeData.field || 'value'}</span>
                    <span className="text-white mx-1">{operatorSymbol}</span>
                    <span className="text-emerald-400">{nodeData.value || '?'}</span>
                </div>
            </div>

            {/* Output Handles */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-8">
                {/* True Handle */}
                <div className="relative">
                    <Handle
                        type="source"
                        position={Position.Right}
                        id="true"
                        className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-emerald-400 hover:!scale-125 transition-transform"
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] text-emerald-400 font-medium">
                        YES
                    </span>
                </div>
                {/* False Handle */}
                <div className="relative">
                    <Handle
                        type="source"
                        position={Position.Right}
                        id="false"
                        className="!w-3 !h-3 !bg-red-500 !border-2 !border-red-400 hover:!scale-125 transition-transform"
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] text-red-400 font-medium">
                        NO
                    </span>
                </div>
            </div>
        </div>
    );
}

export default memo(ConditionNode);
