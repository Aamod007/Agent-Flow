/**
 * PinDataPanel Component
 * 
 * Allows users to pin input/output data on nodes for testing.
 * Similar to n8n's pin data feature for workflow debugging.
 */

import React, { useState, useEffect } from 'react';
import { Pin, PinOff, Copy, Download, Upload, Check, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

export interface PinnedData {
    input?: unknown;
    output?: unknown;
    pinnedAt?: string;
}

interface PinDataPanelProps {
    workflowId: string;
    nodeId: string;
    nodeName: string;
    currentInput?: unknown;
    currentOutput?: unknown;
    pinnedData?: PinnedData;
    onPin: (data: PinnedData) => void;
    onUnpin: () => void;
    onClose: () => void;
}

export const PinDataPanel: React.FC<PinDataPanelProps> = ({
    workflowId,
    nodeId,
    nodeName,
    currentInput,
    currentOutput,
    pinnedData,
    onPin,
    onUnpin,
    onClose
}) => {
    const [activeTab, setActiveTab] = useState<'input' | 'output'>('output');
    const [editMode, setEditMode] = useState(false);
    const [editValue, setEditValue] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [saving, setSaving] = useState(false);

    const isPinned = !!(pinnedData?.input || pinnedData?.output);
    const currentData = activeTab === 'input' ? currentInput : currentOutput;
    const pinnedValue = activeTab === 'input' ? pinnedData?.input : pinnedData?.output;
    const displayValue = pinnedValue ?? currentData;

    useEffect(() => {
        if (editMode && displayValue !== undefined) {
            setEditValue(JSON.stringify(displayValue, null, 2));
        }
    }, [editMode, displayValue]);

    const handlePinCurrent = async () => {
        setSaving(true);
        setError(null);
        try {
            const newPinnedData: PinnedData = {
                ...pinnedData,
                [activeTab]: currentData,
                pinnedAt: new Date().toISOString()
            };
            
            await api.pinNodeData(workflowId, nodeId, {
                [activeTab]: currentData
            });
            
            onPin(newPinnedData);
        } catch (err) {
            setError('Failed to pin data');
        } finally {
            setSaving(false);
        }
    };

    const handlePinCustom = async () => {
        setSaving(true);
        setError(null);
        try {
            const parsedValue = JSON.parse(editValue);
            const newPinnedData: PinnedData = {
                ...pinnedData,
                [activeTab]: parsedValue,
                pinnedAt: new Date().toISOString()
            };
            
            await api.pinNodeData(workflowId, nodeId, {
                [activeTab]: parsedValue
            });
            
            onPin(newPinnedData);
            setEditMode(false);
        } catch (err) {
            if (err instanceof SyntaxError) {
                setError('Invalid JSON format');
            } else {
                setError('Failed to pin data');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleUnpin = async () => {
        setSaving(true);
        setError(null);
        try {
            await api.unpinNodeData(workflowId, nodeId);
            onUnpin();
        } catch (err) {
            setError('Failed to unpin data');
        } finally {
            setSaving(false);
        }
    };

    const handleCopy = async () => {
        const valueToCopy = JSON.stringify(displayValue, null, 2);
        await navigator.clipboard.writeText(valueToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleImport = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                const text = await file.text();
                try {
                    JSON.parse(text); // Validate JSON
                    setEditValue(text);
                    setEditMode(true);
                } catch {
                    setError('Invalid JSON file');
                }
            }
        };
        input.click();
    };

    const handleExport = () => {
        const blob = new Blob([JSON.stringify(displayValue, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${nodeName}-${activeTab}-data.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden w-full max-w-lg">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-700 bg-gray-800">
                <div className="flex items-center gap-2">
                    <Pin className={`w-4 h-4 ${isPinned ? 'text-yellow-400' : 'text-gray-400'}`} />
                    <span className="text-sm font-medium text-white">{nodeName}</span>
                    {isPinned && (
                        <span className="px-1.5 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded">
                            Pinned
                        </span>
                    )}
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-white">
                    ✕
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-700">
                <button
                    onClick={() => { setActiveTab('input'); setEditMode(false); }}
                    className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                        activeTab === 'input'
                            ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-800/50'
                            : 'text-gray-400 hover:text-white'
                    }`}
                >
                    Input
                    {pinnedData?.input !== undefined && pinnedData?.input !== null && (
                        <Pin className="w-3 h-3 inline-block ml-1 text-yellow-400" />
                    )}
                </button>
                <button
                    onClick={() => { setActiveTab('output'); setEditMode(false); }}
                    className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                        activeTab === 'output'
                            ? 'text-green-400 border-b-2 border-green-400 bg-gray-800/50'
                            : 'text-gray-400 hover:text-white'
                    }`}
                >
                    Output
                    {pinnedData?.output !== undefined && pinnedData?.output !== null && (
                        <Pin className="w-3 h-3 inline-block ml-1 text-yellow-400" />
                    )}
                </button>
            </div>

            {/* Content */}
            <div className="p-3 space-y-3">
                {error && (
                    <div className="flex items-center gap-2 p-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </div>
                )}

                {/* Data Display / Edit */}
                {editMode ? (
                    <textarea
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        className="w-full h-64 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-300 font-mono text-xs resize-none focus:border-blue-500 focus:outline-none"
                        placeholder="Enter JSON data..."
                    />
                ) : (
                    <div className="relative">
                        <pre className="w-full h-64 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 font-mono text-xs overflow-auto">
                            {displayValue !== undefined 
                                ? JSON.stringify(displayValue, null, 2)
                                : <span className="text-gray-500 italic">No data available. Execute the workflow first.</span>
                            }
                        </pre>
                        {pinnedValue !== undefined && pinnedValue !== null && (
                            <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                                Pinned Data
                            </div>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                    {editMode ? (
                        <>
                            <button
                                onClick={handlePinCustom}
                                disabled={saving}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded-lg disabled:opacity-50"
                            >
                                <Pin className="w-3.5 h-3.5" />
                                Pin Custom Data
                            </button>
                            <button
                                onClick={() => setEditMode(false)}
                                className="px-3 py-1.5 text-gray-400 hover:text-white text-sm"
                            >
                                Cancel
                            </button>
                        </>
                    ) : (
                        <>
                            {currentData && !pinnedValue && (
                                <button
                                    onClick={handlePinCurrent}
                                    disabled={saving}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded-lg disabled:opacity-50"
                                >
                                    <Pin className="w-3.5 h-3.5" />
                                    Pin Current
                                </button>
                            )}
                            
                            {pinnedValue && (
                                <button
                                    onClick={handleUnpin}
                                    disabled={saving}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg disabled:opacity-50"
                                >
                                    <PinOff className="w-3.5 h-3.5" />
                                    Unpin
                                </button>
                            )}

                            <button
                                onClick={() => setEditMode(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg"
                            >
                                Edit Custom
                            </button>

                            <div className="flex-1" />

                            <button
                                onClick={handleCopy}
                                disabled={!displayValue}
                                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded disabled:opacity-50"
                                title="Copy"
                            >
                                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                            </button>
                            <button
                                onClick={handleImport}
                                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
                                title="Import JSON"
                            >
                                <Upload className="w-4 h-4" />
                            </button>
                            <button
                                onClick={handleExport}
                                disabled={!displayValue}
                                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded disabled:opacity-50"
                                title="Export JSON"
                            >
                                <Download className="w-4 h-4" />
                            </button>
                        </>
                    )}
                </div>

                {/* Info */}
                {isPinned && (
                    <div className="p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-xs text-yellow-300">
                        <strong>Pinned data will be used instead of actual execution data.</strong>
                        <p className="mt-1 text-yellow-300/70">
                            This is useful for testing downstream nodes without re-executing upstream nodes.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

/**
 * Hook to manage pinned data state for all nodes
 */
export const usePinnedData = () => {
    const [pinnedNodes, setPinnedNodes] = useState<Map<string, PinnedData>>(new Map());

    const pinData = (nodeId: string, data: PinnedData) => {
        setPinnedNodes(prev => new Map(prev).set(nodeId, data));
    };

    const unpinData = (nodeId: string) => {
        setPinnedNodes(prev => {
            const next = new Map(prev);
            next.delete(nodeId);
            return next;
        });
    };

    const getPinnedData = (nodeId: string): PinnedData | undefined => {
        return pinnedNodes.get(nodeId);
    };

    const hasPinnedData = (nodeId: string): boolean => {
        return pinnedNodes.has(nodeId);
    };

    const clearAllPins = () => {
        setPinnedNodes(new Map());
    };

    return {
        pinnedNodes,
        pinData,
        unpinData,
        getPinnedData,
        hasPinnedData,
        clearAllPins
    };
};

export default PinDataPanel;
