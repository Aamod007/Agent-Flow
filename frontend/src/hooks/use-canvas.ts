import { useCallback, useState, useRef, useEffect } from 'react';
import { useReactFlow, type Node, type Edge } from '@xyflow/react';
import type { AgentNodeData } from '@/components/workflow/AgentNode';

let nodeIdCounter = 0;

export function useCanvas() {
    const reactFlowInstance = useReactFlow();
    const [isConnecting, setIsConnecting] = useState(false);
    const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
    const clipboard = useRef<{ nodes: Node<AgentNodeData>[]; edges: Edge[] } | null>(null);

    // Generate unique node ID
    const generateNodeId = useCallback(() => {
        return `agent_${++nodeIdCounter}`;
    }, []);

    // Add a new node at position
    const addNode = useCallback((
        type: string,
        label: string,
        position: { x: number; y: number },
        config?: Partial<AgentNodeData['config']>
    ) => {
        const newNode: Node<AgentNodeData> = {
            id: generateNodeId(),
            type: 'agent',
            position,
            data: {
                label,
                agentType: type,
                status: 'idle',
                config: {
                    model: 'gemini-2.0-flash',
                    temperature: 0.7,
                    maxTokens: 2048,
                    systemPrompt: '',
                    ...config,
                },
            },
        };

        reactFlowInstance.addNodes(newNode);
        return newNode;
    }, [reactFlowInstance, generateNodeId]);

    // Handle drop from sidebar
    const handleDrop = useCallback((
        event: React.DragEvent,
        containerRef: React.RefObject<HTMLDivElement>
    ) => {
        event.preventDefault();

        const type = event.dataTransfer.getData('application/agenttype');
        const label = event.dataTransfer.getData('application/label');

        if (!type || !containerRef.current) return;

        const bounds = containerRef.current.getBoundingClientRect();
        const position = reactFlowInstance.screenToFlowPosition({
            x: event.clientX - bounds.left,
            y: event.clientY - bounds.top,
        });

        return addNode(type, label, position);
    }, [reactFlowInstance, addNode]);

    // Copy selected nodes
    const copyNodes = useCallback(() => {
        const nodes = reactFlowInstance.getNodes();
        const edges = reactFlowInstance.getEdges();

        const selectedNodesList = nodes.filter((node) => node.selected);
        if (selectedNodesList.length === 0) return;

        const selectedNodeIds = new Set(selectedNodesList.map((n) => n.id));
        const relevantEdges = edges.filter(
            (edge) => selectedNodeIds.has(edge.source) && selectedNodeIds.has(edge.target)
        );

        clipboard.current = {
            nodes: selectedNodesList as Node<AgentNodeData>[],
            edges: relevantEdges,
        };
    }, [reactFlowInstance]);

    // Paste copied nodes
    const pasteNodes = useCallback(() => {
        if (!clipboard.current) return;

        const { nodes: copiedNodes, edges: copiedEdges } = clipboard.current;
        const idMap = new Map<string, string>();

        // Create new nodes with offset
        const newNodes = copiedNodes.map((node) => {
            const newId = generateNodeId();
            idMap.set(node.id, newId);

            return {
                ...node,
                id: newId,
                position: {
                    x: node.position.x + 50,
                    y: node.position.y + 50,
                },
                selected: true,
                data: { ...node.data },
            };
        });

        // Create new edges with updated IDs
        const newEdges = copiedEdges.map((edge) => ({
            ...edge,
            id: `edge-${Date.now()}-${Math.random()}`,
            source: idMap.get(edge.source) || edge.source,
            target: idMap.get(edge.target) || edge.target,
        }));

        // Deselect existing nodes
        reactFlowInstance.setNodes((nodes) =>
            nodes.map((node) => ({ ...node, selected: false }))
        );

        // Add new nodes and edges
        reactFlowInstance.addNodes(newNodes);
        reactFlowInstance.addEdges(newEdges);
    }, [reactFlowInstance, generateNodeId]);

    // Delete selected nodes
    const deleteSelected = useCallback(() => {
        const nodes = reactFlowInstance.getNodes();
        const selectedNodeIds = nodes
            .filter((node) => node.selected)
            .map((node) => node.id);

        reactFlowInstance.deleteElements({
            nodes: selectedNodeIds.map((id) => ({ id })),
        });
    }, [reactFlowInstance]);

    // Duplicate a specific node
    const duplicateNode = useCallback((nodeId: string) => {
        const nodes = reactFlowInstance.getNodes();
        const node = nodes.find((n) => n.id === nodeId) as Node<AgentNodeData> | undefined;

        if (!node) return;

        const newNode: Node<AgentNodeData> = {
            ...node,
            id: generateNodeId(),
            position: {
                x: node.position.x + 50,
                y: node.position.y + 50,
            },
            selected: false,
            data: { ...node.data },
        };

        reactFlowInstance.addNodes(newNode);
        return newNode;
    }, [reactFlowInstance, generateNodeId]);

    // Fit view to all nodes
    const fitView = useCallback((padding = 0.2) => {
        reactFlowInstance.fitView({ padding, duration: 200 });
    }, [reactFlowInstance]);

    // Zoom controls
    const zoomIn = useCallback(() => {
        reactFlowInstance.zoomIn({ duration: 200 });
    }, [reactFlowInstance]);

    const zoomOut = useCallback(() => {
        reactFlowInstance.zoomOut({ duration: 200 });
    }, [reactFlowInstance]);

    const resetZoom = useCallback(() => {
        reactFlowInstance.setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 200 });
    }, [reactFlowInstance]);

    // Auto-layout nodes
    const autoLayout = useCallback(() => {
        const nodes = reactFlowInstance.getNodes();
        const edges = reactFlowInstance.getEdges();

        // Simple left-to-right layout based on connections
        const inDegree = new Map<string, number>();
        const children = new Map<string, string[]>();

        nodes.forEach((node) => {
            inDegree.set(node.id, 0);
            children.set(node.id, []);
        });

        edges.forEach((edge) => {
            inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
            const childList = children.get(edge.source) || [];
            childList.push(edge.target);
            children.set(edge.source, childList);
        });

        // Find root nodes (no incoming edges)
        const roots = nodes.filter((node) => inDegree.get(node.id) === 0);

        // BFS to assign positions
        const levels = new Map<string, number>();
        const queue: string[] = roots.map((r) => r.id);
        queue.forEach((id) => levels.set(id, 0));

        while (queue.length > 0) {
            const current = queue.shift()!;
            const currentLevel = levels.get(current) || 0;

            (children.get(current) || []).forEach((child) => {
                if (!levels.has(child)) {
                    levels.set(child, currentLevel + 1);
                    queue.push(child);
                }
            });
        }

        // Group by level and position
        const levelGroups = new Map<number, string[]>();
        levels.forEach((level, nodeId) => {
            const group = levelGroups.get(level) || [];
            group.push(nodeId);
            levelGroups.set(level, group);
        });

        const nodeWidth = 250;
        const nodeHeight = 120;
        const horizontalGap = 100;
        const verticalGap = 50;

        const updatedNodes = nodes.map((node) => {
            const level = levels.get(node.id) ?? 0;
            const group = levelGroups.get(level) || [];
            const index = group.indexOf(node.id);

            return {
                ...node,
                position: {
                    x: level * (nodeWidth + horizontalGap),
                    y: index * (nodeHeight + verticalGap),
                },
            };
        });

        reactFlowInstance.setNodes(updatedNodes);
        setTimeout(() => fitView(), 100);
    }, [reactFlowInstance, fitView]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Check if we're in an input field
            if (
                event.target instanceof HTMLInputElement ||
                event.target instanceof HTMLTextAreaElement
            ) {
                return;
            }

            if (event.key === 'Delete' || event.key === 'Backspace') {
                deleteSelected();
            }

            if (event.ctrlKey || event.metaKey) {
                switch (event.key.toLowerCase()) {
                    case 'c':
                        copyNodes();
                        break;
                    case 'v':
                        pasteNodes();
                        break;
                    case 'd':
                        event.preventDefault();
                        const nodes = reactFlowInstance.getNodes();
                        const selected = nodes.find((n) => n.selected);
                        if (selected) duplicateNode(selected.id);
                        break;
                    case 'a':
                        event.preventDefault();
                        reactFlowInstance.setNodes((nodes) =>
                            nodes.map((node) => ({ ...node, selected: true }))
                        );
                        break;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [copyNodes, pasteNodes, deleteSelected, duplicateNode, reactFlowInstance]);

    return {
        addNode,
        handleDrop,
        copyNodes,
        pasteNodes,
        deleteSelected,
        duplicateNode,
        fitView,
        zoomIn,
        zoomOut,
        resetZoom,
        autoLayout,
        isConnecting,
        setIsConnecting,
        selectedNodes,
        setSelectedNodes,
    };
}
