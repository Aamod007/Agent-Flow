import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Slack,
    MessageSquare,
    Mail,
    Calendar,
    FileText,
    Database,
    Github,
    Webhook,
    Plus,
    Check,
    ExternalLink,
    Settings,
    Trash2,
    RefreshCw,
    AlertCircle,
    Zap,
    ArrowRight,
    Sparkles,
    Play,
    Clock,
    GitPullRequest,
    Bell,
    Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

interface Connection {
    id: string;
    name: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    connected: boolean;
    lastSync?: string;
    account?: string;
}

const AVAILABLE_CONNECTIONS: Connection[] = [
    {
        id: "slack",
        name: "Slack",
        description: "Send notifications and messages to Slack channels",
        icon: Slack,
        color: "bg-[#4A154B]",
        connected: true,
        lastSync: "2 mins ago",
        account: "workspace.slack.com"
    },
    {
        id: "discord",
        name: "Discord",
        description: "Post messages to your Discord server",
        icon: MessageSquare,
        color: "bg-[#5865F2]",
        connected: true,
        lastSync: "5 mins ago",
        account: "My Server"
    },
    {
        id: "gmail",
        name: "Gmail",
        description: "Send emails through your Gmail account",
        icon: Mail,
        color: "bg-red-500",
        connected: false,
    },
    {
        id: "google-calendar",
        name: "Google Calendar",
        description: "Create and manage calendar events",
        icon: Calendar,
        color: "bg-blue-500",
        connected: false,
    },
    {
        id: "notion",
        name: "Notion",
        description: "Create pages and database entries in Notion",
        icon: FileText,
        color: "bg-zinc-700",
        connected: true,
        lastSync: "1 hour ago",
        account: "My Workspace"
    },
    {
        id: "google-drive",
        name: "Google Drive",
        description: "Access and manage files in Google Drive",
        icon: Database,
        color: "bg-yellow-500",
        connected: false,
    },
    {
        id: "github",
        name: "GitHub",
        description: "Create issues, PRs, and manage repositories",
        icon: Github,
        color: "bg-zinc-800",
        connected: true,
        lastSync: "30 mins ago",
        account: "@username"
    },
    {
        id: "webhook",
        name: "Custom Webhook",
        description: "Connect any app with a custom webhook URL",
        icon: Webhook,
        color: "bg-indigo-500",
        connected: false,
    },
];

// Connection Templates - Pre-built workflows using connections
interface ConnectionTemplate {
    id: string;
    name: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    connections: string[];
    category: string;
    popular?: boolean;
}

const CONNECTION_TEMPLATES: ConnectionTemplate[] = [
    {
        id: "slack-github-notify",
        name: "GitHub → Slack Notifications",
        description: "Get Slack alerts when PRs are opened, merged, or issues are created",
        icon: GitPullRequest,
        color: "bg-gradient-to-br from-[#4A154B] to-zinc-800",
        connections: ["github", "slack"],
        category: "notifications",
        popular: true,
    },
    {
        id: "email-slack-forward",
        name: "Email → Slack Forward",
        description: "Forward important emails to a Slack channel automatically",
        icon: Mail,
        color: "bg-gradient-to-br from-red-500 to-[#4A154B]",
        connections: ["gmail", "slack"],
        category: "notifications",
    },
    {
        id: "calendar-slack-reminder",
        name: "Meeting Reminders",
        description: "Send Slack reminders 15 minutes before calendar events",
        icon: Clock,
        color: "bg-gradient-to-br from-blue-500 to-[#4A154B]",
        connections: ["google-calendar", "slack"],
        category: "productivity",
        popular: true,
    },
    {
        id: "notion-discord-sync",
        name: "Notion → Discord Updates",
        description: "Post Discord updates when Notion pages are created or modified",
        icon: FileText,
        color: "bg-gradient-to-br from-zinc-700 to-[#5865F2]",
        connections: ["notion", "discord"],
        category: "notifications",
    },
    {
        id: "github-notion-issues",
        name: "GitHub Issues → Notion",
        description: "Automatically create Notion database entries from GitHub issues",
        icon: Github,
        color: "bg-gradient-to-br from-zinc-800 to-zinc-600",
        connections: ["github", "notion"],
        category: "productivity",
    },
    {
        id: "daily-standup",
        name: "Daily Standup Bot",
        description: "Automated daily standup collection via Slack with Notion summary",
        icon: Bell,
        color: "bg-gradient-to-br from-indigo-500 to-purple-600",
        connections: ["slack", "notion"],
        category: "automation",
        popular: true,
    },
];

