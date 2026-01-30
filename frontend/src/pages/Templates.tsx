
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Search,
    Star,
    ArrowRight,
    Globe,
    FileText,
    Code,
    BarChart3,
    Bot,
    Filter,
    BookOpen,
    Sparkles,
    Loader2,
    AlertCircle,
    PenTool,
    HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

interface TemplateDisplay {
    id: string;
    name: string;
    description: string;
    category: string;
    nodes: any[];
    edges: any[];
    icon: React.ComponentType<{ className?: string }>;
    iconColor: string;
    agentCount: number;
    tags: string[];
}

const CATEGORIES = [
    { id: "all", name: "All Templates", icon: Sparkles },
    { id: "research", name: "Research", icon: BookOpen },
    { id: "content", name: "Content", icon: FileText },
    { id: "analysis", name: "Analysis", icon: BarChart3 },
    { id: "support", name: "Support", icon: HelpCircle },
    { id: "development", name: "Development", icon: Code },
];

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
    'research': Globe,
    'content': PenTool,
    'analysis': BarChart3,
    'support': HelpCircle,
    'development': Code,
    'default': Bot,
};

const COLOR_MAP: Record<string, string> = {
    'research': 'bg-blue-600',
    'content': 'bg-purple-600',
    'analysis': 'bg-emerald-600',
    'support': 'bg-amber-600',
    'development': 'bg-orange-600',
    'default': 'bg-indigo-600',
};

function TemplateCard({
    template,
    onUse,
    loading
}: {
    template: TemplateDisplay;
    onUse: () => void;
    loading?: boolean;
}) {
    const Icon = template.icon;

    return (
        <Card className={cn(
            "group relative bg-zinc-900/50 border-zinc-800/50",
            "hover:border-indigo-500/40 transition-all duration-300",
            "hover:shadow-lg hover:shadow-indigo-500/10"
        )}>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg text-white", template.iconColor)}>
                            <Icon className="w-4 h-4" />
                        </div>
                        <div>
                            <CardTitle className="text-sm font-semibold text-zinc-100 group-hover:text-indigo-400 transition-colors">
                                {template.name}
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-zinc-500">
                                    {template.agentCount} agent{template.agentCount !== 1 ? 's' : ''}
                                </span>
                                <span className="text-zinc-700">•</span>
                                <div className="flex items-center gap-1">
                                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                    <span className="text-xs text-zinc-500">New</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <span className="text-2xl">{template.icon ? '' : template.category}</span>
                </div>
            </CardHeader>

            <CardContent>
                <p className="text-xs text-zinc-400 line-clamp-2 mb-3 min-h-[32px]">
                    {template.description}
                </p>

                <div className="flex flex-wrap gap-1.5 mb-3">
                    {template.tags.slice(0, 3).map((tag) => (
                        <Badge
                            key={tag}
                            variant="secondary"
                            className="text-[10px] bg-zinc-800 text-zinc-400 border-none hover:bg-zinc-700"
                        >
                            {tag}
                        </Badge>
                    ))}
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-600 capitalize">
                        {template.category}
                    </span>

                    <Button
                        size="sm"
                        onClick={onUse}
                        disabled={loading}
                        className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                        {loading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <>
                                Use Template
                                <ArrowRight className="w-3 h-3 ml-1" />
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

function CategoryButton({
    category,
    isActive,
    onClick
}: {
    category: typeof CATEGORIES[0];
    isActive: boolean;
    onClick: () => void
}) {
    const Icon = category.icon;

    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                isActive
                    ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30"
                    : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300 border border-transparent"
            )}
        >
            <Icon className="w-3.5 h-3.5" />
            {category.name}
        </button>
    );
}

