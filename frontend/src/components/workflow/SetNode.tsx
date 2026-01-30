/**
 * Set Node - Transform/Map data (like n8n's Set node)
 */

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { Settings2 } from 'lucide-react';

export interface SetNodeData {
    label: string;
    mode: 'manual' | 'json' | 'expression';
    keepOnlySet: boolean;
    values: { name: string; value: string; type: 'string' | 'number' | 'boolean' | 'object' }[];
    status?: 'idle' | 'running' | 'success' | 'error';
    [key: string]: unknown;
}

function SetNode({ data, selected }: NodeProps) {
    const nodeData = data as unknown as SetNodeData;
    const status = nodeData.status || 'idle';
    const values = nodeData.values || [];

    return (
        <div
            className={cn(
                'relative min-w-[240px] rounded-lg border-2 shadow-lg transition-all duration-200',
                'bg-card',
                selected
                    ? 'border-teal-500 shadow-[0_0_20px_rgba(20,184,166,0.4)]'
                    : 'border-border hover:border-teal-500/50',
                'hover:shadow-xl hover:-translate-y-0.5'
            )}
        >
            {/* Input Handle */}
            <Handle
                type="target"
                position={Position.Left}
                className="!w-3 !h-3 !bg-background !border-2 !border-teal-500 hover:!scale-125 transition-transform"
            />

            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/50 rounded-t-lg">
                <div className="w-8 h-8 flex items-center justify-center rounded-md bg-teal-600 text-white">
                    <Settings2 className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">
                        {nodeData.label || 'Set'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                        Set/Transform Data
                    </div>
                </div>
                <div
                    className={cn(
                        'w-2.5 h-2.5 rounded-full',
                        status === 'idle' && 'bg-slate-500',
                        status === 'running' && 'bg-teal-500 animate-pulse',
                        status === 'success' && 'bg-emerald-500',
                        status === 'error' && 'bg-red-500'
                    )}
                />
            </div>

            {/* Body */}
            <div className="p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Mode:</span>
                    <span className="px-1.5 py-0.5 bg-teal-500/20 text-teal-400 rounded text-[10px] font-medium">
                        {nodeData.mode || 'manual'}
                    </span>
                </div>
                
                {values.length > 0 && (
                    <div className="bg-muted/50 rounded p-2 space-y-1 max-h-[100px] overflow-y-auto">
                        {values.slice(0, 4).map((v, i) => (
                            <div key={i} className="flex items-center gap-2 text-[10px]">
                                <span className="text-teal-400 font-mono">{v.name}</span>
                                <span className="text-muted-foreground">=</span>
                                <span className="text-foreground truncate">{v.value}</span>
                            </div>
                        ))}
                        {values.length > 4 && (
                            <div className="text-[10px] text-muted-foreground">
                                +{values.length - 4} more
                            </div>
                        )}
                    </div>
                )}

                {values.length === 0 && (
                    <div className="text-xs text-muted-foreground text-center py-2">
                        No values configured
                    </div>
                )}
            </div>

            {/* Output Handle */}
            <Handle
                type="source"
                position={Position.Right}
                className="!w-3 !h-3 !bg-background !border-2 !border-teal-500 hover:!scale-125 transition-transform"
            />
        </div>
    );
}

export default memo(SetNode);
