/**
 * Connection Types System (n8n-like)
 * 
 * Supports multiple connection types:
 * - Main: Primary data flow
 * - AI: Language model connections
 * - Tool: Tool/function connections
 * - Data: Database/storage connections
 */

import { memo } from 'react';
import { BaseEdge, getBezierPath, EdgeLabelRenderer } from '@xyflow/react';
import { cn } from '@/lib/utils';

// Connection type definitions
export type ConnectionType = 'main' | 'ai' | 'tool' | 'data' | 'error';

export interface ConnectionTypeConfig {
    type: ConnectionType;
    label: string;
    color: string;
    strokeColor: string;
    bgColor: string;
    description: string;
}

export const CONNECTION_TYPES: Record<ConnectionType, ConnectionTypeConfig> = {
    main: {
        type: 'main',
        label: 'Main',
        color: 'indigo',
        strokeColor: '#6366f1',
        bgColor: 'bg-indigo-500',
        description: 'Primary data flow'
    },
    ai: {
        type: 'ai',
        label: 'AI',
        color: 'purple',
        strokeColor: '#a855f7',
        bgColor: 'bg-purple-500',
        description: 'AI/LLM connections'
    },
    tool: {
        type: 'tool',
        label: 'Tool',
        color: 'amber',
        strokeColor: '#f59e0b',
        bgColor: 'bg-amber-500',
        description: 'Tool/function connections'
    },
    data: {
        type: 'data',
        label: 'Data',
        color: 'cyan',
        strokeColor: '#06b6d4',
        bgColor: 'bg-cyan-500',
        description: 'Database/storage connections'
    },
    error: {
        type: 'error',
        label: 'Error',
        color: 'red',
        strokeColor: '#ef4444',
        bgColor: 'bg-red-500',
        description: 'Error handling path'
    }
};

// Handle configuration for multi-input/output nodes
export interface HandleConfig {
    id: string;
    type: ConnectionType;
    label?: string;
    position: 'top' | 'bottom' | 'left' | 'right';
    offset?: number; // Percentage offset from center
}

export interface NodeHandlesConfig {
    inputs: HandleConfig[];
    outputs: HandleConfig[];
}

// Default handle configs for different node types
export const NODE_HANDLE_CONFIGS: Record<string, NodeHandlesConfig> = {
    agent: {
        inputs: [{ id: 'main-in', type: 'main', position: 'left' }],
        outputs: [{ id: 'main-out', type: 'main', position: 'right' }]
    },
    condition: {
        inputs: [{ id: 'main-in', type: 'main', position: 'left' }],
        outputs: [
            { id: 'true', type: 'main', label: 'True', position: 'right', offset: -25 },
            { id: 'false', type: 'main', label: 'False', position: 'right', offset: 25 }
        ]
    },
    switch: {
        inputs: [{ id: 'main-in', type: 'main', position: 'left' }],
        outputs: [] // Dynamic based on cases
    },
    merge: {
        inputs: [
            { id: 'input-1', type: 'main', label: '1', position: 'left', offset: -25 },
            { id: 'input-2', type: 'main', label: '2', position: 'left', offset: 25 }
        ],
        outputs: [{ id: 'main-out', type: 'main', position: 'right' }]
    },
    loop: {
        inputs: [{ id: 'main-in', type: 'main', position: 'left' }],
        outputs: [
            { id: 'loop', type: 'main', label: 'Loop', position: 'right', offset: -25 },
            { id: 'done', type: 'main', label: 'Done', position: 'right', offset: 25 }
        ]
    },
    'ai-agent': {
        inputs: [
            { id: 'main-in', type: 'main', position: 'left' },
            { id: 'ai-in', type: 'ai', label: 'Model', position: 'top' },
            { id: 'tools-in', type: 'tool', label: 'Tools', position: 'bottom' }
        ],
        outputs: [{ id: 'main-out', type: 'main', position: 'right' }]
    },
    trigger: {
        inputs: [],
        outputs: [{ id: 'main-out', type: 'main', position: 'right' }]
    },
    'error-trigger': {
        inputs: [{ id: 'error-in', type: 'error', position: 'left' }],
        outputs: [{ id: 'main-out', type: 'main', position: 'right' }]
    }
};