// Template workflow definitions with actual nodes and edges
const TEMPLATE_WORKFLOWS: Record<string, { nodes: any[]; edges: any[] }> = {
    "slack-github-notify": {
        nodes: [
            { id: "trigger-1", type: "trigger", position: { x: 100, y: 200 }, data: { label: "GitHub Webhook", type: "trigger", config: { event: "push,pull_request,issues" } } },
            { id: "agent-1", type: "agent", position: { x: 350, y: 200 }, data: { label: "Format Message", type: "agent", config: { model: "gpt-4o-mini", systemPrompt: "Format GitHub events into readable Slack messages" } } },
            { id: "action-1", type: "action", position: { x: 600, y: 200 }, data: { label: "Send to Slack", type: "action", config: { channel: "#dev-notifications" } } },
        ],
        edges: [
            { id: "e1-2", source: "trigger-1", target: "agent-1", animated: true },
            { id: "e2-3", source: "agent-1", target: "action-1", animated: true },
        ],
    },
    "email-slack-forward": {
        nodes: [
            { id: "trigger-1", type: "trigger", position: { x: 100, y: 200 }, data: { label: "Gmail Trigger", type: "trigger", config: { filter: "is:unread label:important" } } },
            { id: "agent-1", type: "agent", position: { x: 350, y: 200 }, data: { label: "Summarize Email", type: "agent", config: { model: "gpt-4o-mini", systemPrompt: "Summarize emails concisely for Slack" } } },
            { id: "action-1", type: "action", position: { x: 600, y: 200 }, data: { label: "Post to Slack", type: "action", config: { channel: "#email-alerts" } } },
        ],
        edges: [
            { id: "e1-2", source: "trigger-1", target: "agent-1", animated: true },
            { id: "e2-3", source: "agent-1", target: "action-1", animated: true },
        ],
    },
    "calendar-slack-reminder": {
        nodes: [
            { id: "trigger-1", type: "trigger", position: { x: 100, y: 200 }, data: { label: "Calendar Watch", type: "trigger", config: { beforeMinutes: 15 } } },
            { id: "agent-1", type: "agent", position: { x: 350, y: 200 }, data: { label: "Create Reminder", type: "agent", config: { model: "gpt-4o-mini", systemPrompt: "Create friendly meeting reminders" } } },
            { id: "action-1", type: "action", position: { x: 600, y: 200 }, data: { label: "Send Reminder", type: "action", config: { channel: "#reminders" } } },
        ],
        edges: [
            { id: "e1-2", source: "trigger-1", target: "agent-1", animated: true },
            { id: "e2-3", source: "agent-1", target: "action-1", animated: true },
        ],
    },
    "notion-discord-sync": {
        nodes: [
            { id: "trigger-1", type: "trigger", position: { x: 100, y: 200 }, data: { label: "Notion Updates", type: "trigger", config: { database: "Projects" } } },
            { id: "agent-1", type: "agent", position: { x: 350, y: 200 }, data: { label: "Format Update", type: "agent", config: { model: "gpt-4o-mini", systemPrompt: "Format Notion updates for Discord" } } },
            { id: "action-1", type: "action", position: { x: 600, y: 200 }, data: { label: "Post to Discord", type: "action", config: { channel: "#updates" } } },
        ],
        edges: [
            { id: "e1-2", source: "trigger-1", target: "agent-1", animated: true },
            { id: "e2-3", source: "agent-1", target: "action-1", animated: true },
        ],
    },
    "github-notion-issues": {
        nodes: [
            { id: "trigger-1", type: "trigger", position: { x: 100, y: 200 }, data: { label: "GitHub Issues", type: "trigger", config: { event: "issues.opened" } } },
            { id: "agent-1", type: "agent", position: { x: 350, y: 200 }, data: { label: "Extract Details", type: "agent", config: { model: "gpt-4o-mini", systemPrompt: "Extract issue details for Notion" } } },
            { id: "action-1", type: "action", position: { x: 600, y: 200 }, data: { label: "Create Notion Entry", type: "action", config: { database: "Issue Tracker" } } },
        ],
        edges: [
            { id: "e1-2", source: "trigger-1", target: "agent-1", animated: true },
            { id: "e2-3", source: "agent-1", target: "action-1", animated: true },
        ],
    },
    "daily-standup": {
        nodes: [
            { id: "trigger-1", type: "trigger", position: { x: 100, y: 150 }, data: { label: "Daily Schedule", type: "trigger", config: { cron: "0 9 * * 1-5" } } },
            { id: "action-1", type: "action", position: { x: 350, y: 150 }, data: { label: "Ask Team", type: "action", config: { message: "What did you work on yesterday? What are you working on today?" } } },
            { id: "agent-1", type: "agent", position: { x: 600, y: 150 }, data: { label: "Collect Responses", type: "agent", config: { model: "gpt-4o-mini", systemPrompt: "Collect and summarize standup responses" } } },
            { id: "action-2", type: "action", position: { x: 850, y: 150 }, data: { label: "Save to Notion", type: "action", config: { database: "Standups" } } },
        ],
        edges: [
            { id: "e1-2", source: "trigger-1", target: "action-1", animated: true },
            { id: "e2-3", source: "action-1", target: "agent-1", animated: true },
            { id: "e3-4", source: "agent-1", target: "action-2", animated: true },
        ],
    },
};

