import { useState, type DragEvent } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Search,
    Globe,
    FileText,
    Code,
    Bot,
    BarChart3,
    Mail,
    MessageSquare,
    PenTool,
    Bug,
    FileCode,
    Languages,
    Newspaper,
    CheckCircle,
    TrendingUp,
    AlertTriangle,
    Calendar,
    Database,
    ChevronDown,
    ChevronRight,
    GripVertical,
    // New icons for flow control and triggers
    GitBranch,
    Route,
    Repeat,
    Merge,
    Webhook,
    Clock,
    Play,
    Wand2,
    ArrowRightLeft,
    Filter,
    Braces
} from 'lucide-react';

interface AgentTemplate {
    type: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
}

interface AgentCategory {
    name: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    agents: AgentTemplate[];
}

const AGENT_CATEGORIES: AgentCategory[] = [
    // === NEW: TRIGGERS ===
    {
        name: 'Triggers',
        icon: Webhook,
        color: 'text-orange-400',
        agents: [
            { type: 'trigger-webhook', label: 'Webhook Trigger', icon: Webhook, description: 'Start workflow via HTTP' },
            { type: 'trigger-schedule', label: 'Schedule Trigger', icon: Clock, description: 'Run on a schedule' },
            { type: 'trigger-manual', label: 'Manual Trigger', icon: Play, description: 'Start manually' },
        ]
    },
    // === NEW: LOGIC & FLOW ===
    {
        name: 'Logic & Flow',
        icon: GitBranch,
        color: 'text-amber-400',
        agents: [
            { type: 'condition', label: 'Condition (IF/ELSE)', icon: GitBranch, description: 'Branch based on condition' },
            { type: 'switch', label: 'Switch', icon: Route, description: 'Multiple output branches' },
            { type: 'loop', label: 'Loop', icon: Repeat, description: 'Iterate over items' },
            { type: 'merge', label: 'Merge', icon: Merge, description: 'Combine branches' },
        ]
    },
    // === NEW: DATA TRANSFORM ===
    {
        name: 'Data Transform',
        icon: Wand2,
        color: 'text-violet-400',
        agents: [
            { type: 'transformer', label: 'Transformer', icon: Wand2, description: 'Transform data fields' },
            { type: 'filter', label: 'Filter', icon: Filter, description: 'Filter array items' },
            { type: 'mapper', label: 'Field Mapper', icon: ArrowRightLeft, description: 'Map fields to new names' },
            { type: 'code', label: 'Code (JavaScript)', icon: Braces, description: 'Custom JS code' },
        ]
    },
    // === NEW: INTEGRATIONS ===
    {
        name: 'Integrations',
        icon: Globe,
        color: 'text-emerald-400',
        agents: [
            { type: 'http', label: 'HTTP Request', icon: Globe, description: 'Call external APIs' },
        ]
    },
    // === EXISTING CATEGORIES ===
    {
        name: 'Research Agents',
        icon: Search,
        color: 'text-blue-400',
        agents: [
            { type: 'web-scraper', label: 'Web Scraper', icon: Globe, description: 'Extract data from websites' },
            { type: 'research', label: 'Academic Search', icon: Search, description: 'Search papers across arXiv, PubMed' },
            { type: 'news-monitor', label: 'News Monitor', icon: Newspaper, description: 'Track real-time news' },
            { type: 'fact-checker', label: 'Fact Checker', icon: CheckCircle, description: 'Verify claims against sources' },
        ]
    },
    {
        name: 'Analysis Agents',
        icon: BarChart3,
        color: 'text-emerald-400',
        agents: [
            { type: 'data-analyst', label: 'Data Analyst', icon: BarChart3, description: 'Statistical analysis & insights' },
            { type: 'sentiment', label: 'Sentiment Analyzer', icon: MessageSquare, description: 'Analyze text sentiment' },
            { type: 'trend', label: 'Trend Detector', icon: TrendingUp, description: 'Identify patterns in data' },
            { type: 'anomaly', label: 'Anomaly Detector', icon: AlertTriangle, description: 'Flag outliers in datasets' },
        ]
    },
    {
        name: 'Content Agents',
        icon: PenTool,
        color: 'text-purple-400',
        agents: [
            { type: 'writer', label: 'Writer', icon: PenTool, description: 'Generate long-form content' },
            { type: 'editor', label: 'Editor', icon: FileText, description: 'Review and improve text' },
            { type: 'translator', label: 'Translator', icon: Languages, description: 'Translate 100+ languages' },
            { type: 'summarizer', label: 'Summarizer', icon: FileText, description: 'Create concise summaries' },
        ]
    },
    {
        name: 'Development Agents',
        icon: Code,
        color: 'text-orange-400',
        agents: [
            { type: 'code-generator', label: 'Code Generator', icon: Code, description: 'Write code from specs' },
            { type: 'code-reviewer', label: 'Code Reviewer', icon: Bug, description: 'Analyze code for issues' },
            { type: 'test-generator', label: 'Test Generator', icon: FileCode, description: 'Create unit tests' },
            { type: 'documentation', label: 'Documentation', icon: FileText, description: 'Generate tech docs' },
        ]
    },
    {
        name: 'Communication Agents',
        icon: Mail,
        color: 'text-pink-400',
        agents: [
            { type: 'email', label: 'Email Manager', icon: Mail, description: 'Draft and send emails' },
            { type: 'slack', label: 'Slack Bot', icon: MessageSquare, description: 'Post to Slack channels' },
            { type: 'calendar', label: 'Calendar Scheduler', icon: Calendar, description: 'Manage meetings' },
        ]
    },
    {
        name: 'Data Agents',
        icon: Database,
        color: 'text-cyan-400',
        agents: [
            { type: 'database', label: 'Database Query', icon: Database, description: 'Query databases' },
            { type: 'default', label: 'Generic Agent', icon: Bot, description: 'Custom AI agent' },
        ]
    },
];


