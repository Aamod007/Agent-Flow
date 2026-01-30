import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    Plus,
    ArrowRight,
    Loader2,
    Activity,
    CheckCircle2,
    XCircle,
    Clock,
    Workflow,
    Play,
    MoreVertical,
    Trash2,
    Copy,
    Pencil,
    TrendingUp,
} from "lucide-react";
import { api, type Analytics } from "@/lib/api";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface WorkflowType {
    id: string;
    name: string;
    description: string;
    updatedAt: string;
    status: string;
}

function MetricCard({ 
    title, 
    value, 
    icon: Icon, 
    trend,
    iconBg 
}: { 
    title: string;
    value: number | string;
    icon: React.ComponentType<{ className?: string }>;
    trend?: string;
    iconBg: string;
}) {
    return (
        <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800/50 hover:border-zinc-700/50 transition-colors">
            <div className="flex items-center justify-between mb-4">
                <div className={cn("p-2.5 rounded-lg", iconBg)}>
                    <Icon className="w-5 h-5" />
                </div>
                {trend && (
                    <span className="flex items-center gap-1.5 text-sm text-emerald-400">
                        <TrendingUp className="w-4 h-4" />
                        {trend}
                    </span>
                )}
            </div>
            <p className="text-3xl font-semibold text-zinc-100">{value}</p>
            <p className="text-sm text-zinc-500 mt-1.5">{title}</p>
        </div>
    );
}

function WorkflowRow({ 
    workflow, 
    onDelete, 
    onRun, 
    isRunning 
}: { 
    workflow: WorkflowType; 
    onDelete: () => void; 
    onRun: () => void; 
    isRunning?: boolean;
}) {
    const getStatusBadge = (status: string) => {
        switch (status.toLowerCase()) {
            case 'active':
            case 'running':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Running
                    </span>
                );
            case 'completed':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        Completed
                    </span>
                );
            case 'failed':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                        <XCircle className="w-3 h-3" />
                        Failed
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
                        <Clock className="w-3 h-3" />
                        Draft
                    </span>
                );
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900/30 border border-zinc-800/50 hover:border-zinc-700/50 transition-all group">
            <div className="p-2.5 rounded-lg bg-indigo-500/10">
                <Workflow className="w-5 h-5 text-indigo-400" />
            </div>
            
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5">
                    <h3 className="text-sm font-medium text-zinc-200 truncate">{workflow.name}</h3>
                    {getStatusBadge(workflow.status)}
                </div>
                <p className="text-sm text-zinc-500 truncate mt-1">
                    {workflow.description || "No description"} • Updated {formatDate(workflow.updatedAt)}
                </p>
            </div>

            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRun}
                    disabled={isRunning}
                    className="h-8 px-3 text-sm text-emerald-400 hover:text-emerald-400 hover:bg-emerald-500/10"
                >
                    {isRunning ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Play className="w-4 h-4" />
                    )}
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3 text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                    asChild
                >
                    <Link to={`/dashboard/editor/${workflow.id}`}>
                        Edit
                    </Link>
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800">
                            <MoreVertical className="w-4 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 min-w-[140px]">
                        <DropdownMenuItem className="text-sm text-zinc-300 focus:bg-zinc-800 focus:text-zinc-100">
                            <Pencil className="w-4 h-4 mr-2" />
                            Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-sm text-zinc-300 focus:bg-zinc-800 focus:text-zinc-100">
                            <Copy className="w-4 h-4 mr-2" />
                            Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-zinc-800" />
                        <DropdownMenuItem onClick={onDelete} className="text-sm text-red-400 focus:bg-red-500/10 focus:text-red-400">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}

function WorkflowSkeleton() {
    return (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900/30 border border-zinc-800/50 animate-pulse">
            <div className="p-2.5 rounded-lg bg-zinc-800">
                <div className="w-5 h-5" />
            </div>
            <div className="flex-1">
                <div className="h-4 w-36 bg-zinc-800 rounded mb-2" />
                <div className="h-3.5 w-52 bg-zinc-800/50 rounded" />
            </div>
        </div>
    );
}

