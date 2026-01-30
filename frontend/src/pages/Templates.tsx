
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Search,
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
    Heart,
    Download,
    User,
    Plus,
    Trash2,
    Upload,
    Users,
    TrendingUp,
    Award,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api, type Template, type Workflow } from "@/lib/api";
import { toast } from "sonner";

interface TemplateDisplay extends Template {
    iconComponent: React.ComponentType<{ className?: string }>;
    iconColor: string;
    agentCount: number;
}

const CATEGORIES = [
    { id: "all", name: "All Templates", icon: Sparkles },
    { id: "research", name: "Research", icon: BookOpen },
    { id: "content", name: "Content", icon: FileText },
    { id: "analysis", name: "Analysis", icon: BarChart3 },
    { id: "support", name: "Support", icon: HelpCircle },
    { id: "development", name: "Development", icon: Code },
];

const TABS = [
    { id: "featured", name: "Featured", icon: Award },
    { id: "community", name: "Community", icon: Users },
    { id: "my-templates", name: "My Templates", icon: User },
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
    onLike,
    onDelete,
    loading,
    isOwner,
    showStats = true,
}: {
    template: TemplateDisplay;
    onUse: () => void;
    onLike?: () => void;
    onDelete?: () => void;
    loading?: boolean;
    isOwner?: boolean;
    showStats?: boolean;
}) {
    const Icon = template.iconComponent;

    return (
        <Card className={cn(
            "group relative bg-zinc-900/50 border-zinc-800/50",
            "hover:border-indigo-500/40 transition-all duration-300",
            "hover:shadow-lg hover:shadow-indigo-500/10"
        )}>
            {template.isFeatured && (
                <div className="absolute -top-2 -right-2 z-10">
                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg">
                        <Award className="w-3 h-3 mr-1" />
                        Featured
                    </Badge>
                </div>
            )}
            
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
                                {template.authorName && (
                                    <>
                                        <span className="text-zinc-700">•</span>
                                        <span className="text-xs text-zinc-500">
                                            by {template.authorName}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                <p className="text-xs text-zinc-400 line-clamp-2 mb-3 min-h-[32px]">
                    {template.description}
                </p>

                <div className="flex flex-wrap gap-1.5 mb-3">
                    {template.tags?.slice(0, 3).map((tag) => (
                        <Badge
                            key={tag}
                            variant="secondary"
                            className="text-[10px] bg-zinc-800 text-zinc-400 border-none hover:bg-zinc-700"
                        >
                            {tag}
                        </Badge>
                    ))}
                </div>

                {showStats && (template.likes !== undefined || template.downloads !== undefined) && (
                    <div className="flex items-center gap-4 mb-3 text-xs text-zinc-500">
                        {template.likes !== undefined && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onLike?.(); }}
                                className="flex items-center gap-1 hover:text-pink-400 transition-colors"
                            >
                                <Heart className="w-3.5 h-3.5" />
                                {template.likes}
                            </button>
                        )}
                        {template.downloads !== undefined && (
                            <div className="flex items-center gap-1">
                                <Download className="w-3.5 h-3.5" />
                                {template.downloads}
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-600 capitalize">
                        {template.category}
                    </span>

                    <div className="flex items-center gap-2">
                        {isOwner && onDelete && (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                                className="h-7 w-7 p-0 text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                        )}
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

function SubmitTemplateDialog({
    open,
    onOpenChange,
    workflows,
    onSubmit,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    workflows: Workflow[];
    onSubmit: (data: {
        workflowId: string;
        name: string;
        description: string;
        category: string;
        tags: string[];
    }) => void;
}) {
    const [selectedWorkflow, setSelectedWorkflow] = useState<string>("");
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [tags, setTags] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (selectedWorkflow) {
            const workflow = workflows.find(w => w.id === selectedWorkflow);
            if (workflow) {
                setName(workflow.name);
                setDescription(workflow.description || "");
            }
        }
    }, [selectedWorkflow, workflows]);

    const handleSubmit = async () => {
        if (!selectedWorkflow || !name || !description || !category) {
            toast.error("Please fill in all required fields");
            return;
        }
        
        setSubmitting(true);
        try {
            await onSubmit({
                workflowId: selectedWorkflow,
                name,
                description,
                category,
                tags: tags.split(",").map(t => t.trim()).filter(Boolean),
            });
            onOpenChange(false);
            // Reset form
            setSelectedWorkflow("");
            setName("");
            setDescription("");
            setCategory("");
            setTags("");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-zinc-100 flex items-center gap-2">
                        <Upload className="w-5 h-5 text-indigo-400" />
                        Share Your Template
                    </DialogTitle>
                    <DialogDescription className="text-zinc-500">
                        Share your workflow with the community. Others can use it as a starting point.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label className="text-zinc-300">Select Workflow *</Label>
                        <Select value={selectedWorkflow} onValueChange={setSelectedWorkflow}>
                            <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-200">
                                <SelectValue placeholder="Choose a workflow to share" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-800 border-zinc-700">
                                {workflows.map(w => (
                                    <SelectItem key={w.id} value={w.id} className="text-zinc-200">
                                        {w.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-zinc-300">Template Name *</Label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Give your template a catchy name"
                            className="bg-zinc-800 border-zinc-700 text-zinc-200"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-zinc-300">Description *</Label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe what your template does and who it's for"
                            className="bg-zinc-800 border-zinc-700 text-zinc-200 min-h-[80px]"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-zinc-300">Category *</Label>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-200">
                                <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-800 border-zinc-700">
                                {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                                    <SelectItem key={c.id} value={c.id} className="text-zinc-200">
                                        {c.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-zinc-300">Tags (comma-separated)</Label>
                        <Input
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            placeholder="e.g., automation, ai, productivity"
                            className="bg-zinc-800 border-zinc-700 text-zinc-200"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={submitting || !selectedWorkflow || !name || !description || !category}
                        className="bg-indigo-600 hover:bg-indigo-700"
                    >
                        {submitting ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                            <Upload className="w-4 h-4 mr-2" />
                        )}
                        Share Template
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function Templates() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState("all");
    const [activeTab, setActiveTab] = useState("featured");
    const [templates, setTemplates] = useState<TemplateDisplay[]>([]);
    const [myTemplates, setMyTemplates] = useState<TemplateDisplay[]>([]);
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [creatingFromTemplate, setCreatingFromTemplate] = useState<string | null>(null);
    const [showSubmitDialog, setShowSubmitDialog] = useState(false);
    
    // Mock user ID - in production, this would come from auth context
    const currentUserId = "default-user";
    const currentUserName = "User";

    useEffect(() => {
        loadTemplates();
        loadWorkflows();
    }, []);

    useEffect(() => {
        if (activeTab === "my-templates") {
            loadMyTemplates();
        }
    }, [activeTab]);

    const loadWorkflows = async () => {
        try {
            const data = await api.getWorkflows();
            setWorkflows(data);
        } catch (err) {
            console.error("Failed to load workflows:", err);
        }
    };

    const loadTemplates = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await api.getTemplates();

            const displayTemplates: TemplateDisplay[] = data.map((t) => ({
                ...t,
                iconComponent: ICON_MAP[t.category] || ICON_MAP['default'],
                iconColor: COLOR_MAP[t.category] || COLOR_MAP['default'],
                agentCount: t.nodes?.length || 0,
            }));

            setTemplates(displayTemplates);
        } catch (err) {
            console.error("Failed to load templates:", err);
            setError("Failed to load templates. Make sure the backend is running.");
        } finally {
            setLoading(false);
        }
    };

    const loadMyTemplates = async () => {
        try {
            const data = await api.getMyTemplates(currentUserId);
            const displayTemplates: TemplateDisplay[] = data.map((t) => ({
                ...t,
                iconComponent: ICON_MAP[t.category] || ICON_MAP['default'],
                iconColor: COLOR_MAP[t.category] || COLOR_MAP['default'],
                agentCount: t.nodes?.length || 0,
            }));
            setMyTemplates(displayTemplates);
        } catch (err) {
            console.error("Failed to load my templates:", err);
        }
    };

    const filteredTemplates = (activeTab === "my-templates" ? myTemplates : templates).filter((template) => {
        const matchesSearch =
            template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            template.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesCategory = activeCategory === "all" || template.category === activeCategory;
        
        // For featured tab, only show featured templates
        const matchesTab = activeTab !== "featured" || template.isFeatured;

        return matchesSearch && matchesCategory && matchesTab;
    });

    const handleUseTemplate = async (template: TemplateDisplay) => {
        try {
            setCreatingFromTemplate(template.id);

            // Track download
            try {
                await api.downloadTemplate(template.id);
            } catch (e) {
                // Ignore download tracking errors for system templates
            }

            // Create a new workflow with the template
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

            toast.success("Workflow created from template!");
            navigate(`/dashboard/editor/${workflow.id}`);
        } catch (err) {
            console.error("Failed to create workflow from template:", err);
            toast.error("Failed to create workflow from template.");
        } finally {
            setCreatingFromTemplate(null);
        }
    };

    const handleLikeTemplate = async (templateId: string) => {
        try {
            await api.likeTemplate(templateId, currentUserId);
            loadTemplates(); // Refresh to get updated like count
        } catch (err) {
            console.error("Failed to like template:", err);
        }
    };

    const handleDeleteTemplate = async (templateId: string) => {
        if (!confirm("Are you sure you want to delete this template?")) return;
        
        try {
            await api.deleteTemplate(templateId, currentUserId);
            toast.success("Template deleted");
            loadMyTemplates();
        } catch (err) {
            console.error("Failed to delete template:", err);
            toast.error("Failed to delete template");
        }
    };

    const handleSubmitTemplate = async (data: {
        workflowId: string;
        name: string;
        description: string;
        category: string;
        tags: string[];
    }) => {
        try {
            const workflow = workflows.find(w => w.id === data.workflowId);
            if (!workflow) throw new Error("Workflow not found");

            const definition = typeof workflow.definition === 'string' 
                ? JSON.parse(workflow.definition) 
                : workflow.definition;

            await api.createTemplate({
                name: data.name,
                description: data.description,
                category: data.category,
                icon: '🤖',
                nodes: definition?.nodes || [],
                edges: definition?.edges || [],
                authorId: currentUserId,
                authorName: currentUserName,
                tags: data.tags,
                isPublic: true,
            });

            toast.success("Template shared successfully!");
            loadTemplates();
            loadMyTemplates();
        } catch (err) {
            console.error("Failed to share template:", err);
            toast.error("Failed to share template");
            throw err;
        }
    };

    return (
        <div className="space-y-5">
            {/* Page Header */}
            <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-zinc-100">
                            Template Marketplace
                        </h1>
                        <p className="text-zinc-500 text-sm mt-0.5">
                            Explore and share AI workflow templates with the community
                        </p>
                    </div>
                    <Button
                        onClick={() => setShowSubmitDialog(true)}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Share Template
                    </Button>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 p-1 rounded-lg bg-zinc-900/50 border border-zinc-800/50 w-fit">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                                    activeTab === tab.id
                                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                                )}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.name}
                            </button>
                        );
                    })}
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

            {/* Stats Banner for Community Tab */}
            {activeTab === "community" && (
                <div className="grid grid-cols-3 gap-4">
                    <Card className="bg-zinc-900/50 border-zinc-800/50">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-indigo-500/10">
                                <Users className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-zinc-100">{templates.length}</p>
                                <p className="text-xs text-zinc-500">Total Templates</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-zinc-900/50 border-zinc-800/50">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-pink-500/10">
                                <Heart className="w-5 h-5 text-pink-400" />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-zinc-100">
                                    {templates.reduce((sum, t) => sum + (t.likes || 0), 0)}
                                </p>
                                <p className="text-xs text-zinc-500">Total Likes</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-zinc-900/50 border-zinc-800/50">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-500/10">
                                <TrendingUp className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-zinc-100">
                                    {templates.reduce((sum, t) => sum + (t.downloads || 0), 0)}
                                </p>
                                <p className="text-xs text-zinc-500">Total Downloads</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

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
                            {activeTab === "my-templates" 
                                ? "Your Templates" 
                                : activeTab === "featured"
                                    ? "Featured Templates"
                                    : activeCategory === "all" 
                                        ? "All Templates" 
                                        : CATEGORIES.find(c => c.id === activeCategory)?.name}
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
                                        {activeTab === "my-templates" 
                                            ? "No templates shared yet"
                                            : "No templates found"}
                                    </h3>
                                    <p className="text-xs text-zinc-500 text-center max-w-xs">
                                        {activeTab === "my-templates"
                                            ? "Share your first workflow template with the community!"
                                            : "Try adjusting your search or exploring other categories"}
                                    </p>
                                    {activeTab === "my-templates" && (
                                        <Button
                                            size="sm"
                                            onClick={() => setShowSubmitDialog(true)}
                                            className="mt-4 bg-indigo-600 hover:bg-indigo-700"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Share Template
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {filteredTemplates.map((template) => (
                                    <TemplateCard
                                        key={template.id}
                                        template={template}
                                        onUse={() => handleUseTemplate(template)}
                                        onLike={() => handleLikeTemplate(template.id)}
                                        onDelete={activeTab === "my-templates" ? () => handleDeleteTemplate(template.id) : undefined}
                                        loading={creatingFromTemplate === template.id}
                                        isOwner={template.authorId === currentUserId}
                                        showStats={activeTab !== "my-templates"}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Submit Template CTA (only show on community/featured tabs) */}
            {activeTab !== "my-templates" && (
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
                        <Button 
                            size="sm" 
                            onClick={() => setShowSubmitDialog(true)}
                            className="h-8 bg-indigo-600 hover:bg-indigo-700 text-white shrink-0"
                        >
                            Submit Template
                            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Submit Template Dialog */}
            <SubmitTemplateDialog
                open={showSubmitDialog}
                onOpenChange={setShowSubmitDialog}
                workflows={workflows}
                onSubmit={handleSubmitTemplate}
            />
        </div>
    );
}