function ConnectionCard({ 
    connection, 
    onConnect, 
    onDisconnect,
    onSettings 
}: { 
    connection: Connection;
    onConnect: () => void;
    onDisconnect: () => void;
    onSettings: () => void;
}) {
    const Icon = connection.icon;
    
    return (
        <div className={cn(
            "p-5 rounded-xl border transition-all",
            connection.connected 
                ? "bg-zinc-900/50 border-zinc-700/50" 
                : "bg-zinc-900/30 border-zinc-800/50 hover:border-zinc-700/50"
        )}>
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={cn("p-2.5 rounded-lg", connection.color)}>
                        <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-medium text-zinc-200">{connection.name}</h3>
                            {connection.connected && (
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    <Check className="w-3 h-3" />
                                    Connected
                                </span>
                            )}
                        </div>
                        {connection.connected && connection.account && (
                            <p className="text-xs text-zinc-500 mt-0.5">{connection.account}</p>
                        )}
                    </div>
                </div>
            </div>
            
            <p className="text-sm text-zinc-500 mb-4 leading-relaxed">
                {connection.description}
            </p>

            {connection.connected ? (
                <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-600">
                        Last sync: {connection.lastSync}
                    </span>
                    <div className="flex items-center gap-1.5">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onSettings}
                            className="h-8 w-8 p-0 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                        >
                            <Settings className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onDisconnect}
                            className="h-8 w-8 p-0 text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            ) : (
                <Button
                    size="sm"
                    onClick={onConnect}
                    className="w-full h-9 text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Connect
                </Button>
            )}
        </div>
    );
}