// Custom Edge Component with connection type styling
export interface CustomEdgeData {
    connectionType?: ConnectionType;
    status?: 'idle' | 'running' | 'success' | 'error';
    itemCount?: number;
    label?: string;
}

interface CustomEdgeProps {
    id: string;
    sourceX: number;
    sourceY: number;
    targetX: number;
    targetY: number;
    sourcePosition: any;
    targetPosition: any;
    data?: CustomEdgeData;
    selected?: boolean;
    markerEnd?: string;
}

export function CustomEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
    selected,
    markerEnd
}: CustomEdgeProps) {
    const connectionType = data?.connectionType || 'main';
    const status = data?.status || 'idle';
    const itemCount = data?.itemCount;
    const config = CONNECTION_TYPES[connectionType];

    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    // Determine stroke style based on status
    const getStrokeStyle = () => {
        switch (status) {
            case 'running':
                return {
                    stroke: config.strokeColor,
                    strokeWidth: 2.5,
                    strokeDasharray: '5,5',
                    animation: 'flow 1s linear infinite'
                };
            case 'success':
                return {
                    stroke: '#10b981',
                    strokeWidth: 2.5
                };
            case 'error':
                return {
                    stroke: '#ef4444',
                    strokeWidth: 2.5
                };
            default:
                return {
                    stroke: selected ? config.strokeColor : `${config.strokeColor}99`,
                    strokeWidth: selected ? 2.5 : 2
                };
        }
    };

    const strokeStyle = getStrokeStyle();

    return (
        <>
            {/* Background glow for running state */}
            {status === 'running' && (
                <BaseEdge
                    id={`${id}-glow`}
                    path={edgePath}
                    style={{
                        stroke: config.strokeColor,
                        strokeWidth: 8,
                        opacity: 0.3,
                        filter: 'blur(4px)'
                    }}
                />
            )}

            {/* Main edge */}
            <BaseEdge
                id={id}
                path={edgePath}
                markerEnd={markerEnd}
                style={strokeStyle}
            />

            {/* Edge Label showing item count or connection type */}
            {(itemCount !== undefined || selected) && (
                <EdgeLabelRenderer>
                    <div
                        style={{
                            position: 'absolute',
                            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                            pointerEvents: 'all',
                        }}
                        className="nodrag nopan"
                    >
                        <div
                            className={cn(
                                'px-2 py-0.5 rounded-full text-[10px] font-medium text-white shadow-lg',
                                'transition-all duration-200',
                                status === 'running' && 'animate-pulse',
                                config.bgColor
                            )}
                        >
                            {status === 'running' ? (
                                <span className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                                    Running
                                </span>
                            ) : itemCount !== undefined ? (
                                `${itemCount} item${itemCount !== 1 ? 's' : ''}`
                            ) : (
                                config.label
                            )}
                        </div>
                    </div>
                </EdgeLabelRenderer>
            )}
        </>
    );
}

export const MemoizedCustomEdge = memo(CustomEdge);

// Multi-Handle Node Wrapper
export function getHandleStyle(type: ConnectionType, _isInput?: boolean) {
    const config = CONNECTION_TYPES[type];
    return {
        background: 'hsl(225 12% 8%)',
        border: `2px solid ${config.strokeColor}`,
        width: 12,
        height: 12,
    };
}

export function getHandleClassName(type: ConnectionType) {
    return cn(
        '!w-3 !h-3 !bg-[hsl(225_12%_8%)]',
        type === 'main' && '!border-indigo-500',
        type === 'ai' && '!border-purple-500',
        type === 'tool' && '!border-amber-500',
        type === 'data' && '!border-cyan-500',
        type === 'error' && '!border-red-500',
        'hover:!scale-125 transition-transform !border-2'
    );
}

// CSS for animated edges (add to index.css)
export const edgeAnimationCSS = `
@keyframes flow {
    from {
        stroke-dashoffset: 10;
    }
    to {
        stroke-dashoffset: 0;
    }
}

.react-flow__edge-path {
    transition: stroke 0.2s, stroke-width 0.2s;
}

.react-flow__edge.selected .react-flow__edge-path {
    stroke-width: 3px;
}
`;