export default function DashboardHome() {
    const navigate = useNavigate();
    const [workflows, setWorkflows] = useState<WorkflowType[]>([]);
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newName, setNewName] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [creating, setCreating] = useState(false);
    const [runningWorkflowId, setRunningWorkflowId] = useState<string | null>(null);

    useEffect(() => {
        loadWorkflows();
    }, []);

    const loadWorkflows = async () => {
        try {
            const [workflowData, analyticsData] = await Promise.all([
                api.getWorkflows(),
                api.getAnalytics().catch(() => null)
            ]);
            setWorkflows(workflowData);
            setAnalytics(analyticsData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newName) return;
        setCreating(true);
        try {
            const newWorkflow = await api.createWorkflow(newName, newDesc);
            setNewName("");
            setNewDesc("");
            setIsCreateOpen(false);
            navigate(`/dashboard/editor/${newWorkflow.id}`);
        } catch (err) {
            console.error(err);
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this workflow?')) return;
        try {
            await api.deleteWorkflow(id);
            setWorkflows(workflows.filter(w => w.id !== id));
        } catch (err) {
            console.error('Failed to delete workflow:', err);
        }
    };

    const handleRun = async (id: string) => {
        try {
            setRunningWorkflowId(id);
            await api.executeWorkflow(id);
            loadWorkflows();
        } catch (err: any) {
            console.error('Failed to execute workflow:', err);
            alert(err.message || 'Failed to execute workflow');
        } finally {
            setRunningWorkflowId(null);
        }
    };

    const completedCount = analytics?.successfulExecutions ?? workflows.filter(w => w.status === 'completed').length;
    const failedCount = analytics?.failedExecutions ?? workflows.filter(w => w.status === 'failed').length;
    const totalExecutions = analytics?.totalExecutions ?? 0;

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-zinc-100">Dashboard</h1>
                    <p className="text-sm text-zinc-500 mt-1">Manage your AI agent workflows</p>
                </div>

                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="h-11 px-6 text-base bg-indigo-600 hover:bg-indigo-700">
                            <Plus className="mr-2 h-5 w-5" />
                            New Workflow
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="text-xl text-zinc-100">Create Workflow</DialogTitle>
                            <DialogDescription className="text-base text-zinc-500">
                                Start a new automation workflow.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-6 py-6">
                            <div className="grid gap-3">
                                <Label htmlFor="name" className="text-base text-zinc-400">Name</Label>
                                <Input
                                    id="name"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="e.g., Customer Support"
                                    className="h-12 text-base bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-600"
                                />
                            </div>
                            <div className="grid gap-3">
                                <Label htmlFor="desc" className="text-base text-zinc-400">Description</Label>
                                <Input
                                    id="desc"
                                    value={newDesc}
                                    onChange={(e) => setNewDesc(e.target.value)}
                                    placeholder="Brief description"
                                    className="h-12 text-base bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-600"
                                />
                            </div>
                        </div>
                        <DialogFooter className="gap-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsCreateOpen(false)}
                                className="h-11 px-6 text-base text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                            >
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleCreate}
                                disabled={creating || !newName}
                                className="h-11 px-6 text-base bg-indigo-600 hover:bg-indigo-700"
                            >
                                {creating && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                                Create
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <MetricCard
                    title="Total Workflows"
                    value={workflows.length}
                    icon={Workflow}
                    iconBg="bg-indigo-500/10 text-indigo-400"
                />
                <MetricCard
                    title="Executions"
                    value={totalExecutions}
                    icon={Activity}
                    trend="+12%"
                    iconBg="bg-purple-500/10 text-purple-400"
                />
                <MetricCard
                    title="Completed"
                    value={completedCount}
                    icon={CheckCircle2}
                    iconBg="bg-emerald-500/10 text-emerald-400"
                />
                <MetricCard
                    title="Failed"
                    value={failedCount}
                    icon={XCircle}
                    iconBg="bg-red-500/10 text-red-400"
                />
            </div>

            {/* Workflows List */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-medium text-zinc-400">Recent Workflows</h2>
                    <Link to="/dashboard/workflows" className="text-base text-indigo-400 hover:text-indigo-300">
                        View all <ArrowRight className="inline w-5 h-5" />
                    </Link>
                </div>

                <div className="space-y-5">
                    {loading ? (
                        <>
                            <WorkflowSkeleton />
                            <WorkflowSkeleton />
                            <WorkflowSkeleton />
                        </>
                    ) : workflows.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/20">
                            <div className="p-6 rounded-full bg-zinc-800/50 mb-6">
                                <Workflow className="w-10 h-10 text-zinc-600" />
                            </div>
                            <p className="text-lg text-zinc-400 mb-2">No workflows yet</p>
                            <p className="text-base text-zinc-600 mb-6">Create your first workflow to get started</p>
                            <Button
                                size="sm"
                                onClick={() => setIsCreateOpen(true)}
                                className="h-11 px-6 text-base bg-indigo-600 hover:bg-indigo-700"
                            >
                                <Plus className="w-5 h-5 mr-2" />
                                Create Workflow
                            </Button>
                        </div>
                    ) : (
                        workflows.slice(0, 5).map((workflow) => (
                            <WorkflowRow
                                key={workflow.id}
                                workflow={workflow}
                                onDelete={() => handleDelete(workflow.id)}
                                onRun={() => handleRun(workflow.id)}
                                isRunning={runningWorkflowId === workflow.id}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
