import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { Code } from 'lucide-react';

export interface CodeNodeData {
    label: string;
    code: string;
    language: 'javascript';
    status?: 'idle' | 'running' | 'completed' | 'error';
    output?: unknown;
    error?: string;
    [key: string]: unknown;
}

function CodeNode({ data, selected }: NodeProps) {
    const nodeData = data as unknown as CodeNodeData;
    const status = nodeData.status || 'idle';
    const codePreview = (nodeData.code || '// Write your code here').slice(0, 100);

    return (
        <div
            className={cn(
                'relative min-w-[220px] rounded-lg border-2 shadow-lg transition-all duration-200',
                'bg-[hsl(225_10%_11%)]',
                selected
                    ? 'border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.4)]'
                    : 'border-[hsl(225_7%_26%)] hover:border-yellow-500/50',
                'hover:shadow-xl hover:-translate-y-0.5'
            )}
        >
            {/* Input Handle */}
            <Handle
                type="target"
                position={Position.Left}
                className="!w-3 !h-3 !bg-[hsl(225_12%_8%)] !border-2 !border-yellow-500 hover:!scale-125 transition-transform"
            />

            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[hsl(225_8%_18%)] bg-[hsl(225_12%_8%)] rounded-t-lg">
                <div className="w-8 h-8 flex items-center justify-center rounded-md text-white bg-yellow-600">
                    <Code className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[hsl(220_13%_91%)] truncate">
                        {nodeData.label || 'Code'}
                    </div>
                    <div className="text-xs text-[hsl(220_9%_63%)]">
                        JavaScript
                    </div>
                </div>
                <div
                    className={cn(
                        'w-2.5 h-2.5 rounded-full',
                        status === 'idle' && 'bg-slate-500',
                        status === 'running' && 'bg-yellow-500 animate-pulse',
                        status === 'completed' && 'bg-emerald-500',
                        status === 'error' && 'bg-red-500'
                    )}
                />
            </div>

            {/* Body - Code Preview */}
            <div className="p-3">
                <pre className="font-mono text-[10px] text-[hsl(220_9%_63%)] bg-[hsl(225_15%_5%)] p-2 rounded max-h-[80px] overflow-hidden">
                    <code className="text-yellow-300">
                        {codePreview}
                        {nodeData.code && nodeData.code.length > 100 && '...'}
                    </code>
                </pre>

                {status === 'error' && nodeData.error && (
                    <div className="mt-2 text-[10px] text-red-400 bg-red-500/10 p-1 rounded truncate">
                        {nodeData.error}
                    </div>
                )}
            </div>

            {/* Output Handle */}
            <Handle
                type="source"
                position={Position.Right}
                className="!w-3 !h-3 !bg-[hsl(225_12%_8%)] !border-2 !border-yellow-500 hover:!scale-125 transition-transform"
            />
        </div>
    );
}

export default memo(CodeNode);
