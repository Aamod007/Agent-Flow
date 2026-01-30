/**
 * Data Preview Component
 * 
 * Shows preview of data flowing through connections
 * Similar to n8n's data preview on edges
 */

import { memo, useState } from 'react';
import { cn } from '@/lib/utils';
import { 
    ChevronDown, 
    ChevronRight, 
    Copy, 
    Check,
    FileJson,
    List,
    Hash,
    Type,
    ToggleLeft
} from 'lucide-react';

interface DataPreviewProps {
    data: any;
    maxDepth?: number;
    className?: string;
}

// Get icon for data type
function getTypeIcon(value: any) {
    if (value === null || value === undefined) return null;
    if (Array.isArray(value)) return List;
    if (typeof value === 'object') return FileJson;
    if (typeof value === 'number') return Hash;
    if (typeof value === 'string') return Type;
    if (typeof value === 'boolean') return ToggleLeft;
    return FileJson;
}

// Format value for display
function formatValue(value: any): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') {
        if (value.length > 50) return `"${value.substring(0, 50)}..."`;
        return `"${value}"`;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
    }
    if (Array.isArray(value)) {
        return `Array(${value.length})`;
    }
    if (typeof value === 'object') {
        const keys = Object.keys(value);
        return `{${keys.length} keys}`;
    }
    return String(value);
}

// Get color class for value type
function getTypeColor(value: any): string {
    if (value === null || value === undefined) return 'text-slate-500';
    if (typeof value === 'string') return 'text-green-400';
    if (typeof value === 'number') return 'text-blue-400';
    if (typeof value === 'boolean') return 'text-purple-400';
    if (Array.isArray(value)) return 'text-amber-400';
    if (typeof value === 'object') return 'text-cyan-400';
    return 'text-slate-400';
}

