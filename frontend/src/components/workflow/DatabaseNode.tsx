/**
 * Database Node - Execute database queries
 */

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { Database, Table, FileSearch, FilePlus, FileEdit, FileX } from 'lucide-react';

export interface DatabaseNodeData {
    label: string;
    operation: 'select' | 'insert' | 'update' | 'delete' | 'raw';
    connectionId?: string;
    connectionName?: string;
    table?: string;
    query?: string;
    columns?: string[];
    whereClause?: string;
    values?: Record<string, any>;
    limit?: number;
    status?: 'idle' | 'running' | 'success' | 'error';
    rowsAffected?: number;
    [key: string]: unknown;
}

const OPERATION_ICONS: Record<string, typeof Database> = {
    select: FileSearch,
    insert: FilePlus,
    update: FileEdit,
    delete: FileX,
    raw: Database,
};

const OPERATION_COLORS: Record<string, string> = {
    select: 'bg-blue-600',
    insert: 'bg-emerald-600',
    update: 'bg-amber-600',
    delete: 'bg-red-600',
    raw: 'bg-purple-600',
};

function DatabaseNode({ data, selected }: NodeProps) {
    const nodeData = data as unknown as DatabaseNodeData;
    const status = nodeData.status || 'idle';
    const operation = nodeData.operation || 'select';
    const Icon = OPERATION_ICONS[operation] || Database;
    const colorClass = OPERATION_COLORS[operation] || 'bg-cyan-600';

    return (
        <div
            className={cn(
                'relative min-w-[240px] rounded-lg border-2 shadow-lg transition-all duration-200',
                'bg-card',
                selected
                    ? 'border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                    : 'border-border hover:border-cyan-500/50',
                'hover:shadow-xl hover:-translate-y-0.5'
            )}
        >
            {/* Input Handle */}
            <Handle
                type="target"
                position={Position.Left}
                className="!w-3 !h-3 !bg-background !border-2 !border-cyan-500 hover:!scale-125 transition-transform"
            />

            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/50 rounded-t-lg">
                <div className={cn('w-8 h-8 flex items-center justify-center rounded-md text-white', colorClass)}>
                    <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">
                        {nodeData.label || 'Database'}
                    </div>
                    <div className="text-xs text-muted-foreground capitalize">
                        {operation} Query
                    </div>
                </div>
                <div
                    className={cn(
                        'w-2.5 h-2.5 rounded-full',
                        status === 'idle' && 'bg-slate-500',
                        status === 'running' && 'bg-cyan-500 animate-pulse',
                        status === 'success' && 'bg-emerald-500',
                        status === 'error' && 'bg-red-500'
                    )}
                />
            </div>

            {/* Body */}
            <div className="p-3 space-y-2">
                {/* Connection */}
                <div className="flex items-center gap-2 text-xs">
                    <Database className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-foreground truncate">
                        {nodeData.connectionName || 'No connection'}
                    </span>
                </div>

                {/* Table */}
                {nodeData.table && (
                    <div className="flex items-center gap-2 text-xs">
                        <Table className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">Table:</span>
                        <span className="font-mono text-cyan-400">{nodeData.table}</span>
                    </div>
                )}

                {/* Query Preview */}
                {operation === 'raw' && nodeData.query && (
                    <div className="bg-muted/50 rounded p-2 overflow-hidden">
                        <pre className="font-mono text-[10px] text-muted-foreground truncate">
                            {nodeData.query.substring(0, 100)}
                            {nodeData.query.length > 100 && '...'}
                        </pre>
                    </div>
                )}

                {/* Columns for SELECT */}
                {operation === 'select' && nodeData.columns && nodeData.columns.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {nodeData.columns.slice(0, 4).map((col, i) => (
                            <span
                                key={i}
                                className="px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 rounded text-[10px] font-mono"
                            >
                                {col}
                            </span>
                        ))}
                        {nodeData.columns.length > 4 && (
                            <span className="text-[10px] text-muted-foreground">
                                +{nodeData.columns.length - 4} more
                            </span>
                        )}
                    </div>
                )}

                {/* Results */}
                {status === 'success' && nodeData.rowsAffected !== undefined && (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded p-2">
                        <span className="text-[10px] text-emerald-400">
                            {nodeData.rowsAffected} row(s) {operation === 'select' ? 'returned' : 'affected'}
                        </span>
                    </div>
                )}
            </div>

            {/* Output Handle */}
            <Handle
                type="source"
                position={Position.Right}
                className="!w-3 !h-3 !bg-background !border-2 !border-cyan-500 hover:!scale-125 transition-transform"
            />
        </div>
    );
}

export default memo(DatabaseNode);