export default function Templates() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState("all");
    const [templates, setTemplates] = useState<TemplateDisplay[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [creatingFromTemplate, setCreatingFromTemplate] = useState<string | null>(null);

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await api.getTemplates();

            // Transform API templates to display format
            const displayTemplates: TemplateDisplay[] = data.map((t) => ({
                ...t,
                icon: ICON_MAP[t.category] || ICON_MAP['default'],
                iconColor: COLOR_MAP[t.category] || COLOR_MAP['default'],
                agentCount: t.nodes?.length || 0,
                tags: [t.category, `${t.nodes?.length || 0} agents`],
            }));

            setTemplates(displayTemplates);
        } catch (err) {
            console.error("Failed to load templates:", err);
            setError("Failed to load templates. Make sure the backend is running.");
        } finally {
            setLoading(false);
        }
    };

    const filteredTemplates = templates.filter((template) => {
        const matchesSearch =
            template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesCategory = activeCategory === "all" || template.category === activeCategory;

        return matchesSearch && matchesCategory;
    });

    const handleUseTemplate = async (template: TemplateDisplay) => {
        try {
            setCreatingFromTemplate(template.id);

            // Create a new workflow with the template name
            const workflow = await api.createWorkflow(
                template.name,
                template.description
            );

            // Save the template definition to the new workflow
            await api.saveWorkflow(workflow.id, {
                definition: {
                    nodes: template.nodes,
                    edges: template.edges,
                }
            });

            // Navigate to the editor
            navigate(`/dashboard/editor/${workflow.id}`);
        } catch (err) {
            console.error("Failed to create workflow from template:", err);
            setError("Failed to create workflow from template.");
        } finally {
            setCreatingFromTemplate(null);
        }
    };

    return (
        <div className="space-y-5">
            {/* Page Header */}
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="text-xl font-semibold text-zinc-100">
                        Template Marketplace
                    </h1>
                    <p className="text-zinc-500 text-sm mt-0.5">
                        Explore pre-built AI workflows and start building in seconds
                    </p>
                </div>

                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search templates..."
                            className={cn(
                                "h-9 pl-9",
                                "bg-zinc-900 border-zinc-800",
                                "text-zinc-200 placeholder:text-zinc-600",
                                "focus:border-indigo-500/50"
                            )}
                        />
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={loadTemplates}
                        disabled={loading}
                        className="h-9 bg-transparent border-zinc-800 text-zinc-300 hover:bg-zinc-900"
                    >
                        {loading ? (
                            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        ) : (
                            <Filter className="w-3.5 h-3.5 mr-1.5" />
                        )}
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Error State */}
            {error && (
                <Card className="bg-red-500/10 border-red-500/30">
                    <CardContent className="p-3 flex items-center gap-3">
                        <AlertCircle className="w-4 h-4 text-red-400" />
                        <p className="text-sm text-red-400">{error}</p>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={loadTemplates}
                            className="ml-auto text-red-400 hover:text-red-300 h-7"
                        >
                            Retry
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Categories */}
            <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((category) => (
                    <CategoryButton
                        key={category.id}
                        category={category}
                        isActive={activeCategory === category.id}
                        onClick={() => setActiveCategory(category.id)}
                    />
                ))}
            </div>

            {/* Loading State */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <Loader2 className="w-6 h-6 mx-auto mb-3 animate-spin text-indigo-400" />
                        <p className="text-sm text-zinc-500">Loading templates...</p>
                    </div>
                </div>
            ) : (
                <>
                    {/* Templates Grid */}
                    <div>
                        <h2 className="text-sm font-medium text-zinc-300 mb-3">
                            {activeCategory === "all" ? "All Templates" : CATEGORIES.find(c => c.id === activeCategory)?.name}
                            <span className="text-xs font-normal text-zinc-600 ml-2">
                                ({filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''})
                            </span>
                        </h2>

                        {filteredTemplates.length === 0 ? (
                            <Card className="bg-zinc-900/50 border-zinc-800/50 border-dashed">
                                <CardContent className="flex flex-col items-center justify-center py-10">
                                    <div className="p-3 rounded-full bg-zinc-800 mb-3">
                                        <Bot className="w-6 h-6 text-zinc-500" />
                                    </div>
                                    <h3 className="text-sm font-semibold text-zinc-300 mb-1">
                                        No templates found
                                    </h3>
                                    <p className="text-xs text-zinc-500">
                                        Try adjusting your search or exploring other categories
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {filteredTemplates.map((template) => (
                                    <TemplateCard
                                        key={template.id}
                                        template={template}
                                        onUse={() => handleUseTemplate(template)}
                                        loading={creatingFromTemplate === template.id}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Submit Template CTA */}
            <Card className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
                <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-3 py-4">
                    <div className="text-center sm:text-left">
                        <h3 className="text-sm font-semibold text-zinc-200">
                            Have a great workflow?
                        </h3>
                        <p className="text-xs text-zinc-500">
                            Share your templates with the community and help others automate their work.
                        </p>
                    </div>
                    <Button size="sm" className="h-8 bg-indigo-600 hover:bg-indigo-700 text-white shrink-0">
                        Submit Template
                        <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
