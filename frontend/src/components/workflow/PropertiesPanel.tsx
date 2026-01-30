import { useCallback } from 'react';
import { type Node } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
    X,
    Settings,
    Trash2,
    Copy,
    Bot,
    Thermometer,
    Hash,
    MessageSquare
} from 'lucide-react';
import type { AgentNodeData } from './AgentNode';

// Available models per provider
const MODELS_BY_PROVIDER: Record<string, string[]> = {
    gemini: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash'],
    ollama: ['llama3', 'llama2', 'mistral', 'mixtral', 'codellama', 'phi'],
    openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    groq: ['llama-3.1-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
};

interface PropertiesPanelProps {
    selectedNode: Node<AgentNodeData> | null;
    onClose: () => void;
    onUpdateNode: (nodeId: string, data: Partial<AgentNodeData>) => void;
    onDeleteNode: (nodeId: string) => void;
    onDuplicateNode: (nodeId: string) => void;
}

export default function PropertiesPanel({
    selectedNode,
    onClose,
    onUpdateNode,
    onDeleteNode,
    onDuplicateNode
}: PropertiesPanelProps) {
    const handleConfigChange = useCallback((key: string, value: string | number) => {
        if (!selectedNode) return;

        const newConfig = {
            ...selectedNode.data.config,
            [key]: value
        };

        onUpdateNode(selectedNode.id, { config: newConfig });
    }, [selectedNode, onUpdateNode]);

    const handleLabelChange = useCallback((label: string) => {
        if (!selectedNode) return;
        onUpdateNode(selectedNode.id, { label });
    }, [selectedNode, onUpdateNode]);

    if (!selectedNode) {
        return (
            <div className="w-80 border-l border-[hsl(225_8%_18%)] bg-[hsl(225_12%_8%)] flex flex-col h-full">
                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="text-center">
                        <Settings className="w-12 h-12 mx-auto mb-4 text-[hsl(220_7%_45%)]" />
                        <p className="text-sm text-[hsl(220_9%_63%)]">
                            Select an agent to view its properties
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const data = selectedNode.data;
    const config = data.config || {};

    return (
        <div className="w-80 border-l border-[hsl(225_8%_18%)] bg-[hsl(225_12%_8%)] flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[hsl(225_8%_18%)]">
                <div className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-indigo-400" />
                    <span className="text-sm font-semibold text-[hsl(220_13%_91%)]">
                        Agent Properties
                    </span>
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 rounded-md hover:bg-[hsl(225_9%_15%)] text-[hsl(220_9%_63%)] hover:text-[hsl(220_13%_91%)] transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                    <h4 className="text-xs font-semibold text-[hsl(220_9%_63%)] uppercase tracking-wider">
                        Basic Info
                    </h4>

                    <div className="space-y-2">
                        <Label className="text-xs text-[hsl(220_9%_63%)]">Agent Name</Label>
                        <Input
                            value={data.label}
                            onChange={(e) => handleLabelChange(e.target.value)}
                            className={cn(
                                'h-9 text-sm',
                                'bg-[hsl(225_10%_11%)] border-[hsl(225_8%_18%)]',
                                'text-[hsl(220_13%_91%)]',
                                'focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/25'
                            )}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs text-[hsl(220_9%_63%)]">Agent Type</Label>
                        <div className="h-9 px-3 flex items-center text-sm bg-[hsl(225_10%_11%)] border border-[hsl(225_8%_18%)] rounded-md text-[hsl(220_9%_63%)] capitalize">
                            {(data.agentType || 'default').replace(/-/g, ' ')}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs text-[hsl(220_9%_63%)]">Node ID</Label>
                        <div className="h-9 px-3 flex items-center text-sm font-mono bg-[hsl(225_10%_11%)] border border-[hsl(225_8%_18%)] rounded-md text-[hsl(220_7%_45%)]">
                            {selectedNode.id}
                        </div>
                    </div>
                </div>

                {/* Model Configuration */}
                <div className="space-y-4">
                    <h4 className="text-xs font-semibold text-[hsl(220_9%_63%)] uppercase tracking-wider">
                        Model Configuration
                    </h4>

                    <div className="space-y-2">
                        <Label className="text-xs text-[hsl(220_9%_63%)] flex items-center gap-2">
                            <Hash className="w-3 h-3" />
                            Provider
                        </Label>
                        <select
                            value={config.provider || 'gemini'}
                            onChange={(e) => handleConfigChange('provider', e.target.value)}
                            className={cn(
                                'w-full h-9 px-3 text-sm rounded-md',
                                'bg-[hsl(225_10%_11%)] border border-[hsl(225_8%_18%)]',
                                'text-[hsl(220_13%_91%)]',
                                'focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/25 focus:outline-none'
                            )}
                        >
                            <option value="gemini">Google Gemini</option>
                            <option value="ollama">Ollama (Local)</option>
                            <option value="openai">OpenAI</option>
                            <option value="groq">Groq</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs text-[hsl(220_9%_63%)] flex items-center gap-2">
                            <Hash className="w-3 h-3" />
                            Model
                        </Label>
                        <select
                            value={config.model || 'gemini-2.5-flash'}
                            onChange={(e) => handleConfigChange('model', e.target.value)}
                            className={cn(
                                'w-full h-9 px-3 text-sm font-mono rounded-md',
                                'bg-[hsl(225_10%_11%)] border border-[hsl(225_8%_18%)]',
                                'text-[hsl(220_13%_91%)]',
                                'focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/25 focus:outline-none'
                            )}
                        >
                            {MODELS_BY_PROVIDER[config.provider || 'gemini']?.map((model) => (
                                <option key={model} value={model}>
                                    {model}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs text-[hsl(220_9%_63%)] flex items-center gap-2">
                            <Thermometer className="w-3 h-3" />
                            Temperature
                        </Label>
                        <Input
                            type="number"
                            min="0"
                            max="2"
                            step="0.1"
                            value={config.temperature || 0.7}
                            onChange={(e) => handleConfigChange('temperature', parseFloat(e.target.value))}
                            className={cn(
                                'h-9 text-sm',
                                'bg-[hsl(225_10%_11%)] border-[hsl(225_8%_18%)]',
                                'text-[hsl(220_13%_91%)]',
                                'focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/25'
                            )}
                        />
                        <p className="text-xs text-[hsl(220_7%_45%)]">
                            Higher = more creative, Lower = more focused
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs text-[hsl(220_9%_63%)] flex items-center gap-2">
                            <Hash className="w-3 h-3" />
                            Max Tokens
                        </Label>
                        <Input
                            type="number"
                            min="100"
                            max="8192"
                            step="100"
                            value={config.maxTokens || 2048}
                            onChange={(e) => handleConfigChange('maxTokens', parseInt(e.target.value))}
                            className={cn(
                                'h-9 text-sm',
                                'bg-[hsl(225_10%_11%)] border-[hsl(225_8%_18%)]',
                                'text-[hsl(220_13%_91%)]',
                                'focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/25'
                            )}
                        />
                    </div>
                </div>

                {/* System Prompt */}
                <div className="space-y-4">
                    <h4 className="text-xs font-semibold text-[hsl(220_9%_63%)] uppercase tracking-wider">
                        System Prompt
                    </h4>

                    <div className="space-y-2">
                        <Label className="text-xs text-[hsl(220_9%_63%)] flex items-center gap-2">
                            <MessageSquare className="w-3 h-3" />
                            Instructions
                        </Label>
                        <textarea
                            value={config.systemPrompt || ''}
                            onChange={(e) => handleConfigChange('systemPrompt', e.target.value)}
                            placeholder="Enter system instructions for this agent..."
                            rows={4}
                            className={cn(
                                'w-full px-3 py-2 text-sm rounded-md resize-none',
                                'bg-[hsl(225_10%_11%)] border border-[hsl(225_8%_18%)]',
                                'text-[hsl(220_13%_91%)] placeholder:text-[hsl(220_7%_45%)]',
                                'focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/25 focus:outline-none'
                            )}
                        />
                    </div>
                </div>
            </div>

            {/* Actions Footer */}
            <div className="p-4 border-t border-[hsl(225_8%_18%)] space-y-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDuplicateNode(selectedNode.id)}
                    className={cn(
                        'w-full justify-start',
                        'bg-transparent border-[hsl(225_8%_18%)]',
                        'text-[hsl(220_13%_91%)] hover:bg-[hsl(225_9%_15%)] hover:text-[hsl(220_13%_91%)]'
                    )}
                >
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicate Agent
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDeleteNode(selectedNode.id)}
                    className={cn(
                        'w-full justify-start',
                        'bg-transparent border-red-500/30',
                        'text-red-400 hover:bg-red-500/10 hover:text-red-400'
                    )}
                >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Agent
                </Button>
            </div>
        </div>
    );
}
