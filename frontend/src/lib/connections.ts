// Real connection configuration for OAuth providers
// Similar to n8n's credential system

export interface OAuthConfig {
    clientId: string;
    authUrl: string;
    tokenUrl: string;
    scopes: string[];
    redirectUri: string;
}

export interface ConnectionProvider {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    category: 'communication' | 'productivity' | 'development' | 'storage' | 'custom';
    authType: 'oauth2' | 'api_key' | 'basic' | 'webhook';
    oauth?: OAuthConfig;
    fields?: ConnectionField[];
    docsUrl?: string;
}

export interface ConnectionField {
    id: string;
    label: string;
    type: 'text' | 'password' | 'url' | 'select';
    placeholder?: string;
    required?: boolean;
    helpText?: string;
    options?: { value: string; label: string }[];
}

export interface SavedConnection {
    id: string;
    providerId: string;
    name: string;
    credentials: Record<string, string>;
    status: 'active' | 'expired' | 'error';
    connectedAt: string;
    lastUsed?: string;
    metadata?: Record<string, any>;
}

// Get the base URL for OAuth redirects
const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
        return window.location.origin;
    }
    return 'http://localhost:5173';
};

// Connection providers with real OAuth configurations
export const CONNECTION_PROVIDERS: ConnectionProvider[] = [
    // Communication
    {
        id: 'slack',
        name: 'Slack',
        description: 'Send messages, notifications, and manage channels',
        icon: 'slack',
        color: '#4A154B',
        category: 'communication',
        authType: 'oauth2',
        oauth: {
            clientId: '', // Set from environment
            authUrl: 'https://slack.com/oauth/v2/authorize',
            tokenUrl: 'https://slack.com/api/oauth.v2.access',
            scopes: ['chat:write', 'channels:read', 'users:read'],
            redirectUri: `${getBaseUrl()}/api/oauth/callback/slack`,
        },
        docsUrl: 'https://api.slack.com/docs',
    },
    {
        id: 'discord',
        name: 'Discord',
        description: 'Send messages to Discord channels and servers',
        icon: 'discord',
        color: '#5865F2',
        category: 'communication',
        authType: 'api_key',
        fields: [
            {
                id: 'botToken',
                label: 'Bot Token',
                type: 'password',
                placeholder: 'Enter your Discord bot token',
                required: true,
                helpText: 'Create a bot at discord.com/developers/applications',
            },
            {
                id: 'guildId',
                label: 'Server ID (optional)',
                type: 'text',
                placeholder: 'Your server/guild ID',
                helpText: 'Right-click server and copy ID (Developer Mode)',
            },
        ],
        docsUrl: 'https://discord.com/developers/docs',
    },
    {
        id: 'gmail',
        name: 'Gmail',
        description: 'Send and receive emails through Gmail',
        icon: 'gmail',
        color: '#EA4335',
        category: 'communication',
        authType: 'oauth2',
        oauth: {
            clientId: '', // Set from environment
            authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
            tokenUrl: 'https://oauth2.googleapis.com/token',
            scopes: ['https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/gmail.readonly'],
            redirectUri: `${getBaseUrl()}/api/oauth/callback/google`,
        },
        docsUrl: 'https://developers.google.com/gmail/api',
    },
    // Productivity
    {
        id: 'notion',
        name: 'Notion',
        description: 'Create pages, databases, and manage workspace',
        icon: 'notion',
        color: '#000000',
        category: 'productivity',
        authType: 'oauth2',
        oauth: {
            clientId: '', // Set from environment
            authUrl: 'https://api.notion.com/v1/oauth/authorize',
            tokenUrl: 'https://api.notion.com/v1/oauth/token',
            scopes: [],
            redirectUri: `${getBaseUrl()}/api/oauth/callback/notion`,
        },
        docsUrl: 'https://developers.notion.com/',
    },
    {
        id: 'google-calendar',
        name: 'Google Calendar',
        description: 'Create, update, and manage calendar events',
        icon: 'calendar',
        color: '#4285F4',
        category: 'productivity',
        authType: 'oauth2',
        oauth: {
            clientId: '', // Set from environment
            authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
            tokenUrl: 'https://oauth2.googleapis.com/token',
            scopes: ['https://www.googleapis.com/auth/calendar'],
            redirectUri: `${getBaseUrl()}/api/oauth/callback/google`,
        },
        docsUrl: 'https://developers.google.com/calendar',
    },
    {
        id: 'google-sheets',
        name: 'Google Sheets',
        description: 'Read and write data to Google Sheets',
        icon: 'sheets',
        color: '#0F9D58',
        category: 'productivity',
        authType: 'oauth2',
        oauth: {
            clientId: '', // Set from environment
            authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
            tokenUrl: 'https://oauth2.googleapis.com/token',
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            redirectUri: `${getBaseUrl()}/api/oauth/callback/google`,
        },
        docsUrl: 'https://developers.google.com/sheets',
    },
    // Development
    {
        id: 'github',
        name: 'GitHub',
        description: 'Manage repositories, issues, and pull requests',
        icon: 'github',
        color: '#181717',
        category: 'development',
        authType: 'oauth2',
        oauth: {
            clientId: '', // Set from environment
            authUrl: 'https://github.com/login/oauth/authorize',
            tokenUrl: 'https://github.com/login/oauth/access_token',
            scopes: ['repo', 'read:user', 'read:org'],
            redirectUri: `${getBaseUrl()}/api/oauth/callback/github`,
        },
        docsUrl: 'https://docs.github.com/en/rest',
    },
    {
        id: 'gitlab',
        name: 'GitLab',
        description: 'Manage GitLab projects, issues, and pipelines',
        icon: 'gitlab',
        color: '#FC6D26',
        category: 'development',
        authType: 'oauth2',
        oauth: {
            clientId: '', // Set from environment
            authUrl: 'https://gitlab.com/oauth/authorize',
            tokenUrl: 'https://gitlab.com/oauth/token',
            scopes: ['api', 'read_user'],
            redirectUri: `${getBaseUrl()}/api/oauth/callback/gitlab`,
        },
        docsUrl: 'https://docs.gitlab.com/ee/api/',
    },
    {
        id: 'jira',
        name: 'Jira',
        description: 'Create and manage Jira issues and projects',
        icon: 'jira',
        color: '#0052CC',
        category: 'development',
        authType: 'oauth2',
        oauth: {
            clientId: '', // Set from environment
            authUrl: 'https://auth.atlassian.com/authorize',
            tokenUrl: 'https://auth.atlassian.com/oauth/token',
            scopes: ['read:jira-work', 'write:jira-work', 'read:jira-user'],
            redirectUri: `${getBaseUrl()}/api/oauth/callback/atlassian`,
        },
        docsUrl: 'https://developer.atlassian.com/cloud/jira/platform/rest/v3/intro/',
    },
    // Storage
    {
        id: 'google-drive',
        name: 'Google Drive',
        description: 'Upload, download, and manage files in Drive',
        icon: 'drive',
        color: '#FBBC04',
        category: 'storage',
        authType: 'oauth2',
        oauth: {
            clientId: '', // Set from environment
            authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
            tokenUrl: 'https://oauth2.googleapis.com/token',
            scopes: ['https://www.googleapis.com/auth/drive'],
            redirectUri: `${getBaseUrl()}/api/oauth/callback/google`,
        },
        docsUrl: 'https://developers.google.com/drive',
    },
    {
        id: 'dropbox',
        name: 'Dropbox',
        description: 'Upload and manage files in Dropbox',
        icon: 'dropbox',
        color: '#0061FF',
        category: 'storage',
        authType: 'oauth2',
        oauth: {
            clientId: '', // Set from environment
            authUrl: 'https://www.dropbox.com/oauth2/authorize',
            tokenUrl: 'https://api.dropboxapi.com/oauth2/token',
            scopes: [],
            redirectUri: `${getBaseUrl()}/api/oauth/callback/dropbox`,
        },
        docsUrl: 'https://www.dropbox.com/developers',
    },
    // Custom
    {
        id: 'webhook',
        name: 'Custom Webhook',
        description: 'Connect any app with a custom HTTP webhook',
        icon: 'webhook',
        color: '#6366F1',
        category: 'custom',
        authType: 'webhook',
        fields: [
            {
                id: 'url',
                label: 'Webhook URL',
                type: 'url',
                placeholder: 'https://your-app.com/webhook',
                required: true,
            },
            {
                id: 'secret',
                label: 'Secret (optional)',
                type: 'password',
                placeholder: 'Webhook secret for signature verification',
            },
            {
                id: 'method',
                label: 'HTTP Method',
                type: 'select',
                options: [
                    { value: 'POST', label: 'POST' },
                    { value: 'GET', label: 'GET' },
                    { value: 'PUT', label: 'PUT' },
                ],
            },
        ],
    },
    {
        id: 'http-api',
        name: 'HTTP API',
        description: 'Connect to any REST API with custom authentication',
        icon: 'api',
        color: '#10B981',
        category: 'custom',
        authType: 'api_key',
        fields: [
            {
                id: 'baseUrl',
                label: 'Base URL',
                type: 'url',
                placeholder: 'https://api.example.com',
                required: true,
            },
            {
                id: 'apiKey',
                label: 'API Key',
                type: 'password',
                placeholder: 'Your API key',
            },
            {
                id: 'headerName',
                label: 'Header Name',
                type: 'text',
                placeholder: 'Authorization',
                helpText: 'The header name for the API key (e.g., Authorization, X-API-Key)',
            },
        ],
    },
];

