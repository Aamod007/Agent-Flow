import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface NodeExecution {
  nodeId: string;
  nodeName: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: number;
  endTime?: number;
  duration?: number;
  output?: any;
  error?: string;
}

interface ExecutionState {
  executionId: string | null;
  status: 'idle' | 'running' | 'completed' | 'failed';
  progress: number;
  currentNode: string | null;
  nodes: Record<string, NodeExecution>;
  startTime: number | null;
  endTime: number | null;
  result: any;
  error: string | null;
  totalCost: number;
}

interface UseExecutionMonitorOptions {
  onNodeStart?: (nodeId: string, nodeName: string) => void;
  onNodeComplete?: (nodeId: string, output: any) => void;
  onNodeFailed?: (nodeId: string, error: string) => void;
  onExecutionComplete?: (result: any) => void;
  onExecutionFailed?: (error: string) => void;
  onProgress?: (progress: number) => void;
}

const EXECUTION_WS_URL = import.meta.env.VITE_EXECUTION_WS_URL || 'http://localhost:3002';

export function useExecutionMonitor(options: UseExecutionMonitorOptions = {}) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [executionState, setExecutionState] = useState<ExecutionState>({
    executionId: null,
    status: 'idle',
    progress: 0,
    currentNode: null,
    nodes: {},
    startTime: null,
    endTime: null,
    result: null,
    error: null,
    totalCost: 0
  });

  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(EXECUTION_WS_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    newSocket.on('connect', () => {
      console.log('[ExecutionMonitor] Connected to execution service');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('[ExecutionMonitor] Disconnected from execution service');
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('[ExecutionMonitor] Connection error:', error.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Subscribe to execution events
  useEffect(() => {
    if (!socket) return;

    // Execution started
    socket.on('execution-started', (data: { 
      executionId: string; 
      workflowId: string;
      totalNodes: number 
    }) => {
      console.log('[ExecutionMonitor] Execution started:', data.executionId);
      setExecutionState(prev => ({
        ...prev,
        executionId: data.executionId,
        status: 'running',
        progress: 0,
        currentNode: null,
        nodes: {},
        startTime: Date.now(),
        endTime: null,
        result: null,
        error: null,
        totalCost: 0
      }));
    });

    // Node started
    socket.on('node-started', (data: { 
      executionId: string;
      nodeId: string; 
      nodeName: string 
    }) => {
      console.log('[ExecutionMonitor] Node started:', data.nodeName);
      setExecutionState(prev => ({
        ...prev,
        currentNode: data.nodeId,
        nodes: {
          ...prev.nodes,
          [data.nodeId]: {
            nodeId: data.nodeId,
            nodeName: data.nodeName,
            status: 'running',
            startTime: Date.now()
          }
        }
      }));
      optionsRef.current.onNodeStart?.(data.nodeId, data.nodeName);
    });

    // Node completed
    socket.on('node-completed', (data: { 
      executionId: string;
      nodeId: string; 
      nodeName: string;
      output: any;
      duration: number;
      cost?: number;
    }) => {
      console.log('[ExecutionMonitor] Node completed:', data.nodeName, `(${data.duration}ms)`);
      setExecutionState(prev => ({
        ...prev,
        totalCost: prev.totalCost + (data.cost || 0),
        nodes: {
          ...prev.nodes,
          [data.nodeId]: {
            ...prev.nodes[data.nodeId],
            status: 'completed',
            endTime: Date.now(),
            duration: data.duration,
            output: data.output
          }
        }
      }));
      optionsRef.current.onNodeComplete?.(data.nodeId, data.output);
    });

    // Node failed
    socket.on('node-failed', (data: { 
      executionId: string;
      nodeId: string; 
      nodeName: string;
      error: string 
    }) => {
      console.error('[ExecutionMonitor] Node failed:', data.nodeName, data.error);
      setExecutionState(prev => ({
        ...prev,
        nodes: {
          ...prev.nodes,
          [data.nodeId]: {
            ...prev.nodes[data.nodeId],
            status: 'failed',
            endTime: Date.now(),
            error: data.error
          }
        }
      }));
      optionsRef.current.onNodeFailed?.(data.nodeId, data.error);
    });

    // Progress update
    socket.on('execution-progress', (data: { 
      executionId: string;
      progress: number;
      completedNodes: number;
      totalNodes: number 
    }) => {
      setExecutionState(prev => ({
        ...prev,
        progress: data.progress
      }));
      optionsRef.current.onProgress?.(data.progress);
    });

    // Execution completed
    socket.on('execution-completed', (data: { 
      executionId: string;
      result: any;
      duration: number;
      totalCost: number;
    }) => {
      console.log('[ExecutionMonitor] Execution completed:', data.executionId);
      setExecutionState(prev => ({
        ...prev,
        status: 'completed',
        progress: 100,
        currentNode: null,
        endTime: Date.now(),
        result: data.result,
        totalCost: data.totalCost || prev.totalCost
      }));
      optionsRef.current.onExecutionComplete?.(data.result);
    });

    // Execution failed
    socket.on('execution-failed', (data: { 
      executionId: string;
      error: string 
    }) => {
      console.error('[ExecutionMonitor] Execution failed:', data.error);
      setExecutionState(prev => ({
        ...prev,
        status: 'failed',
        currentNode: null,
        endTime: Date.now(),
        error: data.error
      }));
      optionsRef.current.onExecutionFailed?.(data.error);
    });

    return () => {
      socket.off('execution-started');
      socket.off('node-started');
      socket.off('node-completed');
      socket.off('node-failed');
      socket.off('execution-progress');
      socket.off('execution-completed');
      socket.off('execution-failed');
    };
  }, [socket]);

  // Subscribe to a specific execution
  const subscribeToExecution = useCallback((executionId: string) => {
    if (socket && connected) {
      console.log('[ExecutionMonitor] Subscribing to execution:', executionId);
      socket.emit('subscribe-execution', executionId);
    }
  }, [socket, connected]);

  // Unsubscribe from execution
  const unsubscribeFromExecution = useCallback((executionId: string) => {
    if (socket && connected) {
      console.log('[ExecutionMonitor] Unsubscribing from execution:', executionId);
      socket.emit('unsubscribe-execution', executionId);
    }
  }, [socket, connected]);

  // Reset state
  const reset = useCallback(() => {
    setExecutionState({
      executionId: null,
      status: 'idle',
      progress: 0,
      currentNode: null,
      nodes: {},
      startTime: null,
      endTime: null,
      result: null,
      error: null,
      totalCost: 0
    });
  }, []);

  // Get duration
  const getDuration = useCallback(() => {
    if (!executionState.startTime) return 0;
    const end = executionState.endTime || Date.now();
    return end - executionState.startTime;
  }, [executionState.startTime, executionState.endTime]);

  // Get node list sorted by execution order
  const getNodeList = useCallback(() => {
    return Object.values(executionState.nodes)
      .sort((a, b) => (a.startTime || 0) - (b.startTime || 0));
  }, [executionState.nodes]);

  return {
    // State
    connected,
    executionState,
    isRunning: executionState.status === 'running',
    isComplete: executionState.status === 'completed',
    isFailed: executionState.status === 'failed',
    
    // Actions
    subscribeToExecution,
    unsubscribeFromExecution,
    reset,
    
    // Helpers
    getDuration,
    getNodeList
  };
}

export default useExecutionMonitor;
