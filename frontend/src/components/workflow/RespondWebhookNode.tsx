/**
 * Respond to Webhook Node - Returns response to webhook caller
 */

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { Reply, FileJson } from 'lucide-react';

export interface RespondWebhookNodeData {
    label: string;
    respondWith: 'firstIncomingItem' | 'allIncomingItems' | 'json' | 'noData' | 'redirect';
    responseCode?: number;
    responseHeaders?: { name: string; value: string }[];
    responseBody?: string;
    redirectUrl?: string;
    status?: 'idle' | 'running' | 'success' | 'error';
    [key: string]: unknown;
}

function RespondWebhookNode({ data, selected }: NodeProps) {
    const nodeData = data as unknown as RespondWebhookNodeData;
    const status = nodeData.status || 'idle';
    const respondWith = nodeData.respondWith || 'firstIncomingItem';
    const responseCode = nodeData.responseCode || 200;

    const getResponseDescription = () => {
        switch (respondWith) {
            case 'firstIncomingItem':
                return 'First item as JSON';
            case 'allIncomingItems':
                return 'All items as JSON array';
            case 'json':
                return 'Custom JSON body';
            case 'noData':
                return 'Empty response';
            case 'redirect':
                return `Redirect to URL`;
            default:
                return respondWith;
        }
    };

    const getStatusCodeClass = () => {
        if (responseCode >= 200 && responseCode < 300) return 'bg-emerald-500/20 text-emerald-400';
        if (responseCode >= 300 && responseCode < 400) return 'bg-blue-500/20 text-blue-400';
        if (responseCode >= 400 && responseCode < 500) return 'bg-amber-500/20 text-amber-400';
        if (responseCode >= 500) return 'bg-red-500/20 text-red-400';
        return 'bg-slate-500/20 text-slate-400';
    };

    return (
        <div
            className={cn(
                'relative min-w-[240px] rounded-lg border-2 shadow-lg transition-all duration-200',
                'bg-card',
                selected
                    ? 'border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.4)]'
                    : 'border-border hover:border-orange-500/50',
                'hover:shadow-xl hover:-translate-y-0.5'
            )}
        >
            {/* Input Handle */}
            <Handle
                type="target"
                position={Position.Left}
                className="!w-3 !h-3 !bg-background !border-2 !border-orange-500 hover:!scale-125 transition-transform"
            />

            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/50 rounded-t-lg">
                <div className="w-8 h-8 flex items-center justify-center rounded-md bg-orange-600 text-white">
                    <Reply className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">
                        {nodeData.label || 'Respond Webhook'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                        Send Response
                    </div>
                </div>
                <div
                    className={cn(
                        'w-2.5 h-2.5 rounded-full',
                        status === 'idle' && 'bg-slate-500',
                        status === 'running' && 'bg-orange-500 animate-pulse',
                        status === 'success' && 'bg-emerald-500',
                        status === 'error' && 'bg-red-500'
                    )}
                />
            </div>

            {/* Body */}
            <div className="p-3 space-y-2">
                {/* Response Code */}
                <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Status:</span>
                    <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold', getStatusCodeClass())}>
                        {responseCode}
                    </span>
                </div>

                {/* Response Type */}
                <div className="bg-muted/50 rounded p-2">
                    <div className="flex items-center gap-2">
                        <FileJson className="w-3.5 h-3.5 text-orange-400" />
                        <span className="text-xs text-foreground">
                            {getResponseDescription()}
                        </span>
                    </div>
                </div>

                {/* Headers count */}
                {nodeData.responseHeaders && nodeData.responseHeaders.length > 0 && (
                    <div className="text-[10px] text-muted-foreground">
                        {nodeData.responseHeaders.length} custom header(s)
                    </div>
                )}

                {/* Redirect URL preview */}
                {respondWith === 'redirect' && nodeData.redirectUrl && (
                    <div className="bg-blue-500/10 rounded p-2">
                        <div className="text-[10px] text-blue-400 font-mono truncate">
                            → {nodeData.redirectUrl}
                        </div>
                    </div>
                )}
            </div>

            {/* No output handle - this ends the webhook flow */}
        </div>
    );
}

export default memo(RespondWebhookNode);
