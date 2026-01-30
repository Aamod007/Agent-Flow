import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { 
    Globe, 
    FileText, 
    Code, 
    Bot, 
    BarChart3, 
    Mail,
    MessageSquare,
    Search,
    PenTool,
    Bug,
    FileCode,
    Languages,
    Newspaper,
    CheckCircle,
    TrendingUp,
    AlertTriangle,
    Calendar,
    Database
} from 'lucide-react';

export type AgentStatus = 'idle' | 'running' | 'success' | 'error' | 'waiting';

export interface AgentNodeData {
    label: string;
    agentType: string;
    status?: AgentStatus;
    config?: Record<string, any>;
    [key: string]: unknown;
}

const AGENT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    'web-scraper': Globe,
    'research': Search,
    'news-monitor': Newspaper,
    'fact-checker': CheckCircle,
    'data-analyst': BarChart3,
    'sentiment': MessageSquare,
    'trend': TrendingUp,
    'anomaly': AlertTriangle,
    'writer': PenTool,
    'editor': FileText,
    'translator': Languages,
    'summarizer': FileText,
    'code-generator': Code,
    'code-reviewer': Bug,
    'test-generator': FileCode,
    'documentation': FileText,
    'email': Mail,
    'slack': MessageSquare,
    'calendar': Calendar,
    'database': Database,
    'default': Bot,
};

const AGENT_COLORS: Record<string, string> = {
    'research': 'bg-blue-600',
    'web-scraper': 'bg-blue-600',
    'news-monitor': 'bg-blue-600',
    'fact-checker': 'bg-blue-600',
    'data-analyst': 'bg-emerald-600',
    'sentiment': 'bg-emerald-600',
    'trend': 'bg-emerald-600',
    'anomaly': 'bg-emerald-600',
    'writer': 'bg-purple-600',
    'editor': 'bg-purple-600',
    'translator': 'bg-purple-600',
    'summarizer': 'bg-purple-600',
    'code-generator': 'bg-orange-600',
    'code-reviewer': 'bg-orange-600',
    'test-generator': 'bg-orange-600',
    'documentation': 'bg-orange-600',
    'email': 'bg-pink-600',
    'slack': 'bg-pink-600',
    'calendar': 'bg-pink-600',
    'database': 'bg-cyan-600',
    'default': 'bg-indigo-600',
};

function StatusIndicator({ status }: { status: AgentStatus }) {
    return (
        <div 
            className={cn(
                'w-2.5 h-2.5 rounded-full',
                status === 'idle' && 'bg-slate-500',
                status === 'running' && 'bg-purple-500 animate-pulse',
                status === 'success' && 'bg-emerald-500',
                status === 'error' && 'bg-red-500',
                status === 'waiting' && 'bg-amber-500'
            )}
        />
    );
}

function AgentNode({ data, selected }: NodeProps) {
    const nodeData = data as unknown as AgentNodeData;
    const agentType = nodeData.agentType || 'default';
    const IconComponent = AGENT_ICONS[agentType] || AGENT_ICONS['default'];
    const colorClass = AGENT_COLORS[agentType] || AGENT_COLORS['default'];
    const status: AgentStatus = nodeData.status || 'idle';
    
    return (
        <div 
            className={cn(
                'relative min-w-[220px] rounded-lg border-2 shadow-lg transition-all duration-200',
                'bg-[hsl(225_10%_11%)]',
                selected 
                    ? 'border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.4)]' 
                    : 'border-[hsl(225_7%_26%)] hover:border-indigo-500/50',
                'hover:shadow-xl hover:-translate-y-0.5'
            )}
        >
            {/* Input Handle */}
            <Handle
                type="target"
                position={Position.Left}
                className="!w-3 !h-3 !bg-[hsl(225_12%_8%)] !border-2 !border-indigo-500 hover:!scale-125 transition-transform"
            />
            
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[hsl(225_8%_18%)] bg-[hsl(225_12%_8%)] rounded-t-lg">
                <div className={cn('w-8 h-8 flex items-center justify-center rounded-md text-white', colorClass)}>
                    <IconComponent className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[hsl(220_13%_91%)] truncate">
                        {nodeData.label}
                    </div>
                    <div className="text-xs text-[hsl(220_9%_63%)] capitalize">
                        {agentType.replace(/-/g, ' ')}
                    </div>
                </div>
                <StatusIndicator status={status} />
            </div>
            
            {/* Body - Config Preview */}
            {nodeData.config && Object.keys(nodeData.config).length > 0 && (
                <div className="p-3">
                    <div className="font-mono text-xs text-[hsl(220_9%_63%)] bg-[hsl(225_15%_5%)] p-2 rounded max-h-[80px] overflow-y-auto">
                        {Object.entries(nodeData.config).slice(0, 3).map(([key, value]) => (
                            <div key={key} className="truncate">
                                <span className="text-indigo-400">{key}:</span>{' '}
                                <span className="text-[hsl(220_13%_91%)]">
                                    {typeof value === 'string' ? value.substring(0, 30) : String(value)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Output Handle */}
            <Handle
                type="source"
                position={Position.Right}
                className="!w-3 !h-3 !bg-[hsl(225_12%_8%)] !border-2 !border-indigo-500 hover:!scale-125 transition-transform"
            />
        </div>
    );
}

export default memo(AgentNode);