function ConnectionTemplateCard({
    template,
    onUse,
    connections,
    isLoading,
}: {
    template: ConnectionTemplate;
    onUse: () => void;
    connections: Connection[];
    isLoading?: boolean;
}) {
    const Icon = template.icon;
    const requiredConnections = template.connections.map(id => 
        connections.find(c => c.id === id)
    ).filter(Boolean) as Connection[];
    const allConnected = requiredConnections.every(c => c.connected);
    const connectedCount = requiredConnections.filter(c => c.connected).length;

    return (
        <div className={cn(
            "p-5 rounded-xl border transition-all group",
            "bg-zinc-900/50 border-zinc-800/50 hover:border-indigo-500/40",
            "hover:shadow-lg hover:shadow-indigo-500/10"
        )}>
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={cn("p-2.5 rounded-lg", template.color)}>
                        <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-medium text-zinc-200 group-hover:text-indigo-400 transition-colors">
                                {template.name}
                            </h3>
                            {template.popular && (
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                    <Sparkles className="w-3 h-3" />
                                    Popular
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5 capitalize">{template.category}</p>
                    </div>
                </div>
            </div>

            <p className="text-sm text-zinc-500 mb-4 leading-relaxed">
                {template.description}
            </p>

            {/* Required Connections */}
            <div className="flex items-center gap-2 mb-4">
                <span className="text-xs text-zinc-600">Requires:</span>
                <div className="flex items-center gap-1">
                    {requiredConnections.map((conn) => {
                        const ConnIcon = conn.icon;
                        return (
                            <div
                                key={conn.id}
                                className={cn(
                                    "p-1.5 rounded-md",
                                    conn.connected 
                                        ? "bg-emerald-500/10 ring-1 ring-emerald-500/30" 
                                        : "bg-zinc-800 ring-1 ring-zinc-700"
                                )}
                                title={`${conn.name} ${conn.connected ? '(Connected)' : '(Not connected)'}`}
                            >
                                <ConnIcon className={cn(
                                    "w-3.5 h-3.5",
                                    conn.connected ? "text-emerald-400" : "text-zinc-500"
                                )} />
                            </div>
                        );
                    })}
                </div>
                <span className={cn(
                    "text-xs",
                    allConnected ? "text-emerald-400" : "text-zinc-500"
                )}>
                    {connectedCount}/{requiredConnections.length} connected
                </span>
            </div>

            <Button
                size="sm"
                onClick={onUse}
                disabled={!allConnected || isLoading}
                className={cn(
                    "w-full h-9 text-sm",
                    allConnected 
                        ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                        : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                )}
            >
                {isLoading ? (
                    <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                    </>
                ) : allConnected ? (
                    <>
                        <Play className="w-4 h-4 mr-2" />
                        Use Template
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                ) : (
                    <>
                        Connect Required Apps First
                    </>
                )}
            </Button>
        </div>
    );
}

export default function Connections() {
    const navigate = useNavigate();
    const [connections, setConnections] = useState<Connection[]>(AVAILABLE_CONNECTIONS);
    const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [creatingTemplate, setCreatingTemplate] = useState<string | null>(null);

    const connectedCount = connections.filter(c => c.connected).length;

    const handleConnect = (id: string) => {
        const connection = connections.find(c => c.id === id);
        if (connection) {
            setSelectedConnection(connection);
            setIsConnecting(true);
        }
    };

    const handleDisconnect = (id: string) => {
        if (!confirm("Disconnect this integration?")) return;
        setConnections(connections.map(c => 
            c.id === id ? { ...c, connected: false, lastSync: undefined, account: undefined } : c
        ));
    };

    const handleUseTemplate = async (templateId: string) => {
        const template = CONNECTION_TEMPLATES.find(t => t.id === templateId);
        const workflowDef = TEMPLATE_WORKFLOWS[templateId];
        
        if (!template || !workflowDef) {
            console.error("Template not found:", templateId);
            return;
        }

        setCreatingTemplate(templateId);

        try {
            // Create a new workflow from the template
            const workflow = await api.createWorkflow(template.name, template.description);

            // Save the workflow definition with nodes and edges
            await api.saveWorkflow(workflow.id, {
                definition: {
                    nodes: workflowDef.nodes,
                    edges: workflowDef.edges,
                }
            });

            // Navigate to the workflow editor
            navigate(`/dashboard/editor/${workflow.id}`);
        } catch (error) {
            console.error("Failed to create workflow from template:", error);
            // Fallback: navigate to editor with template in URL params
            navigate(`/dashboard/editor?template=${templateId}`);
        } finally {
            setCreatingTemplate(null);
        }
    };

    const simulateConnect = () => {
        if (!selectedConnection) return;
        
        // Simulate OAuth flow
        setTimeout(() => {
            setConnections(connections.map(c => 
                c.id === selectedConnection.id 
                    ? { ...c, connected: true, lastSync: "Just now", account: "Connected Account" } 
                    : c
            ));
            setIsConnecting(false);
            setSelectedConnection(null);
        }, 1500);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-zinc-100">Connections</h1>
                    <p className="text-sm text-zinc-500 mt-1">{connectedCount} of {connections.length} connected</p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-4 text-sm bg-transparent border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Sync All
                </Button>
            </div>

            {/* Status Banner */}
            {connectedCount > 0 && (
                <div className="flex items-center gap-4 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                    <div className="p-2.5 rounded-lg bg-emerald-500/10">
                        <Zap className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm text-emerald-400">{connectedCount} integrations active</p>
                        <p className="text-sm text-zinc-500">Your workflows can use these connections</p>
                    </div>
                </div>
            )}

            {/* Connections Grid */}
            <div>
                <h2 className="text-sm font-medium text-zinc-400 mb-4">Available Integrations</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {connections.map((connection) => (
                        <ConnectionCard
                            key={connection.id}
                            connection={connection}
                            onConnect={() => handleConnect(connection.id)}
                            onDisconnect={() => handleDisconnect(connection.id)}
                            onSettings={() => {}}
                        />
                    ))}
                </div>
            </div>

            {/* Connection Templates Section */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-sm font-medium text-zinc-400">Connection Templates</h2>
                        <p className="text-xs text-zinc-600 mt-0.5">Pre-built workflows using your connections</p>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/dashboard/templates')}
                        className="h-8 text-xs text-zinc-500 hover:text-zinc-300"
                    >
                        View All Templates
                        <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {CONNECTION_TEMPLATES.map((template) => (
                        <ConnectionTemplateCard
                            key={template.id}
                            template={template}
                            connections={connections}
                            isLoading={creatingTemplate === template.id}
                            onUse={() => handleUseTemplate(template.id)}
                        />
                    ))}
                </div>
            </div>

            {/* Add Custom Integration */}
            <div className="p-5 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/20">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-lg bg-zinc-800">
                        <Webhook className="w-5 h-5 text-zinc-400" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-sm font-medium text-zinc-300">Need a custom integration?</h3>
                        <p className="text-sm text-zinc-500">Use webhooks to connect any app with an API</p>
                    </div>
                    <Button
                        size="sm"
                        className="h-9 px-4 text-sm bg-indigo-600 hover:bg-indigo-700"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Webhook
                    </Button>
                </div>
            </div>

            {/* Connect Dialog */}
            <Dialog open={isConnecting} onOpenChange={setIsConnecting}>
                <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base text-zinc-100 flex items-center gap-3">
                            {selectedConnection && (
                                <>
                                    <div className={cn("p-2 rounded-lg", selectedConnection.color)}>
                                        <selectedConnection.icon className="w-4 h-4 text-white" />
                                    </div>
                                    Connect {selectedConnection.name}
                                </>
                            )}
                        </DialogTitle>
                        <DialogDescription className="text-sm text-zinc-500">
                            You'll be redirected to authorize AgentFlow to access your {selectedConnection?.name} account.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="py-5">
                        <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-3">
                            <div className="flex items-center gap-2.5 text-sm text-zinc-400">
                                <Check className="w-4 h-4 text-emerald-400" />
                                Read your {selectedConnection?.name} data
                            </div>
                            <div className="flex items-center gap-2.5 text-sm text-zinc-400">
                                <Check className="w-4 h-4 text-emerald-400" />
                                Send messages on your behalf
                            </div>
                            <div className="flex items-center gap-2.5 text-sm text-zinc-400">
                                <Check className="w-4 h-4 text-emerald-400" />
                                Access will be limited to workflows you create
                            </div>
                        </div>

                        <div className="flex items-start gap-2.5 mt-4 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                            <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-amber-400/80">
                                You can revoke access at any time from your {selectedConnection?.name} settings.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsConnecting(false)}
                            className="flex-1 h-9 text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            onClick={simulateConnect}
                            className="flex-1 h-9 text-sm bg-indigo-600 hover:bg-indigo-700"
                        >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Authorize
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
