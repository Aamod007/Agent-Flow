import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Plus,
    Search,
    MoreVertical,
    Pencil,
    Copy,
    Trash2,
    Play,
    Workflow,
    Loader2,
    CheckCircle2,
    XCircle,
    Clock,
    Activity,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface WorkflowItem {
    id: string;
    name: string;
    description: string;
    status: string;
    updatedAt: string;
}

function StatusBadge({ status }: { status: string }) {
    const config: Record<string, { icon: typeof Activity; label: string; className: string }> = {
        running: {
            icon: Activity,
            label: "Running",
            className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
        },
        active: {
            icon: Activity,
            label: "Active",
            className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
        },
        completed: {
            icon: CheckCircle2,
            label: "Completed",
            className: "bg-blue-500/10 text-blue-400 border-blue-500/20"
        },
        failed: {
            icon: XCircle,
            label: "Failed",
            className: "bg-red-500/10 text-red-400 border-red-500/20"
        },
        draft: {
            icon: Clock,
            label: "Draft",
            className: "bg-zinc-800 text-zinc-400 border-zinc-700"
        }
    };

    const { icon: Icon, label, className } = config[status.toLowerCase()] || config.draft;

    return (
        <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border", className)}>
            <Icon className="w-3 h-3" />
            {label}
        </span>
    );
}

export default function WorkflowsList() {
    const navigate = useNavigate();
    const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newName, setNewName] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [creating, setCreating] = useState(false);
    const [runningId, setRunningId] = useState<string | null>(null);

    useEffect(() => {
        loadWorkflows();
    }, []);

    const loadWorkflows = async () => {
        try {
            const data = await api.getWorkflows();
            setWorkflows(data);
        } catch (err) {
            console.error("Failed to load workflows:", err);
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
        if (!confirm("Delete this workflow?")) return;
        try {
            await api.deleteWorkflow(id);
            setWorkflows(workflows.filter(w => w.id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    const handleRun = async (id: string) => {
        try {
            setRunningId(id);
            await api.executeWorkflow(id);
            loadWorkflows();
        } catch (err: any) {
            alert(err.message || "Failed to run workflow");
        } finally {
            setRunningId(null);
        }
    };

    const filteredWorkflows = workflows.filter(w =>
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-zinc-100">Workflows</h1>
                    <p className="text-xs text-zinc-500 mt-0.5">{workflows.length} workflows</p>
                </div>

                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700">
                            <Plus className="mr-1.5 h-4 w-4" />
                            New Workflow
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-lg text-zinc-100">Create Workflow</DialogTitle>
                            <DialogDescription className="text-base text-zinc-500">
                                Start a new automation workflow.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-5 py-5">
                            <div className="grid gap-2">
                                <Label htmlFor="name" className="text-base text-zinc-400">Name</Label>
                                <Input
                                    id="name"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="e.g., Customer Support"
                                    className="h-11 text-base bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-600"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="desc" className="text-base text-zinc-400">Description</Label>
                                <Input
                                    id="desc"
                                    value={newDesc}
                                    onChange={(e) => setNewDesc(e.target.value)}
                                    placeholder="Brief description"
                                    className="h-11 text-base bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-600"
                                />
                            </div>
                        </div>
                        <DialogFooter className="gap-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsCreateOpen(false)}
                                className="h-10 text-base text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                            >
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleCreate}
                                disabled={creating || !newName}
                                className="h-10 text-base bg-indigo-600 hover:bg-indigo-700"
                            >
                                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <Input
                    placeholder="Search workflows..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-9 pl-9 text-sm bg-zinc-900 border-zinc-800 text-zinc-300 placeholder:text-zinc-600"
                />
            </div>

            {/* Table */}
            {loading ? (
                <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-14 rounded-lg bg-zinc-900/50 animate-pulse" />
                    ))}
                </div>
            ) : filteredWorkflows.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 rounded-lg border border-dashed border-zinc-800">
                    <Workflow className="w-10 h-10 text-zinc-700 mb-3" />
                    <p className="text-sm text-zinc-400 mb-1">
                        {searchQuery ? "No workflows found" : "No workflows yet"}
                    </p>
                    {!searchQuery && (
                        <Button
                            size="sm"
                            onClick={() => setIsCreateOpen(true)}
                            className="mt-3 h-8 px-4 text-sm bg-indigo-600 hover:bg-indigo-700"
                        >
                            <Plus className="w-4 h-4 mr-1.5" />
                            Create Workflow
                        </Button>
                    )}
                </div>
            ) : (
                <div className="rounded-lg border border-zinc-800 overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-zinc-800 bg-zinc-900/50">
                                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Name</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider hidden md:table-cell">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider hidden sm:table-cell">Updated</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {filteredWorkflows.map((workflow) => (
                                <tr key={workflow.id} className="hover:bg-zinc-900/30 transition-colors group">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-md bg-indigo-500/10">
                                                <Workflow className="w-4 h-4 text-indigo-400" />
                                            </div>
                                            <div>
                                                <Link 
                                                    to={`/dashboard/editor/${workflow.id}`}
                                                    className="text-sm font-medium text-zinc-200 hover:text-indigo-400 transition-colors"
                                                >
                                                    {workflow.name}
                                                </Link>
                                                <p className="text-xs text-zinc-500 truncate max-w-[240px]">
                                                    {workflow.description || "No description"}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 hidden md:table-cell">
                                        <StatusBadge status={workflow.status} />
                                    </td>
                                    <td className="px-4 py-3 hidden sm:table-cell">
                                        <span className="text-xs text-zinc-500">{formatDate(workflow.updatedAt)}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRun(workflow.id)}
                                                disabled={runningId === workflow.id}
                                                className="h-8 w-8 p-0 text-emerald-400 hover:text-emerald-400 hover:bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                {runningId === workflow.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Play className="w-4 h-4" />
                                                )}
                                            </Button>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 min-w-[140px]">
                                                    <DropdownMenuItem asChild className="text-sm text-zinc-300 focus:bg-zinc-800">
                                                        <Link to={`/dashboard/editor/${workflow.id}`}>
                                                            <Pencil className="w-4 h-4 mr-3" />
                                                            Edit
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-sm text-zinc-300 focus:bg-zinc-800">
                                                        <Copy className="w-4 h-4 mr-3" />
                                                        Duplicate
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="bg-zinc-800" />
                                                    <DropdownMenuItem 
                                                        onClick={() => handleDelete(workflow.id)}
                                                        className="text-sm text-red-400 focus:bg-red-500/10 focus:text-red-400"
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-3" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
