import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { api, type Execution, type ExecutionResult } from '@/lib/api';
import {
    X,
    Play,
    Pause,
    RotateCcw,
    Clock,
    CheckCircle2,
    XCircle,
    Activity,
    Bot,
    ChevronDown,
    ChevronRight,
    FileText,
    History
} from 'lucide-react';

interface ExecutionLog {
    timestamp: string;
    message: string;
    agentId?: string;
    level?: 'info' | 'success' | 'error' | 'warning';
    type?: 'info' | 'success' | 'error' | 'warning';
    details?: Record<string, unknown>;
}

interface ExecutionHistory {
    executionId: string;
    status: string;
    timestamp: string;
    logs: ExecutionLog[];
    results: ExecutionResult[];
}

interface ExecutionMonitorProps {
    workflowId: string;
    executionId: string | null;
    onClose: () => void;
    onExecute: () => void;
}

export default function ExecutionMonitor({
    workflowId: _workflowId,
    executionId,
    onClose,
    onExecute
}: ExecutionMonitorProps) {
    const [execution, setExecution] = useState<Execution | null>(null);
    const [logs, setLogs] = useState<ExecutionLog[]>([]);
    const [results, setResults] = useState<ExecutionResult[]>([]);
    const [isPolling, setIsPolling] = useState(false);
    const [activeTab, setActiveTab] = useState<'logs' | 'results' | 'history'>('logs');
    const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());
    const [executionHistory, setExecutionHistory] = useState<ExecutionHistory[]>([]);
    const [expandedHistory, setExpandedHistory] = useState<Set<string>>(new Set());

    const toggleResultExpanded = (agentId: string) => {
        setExpandedResults(prev => {
            const newSet = new Set(prev);
            if (newSet.has(agentId)) {
                newSet.delete(agentId);
            } else {
                newSet.add(agentId);
            }
            return newSet;
        });
    };

    const toggleHistoryExpanded = (execId: string) => {
        setExpandedHistory(prev => {
            const newSet = new Set(prev);
            if (newSet.has(execId)) {
                newSet.delete(execId);
            } else {
                newSet.add(execId);
            }
            return newSet;
        });
    };

    // Save to history when execution completes
    useEffect(() => {
        if (execution && (execution.status === 'completed' || execution.status === 'failed')) {
            const historyEntry: ExecutionHistory = {
                executionId: execution.id,
                status: execution.status,
                timestamp: execution.startedAt,
                logs: logs,
                results: results,
            };
            
            setExecutionHistory(prev => {
                // Don't add duplicates
                if (prev.some(h => h.executionId === execution.id)) {
                    return prev;
                }
                // Keep only last 10 executions
                const newHistory = [historyEntry, ...prev].slice(0, 10);
                return newHistory;
            });
        }
    }, [execution?.status, execution?.id, logs, results]);

    // Poll for execution updates
    useEffect(() => {
        if (!executionId) return;

        const fetchExecution = async () => {
            try {
                const exec = await api.getExecution(executionId);
                setExecution(exec);

                if (exec.logs) {
                    try {
                        const parsedLogs = JSON.parse(exec.logs);
                        setLogs(Array.isArray(parsedLogs) ? parsedLogs : []);
                    } catch {
                        setLogs([]);
                    }
                }

                // Parse results
                if (exec.result) {
                    try {
                        const parsedResults = JSON.parse(exec.result);
                        setResults(Array.isArray(parsedResults) ? parsedResults : []);
                        // Auto-switch to results tab when execution completes successfully
                        if (exec.status === 'completed' && parsedResults.length > 0) {
                            setActiveTab('results');
                            // Auto-expand all results
                            setExpandedResults(new Set(parsedResults.map((r: ExecutionResult) => r.agentId)));
                        }
                    } catch {
                        setResults([]);
                    }
                }

                // Stop polling if execution is complete
                if (exec.status === 'completed' || exec.status === 'failed') {
                    setIsPolling(false);
                }
            } catch (error) {
                console.error('Failed to fetch execution:', error);
            }
        };

        fetchExecution();

        if (execution?.status === 'running' || execution?.status === 'pending') {
            setIsPolling(true);
            const interval = setInterval(fetchExecution, 2000);
            return () => clearInterval(interval);
        }
    }, [executionId, execution?.status]);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'running':
            case 'pending':
                return <Activity className="w-4 h-4 text-purple-400 animate-pulse" />;
            case 'completed':
                return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
            case 'failed':
                return <XCircle className="w-4 h-4 text-red-400" />;
            default:
                return <Clock className="w-4 h-4 text-[hsl(220_9%_63%)]" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'running':
            case 'pending':
                return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
            case 'completed':
                return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
            case 'failed':
                return 'bg-red-500/15 text-red-400 border-red-500/30';
            default:
                return 'bg-[hsl(225_8%_18%)] text-[hsl(220_9%_63%)] border-[hsl(225_7%_26%)]';
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };



    return (
        <div className="fixed bottom-0 right-0 w-[420px] max-h-[500px] bg-[hsl(225_12%_8%)] border-l border-t border-[hsl(225_8%_18%)] rounded-tl-xl shadow-2xl flex flex-col z-50">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(225_8%_18%)]">
                <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-indigo-400" />
                    <span className="text-sm font-semibold text-[hsl(220_13%_91%)]">
                        Execution Monitor
                    </span>
                    {isPolling && (
                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs bg-purple-500/15 text-purple-400 border border-purple-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                            Live
                        </span>
                    )}
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 rounded-md hover:bg-[hsl(225_9%_15%)] text-[hsl(220_9%_63%)] hover:text-[hsl(220_13%_91%)] transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Status Bar */}
            {execution && (
                <div className="px-4 py-3 border-b border-[hsl(225_8%_18%)] bg-[hsl(225_10%_11%)]">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {getStatusIcon(execution.status)}
                            <span className={cn(
                                'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
                                getStatusColor(execution.status)
                            )}>
                                {execution.status.charAt(0).toUpperCase() + execution.status.slice(1)}
                            </span>
                        </div>
                        <div className="text-xs text-[hsl(220_7%_45%)]">
                            Started: {formatTime(execution.startedAt)}
                            {execution.endedAt && ` • Ended: ${formatTime(execution.endedAt)}`}
                        </div>
                    </div>
                </div>
            )}

            {/* Tab Buttons - Always show for history access */}
            <div className="flex border-b border-[hsl(225_8%_18%)]">
                <button
                    onClick={() => setActiveTab('logs')}
                    className={cn(
                        'flex-1 px-3 py-2 text-xs font-medium transition-colors',
                        activeTab === 'logs'
                                ? 'text-indigo-400 border-b-2 border-indigo-400 bg-indigo-500/5'
                                : 'text-[hsl(220_9%_63%)] hover:text-[hsl(220_13%_91%)] hover:bg-[hsl(225_9%_15%)]'
                        )}
                    >
                        <Activity className="w-3.5 h-3.5 inline mr-1.5" />
                        Logs ({logs.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('results')}
                        className={cn(
                            'flex-1 px-3 py-2 text-xs font-medium transition-colors',
                            activeTab === 'results'
                                ? 'text-emerald-400 border-b-2 border-emerald-400 bg-emerald-500/5'
                                : 'text-[hsl(220_9%_63%)] hover:text-[hsl(220_13%_91%)] hover:bg-[hsl(225_9%_15%)]'
                        )}
                    >
                        <FileText className="w-3.5 h-3.5 inline mr-1.5" />
                        Results ({results.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={cn(
                            'flex-1 px-3 py-2 text-xs font-medium transition-colors',
                            activeTab === 'history'
                                ? 'text-amber-400 border-b-2 border-amber-400 bg-amber-500/5'
                                : 'text-[hsl(220_9%_63%)] hover:text-[hsl(220_13%_91%)] hover:bg-[hsl(225_9%_15%)]'
                        )}
                    >
                        <History className="w-3.5 h-3.5 inline mr-1.5" />
                        History ({executionHistory.length})
                    </button>
                </div>

            {/* Content Section */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {!executionId && activeTab !== 'history' ? (
                    <div className="flex flex-col items-center justify-center h-full py-8">
                        <div className="p-4 rounded-full bg-[hsl(225_9%_15%)] mb-4">
                            <Play className="w-8 h-8 text-[hsl(220_7%_45%)]" />
                        </div>
                        <p className="text-sm text-[hsl(220_9%_63%)] text-center mb-4">
                            No active execution.<br />
                            Click Execute to run the workflow.
                        </p>
                        <Button
                            onClick={onExecute}
                            className="bg-emerald-600 hover:bg-emerald-700"
                        >
                            <Play className="w-4 h-4 mr-2" />
                            Execute Workflow
                        </Button>
                    </div>
                ) : activeTab === 'history' ? (
                    /* History Tab */
                    executionHistory.length === 0 ? (
                        <div className="flex items-center justify-center h-full py-8">
                            <div className="text-center">
                                <History className="w-8 h-8 text-[hsl(220_7%_45%)] mx-auto mb-2" />
                                <p className="text-sm text-[hsl(220_9%_63%)]">
                                    No execution history yet
                                </p>
                            </div>
                        </div>
                    ) : (
                        executionHistory.map((historyItem) => (
                            <div
                                key={historyItem.executionId}
                                className={cn(
                                    'rounded-lg border overflow-hidden',
                                    historyItem.status === 'completed'
                                        ? 'bg-emerald-500/5 border-emerald-500/20'
                                        : 'bg-red-500/5 border-red-500/20'
                                )}
                            >
                                {/* History Header */}
                                <button
                                    onClick={() => toggleHistoryExpanded(historyItem.executionId)}
                                    className="w-full px-3 py-2 flex items-center justify-between hover:bg-white/5 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        {expandedHistory.has(historyItem.executionId) ? (
                                            <ChevronDown className="w-4 h-4 text-[hsl(220_9%_63%)]" />
                                        ) : (
                                            <ChevronRight className="w-4 h-4 text-[hsl(220_9%_63%)]" />
                                        )}
                                        {historyItem.status === 'completed' ? (
                                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                        ) : (
                                            <XCircle className="w-4 h-4 text-red-400" />
                                        )}
                                        <span className="text-xs font-mono text-[hsl(220_7%_45%)]">
                                            {formatTime(historyItem.timestamp)}
                                        </span>
                                        <span className={cn(
                                            'px-1.5 py-0.5 rounded text-xs',
                                            historyItem.status === 'completed'
                                                ? 'bg-emerald-500/20 text-emerald-400'
                                                : 'bg-red-500/20 text-red-400'
                                        )}>
                                            {historyItem.status}
                                        </span>
                                    </div>
                                    <div className="text-xs text-[hsl(220_7%_45%)]">
                                        {historyItem.results.length} agent{historyItem.results.length !== 1 ? 's' : ''}
                                    </div>
                                </button>
                                
                                {/* History Content - Collapsed by default */}
                                {expandedHistory.has(historyItem.executionId) && (
                                    <div className="px-3 py-3 border-t border-[hsl(225_8%_18%)] bg-[hsl(225_12%_8%)] space-y-2">
                                        {historyItem.results.map((result) => (
                                            <div key={result.agentId} className="p-2 rounded bg-[hsl(225_10%_11%)] border border-[hsl(225_8%_18%)]">
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <Bot className="w-3 h-3 text-indigo-400" />
                                                        <span className="text-xs font-medium text-[hsl(220_13%_91%)]">
                                                            {result.agentType || result.agentId}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs text-[hsl(220_7%_45%)]">
                                                        {result.model}
                                                    </span>
                                                </div>
                                                {result.output !== null && result.output !== undefined && (
                                                    <div className="text-xs text-[hsl(220_9%_63%)] line-clamp-3 font-mono mt-1">
                                                        {(() => {
                                                            const output = result.output;
                                                            if (typeof output === 'string') {
                                                                return output.substring(0, 200) + (output.length > 200 ? '...' : '');
                                                            }
                                                            return JSON.stringify(output).substring(0, 200);
                                                        })()}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))
                    )
                ) : activeTab === 'results' ? (
                    /* Results Tab */
                    results.length === 0 ? (
                        <div className="flex items-center justify-center h-full py-8">
                            <div className="text-center">
                                <FileText className="w-8 h-8 text-[hsl(220_7%_45%)] mx-auto mb-2" />
                                <p className="text-sm text-[hsl(220_9%_63%)]">
                                    {execution?.status === 'running' ? 'Waiting for results...' : 'No results available'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        results.map((result) => (
                            <div
                                key={result.agentId}
                                className={cn(
                                    'rounded-lg border overflow-hidden',
                                    result.status === 'completed'
                                        ? 'bg-emerald-500/5 border-emerald-500/20'
                                        : 'bg-red-500/5 border-red-500/20'
                                )}
                            >
                                {/* Result Header */}
                                <button
                                    onClick={() => toggleResultExpanded(result.agentId)}
                                    className="w-full px-3 py-2 flex items-center justify-between hover:bg-white/5 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        {expandedResults.has(result.agentId) ? (
                                            <ChevronDown className="w-4 h-4 text-[hsl(220_9%_63%)]" />
                                        ) : (
                                            <ChevronRight className="w-4 h-4 text-[hsl(220_9%_63%)]" />
                                        )}
                                        <Bot className="w-4 h-4 text-indigo-400" />
                                        <span className="text-sm font-medium text-[hsl(220_13%_91%)]">
                                            {result.agentType || result.agentId}
                                        </span>
                                        <span className={cn(
                                            'px-1.5 py-0.5 rounded text-xs',
                                            result.status === 'completed'
                                                ? 'bg-emerald-500/20 text-emerald-400'
                                                : 'bg-red-500/20 text-red-400'
                                        )}>
                                            {result.status}
                                        </span>
                                    </div>
                                    <div className="text-xs text-[hsl(220_7%_45%)]">
                                        {result.latencyMs}ms • {result.tokensUsed?.total || 0} tokens
                                    </div>
                                </button>
                                
                                {/* Result Content */}
                                {expandedResults.has(result.agentId) && (
                                    <div className="px-3 py-3 border-t border-[hsl(225_8%_18%)] bg-[hsl(225_12%_8%)]">
                                        {result.error ? (
                                            <div className="text-sm text-red-400 font-mono whitespace-pre-wrap">
                                                {result.error}
                                            </div>
                                        ) : result.output ? (
                                            <div className="text-sm text-[hsl(220_13%_91%)] whitespace-pre-wrap font-mono leading-relaxed max-h-[300px] overflow-y-auto">
                                                {typeof result.output === 'string' 
                                                    ? result.output 
                                                    : JSON.stringify(result.output, null, 2)}
                                            </div>
                                        ) : (
                                            <div className="text-sm text-[hsl(220_9%_63%)] italic">
                                                No output
                                            </div>
                                        )}
                                        <div className="mt-2 pt-2 border-t border-[hsl(225_8%_18%)] text-xs text-[hsl(220_7%_45%)]">
                                            Model: {result.model} • Provider: {result.provider}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )
                ) : logs.length === 0 ? (
                    <div className="flex items-center justify-center h-full py-8">
                        <div className="text-center">
                            <Activity className="w-8 h-8 text-[hsl(220_7%_45%)] mx-auto mb-2 animate-pulse" />
                            <p className="text-sm text-[hsl(220_9%_63%)]">
                                Waiting for execution logs...
                            </p>
                        </div>
                    </div>
                ) : (
                    logs.map((log, index) => {
                        const logLevel = log.level || log.type;
                        return (
                            <div
                                key={index}
                                className={cn(
                                    'px-3 py-2 rounded-lg border',
                                    logLevel === 'error'
                                        ? 'bg-red-500/5 border-red-500/20'
                                        : logLevel === 'success'
                                            ? 'bg-emerald-500/5 border-emerald-500/20'
                                            : 'bg-[hsl(225_10%_11%)] border-[hsl(225_8%_18%)]'
                                )}
                            >
                                <div className="flex items-start gap-2">
                                    <span className="text-[10px] font-mono text-[hsl(220_7%_45%)] shrink-0 mt-0.5">
                                        {formatTime(log.timestamp)}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        {log.agentId && (
                                            <span className="inline-flex items-center gap-1 text-xs text-indigo-400 mr-2">
                                                <Bot className="w-3 h-3" />
                                                {log.agentId}
                                            </span>
                                        )}
                                        <span className={cn(
                                            'text-sm',
                                            logLevel === 'error' ? 'text-red-400' :
                                                logLevel === 'success' ? 'text-emerald-400' :
                                                    'text-[hsl(220_13%_91%)]'
                                        )}>
                                            {log.message}
                                        </span>
                                        {log.details && (
                                            <div className="mt-1 text-xs text-[hsl(220_7%_45%)]">
                                                {Object.entries(log.details).map(([key, val]) => (
                                                    <span key={key} className="mr-3">
                                                        {key}: {JSON.stringify(val)}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Footer Actions */}
            <div className="px-4 py-3 border-t border-[hsl(225_8%_18%)] flex items-center justify-between">
                <div className="text-xs text-[hsl(220_7%_45%)]">
                    {logs.length} log entries
                </div>
                <div className="flex items-center gap-2">
                    {execution?.status === 'running' && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="bg-transparent border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                        >
                            <Pause className="w-3.5 h-3.5 mr-1.5" />
                            Stop
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onExecute}
                        disabled={execution?.status === 'running'}
                        className="bg-transparent border-[hsl(225_8%_18%)] text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-400"
                    >
                        <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                        Re-run
                    </Button>
                </div>
            </div>
        </div>
    );
}
