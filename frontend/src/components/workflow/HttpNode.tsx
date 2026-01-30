import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { Globe } from 'lucide-react';

export interface HttpNodeData {
    label: string;
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    url: string;
    status?: 'idle' | 'running' | 'success' | 'error';
    statusCode?: number;
    latency?: number;
    [key: string]: unknown;
}

const METHOD_COLORS: Record<string, string> = {
    'GET': 'bg-emerald-600 text-emerald-100',
    'POST': 'bg-blue-600 text-blue-100',
    'PUT': 'bg-amber-600 text-amber-100',
    'PATCH': 'bg-purple-600 text-purple-100',
    'DELETE': 'bg-red-600 text-red-100',
};

function HttpNode({ data, selected }: NodeProps) {
    const nodeData = data as unknown as HttpNodeData;
    const method = nodeData.method || 'GET';
    const status = nodeData.status || 'idle';

    // Parse URL for display
    let displayUrl = nodeData.url || 'https://api.example.com';
    try {
        const url = new URL(displayUrl.replace(/\{\{.*?\}\}/g, 'x')); // Handle template variables
        displayUrl = url.hostname + (url.pathname !== '/' ? url.pathname : '');
    } catch {
        displayUrl = nodeData.url || 'Enter URL';
    }

    return (
        <div
            className={cn(
                'relative min-w-[240px] rounded-lg border-2 shadow-lg transition-all duration-200',
                'bg-[hsl(225_10%_11%)]',
                selected
                    ? 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                    : 'border-[hsl(225_7%_26%)] hover:border-emerald-500/50',
                'hover:shadow-xl hover:-translate-y-0.5'
            )}
        >
            {/* Input Handle */}
            <Handle
                type="target"
                position={Position.Left}
                className="!w-3 !h-3 !bg-[hsl(225_12%_8%)] !border-2 !border-emerald-500 hover:!scale-125 transition-transform"
            />

            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[hsl(225_8%_18%)] bg-[hsl(225_12%_8%)] rounded-t-lg">
                <div className="w-8 h-8 flex items-center justify-center rounded-md text-white bg-emerald-600">
                    <Globe className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[hsl(220_13%_91%)] truncate">
                        {nodeData.label || 'HTTP Request'}
                    </div>
                    <div className="text-xs text-[hsl(220_9%_63%)]">
                        External API
                    </div>
                </div>
                <div
                    className={cn(
                        'w-2.5 h-2.5 rounded-full',
                        status === 'idle' && 'bg-slate-500',
                        status === 'running' && 'bg-emerald-500 animate-pulse',
                        status === 'success' && 'bg-emerald-500',
                        status === 'error' && 'bg-red-500'
                    )}
                />
            </div>

            {/* Body */}
            <div className="p-3 space-y-2">
                {/* Method + URL */}
                <div className="flex items-center gap-2 bg-[hsl(225_15%_5%)] p-2 rounded">
                    <span className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-bold',
                        METHOD_COLORS[method]
                    )}>
                        {method}
                    </span>
                    <span className="text-xs text-[hsl(220_9%_63%)] truncate flex-1 font-mono">
                        {displayUrl}
                    </span>
                </div>

                {/* Response info when completed */}
                {status === 'success' && nodeData.statusCode && (
                    <div className="flex items-center justify-between text-[10px]">
                        <span className={cn(
                            'px-1.5 py-0.5 rounded',
                            nodeData.statusCode >= 200 && nodeData.statusCode < 300
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-red-500/20 text-red-400'
                        )}>
                            {nodeData.statusCode}
                        </span>
                        {nodeData.latency && (
                            <span className="text-slate-500">
                                {nodeData.latency}ms
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Output Handle */}
            <Handle
                type="source"
                position={Position.Right}
                className="!w-3 !h-3 !bg-[hsl(225_12%_8%)] !border-2 !border-emerald-500 hover:!scale-125 transition-transform"
            />
        </div>
    );
}

export default memo(HttpNode);