// Helper to get provider by ID
export function getProvider(id: string): ConnectionProvider | undefined {
    return CONNECTION_PROVIDERS.find(p => p.id === id);
}

// Helper to get providers by category
export function getProvidersByCategory(category: ConnectionProvider['category']): ConnectionProvider[] {
    return CONNECTION_PROVIDERS.filter(p => p.category === category);
}

// Start OAuth flow
export function startOAuthFlow(provider: ConnectionProvider): void {
    if (provider.authType !== 'oauth2' || !provider.oauth) {
        throw new Error('Provider does not support OAuth');
    }

    const { clientId, authUrl, scopes, redirectUri } = provider.oauth;
    
    // Generate state for CSRF protection
    const state = btoa(JSON.stringify({
        providerId: provider.id,
        timestamp: Date.now(),
        nonce: Math.random().toString(36).substring(7),
    }));
    
    // Store state in sessionStorage for verification
    sessionStorage.setItem('oauth_state', state);
    
    // Build OAuth URL
    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: scopes.join(' '),
        state,
    });

    // Special handling for different providers
    if (provider.id === 'notion') {
        params.set('owner', 'user');
    }
    
    if (provider.id.startsWith('google')) {
        params.set('access_type', 'offline');
        params.set('prompt', 'consent');
    }

    // Redirect to OAuth provider
    window.location.href = `${authUrl}?${params.toString()}`;
}

// Verify OAuth state
export function verifyOAuthState(state: string): { providerId: string; valid: boolean } {
    const storedState = sessionStorage.getItem('oauth_state');
    
    if (!storedState || storedState !== state) {
        return { providerId: '', valid: false };
    }
    
    try {
        const decoded = JSON.parse(atob(state));
        sessionStorage.removeItem('oauth_state');
        return { providerId: decoded.providerId, valid: true };
    } catch {
        return { providerId: '', valid: false };
    }
}
