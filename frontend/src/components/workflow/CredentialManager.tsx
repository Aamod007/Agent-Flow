import { useState, useEffect, memo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Plus,
    Key,
    Eye,
    EyeOff,
    Trash2,
    Edit,
    Save,
    Shield,
    AlertTriangle,
    Loader2,
    Database,
    Mail,
    MessageSquare,
    Bot,
    Cloud,
    Lock
} from 'lucide-react';
import { toast } from 'sonner';

interface Credential {
    id: string;
    name: string;
    type: CredentialType;
    data: Record<string, string>;
    createdAt: string;
    updatedAt: string;
    usedBy: string[]; // Node IDs using this credential
}

type CredentialType =
    | 'api_key'
    | 'oauth2'
    | 'basic_auth'
    | 'database'
    | 'smtp'
    | 'slack'
    | 'openai'
    | 'google'
    | 'custom';

interface CredentialFieldConfig {
    name: string;
    label: string;
    type: 'text' | 'password' | 'url' | 'number';
    required?: boolean;
    placeholder?: string;
}

const CREDENTIAL_TYPES: Record<CredentialType, {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    fields: CredentialFieldConfig[];
}> = {
    api_key: {
        label: 'API Key',
        icon: Key,
        color: 'text-amber-400',
        fields: [
            { name: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: 'sk-...' },
            { name: 'baseUrl', label: 'Base URL (optional)', type: 'url', placeholder: 'https://api.example.com' },
        ],
    },
    oauth2: {
        label: 'OAuth2',
        icon: Shield,
        color: 'text-blue-400',
        fields: [
            { name: 'clientId', label: 'Client ID', type: 'text', required: true },
            { name: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
            { name: 'authUrl', label: 'Authorization URL', type: 'url', required: true },
            { name: 'tokenUrl', label: 'Token URL', type: 'url', required: true },
            { name: 'scopes', label: 'Scopes', type: 'text', placeholder: 'read write' },
        ],
    },
    basic_auth: {
        label: 'Basic Auth',
        icon: Lock,
        color: 'text-purple-400',
        fields: [
            { name: 'username', label: 'Username', type: 'text', required: true },
            { name: 'password', label: 'Password', type: 'password', required: true },
        ],
    },
    database: {
        label: 'Database',
        icon: Database,
        color: 'text-emerald-400',
        fields: [
            { name: 'host', label: 'Host', type: 'text', required: true, placeholder: 'localhost' },
            { name: 'port', label: 'Port', type: 'number', required: true, placeholder: '5432' },
            { name: 'database', label: 'Database', type: 'text', required: true },
            { name: 'username', label: 'Username', type: 'text', required: true },
            { name: 'password', label: 'Password', type: 'password', required: true },
            { name: 'ssl', label: 'SSL Mode', type: 'text', placeholder: 'require' },
        ],
    },
    smtp: {
        label: 'SMTP',
        icon: Mail,
        color: 'text-red-400',
        fields: [
            { name: 'host', label: 'SMTP Host', type: 'text', required: true, placeholder: 'smtp.gmail.com' },
            { name: 'port', label: 'Port', type: 'number', required: true, placeholder: '587' },
            { name: 'username', label: 'Username', type: 'text', required: true },
            { name: 'password', label: 'Password', type: 'password', required: true },
            { name: 'secure', label: 'Use TLS', type: 'text', placeholder: 'true' },
        ],
    },
    slack: {
        label: 'Slack',
        icon: MessageSquare,
        color: 'text-purple-400',
        fields: [
            { name: 'botToken', label: 'Bot Token', type: 'password', required: true, placeholder: 'xoxb-...' },
            { name: 'signingSecret', label: 'Signing Secret', type: 'password', placeholder: 'Signing secret' },
        ],
    },
    openai: {
        label: 'OpenAI',
        icon: Bot,
        color: 'text-green-400',
        fields: [
            { name: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: 'sk-...' },
            { name: 'organization', label: 'Organization ID (optional)', type: 'text' },
        ],
    },
    google: {
        label: 'Google',
        icon: Cloud,
        color: 'text-blue-400',
        fields: [
            { name: 'serviceAccountKey', label: 'Service Account JSON', type: 'password', required: true },
            { name: 'projectId', label: 'Project ID', type: 'text' },
        ],
    },
    custom: {
        label: 'Custom',
        icon: Key,
        color: 'text-gray-400',
        fields: [
            { name: 'value1', label: 'Field 1', type: 'password' },
            { name: 'value2', label: 'Field 2', type: 'password' },
            { name: 'value3', label: 'Field 3', type: 'password' },
        ],
    },
};

interface CredentialManagerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectCredential?: (credentialId: string) => void;
    selectedType?: CredentialType;
}

