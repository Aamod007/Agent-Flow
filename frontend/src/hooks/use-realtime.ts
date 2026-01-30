import { useEffect, useRef, useState, useCallback } from 'react';
import type { ExecutionLog } from '@/store/workflow-store';

interface UseRealtimeOptions {
    onAgentStarted?: (agentId: string, agentName: string) => void;
    onAgentCompleted?: (log: ExecutionLog) => void;
    onAgentFailed?: (agentId: string, error: string) => void;
    onExecutionCompleted?: () => void;
    onExecutionFailed?: (error: string) => void;
}

export function useRealtime(executionId: string | null, _options: UseRealtimeOptions = {}) {
    const [connected, setConnected] = useState(false);
    const [logs, _setLogs] = useState<ExecutionLog[]>([]);
    const wsRef = useRef<WebSocket | null>(null);

    const connect = useCallback(() => {
        if (!executionId) return;

        // In a real implementation, this would connect to a WebSocket server
        // For now, we'll simulate with polling or Server-Sent Events
        console.log(`[Realtime] Connecting to execution ${executionId}`);
        setConnected(true);

        // Simulate real-time updates with polling
        const pollInterval = setInterval(async () => {
            try {
                // This would be replaced with actual SSE/WebSocket
                // const response = await fetch(`/api/executions/${executionId}/stream`);
                // Process events...
            } catch (err) {
                console.error('[Realtime] Polling error:', err);
            }
        }, 1000);

        return () => {
            clearInterval(pollInterval);
            setConnected(false);
        };
    }, [executionId]);

    const disconnect = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        setConnected(false);
    }, []);

    // Event handler for when we implement real WebSocket support
    // Kept for future WebSocket implementation
    /*
    const handleEvent = useCallback((event: RealtimeEvent) => {
        const { type, payload } = event;

        switch (type) {
            case 'agent_started':
                if (payload.agentId && payload.agentName) {
                    options.onAgentStarted?.(payload.agentId, payload.agentName);
                    setLogs((prev) => [
                        ...prev,
                        {
                            id: `${payload.agentId}-${Date.now()}`,
                            agentId: payload.agentId,
                            agentName: payload.agentName,
                            status: 'running' as const,
                            startedAt: payload.timestamp,
                        } as ExecutionLog,
                    ]);
                }
                break;

            case 'agent_completed':
                if (payload.agentId) {
                    const log: ExecutionLog = {
                        id: `${payload.agentId}-${Date.now()}`,
                        agentId: payload.agentId,
                        agentName: payload.agentName || 'Unknown',
                        status: 'completed',
                        output: payload.output,
                        completedAt: payload.timestamp,
                    };
                    options.onAgentCompleted?.(log);
                    setLogs((prev) =>
                        prev.map((l) =>
                            l.agentId === payload.agentId
                                ? { ...l, ...log }
                                : l
                        )
                    );
                }
                break;

            case 'agent_failed':
                if (payload.agentId && payload.error) {
                    options.onAgentFailed?.(payload.agentId, payload.error);
                    setLogs((prev) =>
                        prev.map((l) =>
                            l.agentId === payload.agentId
                                ? { ...l, status: 'failed', error: payload.error }
                                : l
                        )
                    );
                }
                break;

            case 'execution_completed':
                options.onExecutionCompleted?.();
                break;

            case 'execution_failed':
                if (payload.error) {
                    options.onExecutionFailed?.(payload.error);
                }
                break;
        }
    }, [options]);
    */

    useEffect(() => {
        const cleanup = connect();
        return () => {
            cleanup?.();
            disconnect();
        };
    }, [connect, disconnect]);

    return {
        connected,
        logs,
        disconnect,
        reconnect: connect,
    };
}

// Hook for simulating real-time execution updates (for demo purposes)
export function useExecutionSimulation(_executionId: string | null) {
    const [status, setStatus] = useState<'idle' | 'running' | 'completed' | 'failed'>('idle');
    const [progress, setProgress] = useState(0);
    const [currentAgent, setCurrentAgent] = useState<string | null>(null);
    const [logs, setLogs] = useState<Array<{ message: string; timestamp: Date; type: 'info' | 'success' | 'error' }>>([]);

    const addLog = useCallback((message: string, type: 'info' | 'success' | 'error' = 'info') => {
        setLogs((prev) => [...prev, { message, timestamp: new Date(), type }]);
    }, []);

    const startSimulation = useCallback((agentNames: string[]) => {
        setStatus('running');
        setProgress(0);
        setLogs([]);
        addLog('Execution started');

        let currentIndex = 0;
        const interval = setInterval(() => {
            if (currentIndex >= agentNames.length) {
                clearInterval(interval);
                setCurrentAgent(null);
                setStatus('completed');
                setProgress(100);
                addLog('Execution completed successfully', 'success');
                return;
            }

            const agentName = agentNames[currentIndex];
            setCurrentAgent(agentName);
            addLog(`Running agent: ${agentName}`);
            setProgress(Math.round(((currentIndex + 1) / agentNames.length) * 100));

            currentIndex++;
        }, 2000);

        return () => clearInterval(interval);
    }, [addLog]);

    return {
        status,
        progress,
        currentAgent,
        logs,
        startSimulation,
        reset: () => {
            setStatus('idle');
            setProgress(0);
            setCurrentAgent(null);
            setLogs([]);
        },
    };
}
