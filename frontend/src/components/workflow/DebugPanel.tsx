/**
 * DebugPanel Component
 * 
 * Provides debugging controls for workflow execution:
 * - Breakpoints on nodes
 * - Step-through execution
 * - Pause/Resume controls
 * - Variable inspection
 */

import React, { useState, useEffect } from 'react';
import { 
    Bug, Play, Pause, SkipForward, Square, Circle, 
    ChevronRight, ChevronDown, Eye, Zap, Clock, RefreshCw
} from 'lucide-react';
import { api } from '@/lib/api';

export interface Breakpoint {
    nodeId: string;
    nodeName: string;
    enabled: boolean;
    condition?: string; // Optional conditional breakpoint
}

export interface DebugState {
    isDebugging: boolean;
    isPaused: boolean;
    currentNodeId: string | null;
    executionId: string | null;
    breakpoints: Map<string, Breakpoint>;
    nodeOutputs: Map<string, unknown>;
    executionStack: string[];
}

interface DebugPanelProps {
    workflowId: string;
    nodes: Array<{ id: string; data: { label?: string; name?: string } }>;
    isOpen: boolean;
    onClose: () => void;
    onBreakpointChange: (breakpoints: Map<string, Breakpoint>) => void;
    onNodeHighlight: (nodeId: string | null) => void;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
    workflowId,
    nodes,
    isOpen,
    onClose,
    onBreakpointChange,
    onNodeHighlight
}) => {
    const [debugState, setDebugState] = useState<DebugState>({
        isDebugging: false,
        isPaused: false,
        currentNodeId: null,
        executionId: null,
        breakpoints: new Map(),
        nodeOutputs: new Map(),
        executionStack: []
    });

    const [activeTab, setActiveTab] = useState<'breakpoints' | 'variables' | 'stack'>('breakpoints');
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        onBreakpointChange(debugState.breakpoints);
    }, [debugState.breakpoints, onBreakpointChange]);

    const toggleBreakpoint = (nodeId: string) => {
        const node = nodes.find(n => n.id === nodeId);
        if (!node) return;

        setDebugState(prev => {
            const newBreakpoints = new Map(prev.breakpoints);
            if (newBreakpoints.has(nodeId)) {
                newBreakpoints.delete(nodeId);
            } else {
                newBreakpoints.set(nodeId, {
                    nodeId,
                    nodeName: node.data.label || node.data.name || nodeId,
                    enabled: true
                });
            }
            return { ...prev, breakpoints: newBreakpoints };
        });
    };

    const toggleBreakpointEnabled = (nodeId: string) => {
        setDebugState(prev => {
            const newBreakpoints = new Map(prev.breakpoints);
            const bp = newBreakpoints.get(nodeId);
            if (bp) {
                newBreakpoints.set(nodeId, { ...bp, enabled: !bp.enabled });
            }
            return { ...prev, breakpoints: newBreakpoints };
        });
    };

    const startDebugging = async () => {
        setLoading(true);
        try {
            const breakpointIds = Array.from(debugState.breakpoints.entries())
                .filter(([_, bp]) => bp.enabled)
                .map(([id]) => id);

            const response = await api.executeWithDebug(workflowId, {}, breakpointIds);
            
            setDebugState(prev => ({
                ...prev,
                isDebugging: true,
                isPaused: false,
                executionId: response.executionId,
                executionStack: []
            }));
        } catch (error) {
            console.error('Failed to start debugging:', error);
        } finally {
            setLoading(false);
        }
    };

    const pauseExecution = async () => {
        if (!debugState.executionId) return;
        
        setLoading(true);
        try {
            await api.pauseExecution(debugState.executionId);
            setDebugState(prev => ({ ...prev, isPaused: true }));
        } catch (error) {
            console.error('Failed to pause execution:', error);
        } finally {
            setLoading(false);
        }
    };

    const resumeExecution = async () => {
        if (!debugState.executionId) return;
        
        setLoading(true);
        try {
            await api.resumeExecution(debugState.executionId);
            setDebugState(prev => ({ ...prev, isPaused: false }));
        } catch (error) {
            console.error('Failed to resume execution:', error);
        } finally {
            setLoading(false);
        }
    };

    const stepExecution = async () => {
        if (!debugState.executionId) return;
        
        setLoading(true);
        try {
            const result = await api.stepExecution(debugState.executionId);
            
            setDebugState(prev => {
                const newOutputs = new Map(prev.nodeOutputs);
                newOutputs.set(result.nodeId, result.output);
                
                return {
                    ...prev,
                    currentNodeId: result.nodeId,
                    nodeOutputs: newOutputs,
                    executionStack: [...prev.executionStack, result.nodeId]
                };
            });

            onNodeHighlight(result.nodeId);
        } catch (error) {
            console.error('Failed to step execution:', error);
        } finally {
            setLoading(false);
        }
    };

    const stopDebugging = () => {
        setDebugState(prev => ({
            ...prev,
            isDebugging: false,
            isPaused: false,
            currentNodeId: null,
            executionId: null,
            executionStack: []
        }));
        onNodeHighlight(null);
    };

    const clearBreakpoints = () => {
        setDebugState(prev => ({
            ...prev,
            breakpoints: new Map()
        }));
    };

    const toggleNodeExpand = (nodeId: string) => {
        setExpandedNodes(prev => {
            const next = new Set(prev);
            if (next.has(nodeId)) {
                next.delete(nodeId);
            } else {
                next.add(nodeId);
            }
            return next;
        });
    };

    if (!isOpen) return null;

    return (
        <div className="w-80 bg-zinc-950 border-l border-zinc-800 flex flex-col h-full shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-zinc-800 bg-gradient-to-r from-purple-500/10 to-violet-500/10">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-purple-500/20">
                        <Bug className="w-4 h-4 text-purple-400" />
                    </div>
                    <span className="font-medium text-zinc-100">Debug Mode</span>
                    {debugState.isDebugging && (
                        <span className={`px-1.5 py-0.5 text-xs rounded ${
                            debugState.isPaused 
                                ? 'bg-yellow-500/20 text-yellow-400' 
                                : 'bg-green-500/20 text-green-400'
                        }`}>
                            {debugState.isPaused ? 'Paused' : 'Running'}
                        </span>
                    )}
                </div>
                <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200 p-1 rounded hover:bg-zinc-800 transition-colors">
                    ✕
                </button>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1 p-2 border-b border-zinc-800 bg-zinc-900/50">
                {!debugState.isDebugging ? (
                    <button
                        onClick={startDebugging}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-sm rounded-lg disabled:opacity-50 transition-colors"
                    >
                        {loading ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                            <Bug className="w-4 h-4" />
                        )}
                        Start Debug
                    </button>
                ) : (
                    <>
                        <button
                            onClick={debugState.isPaused ? resumeExecution : pauseExecution}
                            disabled={loading}
                            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg disabled:opacity-50 transition-colors"
                            title={debugState.isPaused ? 'Resume' : 'Pause'}
                        >
                            {debugState.isPaused ? (
                                <Play className="w-4 h-4" />
                            ) : (
                                <Pause className="w-4 h-4" />
                            )}
                        </button>
                        <button
                            onClick={stepExecution}
                            disabled={loading || !debugState.isPaused}
                            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg disabled:opacity-50 transition-colors"
                            title="Step Over"
                        >
                            <SkipForward className="w-4 h-4" />
                        </button>
                        <button
                            onClick={stopDebugging}
                            className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                            title="Stop"
                        >
                            <Square className="w-4 h-4" />
                        </button>
                    </>
                )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-zinc-800">
                {(['breakpoints', 'variables', 'stack'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 px-3 py-2 text-sm font-medium capitalize transition-colors ${
                            activeTab === tab
                                ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-500/5'
                                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
                        }`}
                    >
                        {tab}
                        {tab === 'breakpoints' && debugState.breakpoints.size > 0 && (
                            <span className="ml-1 px-1.5 bg-purple-500/20 text-purple-400 text-xs rounded">
                                {debugState.breakpoints.size}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-3 bg-zinc-900/30">
                {activeTab === 'breakpoints' && (
                    <div className="space-y-2">
                        {/* Quick actions */}
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-xs text-zinc-500">Click node circles to add breakpoints</span>
                            {debugState.breakpoints.size > 0 && (
                                <button
                                    onClick={clearBreakpoints}
                                    className="text-xs text-red-400 hover:text-red-300 transition-colors"
                                >
                                    Clear All
                                </button>
                            )}
                        </div>

                        {/* Breakpoint List */}
                        {debugState.breakpoints.size === 0 ? (
                            <div className="text-center py-8 text-zinc-500 text-sm">
                                <Circle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p>No breakpoints set</p>
                            </div>
                        ) : (
                            Array.from(debugState.breakpoints.values()).map(bp => (
                                <div 
                                    key={bp.nodeId}
                                    className="flex items-center gap-2 p-2 bg-zinc-900/50 border border-zinc-800 rounded-lg"
                                >
                                    <button
                                        onClick={() => toggleBreakpointEnabled(bp.nodeId)}
                                        className={`p-1 rounded ${
                                            bp.enabled ? 'text-red-400' : 'text-zinc-600'
                                        }`}
                                    >
                                        <Circle className="w-3 h-3 fill-current" />
                                    </button>
                                    <span className={`flex-1 text-sm truncate ${
                                        bp.enabled ? 'text-zinc-100' : 'text-zinc-500'
                                    }`}>
                                        {bp.nodeName}
                                    </span>
                                    <button
                                        onClick={() => toggleBreakpoint(bp.nodeId)}
                                        className="text-zinc-500 hover:text-red-400 transition-colors"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))
                        )}

                        {/* Available Nodes */}
                        <div className="mt-4 pt-4 border-t border-zinc-800">
                            <span className="text-xs text-zinc-500 block mb-2">Available Nodes</span>
                            {nodes.filter(n => !debugState.breakpoints.has(n.id)).map(node => (
                                <button
                                    key={node.id}
                                    onClick={() => toggleBreakpoint(node.id)}
                                    className="w-full flex items-center gap-2 p-2 text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 rounded-lg transition-colors"
                                >
                                    <Circle className="w-3 h-3" />
                                    {node.data.label || node.data.name || node.id}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'variables' && (
                    <div className="space-y-2">
                        {debugState.nodeOutputs.size === 0 ? (
                            <div className="text-center py-8 text-zinc-500 text-sm">
                                <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p>No variables captured</p>
                                <p className="text-xs mt-1">Start debugging to inspect node outputs</p>
                            </div>
                        ) : (
                            Array.from(debugState.nodeOutputs.entries()).map(([nodeId, output]) => {
                                const node = nodes.find(n => n.id === nodeId);
                                const isExpanded = expandedNodes.has(nodeId);

                                return (
                                    <div key={nodeId} className="bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden">
                                        <button
                                            onClick={() => toggleNodeExpand(nodeId)}
                                            className="w-full flex items-center gap-2 p-2 text-sm text-zinc-100 hover:bg-zinc-800/50 transition-colors"
                                        >
                                            {isExpanded ? (
                                                <ChevronDown className="w-4 h-4 text-zinc-400" />
                                            ) : (
                                                <ChevronRight className="w-4 h-4 text-zinc-400" />
                                            )}
                                            {node?.data.label || node?.data.name || nodeId}
                                        </button>
                                        {isExpanded && (
                                            <pre className="p-2 text-xs text-zinc-300 bg-zinc-950/50 overflow-x-auto max-h-48 border-t border-zinc-800">
                                                {JSON.stringify(output, null, 2)}
                                            </pre>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}

                {activeTab === 'stack' && (
                    <div className="space-y-1">
                        {debugState.executionStack.length === 0 ? (
                            <div className="text-center py-8 text-zinc-500 text-sm">
                                <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p>Execution stack empty</p>
                                <p className="text-xs mt-1">Start debugging to see execution order</p>
                            </div>
                        ) : (
                            debugState.executionStack.map((nodeId, index) => {
                                const node = nodes.find(n => n.id === nodeId);
                                const isCurrent = nodeId === debugState.currentNodeId;

                                return (
                                    <div
                                        key={`${nodeId}-${index}`}
                                        onClick={() => onNodeHighlight(nodeId)}
                                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                                            isCurrent 
                                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                                                : 'bg-zinc-900/50 border border-zinc-800 text-zinc-300 hover:bg-zinc-800/50'
                                        }`}
                                    >
                                        <span className="text-xs text-zinc-500 w-6">{index + 1}</span>
                                        {isCurrent && <Zap className="w-3 h-3 text-purple-400" />}
                                        <span className="text-sm truncate">
                                            {node?.data.label || node?.data.name || nodeId}
                                        </span>
                                        {isCurrent && (
                                            <span className="ml-auto text-xs text-purple-400">current</span>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>

            {/* Status Bar */}
            {debugState.isDebugging && (
                <div className="p-2 border-t border-zinc-800 bg-zinc-900/50">
                    <div className="flex items-center gap-2 text-xs">
                        {debugState.isPaused ? (
                            <>
                                <Clock className="w-3 h-3 text-yellow-400" />
                                <span className="text-yellow-400">
                                    Paused at: {nodes.find(n => n.id === debugState.currentNodeId)?.data.label || 'Unknown'}
                                </span>
                            </>
                        ) : (
                            <>
                                <RefreshCw className="w-3 h-3 text-green-400 animate-spin" />
                                <span className="text-green-400">Running...</span>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DebugPanel;
