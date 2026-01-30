/**
 * GroupNode Component
 * 
 * A container node that groups multiple nodes together.
 * Similar to n8n's sticky notes but for logical grouping.
 */

import React, { useState, useCallback, memo } from 'react';
import { Handle, Position, NodeResizer, useReactFlow } from '@xyflow/react';
import { FolderOpen, Folder, ChevronDown, ChevronRight, MoreVertical, Trash2, Copy, Edit2, Palette } from 'lucide-react';

export interface GroupNodeData {
    label: string;
    description?: string;
    color: string;
    collapsed: boolean;
    childNodeIds: string[];
    width?: number;
    height?: number;
}

interface GroupNodeProps {
    id: string;
    data: GroupNodeData;
    selected?: boolean;
}

const GROUP_COLORS = [
    { id: 'gray', bg: 'bg-gray-800/50', border: 'border-gray-600', text: 'text-gray-300' },
    { id: 'blue', bg: 'bg-blue-900/30', border: 'border-blue-600/50', text: 'text-blue-300' },
    { id: 'green', bg: 'bg-green-900/30', border: 'border-green-600/50', text: 'text-green-300' },
    { id: 'purple', bg: 'bg-purple-900/30', border: 'border-purple-600/50', text: 'text-purple-300' },
    { id: 'orange', bg: 'bg-orange-900/30', border: 'border-orange-600/50', text: 'text-orange-300' },
    { id: 'pink', bg: 'bg-pink-900/30', border: 'border-pink-600/50', text: 'text-pink-300' },
    { id: 'cyan', bg: 'bg-cyan-900/30', border: 'border-cyan-600/50', text: 'text-cyan-300' },
    { id: 'yellow', bg: 'bg-yellow-900/30', border: 'border-yellow-600/50', text: 'text-yellow-300' },
];

