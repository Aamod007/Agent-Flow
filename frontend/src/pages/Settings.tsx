import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
    User,
    Bell,
    Key,
    Globe,
    Palette,
    Shield,
    CreditCard,
    LogOut,
    ChevronRight,
    Check,
    Moon,
    Sun,
    Monitor,
    Save,
    Loader2,
    Plus,
    Trash2,
    AlertCircle,
    Camera,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import type { User as UserType, UserSettings as UserSettingsType, ApiKey } from "@/lib/api";
import { toast } from "sonner";
import { useTheme } from "@/hooks/use-theme";

interface SettingsSection {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
}

const SECTIONS: SettingsSection[] = [
    { id: "profile", label: "Profile", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "api-keys", label: "API Keys", icon: Key },
    { id: "integrations", label: "Integrations", icon: Globe },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "security", label: "Security", icon: Shield },
    { id: "billing", label: "Billing", icon: CreditCard },
];

function SettingsNav({
    activeSection,
    onSectionChange
}: {
    activeSection: string;
    onSectionChange: (id: string) => void
}) {
    return (
        <nav className="space-y-1">
            {SECTIONS.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;

                return (
                    <button
                        key={section.id}
                        onClick={() => onSectionChange(section.id)}
                        className={cn(
                            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                            isActive
                                ? "bg-primary/15 text-primary"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                    >
                        <Icon className="w-4 h-4" />
                        {section.label}
                        <ChevronRight className={cn(
                            "w-4 h-4 ml-auto transition-transform",
                            isActive && "text-primary"
                        )} />
                    </button>
                );
            })}

            <Separator className="my-4 bg-border" />

            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                <LogOut className="w-4 h-4" />
                Sign Out
            </button>
        </nav>
    );
}

function ProfileSettings({ user, onUpdate }: { user: UserType | null; onUpdate: () => void }) {
    const [saving, setSaving] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        company: '',
        role: ''
    });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                company: user.company || '',
                role: user.role || ''
            });
            if (user.avatar) {
                setAvatarPreview(user.avatar);
            }
        }
    }, [user]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.updateUser(formData);
            toast.success('Profile updated successfully');
            onUpdate();
        } catch (error) {
            toast.error('Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        // Validate file size (2MB max)
        if (file.size > 2 * 1024 * 1024) {
            toast.error('Image must be less than 2MB');
            return;
        }

        setUploadingAvatar(true);

        // Create preview
        const reader = new FileReader();
        reader.onload = (event) => {
            setAvatarPreview(event.target?.result as string);
        };
        reader.readAsDataURL(file);

        try {
            // Upload avatar
            const formData = new FormData();
            formData.append('avatar', file);
            
            await api.uploadAvatar(formData);
            toast.success('Avatar updated successfully');
            onUpdate();
        } catch (error) {
            toast.error('Failed to upload avatar');
            // Revert preview on error
            setAvatarPreview(user?.avatar || null);
        } finally {
            setUploadingAvatar(false);
        }
    };

    const getInitials = () => {
        if (!user?.name) return 'U';
        return user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <div className="space-y-5">
            <div>
                <h2 className="text-lg font-semibold text-foreground">Profile</h2>
                <p className="text-sm text-muted-foreground">
                    Manage your account information
                </p>
            </div>

            <Card className="bg-card border-border">
                <CardContent className="p-5 space-y-5">
                    <div className="flex items-center gap-5">
                        <div 
                            className="relative w-16 h-16 cursor-pointer group"
                            onClick={handleAvatarClick}
                        >
                            {avatarPreview ? (
                                <img 
                                    src={avatarPreview} 
                                    alt="Avatar" 
                                    className="w-16 h-16 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl font-bold text-white">
                                    {getInitials()}
                                </div>
                            )}
                            {/* Overlay on hover */}
                            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                {uploadingAvatar ? (
                                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                                ) : (
                                    <Camera className="w-5 h-5 text-white" />
                                )}
                            </div>
                        </div>
                        <input 
                            type="file"
                            ref={fileInputRef}
                            onChange={handleAvatarChange}
                            accept="image/*"
                            className="hidden"
                        />
                        <div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleAvatarClick}
                                disabled={uploadingAvatar}
                                className="h-8 bg-transparent border-border text-foreground hover:bg-muted"
                            >
                                {uploadingAvatar ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    'Change Avatar'
                                )}
                            </Button>
                            <p className="text-xs text-muted-foreground mt-1.5">
                                JPG, GIF or PNG. Max 2MB
                            </p>
                        </div>
                    </div>

                    <Separator className="bg-border" />

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label className="text-sm text-foreground">Full Name</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                className="h-9 bg-background border-border text-foreground focus:border-primary/50"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-sm text-foreground">Email</Label>
                            <Input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                className="h-9 bg-background border-border text-foreground focus:border-primary/50"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-sm text-foreground">Company</Label>
                            <Input
                                value={formData.company}
                                onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                                className="h-9 bg-background border-border text-foreground focus:border-primary/50"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-sm text-foreground">Role</Label>
                            <Input
                                value={formData.role}
                                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                                className="h-9 bg-background border-border text-foreground focus:border-primary/50"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    size="sm"
                    className="h-8 bg-primary hover:bg-primary/90"
                >
                    {saving ? (
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    ) : (
                        <Save className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    Save Changes
                </Button>
            </div>
        </div>
    );
}

