import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Plus,
    Check,
    ExternalLink,
    Settings,
    RefreshCw,
    AlertCircle,
    Loader2,
    Search,
    Link2,
    Unlink,
    Key,
    Globe,
    MessageSquare,
    Code2,
    FolderOpen,
    Webhook,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { 
    CONNECTION_PROVIDERS, 
    getProvider, 
    startOAuthFlow,
    type ConnectionProvider,
    type SavedConnection,
} from "@/lib/connections";

// Icon mapping for providers
const PROVIDER_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    slack: () => <span className="text-lg">💬</span>,
    discord: () => <span className="text-lg">🎮</span>,
    gmail: () => <span className="text-lg">✉️</span>,
    notion: () => <span className="text-lg">📝</span>,
    'google-calendar': () => <span className="text-lg">📅</span>,
    'google-sheets': () => <span className="text-lg">📊</span>,
    'google-drive': () => <span className="text-lg">📁</span>,
    github: () => <span className="text-lg">🐙</span>,
    gitlab: () => <span className="text-lg">🦊</span>,
    jira: () => <span className="text-lg">🎯</span>,
    dropbox: () => <span className="text-lg">📦</span>,
    webhook: () => <Webhook className="w-5 h-5" />,
    'http-api': () => <Globe className="w-5 h-5" />,
};

const CATEGORY_ICONS = {
    communication: MessageSquare,
    productivity: FolderOpen,
    development: Code2,
    storage: FolderOpen,
    custom: Webhook,
};

const CATEGORY_LABELS = {
    communication: 'Communication',
    productivity: 'Productivity',
    development: 'Development',
    storage: 'Storage',
    custom: 'Custom',
};

interface ConnectionDialogProps {
    provider: ConnectionProvider | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (credentials: Record<string, string>) => void;
    isSaving: boolean;
}