export const GroupNode: React.FC<GroupNodeProps> = memo(({ 
    id, 
    data, 
    selected 
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editLabel, setEditLabel] = useState(data.label);
    const [editDescription, setEditDescription] = useState(data.description || '');
    const [showMenu, setShowMenu] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);
    
    const { setNodes, deleteElements, getNodes } = useReactFlow();

    const colorConfig = GROUP_COLORS.find(c => c.id === data.color) || GROUP_COLORS[0];

    const handleToggleCollapse = useCallback(() => {
        setNodes(nodes => nodes.map(node => {
            if (node.id === id) {
                return {
                    ...node,
                    data: { ...node.data, collapsed: !data.collapsed }
                };
            }
            // Hide/show child nodes
            if (data.childNodeIds.includes(node.id)) {
                return {
                    ...node,
                    hidden: !data.collapsed
                };
            }
            return node;
        }));
    }, [id, data.collapsed, data.childNodeIds, setNodes]);

    const handleLabelSave = useCallback(() => {
        setNodes(nodes => nodes.map(node => 
            node.id === id 
                ? { ...node, data: { ...node.data, label: editLabel, description: editDescription } }
                : node
        ));
        setIsEditing(false);
    }, [id, editLabel, editDescription, setNodes]);

    const handleColorChange = useCallback((colorId: string) => {
        setNodes(nodes => nodes.map(node =>
            node.id === id
                ? { ...node, data: { ...node.data, color: colorId } }
                : node
        ));
        setShowColorPicker(false);
    }, [id, setNodes]);

    const handleDelete = useCallback(() => {
        deleteElements({ nodes: [{ id }] });
    }, [id, deleteElements]);

    const handleDuplicate = useCallback(() => {
        const nodes = getNodes();
        const thisNode = nodes.find(n => n.id === id);
        if (!thisNode) return;

        const newNode = {
            ...thisNode,
            id: `group-${Date.now()}`,
            position: {
                x: thisNode.position.x + 50,
                y: thisNode.position.y + 50
            },
            data: {
                ...thisNode.data,
                childNodeIds: [] // Don't copy children
            }
        };

        setNodes(nodes => [...nodes, newNode]);
    }, [id, getNodes, setNodes]);

    return (
        <div 
            className={`relative ${data.collapsed ? 'min-w-[200px]' : 'min-w-[300px] min-h-[200px]'}`}
            style={{ 
                width: data.collapsed ? 'auto' : (data.width || 400),
                height: data.collapsed ? 'auto' : (data.height || 300)
            }}
        >
            {/* Resizer - only when not collapsed */}
            {!data.collapsed && (
                <NodeResizer 
                    minWidth={300}
                    minHeight={200}
                    isVisible={selected ?? false}
                    lineClassName="border-blue-500"
                    handleClassName="w-2 h-2 bg-blue-500 rounded-full"
                />
            )}

            {/* Main Container */}
            <div 
                className={`h-full rounded-xl border-2 border-dashed transition-all ${colorConfig.bg} ${colorConfig.border} ${
                    selected ? 'ring-2 ring-blue-500/50' : ''
                }`}
            >
                {/* Header */}
                <div className={`flex items-center justify-between px-3 py-2 border-b border-dashed ${colorConfig.border}`}>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        {/* Collapse Toggle */}
                        <button 
                            onClick={handleToggleCollapse}
                            className={`p-1 rounded hover:bg-gray-700/50 transition-colors ${colorConfig.text}`}
                        >
                            {data.collapsed ? (
                                <ChevronRight className="w-4 h-4" />
                            ) : (
                                <ChevronDown className="w-4 h-4" />
                            )}
                        </button>

                        {/* Icon */}
                        {data.collapsed ? (
                            <Folder className={`w-4 h-4 ${colorConfig.text}`} />
                        ) : (
                            <FolderOpen className={`w-4 h-4 ${colorConfig.text}`} />
                        )}

                        {/* Label */}
                        {isEditing ? (
                            <input
                                type="text"
                                value={editLabel}
                                onChange={e => setEditLabel(e.target.value)}
                                onBlur={handleLabelSave}
                                onKeyDown={e => e.key === 'Enter' && handleLabelSave()}
                                className="flex-1 px-2 py-0.5 bg-gray-700 border border-gray-600 rounded text-sm text-white"
                                autoFocus
                            />
                        ) : (
                            <span 
                                className={`font-medium truncate ${colorConfig.text}`}
                                onDoubleClick={() => setIsEditing(true)}
                            >
                                {data.label}
                            </span>
                        )}

                        {/* Node count */}
                        {data.childNodeIds.length > 0 && (
                            <span className="px-1.5 py-0.5 bg-gray-700/50 text-gray-400 text-xs rounded">
                                {data.childNodeIds.length} nodes
                            </span>
                        )}
                    </div>

                    {/* Menu */}
                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className={`p-1 rounded hover:bg-gray-700/50 transition-colors ${colorConfig.text}`}
                        >
                            <MoreVertical className="w-4 h-4" />
                        </button>

                        {showMenu && (
                            <div className="absolute right-0 top-full mt-1 w-40 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 py-1">
                                <button
                                    onClick={() => { setIsEditing(true); setShowMenu(false); }}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-700"
                                >
                                    <Edit2 className="w-3.5 h-3.5" />
                                    Edit Label
                                </button>
                                <button
                                    onClick={() => { setShowColorPicker(true); setShowMenu(false); }}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-700"
                                >
                                    <Palette className="w-3.5 h-3.5" />
                                    Change Color
                                </button>
                                <button
                                    onClick={() => { handleDuplicate(); setShowMenu(false); }}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-700"
                                >
                                    <Copy className="w-3.5 h-3.5" />
                                    Duplicate
                                </button>
                                <hr className="my-1 border-gray-700" />
                                <button
                                    onClick={() => { handleDelete(); setShowMenu(false); }}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/20"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Delete
                                </button>
                            </div>
                        )}

                        {/* Color Picker */}
                        {showColorPicker && (
                            <div 
                                className="absolute right-0 top-full mt-1 p-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50"
                                onMouseLeave={() => setShowColorPicker(false)}
                            >
                                <div className="grid grid-cols-4 gap-1">
                                    {GROUP_COLORS.map(color => (
                                        <button
                                            key={color.id}
                                            onClick={() => handleColorChange(color.id)}
                                            className={`w-6 h-6 rounded border-2 ${color.bg} ${color.border} ${
                                                data.color === color.id ? 'ring-2 ring-white' : ''
                                            }`}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Description (when not collapsed) */}
                {!data.collapsed && data.description && (
                    <div className={`px-3 py-2 text-xs ${colorConfig.text} opacity-70`}>
                        {isEditing ? (
                            <textarea
                                value={editDescription}
                                onChange={e => setEditDescription(e.target.value)}
                                className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-white resize-none"
                                rows={2}
                            />
                        ) : (
                            data.description
                        )}
                    </div>
                )}

                {/* Content area (when not collapsed) */}
                {!data.collapsed && (
                    <div className="flex-1 p-4">
                        {data.childNodeIds.length === 0 && (
                            <div className={`h-full flex items-center justify-center ${colorConfig.text} opacity-50 text-sm`}>
                                Drag nodes here to group them
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Handles for connections */}
            <Handle
                type="target"
                position={Position.Left}
                className="w-3 h-3 !bg-gray-500 border-2 border-gray-700"
            />
            <Handle
                type="source"
                position={Position.Right}
                className="w-3 h-3 !bg-gray-500 border-2 border-gray-700"
            />

            {/* Click outside handler */}
            {(showMenu || showColorPicker) && (
                <div 
                    className="fixed inset-0 z-40"
                    onClick={() => { setShowMenu(false); setShowColorPicker(false); }}
                />
            )}
        </div>
    );
});

GroupNode.displayName = 'GroupNode';

export default GroupNode;
