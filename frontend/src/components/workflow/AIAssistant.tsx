import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    X,
    Send,
    Sparkles,
    Bot,
    User,
    Loader2,
    Lightbulb,
    Wand2,
    Copy,
    Check,
    ChevronDown,
    ChevronUp,
    Zap,
    Code,
    Workflow,
    MessageSquare,
} from 'lucide-react';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    suggestions?: WorkflowSuggestion[];
}

interface WorkflowSuggestion {
    type: 'node' | 'connection' | 'workflow';
    title: string;
    description: string;
    action?: () => void;
}

interface AIAssistantProps {
    onClose: () => void;
    onAddNode?: (type: string, data: Record<string, unknown>) => void;
    onSuggestWorkflow?: (nodes: unknown[], edges: unknown[]) => void;
    currentNodes?: unknown[];
    currentEdges?: unknown[];
}

const QUICK_PROMPTS = [
    { icon: Workflow, label: "Build a workflow", prompt: "Help me build a workflow that" },
    { icon: Code, label: "Add code node", prompt: "Add a code node that" },
    { icon: Zap, label: "Optimize workflow", prompt: "How can I optimize my current workflow?" },
    { icon: Lightbulb, label: "Best practices", prompt: "What are the best practices for" },
];

export default function AIAssistant({
    onClose,
    onAddNode,
    onSuggestWorkflow,
    currentNodes = [],
    currentEdges = [],
}: AIAssistantProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: "Hi! I'm your AI workflow assistant. I can help you:\n\n• Build and optimize workflows\n• Suggest node configurations\n• Explain how different nodes work\n• Generate code for custom logic\n\nHow can I help you today?",
            timestamp: new Date(),
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [showQuickPrompts, setShowQuickPrompts] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const generateResponse = async (userMessage: string): Promise<string> => {
        // Simulate AI response - in production, this would call your AI backend
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
        
        const lowerMessage = userMessage.toLowerCase();
        
        if (lowerMessage.includes('workflow') && lowerMessage.includes('build')) {
            return `I'd be happy to help you build a workflow! Here's what I recommend:

1. **Start with a Trigger** - Every workflow needs a starting point. Choose from:
   - Manual trigger for on-demand execution
   - Webhook trigger for external events
   - Schedule trigger for timed automation

2. **Add Processing Nodes** - Based on your needs:
   - Use **HTTP nodes** for API calls
   - Use **Code nodes** for custom logic
   - Use **AI Agent nodes** for intelligent processing

3. **Add Flow Control** - For complex logic:
   - **Condition nodes** for if/else branching
   - **Switch nodes** for multiple paths
   - **Loop nodes** for iteration

What specific task are you trying to automate?`;
        }
        
        if (lowerMessage.includes('code') || lowerMessage.includes('script')) {
            return `For custom logic, use the **Code Node**. Here's an example:

\`\`\`javascript
// Transform input data
const items = $input.all();
const results = items.map(item => ({
  ...item,
  processed: true,
  timestamp: new Date().toISOString()
}));
return results;
\`\`\`

The Code node supports:
- JavaScript/TypeScript
- Access to input data via \`$input\`
- Async/await for API calls
- npm packages (limited set)

Would you like me to help you write specific code?`;
        }
        
        if (lowerMessage.includes('optimize')) {
            const nodeCount = currentNodes.length;
            return `Here are some optimization tips for your workflow (${nodeCount} nodes):

${nodeCount > 10 ? '⚠️ **Consider simplifying** - Your workflow has many nodes. Try grouping related operations.\n\n' : ''}
1. **Use Merge nodes** to combine parallel branches efficiently
2. **Add error handling** with Error Trigger nodes
3. **Use Set nodes** to transform data early
4. **Enable caching** for repeated API calls
5. **Add logging** with Wait/Debug nodes for troubleshooting

Would you like specific suggestions for any of these optimizations?`;
        }
        
        if (lowerMessage.includes('best practice')) {
            return `Here are workflow best practices:

**📋 Organization**
- Name nodes descriptively
- Group related nodes using Group nodes
- Add Sticky Notes for documentation

**🔒 Error Handling**
- Always add Error Trigger nodes
- Use Condition nodes to validate data
- Set up notifications for failures

**⚡ Performance**
- Minimize API calls with caching
- Use batch operations when possible
- Set appropriate timeouts

**🧪 Testing**
- Test with sample data first
- Use the Debug panel
- Pin data for consistent testing

Need help implementing any of these?`;
        }
        
        return `I understand you're asking about: "${userMessage}"

Based on your current workflow with ${currentNodes.length} nodes and ${currentEdges.length} connections, here are some suggestions:

1. **Review your flow** - Make sure all nodes are properly connected
2. **Test incrementally** - Execute small sections to verify they work
3. **Check data formats** - Ensure data types match between nodes

Would you like me to explain any specific node type or help with a particular task?`;
    };

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        setShowQuickPrompts(false);

        try {
            const response = await generateResponse(userMessage.content);
            
            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "I apologize, but I encountered an error. Please try again.",
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuickPrompt = (prompt: string) => {
        setInput(prompt + ' ');
        inputRef.current?.focus();
    };

    const renderMessage = (message: Message) => {
        const isUser = message.role === 'user';
        
        return (
            <div
                key={message.id}
                className={cn(
                    "flex gap-3 p-4",
                    isUser ? "bg-zinc-900/30" : "bg-transparent"
                )}
            >
                <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    isUser 
                        ? "bg-indigo-500/20 text-indigo-400" 
                        : "bg-gradient-to-br from-purple-500/20 to-pink-500/20 text-purple-400"
                )}>
                    {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                </div>
                
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                            "text-sm font-medium",
                            isUser ? "text-indigo-400" : "text-purple-400"
                        )}>
                            {isUser ? 'You' : 'AI Assistant'}
                        </span>
                        <span className="text-xs text-zinc-600">
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                    
                    <div className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                        {message.content.split('```').map((part, index) => {
                            if (index % 2 === 1) {
                                // Code block
                                const lines = part.split('\n');
                                const language = lines[0] || 'javascript';
                                const code = lines.slice(1).join('\n');
                                
                                return (
                                    <div key={index} className="my-3 rounded-lg overflow-hidden border border-zinc-800">
                                        <div className="flex items-center justify-between px-3 py-2 bg-zinc-900 border-b border-zinc-800">
                                            <span className="text-xs text-zinc-500">{language}</span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0 text-zinc-500 hover:text-zinc-300"
                                                onClick={() => copyToClipboard(code, `code-${message.id}-${index}`)}
                                            >
                                                {copiedId === `code-${message.id}-${index}` ? (
                                                    <Check className="w-3 h-3 text-emerald-400" />
                                                ) : (
                                                    <Copy className="w-3 h-3" />
                                                )}
                                            </Button>
                                        </div>
                                        <pre className="p-3 bg-zinc-950 text-sm overflow-x-auto">
                                            <code className="text-emerald-400">{code}</code>
                                        </pre>
                                    </div>
                                );
                            }
                            return <span key={index}>{part}</span>;
                        })}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed right-4 bottom-4 w-[420px] h-[600px] bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-zinc-100">AI Assistant</h3>
                        <p className="text-xs text-zinc-500">Workflow helper</p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="h-8 w-8 p-0 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                >
                    <X className="w-4 h-4" />
                </Button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1">
                <div className="divide-y divide-zinc-800/50">
                    {messages.map(renderMessage)}
                    
                    {isLoading && (
                        <div className="flex gap-3 p-4">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                                <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex gap-1">
                                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                                <span className="text-sm text-zinc-500">Thinking...</span>
                            </div>
                        </div>
                    )}
                </div>
                <div ref={messagesEndRef} />
            </ScrollArea>

            {/* Quick Prompts */}
            {showQuickPrompts && messages.length <= 1 && (
                <div className="px-4 py-3 border-t border-zinc-800/50 bg-zinc-900/30">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-zinc-500 font-medium">Quick actions</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 text-zinc-600 hover:text-zinc-400"
                            onClick={() => setShowQuickPrompts(false)}
                        >
                            <ChevronDown className="w-3 h-3" />
                        </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {QUICK_PROMPTS.map((item, index) => (
                            <button
                                key={index}
                                onClick={() => handleQuickPrompt(item.prompt)}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 hover:border-zinc-600 transition-all text-left"
                            >
                                <item.icon className="w-4 h-4 text-purple-400" />
                                <span className="text-xs text-zinc-300">{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
                <div className="flex gap-2">
                    <Input
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                        placeholder="Ask anything about workflows..."
                        className="flex-1 h-10 bg-zinc-900 border-zinc-700 text-zinc-200 placeholder:text-zinc-600 focus:border-purple-500 focus:ring-purple-500/20"
                        disabled={isLoading}
                    />
                    <Button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className="h-10 w-10 p-0 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                    </Button>
                </div>
                <p className="text-[10px] text-zinc-600 mt-2 text-center">
                    AI suggestions are for guidance. Always verify before applying.
                </p>
            </div>
        </div>
    );
}
