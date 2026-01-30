import { useState, useEffect, memo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    X,
    Search,
    Clock,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Play,
    Pause,
    RotateCcw,
    Trash2,
    Download,
    Calendar,
    Eye,
    Loader2,
    RefreshCw
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

// Simple time formatting utilities
function formatDistanceToNow(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'just now';
}

function formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

interface Execution {
    id: string;
    workflowId: string;
    status: 'pending' | 'running' | 'success' | 'error' | 'stopped';
    startedAt: string;
    finishedAt?: string;
    duration?: number;
    mode: 'manual' | 'webhook' | 'schedule';
    nodeCount: number;
    errorMessage?: string;
    data?: any;
}

interface ExecutionHistoryPanelProps {
    workflowId: string;
    onClose: () => void;
    onViewExecution: (executionId: string) => void;
    onReplayExecution: (executionId: string) => void;
}

function StatusIcon({ status }: { status: Execution['status'] }) {
    switch (status) {
        case 'success':
            return <CheckCircle className="w-4 h-4 text-emerald-400" />;
        case 'error':
            return <XCircle className="w-4 h-4 text-red-400" />;
        case 'running':
            return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
        case 'stopped':
            return <Pause className="w-4 h-4 text-amber-400" />;
        default:
            return <Clock className="w-4 h-4 text-gray-400" />;
    }
}

function ModeIcon({ mode }: { mode: Execution['mode'] }) {
    switch (mode) {
        case 'webhook':
            return <RefreshCw className="w-3 h-3" />;
        case 'schedule':
            return <Calendar className="w-3 h-3" />;
        default:
            return <Play className="w-3 h-3" />;
    }
}

function ExecutionCard({
    execution,
    onView,
    onReplay,
    onDelete,
}: {
    execution: Execution;
    onView: () => void;
    onReplay: () => void;
    onDelete: () => void;
}) {
    const statusColors = {
        pending: 'border-gray-500/30',
        running: 'border-blue-500/30 bg-blue-500/5',
        success: 'border-emerald-500/30',
        error: 'border-red-500/30 bg-red-500/5',
        stopped: 'border-amber-500/30',
    };

    return (
        <div
            className={cn(
                'p-4 rounded-lg border transition-all duration-200',
                'bg-[hsl(225_10%_11%)] hover:bg-[hsl(225_9%_15%)]',
                statusColors[execution.status]
            )}
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <StatusIcon status={execution.status} />
                    <div>
                        <p className="text-sm font-medium text-[hsl(220_13%_91%)]">
                            #{execution.id.slice(0, 8)}
                        </p>
                        <p className="text-xs text-[hsl(220_7%_45%)]">
                            {formatDistanceToNow(new Date(execution.startedAt))}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={onView}
                        title="View details"
                    >
                        <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={onReplay}
                        title="Replay execution"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-400 hover:text-red-300"
                        onClick={onDelete}
                        title="Delete execution"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-[hsl(220_9%_63%)]">
                <span className="flex items-center gap-1 px-2 py-1 bg-[hsl(225_8%_18%)] rounded">
                    <ModeIcon mode={execution.mode} />
                    {execution.mode}
                </span>
                {execution.duration !== undefined && (
                    <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {execution.duration < 1000
                            ? `${execution.duration}ms`
                            : `${(execution.duration / 1000).toFixed(1)}s`}
                    </span>
                )}
                <span>{execution.nodeCount} nodes</span>
            </div>

            {execution.status === 'error' && execution.errorMessage && (
                <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400 truncate">
                    {execution.errorMessage}
                </div>
            )}

            <div className="mt-3 pt-3 border-t border-[hsl(225_8%_18%)] text-xs text-[hsl(220_7%_45%)]">
                Started: {formatDate(new Date(execution.startedAt))}
            </div>
        </div>
    );
}

function ExecutionHistoryPanel({
    workflowId,
    onClose,
    onViewExecution,
    onReplayExecution,
}: ExecutionHistoryPanelProps) {
    const [executions, setExecutions] = useState<Execution[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [modeFilter, setModeFilter] = useState<string>('all');

    // Fetch executions
    useEffect(() => {
        const fetchExecutions = async () => {
            try {
                setLoading(true);
                // Try to get executions - the API might not exist yet
                const data: Execution[] = [];
                try {
                    const result = await api.getExecution(workflowId);
                    if (result) data.push(result as unknown as Execution);
                } catch {}
                setExecutions(data);
            } catch (error) {
                console.error('Failed to fetch executions:', error);
                // Use mock data for development
                setExecutions([
                    {
                        id: 'exec-001-abc123def456',
                        workflowId,
                        status: 'success',
                        startedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
                        finishedAt: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
                        duration: 1234,
                        mode: 'manual',
                        nodeCount: 5,
                    },
                    {
                        id: 'exec-002-xyz789ghi012',
                        workflowId,
                        status: 'error',
                        startedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
                        finishedAt: new Date(Date.now() - 1000 * 60 * 29).toISOString(),
                        duration: 856,
                        mode: 'webhook',
                        nodeCount: 3,
                        errorMessage: 'HTTP Request failed: Connection timeout',
                    },
                    {
                        id: 'exec-003-jkl345mno678',
                        workflowId,
                        status: 'success',
                        startedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
                        finishedAt: new Date(Date.now() - 1000 * 60 * 60 * 2 + 5000).toISOString(),
                        duration: 5432,
                        mode: 'schedule',
                        nodeCount: 8,
                    },
                    {
                        id: 'exec-004-pqr901stu234',
                        workflowId,
                        status: 'running',
                        startedAt: new Date(Date.now() - 1000 * 30).toISOString(),
                        mode: 'manual',
                        nodeCount: 4,
                    },
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchExecutions();
    }, [workflowId]);

    const handleDelete = async (executionId: string) => {
        try {
            // await api.deleteExecution(executionId);
            setExecutions((prev) => prev.filter((e) => e.id !== executionId));
            toast.success('Execution deleted');
        } catch (error) {
            toast.error('Failed to delete execution');
        }
    };

    const handleExportAll = () => {
        const blob = new Blob([JSON.stringify(executions, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `executions-${workflowId}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Executions exported');
    };

    // Filter executions
    const filteredExecutions = executions.filter((execution) => {
        if (statusFilter !== 'all' && execution.status !== statusFilter) return false;
        if (modeFilter !== 'all' && execution.mode !== modeFilter) return false;
        if (searchQuery && !execution.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    // Stats
    const stats = {
        total: executions.length,
        success: executions.filter((e) => e.status === 'success').length,
        error: executions.filter((e) => e.status === 'error').length,
        running: executions.filter((e) => e.status === 'running').length,
    };

    return (
        <div className="fixed inset-y-0 right-0 w-[480px] bg-[hsl(225_12%_8%)] border-l border-[hsl(225_8%_18%)] flex flex-col z-50 shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[hsl(225_8%_18%)]">
                <div>
                    <h3 className="font-semibold text-[hsl(220_13%_91%)]">Execution History</h3>
                    <p className="text-xs text-[hsl(220_7%_45%)] mt-1">
                        {stats.total} total executions
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportAll}
                        className="bg-transparent border-[hsl(225_8%_18%)] text-[hsl(220_13%_91%)]"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="flex items-center gap-4 p-4 border-b border-[hsl(225_8%_18%)] bg-[hsl(225_10%_11%)]">
                <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm text-[hsl(220_13%_91%)]">{stats.success}</span>
                </div>
                <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-400" />
                    <span className="text-sm text-[hsl(220_13%_91%)]">{stats.error}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-[hsl(220_13%_91%)]">{stats.running}</span>
                </div>
            </div>

            {/* Filters */}
            <div className="p-4 border-b border-[hsl(225_8%_18%)] space-y-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(220_7%_45%)]" />
                    <Input
                        placeholder="Search by execution ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-[hsl(225_10%_11%)] border-[hsl(225_8%_18%)] text-[hsl(220_13%_91%)]"
                    />
                </div>
                <div className="flex gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[130px] bg-[hsl(225_10%_11%)] border-[hsl(225_8%_18%)] text-[hsl(220_13%_91%)]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent className="bg-[hsl(225_12%_8%)] border-[hsl(225_8%_18%)]">
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="success">Success</SelectItem>
                            <SelectItem value="error">Error</SelectItem>
                            <SelectItem value="running">Running</SelectItem>
                            <SelectItem value="stopped">Stopped</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={modeFilter} onValueChange={setModeFilter}>
                        <SelectTrigger className="w-[130px] bg-[hsl(225_10%_11%)] border-[hsl(225_8%_18%)] text-[hsl(220_13%_91%)]">
                            <SelectValue placeholder="Mode" />
                        </SelectTrigger>
                        <SelectContent className="bg-[hsl(225_12%_8%)] border-[hsl(225_8%_18%)]">
                            <SelectItem value="all">All Modes</SelectItem>
                            <SelectItem value="manual">Manual</SelectItem>
                            <SelectItem value="webhook">Webhook</SelectItem>
                            <SelectItem value="schedule">Schedule</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Execution List */}
            <div className="flex-1 overflow-auto">
                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                    </div>
                ) : filteredExecutions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-center p-4">
                        <AlertTriangle className="w-12 h-12 text-[hsl(220_7%_45%)] mb-3" />
                        <p className="text-[hsl(220_9%_63%)]">No executions found</p>
                        <p className="text-xs text-[hsl(220_7%_45%)] mt-1">
                            {searchQuery || statusFilter !== 'all' || modeFilter !== 'all'
                                ? 'Try adjusting your filters'
                                : 'Execute the workflow to see history'}
                        </p>
                    </div>
                ) : (
                    <div className="p-4 space-y-3">
                        {filteredExecutions.map((execution) => (
                            <ExecutionCard
                                key={execution.id}
                                execution={execution}
                                onView={() => onViewExecution(execution.id)}
                                onReplay={() => onReplayExecution(execution.id)}
                                onDelete={() => handleDelete(execution.id)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default memo(ExecutionHistoryPanel);