function ConnectionDialog({ provider, isOpen, onClose, onSave, isSaving }: ConnectionDialogProps) {
    const [credentials, setCredentials] = useState<Record<string, string>>({});
    const [connectionName, setConnectionName] = useState('');

    useEffect(() => {
        if (provider) {
            setConnectionName(`My ${provider.name}`);
            setCredentials({});
        }
    }, [provider]);

    if (!provider) return null;

    const handleSubmit = () => {
        if (!connectionName.trim()) {
            toast.error('Please enter a connection name');
            return;
        }

        // Validate required fields
        const missingFields = provider.fields?.filter(f => f.required && !credentials[f.id]);
        if (missingFields && missingFields.length > 0) {
            toast.error(`Please fill in: ${missingFields.map(f => f.label).join(', ')}`);
            return;
        }

        onSave({ ...credentials, _name: connectionName });
    };

    const handleOAuth = () => {
        try {
            startOAuthFlow(provider);
        } catch (error) {
            toast.error('Failed to start OAuth flow. Please configure OAuth credentials.');
        }
    };

    const Icon = PROVIDER_ICONS[provider.id] || (() => <Globe className="w-5 h-5" />);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] bg-background border-border">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3 text-foreground">
                        <div className={cn("p-2 rounded-lg text-white")} style={{ backgroundColor: provider.color }}>
                            <Icon className="w-5 h-5" />
                        </div>
                        Connect {provider.name}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        {provider.description}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Connection Name */}
                    <div className="space-y-2">
                        <Label className="text-foreground">Connection Name</Label>
                        <Input
                            value={connectionName}
                            onChange={(e) => setConnectionName(e.target.value)}
                            placeholder="My connection name"
                            className="bg-background border-border"
                        />
                        <p className="text-xs text-muted-foreground">
                            A friendly name to identify this connection
                        </p>
                    </div>

                    {/* OAuth Flow */}
                    {provider.authType === 'oauth2' && (
                        <div className="p-4 rounded-lg bg-muted/50 border border-border">
                            <div className="flex items-center gap-3 mb-3">
                                <Key className="w-5 h-5 text-primary" />
                                <div>
                                    <p className="text-sm font-medium text-foreground">OAuth Authentication</p>
                                    <p className="text-xs text-muted-foreground">
                                        Sign in with your {provider.name} account
                                    </p>
                                </div>
                            </div>
                            <Button
                                onClick={handleOAuth}
                                className="w-full"
                                style={{ backgroundColor: provider.color }}
                            >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Sign in with {provider.name}
                            </Button>
                            {provider.docsUrl && (
                                <a 
                                    href={provider.docsUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 mt-2 text-xs text-primary hover:underline"
                                >
                                    View API Documentation <ExternalLink className="w-3 h-3" />
                                </a>
                            )}
                        </div>
                    )}

                    {/* API Key / Custom Fields */}
                    {(provider.authType === 'api_key' || provider.authType === 'webhook') && provider.fields && (
                        <div className="space-y-4">
                            {provider.fields.map((field) => (
                                <div key={field.id} className="space-y-2">
                                    <Label className="text-foreground">
                                        {field.label}
                                        {field.required && <span className="text-destructive ml-1">*</span>}
                                    </Label>
                                    {field.type === 'select' ? (
                                        <Select
                                            value={credentials[field.id] || ''}
                                            onValueChange={(value) => setCredentials(prev => ({ ...prev, [field.id]: value }))}
                                        >
                                            <SelectTrigger className="bg-background border-border">
                                                <SelectValue placeholder="Select..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {field.options?.map(opt => (
                                                    <SelectItem key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <Input
                                            type={field.type === 'password' ? 'password' : 'text'}
                                            value={credentials[field.id] || ''}
                                            onChange={(e) => setCredentials(prev => ({ ...prev, [field.id]: e.target.value }))}
                                            placeholder={field.placeholder}
                                            className="bg-background border-border"
                                        />
                                    )}
                                    {field.helpText && (
                                        <p className="text-xs text-muted-foreground">{field.helpText}</p>
                                    )}
                                </div>
                            ))}

                            {provider.docsUrl && (
                                <a 
                                    href={provider.docsUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                                >
                                    View API Documentation <ExternalLink className="w-3 h-3" />
                                </a>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSaving}>
                        Cancel
                    </Button>
                    {(provider.authType === 'api_key' || provider.authType === 'webhook') && (
                        <Button onClick={handleSubmit} disabled={isSaving}>
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Connecting...
                                </>
                            ) : (
                                <>
                                    <Link2 className="w-4 h-4 mr-2" />
                                    Connect
                                </>
                            )}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function ConnectionCard({ 
    connection,
    provider,
    onDisconnect,
    onSettings,
    onTest,
    isLoading,
}: { 
    connection: SavedConnection;
    provider: ConnectionProvider;
    onDisconnect: () => void;
    onSettings: () => void;
    onTest: () => void;
    isLoading?: boolean;
}) {
    const Icon = PROVIDER_ICONS[provider.id] || (() => <Globe className="w-5 h-5" />);
    
    return (
        <div className="p-5 rounded-xl border bg-card border-border hover:border-primary/30 transition-all">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={cn("p-2.5 rounded-lg text-white")} style={{ backgroundColor: provider.color }}>
                        <Icon className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-medium text-foreground">{connection.name}</h3>
                            <span className={cn(
                                "flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border",
                                connection.status === 'active' 
                                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                    : connection.status === 'expired'
                                    ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                    : "bg-destructive/10 text-destructive border-destructive/20"
                            )}>
                                {connection.status === 'active' ? (
                                    <><Check className="w-3 h-3" /> Connected</>
                                ) : connection.status === 'expired' ? (
                                    <><AlertCircle className="w-3 h-3" /> Expired</>
                                ) : (
                                    <><AlertCircle className="w-3 h-3" /> Error</>
                                )}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{provider.name}</p>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                    {connection.lastUsed ? (
                        <>Last used: {new Date(connection.lastUsed).toLocaleDateString()}</>
                    ) : (
                        <>Connected: {new Date(connection.connectedAt).toLocaleDateString()}</>
                    )}
                </div>
                <div className="flex items-center gap-1.5">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onTest}
                        disabled={isLoading}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        title="Test connection"
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <RefreshCw className="w-4 h-4" />
                        )}
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onSettings}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        title="Settings"
                    >
                        <Settings className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onDisconnect}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        title="Disconnect"
                    >
                        <Unlink className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

function ProviderCard({ 
    provider, 
    onConnect,
}: { 
    provider: ConnectionProvider;
    onConnect: () => void;
}) {
    const Icon = PROVIDER_ICONS[provider.id] || (() => <Globe className="w-5 h-5" />);
    
    return (
        <div className="p-5 rounded-xl border bg-card/50 border-border hover:border-primary/30 hover:bg-card transition-all group">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={cn("p-2.5 rounded-lg text-white")} style={{ backgroundColor: provider.color }}>
                        <Icon className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                            {provider.name}
                        </h3>
                        <p className="text-xs text-muted-foreground capitalize">{provider.category}</p>
                    </div>
                </div>
            </div>
            
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed line-clamp-2">
                {provider.description}
            </p>

            <Button
                size="sm"
                onClick={onConnect}
                variant="outline"
                className="w-full h-9 text-sm"
            >
                <Plus className="w-4 h-4 mr-2" />
                Connect
            </Button>
        </div>
    );
}

export default function Connections() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [connections, setConnections] = useState<SavedConnection[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProvider, setSelectedProvider] = useState<ConnectionProvider | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [testingId, setTestingId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('all');

    // Load saved connections
    useEffect(() => {
        const loadConnections = async () => {
            try {
                const data = await api.getConnections();
                setConnections(data);
            } catch (error) {
                console.error('Failed to load connections:', error);
                // Use mock data for now
                setConnections([
                    {
                        id: '1',
                        providerId: 'github',
                        name: 'My GitHub',
                        credentials: {},
                        status: 'active',
                        connectedAt: new Date().toISOString(),
                        lastUsed: new Date().toISOString(),
                    },
                    {
                        id: '2',
                        providerId: 'slack',
                        name: 'Work Slack',
                        credentials: {},
                        status: 'active',
                        connectedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
                    },
                ]);
            } finally {
                setLoading(false);
            }
        };
        loadConnections();
    }, []);

    // Handle OAuth callback
    useEffect(() => {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        if (error) {
            toast.error(`OAuth error: ${error}`);
            navigate('/dashboard/connections', { replace: true });
            return;
        }

        if (code && state) {
            // Handle OAuth callback
            handleOAuthCallback(code, state);
        }
    }, [searchParams]);

    const handleOAuthCallback = async (code: string, state: string) => {
        try {
            // Exchange code for token via backend
            const result = await api.exchangeOAuthCode(code, state);
            
            setConnections(prev => [...prev, result.connection]);
            toast.success(`${result.provider} connected successfully!`);
            navigate('/dashboard/connections', { replace: true });
        } catch (error) {
            toast.error('Failed to complete OAuth connection');
            navigate('/dashboard/connections', { replace: true });
        }
    };

    const handleConnect = (providerId: string) => {
        const provider = getProvider(providerId);
        if (provider) {
            setSelectedProvider(provider);
            setIsDialogOpen(true);
        }
    };

    const handleSaveConnection = async (credentials: Record<string, string>) => {
        if (!selectedProvider) return;

        setIsSaving(true);
        try {
            const result = await api.createConnection({
                providerId: selectedProvider.id,
                name: credentials._name,
                credentials: Object.fromEntries(
                    Object.entries(credentials).filter(([k]) => k !== '_name')
                ),
            });

            setConnections(prev => [...prev, result]);
            toast.success(`${selectedProvider.name} connected successfully!`);
            setIsDialogOpen(false);
        } catch (error) {
            toast.error('Failed to save connection');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDisconnect = async (connectionId: string) => {
        const connection = connections.find(c => c.id === connectionId);
        if (!connection) return;

        if (!confirm(`Disconnect ${connection.name}? This will remove all stored credentials.`)) return;

        try {
            await api.deleteConnection(connectionId);
            setConnections(prev => prev.filter(c => c.id !== connectionId));
            toast.success('Connection removed');
        } catch (error) {
            toast.error('Failed to disconnect');
        }
    };

    const handleTestConnection = async (connectionId: string) => {
        setTestingId(connectionId);
        try {
            const result = await api.testConnection(connectionId);
            if (result.success) {
                toast.success('Connection is working!');
            } else {
                toast.error(`Connection test failed: ${result.error}`);
            }
        } catch (error) {
            toast.error('Failed to test connection');
        } finally {
            setTestingId(null);
        }
    };

    // Filter providers
    const filteredProviders = CONNECTION_PROVIDERS.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             p.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-xl font-semibold text-foreground">Connections</h1>
                <p className="text-muted-foreground text-sm mt-0.5">
                    Connect your apps and services to use them in workflows
                </p>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 p-4 rounded-xl bg-card border border-border">
                <div>
                    <p className="text-2xl font-bold text-foreground">{connections.length}</p>
                    <p className="text-xs text-muted-foreground">Connected Apps</p>
                </div>
                <div className="h-10 w-px bg-border" />
                <div>
                    <p className="text-2xl font-bold text-foreground">{CONNECTION_PROVIDERS.length}</p>
                    <p className="text-xs text-muted-foreground">Available Integrations</p>
                </div>
                <div className="h-10 w-px bg-border" />
                <div>
                    <p className="text-2xl font-bold text-emerald-500">
                        {connections.filter(c => c.status === 'active').length}
                    </p>
                    <p className="text-xs text-muted-foreground">Active</p>
                </div>
            </div>

            <Tabs defaultValue="connected" className="space-y-6">
                <TabsList className="bg-muted">
                    <TabsTrigger value="connected">My Connections</TabsTrigger>
                    <TabsTrigger value="available">Add New</TabsTrigger>
                </TabsList>

                {/* My Connections Tab */}
                <TabsContent value="connected" className="space-y-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        </div>
                    ) : connections.length === 0 ? (
                        <div className="text-center py-12">
                            <Link2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                            <h3 className="text-lg font-medium text-foreground mb-2">No connections yet</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Connect your first app to start building workflows
                            </p>
                            <Button onClick={() => document.querySelector('[value="available"]')?.dispatchEvent(new Event('click'))}>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Connection
                            </Button>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {connections.map((connection) => {
                                const provider = getProvider(connection.providerId);
                                if (!provider) return null;
                                return (
                                    <ConnectionCard
                                        key={connection.id}
                                        connection={connection}
                                        provider={provider}
                                        onDisconnect={() => handleDisconnect(connection.id)}
                                        onSettings={() => {}}
                                        onTest={() => handleTestConnection(connection.id)}
                                        isLoading={testingId === connection.id}
                                    />
                                );
                            })}
                        </div>
                    )}
                </TabsContent>

                {/* Add New Tab */}
                <TabsContent value="available" className="space-y-6">
                    {/* Search and Filter */}
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search integrations..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 bg-background"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant={activeCategory === 'all' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setActiveCategory('all')}
                            >
                                All
                            </Button>
                            {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
                                const Icon = CATEGORY_ICONS[key as keyof typeof CATEGORY_ICONS];
                                return (
                                    <Button
                                        key={key}
                                        variant={activeCategory === key ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setActiveCategory(key)}
                                    >
                                        <Icon className="w-4 h-4 mr-1.5" />
                                        {label}
                                    </Button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Providers Grid */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filteredProviders.map((provider) => (
                            <ProviderCard
                                key={provider.id}
                                provider={provider}
                                onConnect={() => handleConnect(provider.id)}
                            />
                        ))}
                    </div>

                    {filteredProviders.length === 0 && (
                        <div className="text-center py-12">
                            <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                            <h3 className="text-lg font-medium text-foreground mb-2">No integrations found</h3>
                            <p className="text-sm text-muted-foreground">
                                Try a different search term or category
                            </p>
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Connection Dialog */}
            <ConnectionDialog
                provider={selectedProvider}
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                onSave={handleSaveConnection}
                isSaving={isSaving}
            />
        </div>
    );
}
