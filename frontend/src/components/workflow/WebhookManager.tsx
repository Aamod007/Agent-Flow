/**
 * WebhookManager Component
 * 
 * Manages webhook URLs for triggering workflows externally.
 * Similar to n8n's webhook trigger configuration.
 */

import React, { useState, useEffect } from 'react';
import { Webhook, Globe, Copy, Trash2, ToggleLeft, ToggleRight, Plus, ExternalLink, Shield, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import type { Webhook as WebhookType } from '@/lib/api';

interface WebhookManagerProps {
    workflowId: string;
    isOpen: boolean;
    onClose: () => void;
}

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const;

export const WebhookManager: React.FC<WebhookManagerProps> = ({
    workflowId,
    isOpen,
    onClose
}) => {
    const [webhooks, setWebhooks] = useState<WebhookType[]>([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newMethod, setNewMethod] = useState<string>('POST');
    const [newSecret, setNewSecret] = useState<string>('');
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);

    useEffect(() => {
        if (isOpen && workflowId) {
            loadWebhooks();
        }
    }, [isOpen, workflowId]);

    const loadWebhooks = async () => {
        setLoading(true);
        try {
            const data = await api.getWebhooks(workflowId);
            setWebhooks(data);
        } catch (error) {
            console.error('Failed to load webhooks:', error);
        } finally {
            setLoading(false);
        }
    };

    const createWebhook = async () => {
        setCreating(true);
        try {
            const webhook = await api.createWebhook(workflowId, {
                method: newMethod,
                secret: newSecret || undefined
            });
            setWebhooks(prev => [webhook, ...prev]);
            setShowCreateForm(false);
            setNewMethod('POST');
            setNewSecret('');
        } catch (error) {
            console.error('Failed to create webhook:', error);
        } finally {
            setCreating(false);
        }
    };

    const deleteWebhook = async (id: string) => {
        try {
            await api.deleteWebhook(id);
            setWebhooks(prev => prev.filter(w => w.id !== id));
        } catch (error) {
            console.error('Failed to delete webhook:', error);
        }
    };

    const toggleWebhook = async (id: string) => {
        try {
            const result = await api.toggleWebhook(id);
            setWebhooks(prev => prev.map(w => 
                w.id === id ? { ...w, isActive: result.isActive } : w
            ));
        } catch (error) {
            console.error('Failed to toggle webhook:', error);
        }
    };

    const copyToClipboard = async (text: string, id: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Never';
        return new Date(dateString).toLocaleString();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
            <div 
                className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-gradient-to-r from-purple-500/10 to-violet-500/10">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-violet-500/20">
                            <Webhook className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-zinc-100">Webhook Triggers</h2>
                            <p className="text-xs text-zinc-500">Trigger this workflow via HTTP requests</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto bg-zinc-900/30">
                    {/* Create New Webhook */}
                    {!showCreateForm ? (
                        <button
                            onClick={() => setShowCreateForm(true)}
                            className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-zinc-700 rounded-xl text-zinc-500 hover:text-purple-400 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            Create New Webhook
                        </button>
                    ) : (
                        <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800 space-y-4">
                            <h3 className="text-sm font-medium text-zinc-200">New Webhook</h3>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-zinc-400 mb-1">HTTP Method</label>
                                    <select
                                        value={newMethod}
                                        onChange={e => setNewMethod(e.target.value)}
                                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 text-sm focus:border-purple-500/50 outline-none"
                                    >
                                        {HTTP_METHODS.map(method => (
                                            <option key={method} value={method}>{method}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-zinc-400 mb-1">Secret (Optional)</label>
                                    <input
                                        type="text"
                                        value={newSecret}
                                        onChange={e => setNewSecret(e.target.value)}
                                        placeholder="x-webhook-secret header"
                                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 text-sm focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setShowCreateForm(false)}
                                    className="px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={createWebhook}
                                    disabled={creating}
                                    className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg disabled:opacity-50 flex items-center gap-2 transition-colors"
                                >
                                    {creating && <RefreshCw className="w-3 h-3 animate-spin" />}
                                    Create Webhook
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Webhooks List */}
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <RefreshCw className="w-5 h-5 text-zinc-400 animate-spin" />
                        </div>
                    ) : webhooks.length === 0 ? (
                        <div className="text-center py-8 text-zinc-500">
                            <Globe className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No webhooks configured</p>
                            <p className="text-sm">Create a webhook to trigger this workflow externally</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {webhooks.map(webhook => (
                                <div 
                                    key={webhook.id}
                                    className={`p-4 rounded-xl border transition-all ${
                                        webhook.isActive 
                                            ? 'bg-zinc-900/50 border-zinc-800' 
                                            : 'bg-zinc-950/50 border-zinc-800/50'
                                    }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            {/* Method badge */}
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`px-2 py-0.5 text-xs font-mono rounded ${
                                                    webhook.method === 'GET' ? 'bg-green-500/20 text-green-400' :
                                                    webhook.method === 'POST' ? 'bg-blue-500/20 text-blue-400' :
                                                    webhook.method === 'PUT' ? 'bg-yellow-500/20 text-yellow-400' :
                                                    webhook.method === 'DELETE' ? 'bg-red-500/20 text-red-400' :
                                                    'bg-purple-500/20 text-purple-400'
                                                }`}>
                                                    {webhook.method}
                                                </span>
                                                {!webhook.isActive && (
                                                    <span className="px-2 py-0.5 text-xs bg-zinc-800 text-zinc-500 rounded">
                                                        Disabled
                                                    </span>
                                                )}
                                            </div>

                                            {/* URL */}
                                            <div className="flex items-center gap-2 group">
                                                <code className="text-sm text-zinc-300 truncate flex-1 font-mono">
                                                    {webhook.url}
                                                </code>
                                                <button
                                                    onClick={() => copyToClipboard(webhook.url, webhook.id)}
                                                    className="p-1 text-zinc-500 hover:text-zinc-100 opacity-0 group-hover:opacity-100 transition-all"
                                                    title="Copy URL"
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                                <a
                                                    href={webhook.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-1 text-zinc-500 hover:text-zinc-100 opacity-0 group-hover:opacity-100 transition-all"
                                                    title="Open in new tab"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                            </div>

                                            {copiedId === webhook.id && (
                                                <span className="text-xs text-green-400 mt-1 block">
                                                    Copied to clipboard!
                                                </span>
                                            )}

                                            {/* Stats */}
                                            <div className="flex items-center gap-4 mt-3 text-xs text-zinc-500">
                                                <span>Calls: {webhook.callCount || 0}</span>
                                                <span>Last called: {formatDate(webhook.lastCalledAt)}</span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1 ml-4">
                                            <button
                                                onClick={() => toggleWebhook(webhook.id)}
                                                className={`p-2 rounded-lg transition-colors ${
                                                    webhook.isActive 
                                                        ? 'text-green-400 hover:bg-green-500/20' 
                                                        : 'text-zinc-500 hover:bg-zinc-800'
                                                }`}
                                                title={webhook.isActive ? 'Disable' : 'Enable'}
                                            >
                                                {webhook.isActive ? (
                                                    <ToggleRight className="w-5 h-5" />
                                                ) : (
                                                    <ToggleLeft className="w-5 h-5" />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => deleteWebhook(webhook.id)}
                                                className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Info Box */}
                    <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                        <div className="flex items-start gap-2">
                            <Shield className="w-4 h-4 text-blue-400 mt-0.5" />
                            <div className="text-xs text-blue-300">
                                <strong>Security Tips:</strong>
                                <ul className="list-disc list-inside mt-1 space-y-0.5 text-blue-300/80">
                                    <li>Use a secret header for authentication</li>
                                    <li>Disable webhooks when not in use</li>
                                    <li>Each webhook URL is unique and unguessable</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WebhookManager;