function CredentialCard({
    credential,
    onEdit,
    onDelete,
    onSelect,
}: {
    credential: Credential;
    onEdit: () => void;
    onDelete: () => void;
    onSelect?: () => void;
}) {
    const config = CREDENTIAL_TYPES[credential.type];
    const Icon = config.icon;

    return (
        <div
            className={cn(
                'p-4 rounded-lg border transition-all duration-200',
                'bg-zinc-900/50 border-zinc-800',
                'hover:border-indigo-500/30 hover:bg-zinc-900',
                onSelect && 'cursor-pointer'
            )}
            onClick={onSelect}
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className={cn('p-2 rounded-lg bg-zinc-800', config.color)}>
                        <Icon className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-zinc-100">
                            {credential.name}
                        </p>
                        <p className="text-xs text-zinc-500">{config.label}</p>
                    </div>
                </div>
                {!onSelect && (
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit();
                            }}
                        >
                            <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-400 hover:text-red-300"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete();
                            }}
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                )}
            </div>

            {credential.usedBy.length > 0 && (
                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-400 text-xs">
                        Used by {credential.usedBy.length} node{credential.usedBy.length > 1 ? 's' : ''}
                    </Badge>
                </div>
            )}

            <div className="mt-3 pt-3 border-t border-zinc-800 text-xs text-zinc-500">
                Updated {new Date(credential.updatedAt).toLocaleDateString()}
            </div>
        </div>
    );
}