function AgentTemplateCard({
    agent,
    onDragStart
}: {
    agent: AgentTemplate;
    onDragStart: (e: DragEvent, type: string, label: string) => void;
}) {
    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, agent.type, agent.label)}
            className={cn(
                'group flex items-center gap-3 p-3 rounded-lg cursor-grab',
                'bg-[hsl(225_10%_11%)] border border-[hsl(225_8%_18%)]',
                'hover:border-indigo-500/50 hover:bg-[hsl(225_9%_15%)]',
                'transition-all duration-200'
            )}
        >
            <div className="p-1.5 text-[hsl(220_9%_63%)] group-hover:text-[hsl(220_13%_91%)]">
                <GripVertical className="w-4 h-4" />
            </div>
            <div className="p-2 rounded-md bg-indigo-500/10 text-indigo-400">
                <agent.icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[hsl(220_13%_91%)] truncate">
                    {agent.label}
                </div>
                <div className="text-xs text-[hsl(220_7%_45%)] truncate">
                    {agent.description}
                </div>
            </div>
        </div>
    );
}

function CategorySection({
    category,
    isExpanded,
    onToggle,
    onDragStart
}: {
    category: AgentCategory;
    isExpanded: boolean;
    onToggle: () => void;
    onDragStart: (e: DragEvent, type: string, label: string) => void;
}) {
    return (
        <div className="mb-2">
            <button
                onClick={onToggle}
                className={cn(
                    'w-full flex items-center gap-2 p-3 rounded-lg',
                    'text-left transition-colors duration-200',
                    'hover:bg-[hsl(225_9%_15%)]',
                    isExpanded && 'bg-[hsl(225_10%_11%)]'
                )}
            >
                {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-[hsl(220_9%_63%)]" />
                ) : (
                    <ChevronRight className="w-4 h-4 text-[hsl(220_9%_63%)]" />
                )}
                <category.icon className={cn('w-4 h-4', category.color)} />
                <span className="text-sm font-medium text-[hsl(220_13%_91%)]">
                    {category.name}
                </span>
                <span className="ml-auto text-xs text-[hsl(220_7%_45%)] bg-[hsl(225_8%_18%)] px-2 py-0.5 rounded-full">
                    {category.agents.length}
                </span>
            </button>

            {isExpanded && (
                <div className="pl-3 pr-1 pb-2 space-y-2 mt-2">
                    {category.agents.map((agent) => (
                        <AgentTemplateCard
                            key={agent.type}
                            agent={agent}
                            onDragStart={onDragStart}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function Sidebar() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
        new Set(['Research Agents', 'Content Agents'])
    );

    const onDragStart = (event: DragEvent, nodeType: string, label: string) => {
        event.dataTransfer.setData('application/reactflow', 'agent');
        event.dataTransfer.setData('application/agenttype', nodeType);
        event.dataTransfer.setData('application/label', label);
        event.dataTransfer.effectAllowed = 'move';
    };

    const toggleCategory = (categoryName: string) => {
        if (isCollapsed) {
            setIsCollapsed(false);
            setExpandedCategories(new Set([categoryName]));
            return;
        }
        setExpandedCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(categoryName)) {
                newSet.delete(categoryName);
            } else {
                newSet.add(categoryName);
            }
            return newSet;
        });
    };

    // Filter categories and agents based on search
    const filteredCategories = AGENT_CATEGORIES.map(category => ({
        ...category,
        agents: category.agents.filter(agent =>
            agent.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            agent.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })).filter(category => category.agents.length > 0);

    return (
        <div
            className={cn(
                "border-r border-[hsl(225_8%_18%)] bg-[hsl(225_12%_8%)] flex flex-col h-full transition-all duration-300 ease-in-out",
                isCollapsed ? "w-16" : "w-72"
            )}
        >
            {/* Header */}
            <div className={cn(
                "flex items-center border-b border-[hsl(225_8%_18%)]",
                isCollapsed ? "justify-center p-4" : "justify-between p-4"
            )}>
                {!isCollapsed && (
                    <h3 className="text-sm font-semibold text-[hsl(220_13%_91%)] truncate">
                        Agent Toolbox
                    </h3>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-[hsl(220_7%_45%)] hover:text-[hsl(220_13%_91%)]"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                >
                    {isCollapsed ? (
                        <ChevronRight className="w-4 h-4" />
                    ) : (
                        <ChevronRight className="w-4 h-4 rotate-180 transition-transform" />
                    )}
                </Button>
            </div>

            {/* Search (Hidden when collapsed) */}
            {!isCollapsed && (
                <div className="p-4 pt-2 border-b border-[hsl(225_8%_18%)]">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(220_7%_45%)]" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search agents..."
                            className={cn(
                                'pl-9 h-9 text-sm',
                                'bg-[hsl(225_10%_11%)] border-[hsl(225_8%_18%)]',
                                'text-[hsl(220_13%_91%)] placeholder:text-[hsl(220_7%_45%)]',
                                'focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/25'
                            )}
                        />
                    </div>
                </div>
            )}

            {/* Agent Categories */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-2">
                {filteredCategories.map((category) => (
                    <div key={category.name} className="mb-2">
                        {isCollapsed ? (
                            // Collapsed View - Only Category Icons
                            <div className="flex justify-center mb-2">
                                <div
                                    className="p-2 rounded-md hover:bg-[hsl(225_9%_15%)] cursor-pointer relative group"
                                    onClick={() => setIsCollapsed(false)}
                                >
                                    <category.icon className={cn('w-5 h-5', category.color)} />
                                    {/* Tooltip on hover */}
                                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 rounded bg-[hsl(225_12%_5%)] border border-[hsl(225_8%_18%)] text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50">
                                        {category.name}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <CategorySection
                                category={category}
                                isExpanded={expandedCategories.has(category.name) || searchQuery.length > 0}
                                onToggle={() => toggleCategory(category.name)}
                                onDragStart={onDragStart}
                            />
                        )}
                    </div>
                ))}
            </div>

            {/* Footer Hint */}
            {!isCollapsed && (
                <div className="p-4 border-t border-[hsl(225_8%_18%)]">
                    <p className="text-xs text-[hsl(220_7%_45%)] text-center">
                        Drag agents onto the canvas
                    </p>
                </div>
            )}
        </div>
    );
}
