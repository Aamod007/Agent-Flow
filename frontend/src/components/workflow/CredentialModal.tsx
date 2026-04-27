import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, ExternalLink, CheckCircle, AlertCircle, Eye, EyeOff, Info } from 'lucide-react';
import { toast } from 'sonner';
import type { ConnectionProvider, SavedConnection } from '@/lib/connections';
import { startOAuthFlow } from '@/lib/connections';
import { api } from '@/lib/api';

interface CredentialModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider: ConnectionProvider | null;
  existingConnection?: SavedConnection | null;
  onSuccess?: (connection: SavedConnection) => void;
}

// n8n-style credential modal for connecting apps
export function CredentialModal({ 
  open, 
  onOpenChange, 
  provider, 
  existingConnection,
  onSuccess 
}: CredentialModalProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [connectionName, setConnectionName] = useState('');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  // Reset form when provider changes
  useEffect(() => {
    if (provider) {
      setConnectionName(existingConnection?.name || `My ${provider.name}`);
      setFormData({});
      setShowPasswords({});
      setTestStatus('idle');
      setTestMessage('');
    }
  }, [provider, existingConnection]);

  if (!provider) return null;

  const handleOAuthConnect = () => {
    setIsConnecting(true);
    
    startOAuthFlow(
      provider,
      // On success
      (connection) => {
        setIsConnecting(false);
        toast.success(`Connected to ${provider.name}!`);
        onSuccess?.(connection);
        onOpenChange(false);
      },
      // On error
      (error) => {
        setIsConnecting(false);
        toast.error(error);
      }
    );
  };

  const handleCredentialSubmit = async () => {
    // Validate required fields
    const missingFields = (provider.fields || [])
      .filter(f => f.required && !formData[f.id])
      .map(f => f.label);
    
    if (missingFields.length > 0) {
      toast.error(`Please fill in: ${missingFields.join(', ')}`);
      return;
    }

    setIsConnecting(true);
    
    try {
      const result = await api.createConnection({
        providerId: provider.id,
        name: connectionName,
        credentials: formData,
      });

      toast.success(`Connected to ${provider.name}!`);
      onSuccess?.(result);
      onOpenChange(false);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save connection';
      toast.error(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleTestConnection = async () => {
    if (!existingConnection && provider.authType !== 'oauth2') {
      // For new connections, save first then test
      toast.info('Save the connection first, then test it.');
      return;
    }

    setIsTesting(true);
    setTestStatus('testing');
    setTestMessage('Testing connection...');

    try {
      // If we have an existing connection, test it
      const id = existingConnection?.id;
      if (id) {
        const result = await api.testConnection(id);
        if (result.success) {
          setTestStatus('success');
          setTestMessage('Connection successful!');
        } else {
          setTestStatus('error');
          setTestMessage(result.error || 'Connection failed');
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Connection test failed';
      setTestStatus('error');
      setTestMessage(errorMessage);
    } finally {
      setIsTesting(false);
    }
  };

  const renderOAuthContent = () => (
    <div className="space-y-6 py-4">
      <div className="text-center space-y-4">
        <div 
          className="w-20 h-20 rounded-xl mx-auto flex items-center justify-center text-4xl"
          style={{ backgroundColor: `${provider.color}15` }}
        >
          {getProviderEmoji(provider.id)}
        </div>
        
        <div>
          <h3 className="font-medium text-lg">Connect to {provider.name}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {provider.description}
          </p>
        </div>
      </div>

      <div className="bg-muted/50 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium">How it works</p>
            <p className="text-muted-foreground mt-1">
              Click the button below to sign in with {provider.name}. 
              A popup window will open where you can authorize AgentFlow to access your account.
            </p>
          </div>
        </div>
      </div>

      {provider.oauth?.scopes && provider.oauth.scopes.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Permissions requested:</Label>
          <div className="flex flex-wrap gap-2">
            {provider.oauth.scopes.map((scope) => (
              <Badge key={scope} variant="secondary" className="text-xs">
                {formatScope(scope)}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderCredentialFields = () => (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="connectionName">Connection Name</Label>
        <Input
          id="connectionName"
          value={connectionName}
          onChange={(e) => setConnectionName(e.target.value)}
          placeholder={`My ${provider.name}`}
        />
      </div>

      {provider.fields?.map((field) => (
        <div key={field.id} className="space-y-2">
          <Label htmlFor={field.id}>
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          
          {field.type === 'select' ? (
            <Select
              value={formData[field.id] || ''}
              onValueChange={(value) => setFormData({ ...formData, [field.id]: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="relative">
              <Input
                id={field.id}
                type={
                  field.type === 'password' && !showPasswords[field.id]
                    ? 'password'
                    : 'text'
                }
                value={formData[field.id] || ''}
                onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                placeholder={field.placeholder}
                className="pr-10"
              />
              {field.type === 'password' && (
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPasswords({ 
                    ...showPasswords, 
                    [field.id]: !showPasswords[field.id] 
                  })}
                >
                  {showPasswords[field.id] ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          )}
          
          {field.helpText && (
            <p className="text-xs text-muted-foreground">{field.helpText}</p>
          )}
        </div>
      ))}

      {/* Test status display */}
      {testStatus !== 'idle' && (
        <div className={`flex items-center gap-2 p-3 rounded-lg ${
          testStatus === 'testing' ? 'bg-blue-500/10 text-blue-600' :
          testStatus === 'success' ? 'bg-green-500/10 text-green-600' :
          'bg-red-500/10 text-red-600'
        }`}>
          {testStatus === 'testing' && <Loader2 className="w-4 h-4 animate-spin" />}
          {testStatus === 'success' && <CheckCircle className="w-4 h-4" />}
          {testStatus === 'error' && <AlertCircle className="w-4 h-4" />}
          <span className="text-sm">{testMessage}</span>
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span 
              className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
              style={{ backgroundColor: `${provider.color}15` }}
            >
              {getProviderEmoji(provider.id)}
            </span>
            {existingConnection ? 'Edit' : 'New'} {provider.name} Connection
          </DialogTitle>
          <DialogDescription>
            {provider.authType === 'oauth2' 
              ? 'Sign in to connect your account securely.'
              : 'Enter your credentials to connect.'
            }
          </DialogDescription>
        </DialogHeader>

        {provider.authType === 'oauth2' ? renderOAuthContent() : renderCredentialFields()}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {provider.docsUrl && (
            <Button variant="ghost" size="sm" asChild className="mr-auto">
              <a href={provider.docsUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-1" />
                Docs
              </a>
            </Button>
          )}
          
          {provider.authType !== 'oauth2' && existingConnection && (
            <Button 
              variant="outline" 
              onClick={handleTestConnection}
              disabled={isTesting}
            >
              {isTesting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Test
            </Button>
          )}
          
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          
          {provider.authType === 'oauth2' ? (
            <Button 
              onClick={handleOAuthConnect} 
              disabled={isConnecting}
              style={{ backgroundColor: provider.color }}
              className="text-white hover:opacity-90"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  Sign in with {provider.name}
                </>
              )}
            </Button>
          ) : (
            <Button 
              onClick={handleCredentialSubmit}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Connection'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helper functions
function getProviderEmoji(providerId: string): string {
  const emojiMap: Record<string, string> = {
    slack: '💬',
    discord: '🎮',
    gmail: '📧',
    notion: '📝',
    'google-calendar': '📅',
    'google-sheets': '📊',
    github: '🐙',
    gitlab: '🦊',
    jira: '🎯',
    'google-drive': '📁',
    dropbox: '📦',
    webhook: '🔗',
    'http-api': '🌐',
    openai: '🤖',
    anthropic: '🧠',
    trello: '📋',
    airtable: '🗃️',
    asana: '✅',
    shopify: '🛒',
    stripe: '💳',
    hubspot: '🔶',
    salesforce: '☁️',
    twilio: '📱',
    sendgrid: '✉️',
    telegram: '📨',
    aws: '☁️',
    azure: '🔷',
    mongodb: '🍃',
    postgresql: '🐘',
  };
  return emojiMap[providerId] || '🔌';
}

function formatScope(scope: string): string {
  // Convert OAuth scopes to readable format
  return scope
    .replace(/https?:\/\/[^/]+\/auth\//g, '')
    .replace(/[._]/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, l => l.toUpperCase());
}

export default CredentialModal;