function CredentialEditor({
    credential,
    isOpen,
    onClose,
    onSave,
}: {
    credential?: Credential;
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<Credential, 'id' | 'createdAt' | 'updatedAt' | 'usedBy'>) => void;
}) {
    const [name, setName] = useState(credential?.name || '');
    const [type, setType] = useState<CredentialType>(credential?.type || 'api_key');
    const [data, setData] = useState<Record<string, string>>(credential?.data || {});
    const [showPasswords, setShowPasswords] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (credential) {
            setName(credential.name);
            setType(credential.type);
            setData(credential.data);
        } else {
            setName('');
            setType('api_key');
            setData({});
        }
        setShowPasswords(new Set());
    }, [credential, isOpen]);

    const config = CREDENTIAL_TYPES[type];

    const toggleShowPassword = (field: string) => {
        const newSet = new Set(showPasswords);
        if (newSet.has(field)) {
            newSet.delete(field);
        } else {
            newSet.add(field);
        }
        setShowPasswords(newSet);
    };

    const handleSave = () => {
        if (!name.trim()) {
            toast.error('Please enter a name for the credential');
            return;
        }

        const missingRequired = config.fields
            .filter((f) => f.required && !data[f.name])
            .map((f) => f.label);

        if (missingRequired.length > 0) {
            toast.error(`Missing required fields: ${missingRequired.join(', ')}`);
            return;
        }

        onSave({ name, type, data });
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Key className="w-5 h-5 text-indigo-400" />
                        {credential ? 'Edit Credential' : 'New Credential'}
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Securely store credentials for use in your workflows.
                    </DialogDescription>
                </DialogHeader>

                <div className="max-h-[60vh] overflow-auto">
                    <div className="space-y-4 p-1">
                        {/* Name */}
                        <div className="space-y-2">
                            <Label className="text-zinc-400">Name</Label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="My API Key"
                                className="bg-zinc-900 border-zinc-800 text-zinc-100"
                            />
                        </div>

                        {/* Type */}
                        <div className="space-y-2">
                            <Label className="text-zinc-400">Type</Label>
                            <Select
                                value={type}
                                onValueChange={(v) => {
                                    setType(v as CredentialType);
                                    setData({});
                                }}
                                disabled={!!credential}
                            >
                                <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-100">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-950 border-zinc-800">
                                    {Object.entries(CREDENTIAL_TYPES).map(([key, value]) => (
                                        <SelectItem key={key} value={key}>
                                            <span className="flex items-center gap-2">
                                                <value.icon className={cn('w-4 h-4', value.color)} />
                                                {value.label}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Dynamic Fields */}
                        <div className="space-y-3 pt-2">
                            <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                Credential Details
                            </div>
                            {config.fields.map((field) => (
                                <div key={field.name} className="space-y-1.5">
                                    <Label className="text-zinc-400 text-xs flex items-center gap-1">
                                        {field.label}
                                        {field.required && <span className="text-red-400">*</span>}
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            type={
                                                field.type === 'password' && !showPasswords.has(field.name)
                                                    ? 'password'
                                                    : field.type === 'password'
                                                    ? 'text'
                                                    : field.type
                                            }
                                            value={data[field.name] || ''}
                                            onChange={(e) =>
                                                setData((prev) => ({ ...prev, [field.name]: e.target.value }))
                                            }
                                            placeholder={field.placeholder}
                                            className="bg-zinc-900 border-zinc-800 text-zinc-100 pr-10"
                                        />
                                        {field.type === 'password' && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                                                onClick={() => toggleShowPassword(field.name)}
                                            >
                                                {showPasswords.has(field.name) ? (
                                                    <EyeOff className="w-4 h-4" />
                                                ) : (
                                                    <Eye className="w-4 h-4" />
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Security Notice */}
                        <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                            <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5" />
                            <div className="text-xs text-amber-200">
                                Credentials are encrypted and stored securely. Never share them with untrusted workflows.
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="bg-transparent border-zinc-800 text-zinc-100 hover:bg-zinc-800"
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-500 text-white">
                        <Save className="w-4 h-4 mr-2" />
                        Save Credential
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function CredentialManager({
    isOpen,
    onClose,
    onSelectCredential,
    selectedType,
}: CredentialManagerProps) {
    const [credentials, setCredentials] = useState<Credential[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [editingCredential, setEditingCredential] = useState<Credential | undefined>();
    const [isEditorOpen, setIsEditorOpen] = useState(false);

    // Load credentials
    useEffect(() => {
        if (isOpen) {
            // Mock data for development
            setCredentials([
                {
                    id: 'cred-1',
                    name: 'OpenAI Production',
                    type: 'openai',
                    data: { apiKey: 'sk-...hidden...' },
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    usedBy: ['agent_1', 'agent_3'],
                },
                {
                    id: 'cred-2',
                    name: 'PostgreSQL Main',
                    type: 'database',
                    data: { host: 'localhost', port: '5432', database: 'app', username: 'user' },
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    usedBy: [],
                },
            ]);
            setLoading(false);
        }
    }, [isOpen]);

    const handleSaveCredential = (data: Omit<Credential, 'id' | 'createdAt' | 'updatedAt' | 'usedBy'>) => {
        if (editingCredential) {
            // Update
            setCredentials((prev) =>
                prev.map((c) =>
                    c.id === editingCredential.id
                        ? { ...c, ...data, updatedAt: new Date().toISOString() }
                        : c
                )
            );
            toast.success('Credential updated');
        } else {
            // Create
            const newCredential: Credential = {
                ...data,
                id: `cred-${Date.now()}`,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                usedBy: [],
            };
            setCredentials((prev) => [...prev, newCredential]);
            toast.success('Credential created');
        }
        setEditingCredential(undefined);
    };

    const handleDeleteCredential = (id: string) => {
        const credential = credentials.find((c) => c.id === id);
        if (credential?.usedBy.length) {
            toast.error('Cannot delete: credential is in use');
            return;
        }
        setCredentials((prev) => prev.filter((c) => c.id !== id));
        toast.success('Credential deleted');
    };

    // Filter credentials
    const filteredCredentials = credentials.filter((cred) => {
        if (selectedType && cred.type !== selectedType) return false;
        if (typeFilter !== 'all' && cred.type !== typeFilter) return false;
        if (searchQuery && !cred.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    if (!isOpen) return null;

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-indigo-400" />
                            Credentials Manager
                        </DialogTitle>
                        <DialogDescription className="text-zinc-400">
                            Manage your API keys, OAuth tokens, and other secrets securely.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Toolbar */}
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                            <Input
                                placeholder="Search credentials..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-zinc-900 border-zinc-800 text-zinc-100"
                            />
                        </div>
                        {!selectedType && (
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger className="w-[150px] bg-zinc-900 border-zinc-800 text-zinc-100">
                                    <SelectValue placeholder="All Types" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-950 border-zinc-800">
                                    <SelectItem value="all">All Types</SelectItem>
                                    {Object.entries(CREDENTIAL_TYPES).map(([key, value]) => (
                                        <SelectItem key={key} value={key}>
                                            {value.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                        <Button
                            onClick={() => {
                                setEditingCredential(undefined);
                                setIsEditorOpen(true);
                            }}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add New
                        </Button>
                    </div>

                    {/* Credentials List */}
                    <div className="h-[400px] overflow-auto pr-4">
                        {loading ? (
                            <div className="flex items-center justify-center h-48">
                                <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                            </div>
                        ) : filteredCredentials.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 text-center">
                                <Key className="w-12 h-12 text-zinc-500 mb-3" />
                                <p className="text-zinc-400">No credentials found</p>
                                <p className="text-xs text-zinc-500 mt-1">
                                    Add your first credential to get started
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {filteredCredentials.map((credential) => (
                                    <CredentialCard
                                        key={credential.id}
                                        credential={credential}
                                        onEdit={() => {
                                            setEditingCredential(credential);
                                            setIsEditorOpen(true);
                                        }}
                                        onDelete={() => handleDeleteCredential(credential.id)}
                                        onSelect={
                                            onSelectCredential
                                                ? () => {
                                                      onSelectCredential(credential.id);
                                                      onClose();
                                                  }
                                                : undefined
                                        }
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Credential Editor */}
            <CredentialEditor
                credential={editingCredential}
                isOpen={isEditorOpen}
                onClose={() => {
                    setIsEditorOpen(false);
                    setEditingCredential(undefined);
                }}
                onSave={handleSaveCredential}
            />
        </>
    );
}

export default memo(CredentialManager);