// Recursive JSON Tree component
function JsonTreeNode({ 
    name, 
    value, 
    depth = 0, 
    maxDepth = 3,
    path = ''
}: { 
    name: string; 
    value: any; 
    depth?: number;
    maxDepth?: number;
    path?: string;
}) {
    const [isExpanded, setIsExpanded] = useState(depth < 2);
    const [copied, setCopied] = useState(false);

    const isExpandable = (typeof value === 'object' && value !== null) || Array.isArray(value);
    const currentPath = path ? `${path}.${name}` : name;
    const Icon = getTypeIcon(value);

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(JSON.stringify(value, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const handleCopyPath = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(`{{$json.${currentPath}}}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    if (depth > maxDepth) {
        return (
            <div className="pl-4 text-xs text-slate-500 italic">
                ... (max depth reached)
            </div>
        );
    }

    return (
        <div className="select-none">
            <div 
                className={cn(
                    'flex items-center gap-1 py-0.5 px-1 rounded group',
                    'hover:bg-slate-800/50 cursor-pointer'
                )}
                onClick={() => isExpandable && setIsExpanded(!isExpanded)}
            >
                {/* Expand/Collapse icon */}
                <span className="w-4 h-4 flex items-center justify-center text-slate-500">
                    {isExpandable ? (
                        isExpanded ? (
                            <ChevronDown className="w-3 h-3" />
                        ) : (
                            <ChevronRight className="w-3 h-3" />
                        )
                    ) : (
                        <span className="w-3" />
                    )}
                </span>

                {/* Type icon */}
                {Icon && <Icon className={cn('w-3 h-3', getTypeColor(value))} />}

                {/* Key name */}
                <span className="text-indigo-400 text-xs">{name}</span>
                <span className="text-slate-500 text-xs">:</span>

                {/* Value preview */}
                {!isExpanded || !isExpandable ? (
                    <span className={cn('text-xs truncate max-w-[200px]', getTypeColor(value))}>
                        {formatValue(value)}
                    </span>
                ) : null}

                {/* Copy buttons (visible on hover) */}
                <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={handleCopyPath}
                        className="p-0.5 rounded hover:bg-slate-700 text-slate-500 hover:text-indigo-400"
                        title="Copy path expression"
                    >
                        {copied ? (
                            <Check className="w-3 h-3 text-green-400" />
                        ) : (
                            <span className="text-[9px] font-mono">{'{}'}</span>
                        )}
                    </button>
                    <button
                        onClick={handleCopy}
                        className="p-0.5 rounded hover:bg-slate-700 text-slate-500 hover:text-slate-300"
                        title="Copy value"
                    >
                        <Copy className="w-3 h-3" />
                    </button>
                </div>
            </div>

            {/* Children */}
            {isExpanded && isExpandable && (
                <div className="ml-4 border-l border-slate-700 pl-2">
                    {Array.isArray(value) ? (
                        value.map((item, index) => (
                            <JsonTreeNode
                                key={index}
                                name={String(index)}
                                value={item}
                                depth={depth + 1}
                                maxDepth={maxDepth}
                                path={currentPath}
                            />
                        ))
                    ) : (
                        Object.entries(value).map(([key, val]) => (
                            <JsonTreeNode
                                key={key}
                                name={key}
                                value={val}
                                depth={depth + 1}
                                maxDepth={maxDepth}
                                path={currentPath}
                            />
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

// Main Data Preview component
export function DataPreview({ data, maxDepth = 3, className }: DataPreviewProps) {
    const [viewMode, setViewMode] = useState<'tree' | 'json'>('tree');
    const [copied, setCopied] = useState(false);

    const handleCopyAll = () => {
        navigator.clipboard.writeText(JSON.stringify(data, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    if (data === null || data === undefined) {
        return (
            <div className={cn('p-4 text-center text-slate-500 text-sm', className)}>
                No data available
            </div>
        );
    }

    return (
        <div className={cn('flex flex-col', className)}>
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/50">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-foreground">Output Data</span>
                    {Array.isArray(data) && (
                        <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 text-[10px] font-medium">
                            {data.length} items
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    {/* View mode toggle */}
                    <button
                        onClick={() => setViewMode(viewMode === 'tree' ? 'json' : 'tree')}
                        className={cn(
                            'px-2 py-1 rounded text-xs',
                            'hover:bg-muted text-muted-foreground hover:text-foreground'
                        )}
                    >
                        {viewMode === 'tree' ? 'JSON' : 'Tree'}
                    </button>
                    {/* Copy all */}
                    <button
                        onClick={handleCopyAll}
                        className={cn(
                            'p-1 rounded',
                            'hover:bg-muted text-muted-foreground hover:text-foreground'
                        )}
                        title="Copy all"
                    >
                        {copied ? (
                            <Check className="w-3.5 h-3.5 text-green-400" />
                        ) : (
                            <Copy className="w-3.5 h-3.5" />
                        )}
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-2">
                {viewMode === 'tree' ? (
                    <div className="font-mono text-xs">
                        {Array.isArray(data) ? (
                            data.map((item, index) => (
                                <JsonTreeNode
                                    key={index}
                                    name={`[${index}]`}
                                    value={item}
                                    maxDepth={maxDepth}
                                    path=""
                                />
                            ))
                        ) : typeof data === 'object' ? (
                            Object.entries(data).map(([key, value]) => (
                                <JsonTreeNode
                                    key={key}
                                    name={key}
                                    value={value}
                                    maxDepth={maxDepth}
                                    path=""
                                />
                            ))
                        ) : (
                            <span className={getTypeColor(data)}>{formatValue(data)}</span>
                        )}
                    </div>
                ) : (
                    <pre className="font-mono text-xs text-slate-300 whitespace-pre-wrap">
                        {JSON.stringify(data, null, 2)}
                    </pre>
                )}
            </div>
        </div>
    );
}

// Mini preview for connection hover
export function ConnectionDataPreview({ 
    data, 
    itemCount,
    className 
}: { 
    data?: any; 
    itemCount?: number;
    className?: string;
}) {
    if (!data && itemCount === undefined) return null;

    return (
        <div className={cn(
            'bg-slate-900 border border-slate-700 rounded-lg shadow-xl',
            'max-w-[300px] max-h-[200px] overflow-hidden',
            className
        )}>
            <div className="px-3 py-2 border-b border-slate-700 bg-slate-800/50">
                <div className="flex items-center gap-2">
                    <FileJson className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-xs font-medium text-slate-200">Data Preview</span>
                    {itemCount !== undefined && (
                        <span className="ml-auto text-[10px] text-indigo-400">
                            {itemCount} items
                        </span>
                    )}
                </div>
            </div>
            <div className="p-2 max-h-[150px] overflow-auto">
                {data ? (
                    <pre className="font-mono text-[10px] text-slate-400 whitespace-pre-wrap">
                        {JSON.stringify(data, null, 2).substring(0, 500)}
                        {JSON.stringify(data, null, 2).length > 500 && '...'}
                    </pre>
                ) : (
                    <span className="text-xs text-slate-500">No data yet</span>
                )}
            </div>
        </div>
    );
}

export default memo(DataPreview);
