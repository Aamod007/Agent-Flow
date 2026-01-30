import { useState, useEffect, useRef } from 'react';
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
    History,
    Terminal,
    Zap,
    Copy,
    Check,
    Timer,
    Cpu,
    Sparkles,
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
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const logsEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (activeTab === 'logs' && logs.length > 0) {
            scrollToBottom();
        }
    }, [logs, activeTab]);

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

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
                if (prev.some(h => h.executionId === execution.id)) {
                    return prev;
                }
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

                if (exec.result) {
                    try {
                        const parsedResults = JSON.parse(exec.result);
                        setResults(Array.isArray(parsedResults) ? parsedResults : []);
                        if (exec.status === 'completed' && parsedResults.length > 0) {
                            setActiveTab('results');
                            setExpandedResults(new Set(parsedResults.map((r: ExecutionResult) => r.agentId)));
                        }
                    } catch {
                        setResults([]);
                    }
                }

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

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'running':
            case 'pending':
                return {
                    icon: Activity,
                    color: 'text-purple-400',
                    bg: 'bg-purple-500/10',
                    border: 'border-purple-500/30',
                    label: status === 'running' ? 'Running' : 'Pending',
                    animate: true,
                };
            case 'completed':
                return {
                    icon: CheckCircle2,
                    color: 'text-emerald-400',
                    bg: 'bg-emerald-500/10',
                    border: 'border-emerald-500/30',
                    label: 'Completed',
                    animate: false,
                };
            case 'failed':
                return {
                    icon: XCircle,
                    color: 'text-red-400',
                    bg: 'bg-red-500/10',
                    border: 'border-red-500/30',
                    label: 'Failed',
                    animate: false,
                };
            default:
                return {
                    icon: Clock,
                    color: 'text-muted-foreground',
                    bg: 'bg-muted/50',
                    border: 'border-border',
                    label: 'Unknown',
                    animate: false,
                };
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

    const formatDuration = (start: string, end?: string | null) => {
        const startDate = new Date(start);
        const endDate = end ? new Date(end) : new Date();
        const diffMs = endDate.getTime() - startDate.getTime();
        const seconds = Math.floor(diffMs / 1000);
        const minutes = Math.floor(seconds / 60);
        if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        }
        return `${seconds}s`;
    };

    const statusConfig = execution ? getStatusConfig(execution.status) : null;
    const StatusIcon = statusConfig?.icon || Clock;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
            <div 
                className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-gradient-to-r from-purple-500/10 to-indigo-500/10">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20">
                            <Terminal className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-zinc-100">Execution Monitor</h2>
                            <p className="text-xs text-zinc-500">
                                {isPolling ? (
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                                        <span className="text-purple-400 font-medium">Live monitoring</span>
                                    </span>
                                ) : 'View execution logs and results'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Status Bar */}
                {execution && statusConfig && (
                    <div className={cn("px-4 py-3 border-b border-zinc-800", statusConfig.bg)}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <StatusIcon className={cn("w-5 h-5", statusConfig.color, statusConfig.animate && "animate-pulse")} />
                                <div>
                                    <span className={cn(
                                        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border',
                                        statusConfig.bg, statusConfig.color, statusConfig.border
                                    )}>
                                        {statusConfig.label}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-zinc-500">
                                <div className="flex items-center gap-1.5">
                                    <Timer className="w-3.5 h-3.5" />
                                    <span className="text-zinc-300">{formatDuration(execution.startedAt, execution.endedAt)}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span className="text-zinc-300">{formatTime(execution.startedAt)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab Buttons */}
                <div className="flex border-b border-zinc-800 bg-zinc-900/30">
                    {[
                        { id: 'logs', label: 'Logs', icon: Terminal, count: logs.length, color: 'indigo' },
                        { id: 'results', label: 'Output', icon: Sparkles, count: results.length, color: 'emerald' },
                        { id: 'history', label: 'History', icon: History, count: executionHistory.length, color: 'amber' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as typeof activeTab)}
                            className={cn(
                                'flex-1 px-4 py-2.5 text-xs font-medium transition-all flex items-center justify-center gap-2 border-b-2',
                                activeTab === tab.id
                                    ? 'border-current bg-white/5'
                                    : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30'
                            )}
                            style={activeTab === tab.id ? {
                                color: tab.color === 'indigo' ? 'rgb(129, 140, 248)' : 
                                       tab.color === 'emerald' ? 'rgb(52, 211, 153)' : 'rgb(251, 191, 36)',
                            } : {}}
                        >
                            <tab.icon className="w-3.5 h-3.5" />
                            {tab.label}
                            <span className={cn(
                                "px-1.5 py-0.5 rounded-full text-[10px] font-bold min-w-[20px]",
                                activeTab === tab.id 
                                    ? "bg-current/20" 
                                    : "bg-zinc-800 text-zinc-500"
                            )}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Content Section */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-zinc-900/30 max-h-[50vh]">
                    {!executionId && activeTab !== 'history' ? (
                        /* No Execution State */
                        <div className="flex flex-col items-center justify-center h-full py-8">
                            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 mb-5">
                                <Zap className="w-10 h-10 text-emerald-400" />
                            </div>
                            <h3 className="text-base font-semibold text-zinc-100 mb-1">Ready to Execute</h3>
                            <p className="text-sm text-zinc-500 text-center mb-5 max-w-[250px]">
                                Run your workflow to see live execution logs and results
                            </p>
                            <Button
                                onClick={onExecute}
                                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-500/20"
                            >
                                <Play className="w-4 h-4 mr-2" />
                                Execute Workflow
                            </Button>
                        </div>
                    ) : activeTab === 'history' ? (
                        /* History Tab */
                        executionHistory.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full py-8">
                                <div className="p-4 rounded-xl bg-zinc-800/50 mb-4">
                                    <History className="w-8 h-8 text-zinc-500" />
                                </div>
                                <p className="text-sm font-medium text-zinc-300 mb-1">No History Yet</p>
                            <p className="text-xs text-zinc-500">
                                Completed executions will appear here
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {executionHistory.map((historyItem) => {
                                const config = getStatusConfig(historyItem.status);
                                return (
                                    <div
                                        key={historyItem.executionId}
                                        className={cn(
                                            'rounded-xl border overflow-hidden transition-all',
                                            config.bg, config.border
                                        )}
                                    >
                                        <button
                                            onClick={() => toggleHistoryExpanded(historyItem.executionId)}
                                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                {expandedHistory.has(historyItem.executionId) ? (
                                                    <ChevronDown className="w-4 h-4 text-zinc-500" />
                                                ) : (
                                                    <ChevronRight className="w-4 h-4 text-zinc-500" />
                                                )}
                                                <config.icon className={cn("w-4 h-4", config.color)} />
                                                <span className="text-xs font-mono text-zinc-500">
                                                    {formatTime(historyItem.timestamp)}
                                                </span>
                                                <span className={cn(
                                                    'px-2 py-0.5 rounded-md text-xs font-medium',
                                                    config.bg, config.color
                                                )}>
                                                    {config.label}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-zinc-500">
                                                <Cpu className="w-3.5 h-3.5" />
                                                {historyItem.results.length} agent{historyItem.results.length !== 1 ? 's' : ''}
                                            </div>
                                        </button>
                                        
                                        {expandedHistory.has(historyItem.executionId) && (
                                            <div className="px-4 py-3 border-t border-zinc-800/50 bg-zinc-900/50 space-y-2">
                                                {historyItem.results.map((result) => (
                                                    <div key={result.agentId} className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <Bot className="w-3.5 h-3.5 text-purple-400" />
                                                                <span className="text-xs font-medium text-zinc-200">
                                                                    {result.agentType || result.agentId}
                                                                </span>
                                                            </div>
                                                            <span className="text-[10px] text-zinc-500 font-mono">
                                                                {result.model}
                                                            </span>
                                                        </div>
                                                        {result.output !== null && result.output !== undefined && (
                                                            <div className="text-xs text-zinc-400 line-clamp-3 font-mono bg-zinc-900/50 rounded p-2">
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
                                );
                            })}
                        </div>
                    )
                ) : activeTab === 'results' ? (
                    /* Results Tab */
                    results.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full py-8">
                            <div className="p-4 rounded-xl bg-zinc-800/50 mb-4">
                                <FileText className={cn("w-8 h-8", execution?.status === 'running' ? "text-purple-400 animate-pulse" : "text-zinc-500")} />
                            </div>
                            <p className="text-sm font-medium text-zinc-200 mb-1">
                                {execution?.status === 'running' ? 'Processing...' : 'No Results'}
                            </p>
                            <p className="text-xs text-zinc-500">
                                {execution?.status === 'running' ? 'Results will appear as agents complete' : 'No results available'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {results.map((result) => {
                                const resultConfig = getStatusConfig(result.status);
                                return (
                                    <div
                                        key={result.agentId}
                                        className={cn(
                                            'rounded-xl border overflow-hidden transition-all',
                                            resultConfig.bg, resultConfig.border
                                        )}
                                    >
                                        <button
                                            onClick={() => toggleResultExpanded(result.agentId)}
                                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                {expandedResults.has(result.agentId) ? (
                                                    <ChevronDown className="w-4 h-4 text-zinc-500" />
                                                ) : (
                                                    <ChevronRight className="w-4 h-4 text-zinc-500" />
                                                )}
                                                <div className="p-1.5 rounded-lg bg-purple-500/20">
                                                    <Bot className="w-4 h-4 text-purple-400" />
                                                </div>
                                                <span className="text-sm font-medium text-zinc-200">
                                                    {result.agentType || result.agentId}
                                                </span>
                                                <span className={cn(
                                                    'px-2 py-0.5 rounded-md text-xs font-medium',
                                                    resultConfig.bg, resultConfig.color
                                                )}>
                                                    {resultConfig.label}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-zinc-500">
                                                <span className="flex items-center gap-1">
                                                    <Timer className="w-3 h-3" />
                                                    {result.latencyMs}ms
                                                </span>
                                                <span>{result.tokensUsed?.total || 0} tokens</span>
                                            </div>
                                        </button>
                                        
                                        {expandedResults.has(result.agentId) && (
                                            <div className="px-4 py-3 border-t border-zinc-800/50 bg-zinc-900/50">
                                                {result.error ? (
                                                    <div className="text-sm text-red-400 font-mono whitespace-pre-wrap p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                                                        {result.error}
                                                    </div>
                                                ) : result.output ? (
                                                    <div className="relative">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                copyToClipboard(
                                                                    typeof result.output === 'string' ? result.output : JSON.stringify(result.output, null, 2),
                                                                    result.agentId
                                                                );
                                                            }}
                                                            className="absolute top-2 right-2 p-1.5 rounded-md bg-zinc-800/80 hover:bg-zinc-700 text-zinc-500 hover:text-zinc-200 transition-colors"
                                                        >
                                                            {copiedId === result.agentId ? (
                                                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                                            ) : (
                                                                <Copy className="w-3.5 h-3.5" />
                                                            )}
                                                        </button>
                                                        <div className="text-sm text-zinc-200 whitespace-pre-wrap font-mono leading-relaxed max-h-[300px] overflow-y-auto p-3 rounded-lg bg-zinc-800/30 border border-zinc-700/50">
                                                            {typeof result.output === 'string' 
                                                                ? result.output 
                                                                : JSON.stringify(result.output, null, 2)}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-sm text-zinc-500 italic p-3 rounded-lg bg-zinc-800/30">
                                                        No output
                                                    </div>
                                                )}
                                                <div className="mt-3 pt-3 border-t border-zinc-800/50 flex items-center justify-between text-xs text-zinc-500">
                                                    <span>Model: <span className="text-zinc-200 font-medium">{result.model}</span></span>
                                                    <span>Provider: <span className="text-zinc-200 font-medium">{result.provider}</span></span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )
                ) : logs.length === 0 ? (
                    /* Empty Logs State */
                    <div className="flex flex-col items-center justify-center h-full py-8">
                        <div className="p-4 rounded-xl bg-zinc-800/50 mb-4">
                            <Activity className="w-8 h-8 text-purple-400 animate-pulse" />
                        </div>
                        <p className="text-sm font-medium text-zinc-200 mb-1">Waiting for Logs</p>
                        <p className="text-xs text-zinc-500">
                            Logs will stream in real-time
                        </p>
                    </div>
                ) : (
                    /* Logs Tab */
                    <div className="space-y-1.5">
                        {logs.map((log, index) => {
                            const logLevel = log.level || log.type;
                            const logConfig = {
                                error: { bg: 'bg-red-500/5', border: 'border-red-500/20', text: 'text-red-400', dot: 'bg-red-400' },
                                success: { bg: 'bg-emerald-500/5', border: 'border-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-400' },
                                warning: { bg: 'bg-amber-500/5', border: 'border-amber-500/20', text: 'text-amber-400', dot: 'bg-amber-400' },
                                info: { bg: 'bg-zinc-800/50', border: 'border-zinc-700/50', text: 'text-zinc-200', dot: 'bg-purple-400' },
                            }[logLevel || 'info'] || { bg: 'bg-zinc-800/50', border: 'border-zinc-700/50', text: 'text-zinc-200', dot: 'bg-purple-400' };

                            return (
                                <div
                                    key={index}
                                    className={cn(
                                        'px-3 py-2.5 rounded-lg border transition-all',
                                        logConfig.bg, logConfig.border
                                    )}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex items-center gap-2 shrink-0 mt-0.5">
                                            <span className={cn("w-1.5 h-1.5 rounded-full", logConfig.dot)} />
                                            <span className="text-[10px] font-mono text-zinc-500">
                                                {formatTime(log.timestamp)}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            {log.agentId && (
                                                <span className="inline-flex items-center gap-1 text-xs text-purple-400 mr-2 font-medium">
                                                    <Bot className="w-3 h-3" />
                                                    {log.agentId}
                                                </span>
                                            )}
                                            <span className={cn('text-sm', logConfig.text)}>
                                                {log.message}
                                            </span>
                                            {log.details && (
                                                <div className="mt-1.5 text-xs text-zinc-500 font-mono bg-zinc-900/50 rounded px-2 py-1">
                                                    {Object.entries(log.details).map(([key, val]) => (
                                                        <span key={key} className="mr-3">
                                                            <span className="text-purple-400">{key}</span>: {JSON.stringify(val)}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={logsEndRef} />
                    </div>
                )}
            </div>

                {/* Footer Actions */}
                <div className="px-4 py-3 border-t border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <Terminal className="w-3.5 h-3.5" />
                        {logs.length} log entries
                    </div>
                    <div className="flex items-center gap-2">
                        {execution?.status === 'running' && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 bg-transparent border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
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
                            className="h-8 bg-transparent border-zinc-700 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 hover:border-emerald-500/30 disabled:opacity-50"
                        >
                            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                            Re-run
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