function APIKeysSettings() {
    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [newKey, setNewKey] = useState({ name: '', provider: 'gemini', key: '' });
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const loadKeys = async () => {
        try {
            const data = await api.getApiKeys();
            setKeys(data);
        } catch (error) {
            toast.error('Failed to load API keys');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadKeys();
    }, []);

    const handleAddKey = async () => {
        if (!newKey.name || !newKey.key) {
            toast.error('Please fill in all fields');
            return;
        }
        setSaving(true);
        try {
            await api.addApiKey(newKey);
            toast.success('API key added successfully');
            setDialogOpen(false);
            setNewKey({ name: '', provider: 'gemini', key: '' });
            loadKeys();
        } catch (error) {
            toast.error('Failed to add API key');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteKey = async (id: string) => {
        setDeletingId(id);
        try {
            await api.deleteApiKey(id);
            toast.success('API key deleted');
            loadKeys();
        } catch (error) {
            toast.error('Failed to delete API key');
        } finally {
            setDeletingId(null);
        }
    };

    const handleToggleStatus = async (key: ApiKey) => {
        try {
            await api.updateApiKey(key.id, {
                status: key.status === 'active' ? 'inactive' : 'active'
            });
            loadKeys();
        } catch (error) {
            toast.error('Failed to update API key');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <div>
                <h2 className="text-lg font-semibold text-foreground">API Keys</h2>
                <p className="text-sm text-muted-foreground">
                    Manage your AI model provider API keys
                </p>
            </div>

            <Card className="bg-card border-border">
                <CardContent className="p-5 space-y-3">
                    {keys.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Key className="w-10 h-10 mx-auto mb-3 opacity-50" />
                            <p className="text-sm">No API keys configured</p>
                            <p className="text-xs mt-1">Add your first API key to get started</p>
                        </div>
                    ) : (
                        keys.map((apiKey) => (
                            <div
                                key={apiKey.id}
                                className={cn(
                                    "flex items-center justify-between p-3 rounded-lg",
                                    "bg-background border border-border"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => handleToggleStatus(apiKey)}
                                        className={cn(
                                            "w-2 h-2 rounded-full cursor-pointer transition-colors",
                                            apiKey.status === "active" ? "bg-emerald-500" : "bg-muted-foreground"
                                        )}
                                        title={`Click to ${apiKey.status === 'active' ? 'deactivate' : 'activate'}`}
                                    />
                                    <div>
                                        <p className="text-sm font-medium text-foreground">{apiKey.name}</p>
                                        <p className="text-xs font-mono text-muted-foreground">
                                            {apiKey.key} • {apiKey.provider}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteKey(apiKey.id)}
                                        disabled={deletingId === apiKey.id}
                                        className="h-7 text-red-400 hover:bg-red-500/10 hover:text-red-400"
                                    >
                                        {deletingId === apiKey.id ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                            <Trash2 className="w-3.5 h-3.5" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>

            <Button
                onClick={() => setDialogOpen(true)}
                size="sm"
                className="h-8 bg-primary hover:bg-primary/90"
            >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Add API Key
            </Button>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="bg-popover border-border">
                    <DialogHeader>
                        <DialogTitle className="text-foreground">Add API Key</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Add a new AI provider API key to use in your workflows
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-1.5">
                            <Label className="text-sm text-foreground">Name</Label>
                            <Input
                                placeholder="My Gemini Key"
                                value={newKey.name}
                                onChange={(e) => setNewKey(prev => ({ ...prev, name: e.target.value }))}
                                className="h-9 bg-background border-border text-foreground"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-sm text-foreground">Provider</Label>
                            <Select
                                value={newKey.provider}
                                onValueChange={(value) => setNewKey(prev => ({ ...prev, provider: value }))}
                            >
                                <SelectTrigger className="h-9 bg-background border-border text-foreground">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border">
                                    <SelectItem value="gemini">Gemini (Google)</SelectItem>
                                    <SelectItem value="openai">OpenAI</SelectItem>
                                    <SelectItem value="groq">Groq</SelectItem>
                                    <SelectItem value="ollama">Ollama (Local)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-sm text-foreground">API Key</Label>
                            <Input
                                type="password"
                                placeholder="sk-..."
                                value={newKey.key}
                                onChange={(e) => setNewKey(prev => ({ ...prev, key: e.target.value }))}
                                className="h-9 bg-background border-border text-foreground"
                            />
                        </div>

                        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                            <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                            <p className="text-xs text-amber-200">
                                Your API keys are stored securely and only used for executing your workflows.
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDialogOpen(false)}
                            className="h-8 bg-transparent border-border text-foreground"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddKey}
                            disabled={saving}
                            size="sm"
                            className="h-8 bg-primary hover:bg-primary/90"
                        >
                            {saving ? (
                                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                            ) : (
                                <Plus className="w-3.5 h-3.5 mr-1.5" />
                            )}
                            Add Key
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function AppearanceSettings({ settings, onUpdate }: { settings: UserSettingsType | null; onUpdate: () => void }) {
    const [saving, setSaving] = useState(false);
    const { theme, setTheme: applyTheme } = useTheme();
    const [accentColor, setAccentColor] = useState<string>("indigo");

    useEffect(() => {
        if (settings) {
            setAccentColor(settings.accentColor);
        }
    }, [settings]);

    const handleSaveTheme = async (newTheme: "dark" | "light" | "system") => {
        setSaving(true);
        try {
            // Apply theme visually first
            applyTheme(newTheme);
            // Then save to API
            await api.updateUserSettings({ theme: newTheme });
            toast.success(`Theme changed to ${newTheme}`);
            onUpdate();
        } catch (error) {
            toast.error('Failed to update theme');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveAccent = async (color: string) => {
        setAccentColor(color);
        try {
            await api.updateUserSettings({ accentColor: color });
            onUpdate();
        } catch (error) {
            toast.error('Failed to update accent color');
        }
    };

    const themes = [
        { id: "dark", label: "Dark", icon: Moon },
        { id: "light", label: "Light", icon: Sun },
        { id: "system", label: "System", icon: Monitor },
    ] as const;

    const colors = [
        { id: "indigo", class: "bg-indigo-500" },
        { id: "purple", class: "bg-purple-500" },
        { id: "pink", class: "bg-pink-500" },
        { id: "cyan", class: "bg-cyan-500" },
        { id: "emerald", class: "bg-emerald-500" },
        { id: "amber", class: "bg-amber-500" },
    ];

    return (
        <div className="space-y-5">
            <div>
                <h2 className="text-lg font-semibold text-foreground">Appearance</h2>
                <p className="text-sm text-muted-foreground">
                    Customize the look and feel of the application
                </p>
            </div>

            <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-card-foreground flex items-center gap-2">
                        Theme
                        {saving && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-3">
                        {themes.map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                onClick={() => handleSaveTheme(id)}
                                className={cn(
                                    "flex-1 flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors",
                                    theme === id
                                        ? "bg-primary/10 border-primary"
                                        : "bg-background border-border hover:border-muted-foreground"
                                )}
                            >
                                <Icon className={cn(
                                    "w-5 h-5",
                                    theme === id ? "text-primary" : "text-muted-foreground"
                                )} />
                                <span className={cn(
                                    "text-sm font-medium",
                                    theme === id ? "text-primary" : "text-foreground"
                                )}>
                                    {label}
                                </span>
                                {theme === id && (
                                    <Check className="w-3.5 h-3.5 text-primary" />
                                )}
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-card-foreground">Accent Color</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2.5">
                        {colors.map((color) => (
                            <button
                                key={color.id}
                                onClick={() => handleSaveAccent(color.id)}
                                className={cn(
                                    "w-7 h-7 rounded-full transition-transform hover:scale-110",
                                    color.class,
                                    accentColor === color.id && "ring-2 ring-white ring-offset-2 ring-offset-background"
                                )}
                            />
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function IntegrationsSettings() {
    const integrations = [
        { id: 'slack', name: 'Slack', icon: '💬', description: 'Send notifications to Slack channels', connected: false },
        { id: 'discord', name: 'Discord', icon: '🎮', description: 'Integrate with Discord servers', connected: false },
        { id: 'github', name: 'GitHub', icon: '🐙', description: 'Trigger workflows from GitHub events', connected: true },
        { id: 'notion', name: 'Notion', icon: '📝', description: 'Sync data with Notion databases', connected: false },
        { id: 'zapier', name: 'Zapier', icon: '⚡', description: 'Connect with 5000+ apps', connected: false },
        { id: 'webhook', name: 'Webhooks', icon: '🔗', description: 'Custom HTTP webhook integrations', connected: true },
    ];

    return (
        <div className="space-y-5">
            <div>
                <h2 className="text-lg font-semibold text-foreground">Integrations</h2>
                <p className="text-sm text-muted-foreground">
                    Connect external services to extend your workflows
                </p>
            </div>

            <Card className="bg-card border-border">
                <CardContent className="p-5 space-y-3">
                    {integrations.map((integration) => (
                        <div
                            key={integration.id}
                            className={cn(
                                "flex items-center justify-between p-3 rounded-lg",
                                "bg-background border border-border"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{integration.icon}</span>
                                <div>
                                    <p className="text-sm font-medium text-foreground">{integration.name}</p>
                                    <p className="text-xs text-muted-foreground">{integration.description}</p>
                                </div>
                            </div>
                            <Button
                                variant={integration.connected ? "outline" : "default"}
                                size="sm"
                                className={cn(
                                    "h-7",
                                    integration.connected
                                        ? "bg-transparent border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                                        : "bg-primary hover:bg-primary/90 text-white"
                                )}
                            >
                                {integration.connected ? (
                                    <>
                                        <Check className="w-3.5 h-3.5 mr-1.5" />
                                        Connected
                                    </>
                                ) : (
                                    'Connect'
                                )}
                            </Button>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}

function SecuritySettings() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

    const sessions = [
        { id: '1', device: 'Windows PC - Chrome', location: 'San Francisco, US', lastActive: 'Active now', current: true },
        { id: '2', device: 'MacBook Pro - Safari', location: 'New York, US', lastActive: '2 hours ago', current: false },
        { id: '3', device: 'iPhone - AgentFlow App', location: 'San Francisco, US', lastActive: '1 day ago', current: false },
    ];

    return (
        <div className="space-y-5">
            <div>
                <h2 className="text-lg font-semibold text-foreground">Security</h2>
                <p className="text-sm text-muted-foreground">
                    Manage your password and security settings
                </p>
            </div>

            <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-card-foreground">Change Password</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                        <Label className="text-sm text-foreground">Current Password</Label>
                        <Input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="h-9 bg-background border-border text-foreground"
                        />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label className="text-sm text-foreground">New Password</Label>
                            <Input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="h-9 bg-background border-border text-foreground"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-sm text-foreground">Confirm Password</Label>
                            <Input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="h-9 bg-background border-border text-foreground"
                            />
                        </div>
                    </div>
                    <Button size="sm" className="h-8 bg-primary hover:bg-primary/90">
                        Update Password
                    </Button>
                </CardContent>
            </Card>

            <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-card-foreground">Two-Factor Authentication</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-foreground">
                                {twoFactorEnabled ? 'Two-factor authentication is enabled' : 'Add an extra layer of security'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Use an authenticator app to generate verification codes
                            </p>
                        </div>
                        <button
                            onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                            className={cn(
                                "w-10 h-5 rounded-full transition-colors relative",
                                twoFactorEnabled ? "bg-primary" : "bg-muted"
                            )}
                        >
                            <div className={cn(
                                "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
                                twoFactorEnabled ? "translate-x-5" : "translate-x-0.5"
                            )} />
                        </button>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-card-foreground">Active Sessions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {sessions.map((session) => (
                        <div
                            key={session.id}
                            className={cn(
                                "flex items-center justify-between p-3 rounded-lg",
                                "bg-background border border-border"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                {session.current && (
                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                )}
                                <div>
                                    <p className="text-sm font-medium text-foreground">{session.device}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {session.location} • {session.lastActive}
                                    </p>
                                </div>
                            </div>
                            {!session.current && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-red-400 hover:bg-red-500/10 hover:text-red-400"
                                >
                                    Revoke
                                </Button>
                            )}
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}

function BillingSettings() {
    const plans = [
        { id: 'free', name: 'Free', price: '$0', period: '/month', features: ['5 workflows', '100 executions/mo', 'Community support'], current: true },
        { id: 'pro', name: 'Pro', price: '$29', period: '/month', features: ['Unlimited workflows', '10,000 executions/mo', 'Priority support', 'Advanced analytics'], current: false, popular: true },
        { id: 'enterprise', name: 'Enterprise', price: 'Custom', period: '', features: ['Unlimited everything', 'Dedicated support', 'Custom integrations', 'SLA guarantee'], current: false },
    ];

    const usage = {
        workflows: { used: 3, limit: 5 },
        executions: { used: 47, limit: 100 },
    };

    return (
        <div className="space-y-5">
            <div>
                <h2 className="text-lg font-semibold text-foreground">Billing</h2>
                <p className="text-sm text-muted-foreground">
                    Manage your subscription and usage
                </p>
            </div>

            <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-card-foreground">Current Usage</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">Workflows</span>
                            <span className="text-sm text-foreground">{usage.workflows.used} / {usage.workflows.limit}</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                                className="h-full bg-indigo-500 rounded-full"
                                style={{ width: `${(usage.workflows.used / usage.workflows.limit) * 100}%` }}
                            />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">Executions this month</span>
                            <span className="text-sm text-foreground">{usage.executions.used} / {usage.executions.limit}</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                                className="h-full bg-purple-500 rounded-full"
                                style={{ width: `${(usage.executions.used / usage.executions.limit) * 100}%` }}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div>
                <h3 className="text-sm font-medium text-foreground mb-3">Available Plans</h3>
                <div className="grid gap-4 md:grid-cols-3">
                    {plans.map((plan) => (
                        <Card
                            key={plan.id}
                            className={cn(
                                "bg-card border-border relative",
                                plan.popular && "border-indigo-500/50 ring-1 ring-indigo-500/20"
                            )}
                        >
                            {plan.popular && (
                                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-indigo-600 text-[10px] font-medium text-white">
                                    Most Popular
                                </div>
                            )}
                            <CardContent className="p-4">
                                <h4 className="text-sm font-semibold text-foreground">{plan.name}</h4>
                                <div className="mt-2">
                                    <span className="text-2xl font-bold text-foreground">{plan.price}</span>
                                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                                </div>
                                <ul className="mt-3 space-y-1.5">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                <Button
                                    size="sm"
                                    className={cn(
                                        "w-full mt-4 h-8",
                                        plan.current
                                            ? "bg-muted text-muted-foreground cursor-default hover:bg-muted"
                                            : "bg-primary hover:bg-primary/90 text-white"
                                    )}
                                    disabled={plan.current}
                                >
                                    {plan.current ? 'Current Plan' : 'Upgrade'}
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}

function NotificationsSettings({ settings, onUpdate }: { settings: UserSettingsType | null; onUpdate: () => void }) {
    const [notifications, setNotifications] = useState({
        emailNotifications: true,
        browserNotifications: true,
        workflowComplete: true,
        workflowFailed: true,
        weeklyReport: false,
    });
    const [browserPermission, setBrowserPermission] = useState<NotificationPermission>('default');

    useEffect(() => {
        // Check current browser notification permission
        if ('Notification' in window) {
            setBrowserPermission(Notification.permission);
        }
    }, []);

    useEffect(() => {
        if (settings) {
            setNotifications({
                emailNotifications: settings.emailNotifications,
                browserNotifications: settings.browserNotifications,
                workflowComplete: settings.workflowComplete,
                workflowFailed: settings.workflowFailed,
                weeklyReport: settings.weeklyReport,
            });
        }
    }, [settings]);

    const requestBrowserPermission = async () => {
        if (!('Notification' in window)) {
            toast.error('Browser notifications are not supported');
            return;
        }

        try {
            const permission = await Notification.requestPermission();
            setBrowserPermission(permission);
            
            if (permission === 'granted') {
                toast.success('Browser notifications enabled!');
                // Show a test notification
                new Notification('AgentFlow', {
                    body: 'Browser notifications are now enabled!',
                    icon: '/favicon.ico'
                });
            } else if (permission === 'denied') {
                toast.error('Browser notifications were denied. Please enable them in your browser settings.');
            }
        } catch (error) {
            toast.error('Failed to request notification permission');
        }
    };

    const toggleNotification = async (key: keyof typeof notifications) => {
        // Special handling for browser notifications
        if (key === 'browserNotifications' && !notifications[key]) {
            if (browserPermission !== 'granted') {
                await requestBrowserPermission();
                if (Notification.permission !== 'granted') {
                    return; // Don't toggle if permission wasn't granted
                }
            }
        }

        const newValue = !notifications[key];
        setNotifications(prev => ({ ...prev, [key]: newValue }));

        try {
            await api.updateUserSettings({ [key]: newValue });
            toast.success(`${key === 'browserNotifications' ? 'Browser notifications' : 'Setting'} ${newValue ? 'enabled' : 'disabled'}`);
            onUpdate();
        } catch (error) {
            // Revert on error
            setNotifications(prev => ({ ...prev, [key]: !newValue }));
            toast.error('Failed to update notification settings');
        }
    };

    const sendTestNotification = () => {
        if (browserPermission !== 'granted') {
            toast.error('Please enable browser notifications first');
            return;
        }

        new Notification('AgentFlow Test', {
            body: 'This is a test notification. Your notifications are working!',
            icon: '/favicon.ico',
            tag: 'test-notification'
        });
        toast.success('Test notification sent!');
    };

    const notificationItems = [
        { key: "emailNotifications", label: "Email Notifications", desc: "Receive updates via email" },
        { key: "browserNotifications", label: "Browser Notifications", desc: "Show desktop notifications" },
        { key: "workflowComplete", label: "Workflow Completed", desc: "Notify when workflow finishes" },
        { key: "workflowFailed", label: "Workflow Failed", desc: "Alert on workflow errors" },
        { key: "weeklyReport", label: "Weekly Report", desc: "Receive weekly summary email" },
    ] as const;

    return (
        <div className="space-y-5">
            <div>
                <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
                <p className="text-sm text-muted-foreground">
                    Configure how you want to receive notifications
                </p>
            </div>

            {/* Browser Permission Status */}
            {browserPermission !== 'granted' && (
                <Card className="bg-amber-500/10 border-amber-500/20">
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-amber-200">
                                    Browser notifications are {browserPermission === 'denied' ? 'blocked' : 'not enabled'}
                                </p>
                                <p className="text-xs text-amber-300/70 mt-1">
                                    {browserPermission === 'denied' 
                                        ? 'You have blocked notifications. Please enable them in your browser settings.'
                                        : 'Enable browser notifications to receive alerts when workflows complete or fail.'}
                                </p>
                                {browserPermission !== 'denied' && (
                                    <Button
                                        onClick={requestBrowserPermission}
                                        size="sm"
                                        className="mt-3 h-7 bg-amber-600 hover:bg-amber-700 text-white"
                                    >
                                        <Bell className="w-3.5 h-3.5 mr-1.5" />
                                        Enable Notifications
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card className="bg-card border-border">
                <CardContent className="p-5 space-y-3">
                    {notificationItems.map(({ key, label, desc }) => (
                        <div key={key} className="flex items-center justify-between py-2">
                            <div>
                                <p className="text-sm font-medium text-foreground">{label}</p>
                                <p className="text-xs text-muted-foreground">{desc}</p>
                            </div>
                            <button
                                onClick={() => toggleNotification(key)}
                                className={cn(
                                    "w-10 h-5 rounded-full transition-colors relative",
                                    notifications[key]
                                        ? "bg-primary"
                                        : "bg-muted"
                                )}
                            >
                                <div className={cn(
                                    "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
                                    notifications[key]
                                        ? "translate-x-5"
                                        : "translate-x-0.5"
                                )} />
                            </button>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Test Notification Button */}
            {browserPermission === 'granted' && (
                <Button
                    onClick={sendTestNotification}
                    variant="outline"
                    size="sm"
                    className="h-8"
                >
                    <Bell className="w-3.5 h-3.5 mr-1.5" />
                    Send Test Notification
                </Button>
            )}
        </div>
    );
}

export default function Settings() {
    const [activeSection, setActiveSection] = useState("profile");
    const [user, setUser] = useState<UserType | null>(null);
    const [settings, setSettings] = useState<UserSettingsType | null>(null);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        try {
            const [userData, settingsData] = await Promise.all([
                api.getCurrentUser(),
                api.getUserSettings()
            ]);
            setUser(userData);
            setSettings(settingsData);
        } catch (error) {
            toast.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const renderSection = () => {
        if (loading) {
            return (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                </div>
            );
        }

        switch (activeSection) {
            case "profile":
                return <ProfileSettings user={user} onUpdate={loadData} />;
            case "api-keys":
                return <APIKeysSettings />;
            case "appearance":
                return <AppearanceSettings settings={settings} onUpdate={loadData} />;
            case "notifications":
                return <NotificationsSettings settings={settings} onUpdate={loadData} />;
            case "integrations":
                return <IntegrationsSettings />;
            case "security":
                return <SecuritySettings />;
            case "billing":
                return <BillingSettings />;
            default:
                return (
                    <div className="text-center py-12 text-muted-foreground">
                        <p className="text-sm">This section is coming soon</p>
                    </div>
                );
        }
    };

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-xl font-semibold text-foreground">
                    Settings
                </h1>
                <p className="text-muted-foreground text-sm mt-0.5">
                    Manage your account and preferences
                </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-5">
                {/* Sidebar */}
                <Card className="lg:w-56 shrink-0 bg-card border-border">
                    <CardContent className="p-3">
                        <SettingsNav
                            activeSection={activeSection}
                            onSectionChange={setActiveSection}
                        />
                    </CardContent>
                </Card>

                {/* Content */}
                <div className="flex-1">
                    {renderSection()}
                </div>
            </div>
        </div>
    );
}
