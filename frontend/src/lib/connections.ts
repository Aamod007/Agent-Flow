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
    // AI & LLM Providers
    {
        id: 'openai',
        name: 'OpenAI',
        description: 'Connect to GPT-4, ChatGPT, and DALL-E APIs',
        icon: 'openai',
        color: '#00A67E',
        category: 'custom',
        authType: 'api_key',
        fields: [
            {
                id: 'apiKey',
                label: 'API Key',
                type: 'password',
                placeholder: 'sk-...',
                required: true,
                helpText: 'Get your API key from platform.openai.com',
            },
            {
                id: 'organization',
                label: 'Organization ID (optional)',
                type: 'text',
                placeholder: 'org-...',
            },
        ],
        docsUrl: 'https://platform.openai.com/docs',
    },
    {
        id: 'anthropic',
        name: 'Anthropic (Claude)',
        description: 'Connect to Claude AI models',
        icon: 'anthropic',
        color: '#D4A574',
        category: 'custom',
        authType: 'api_key',
        fields: [
            {
                id: 'apiKey',
                label: 'API Key',
                type: 'password',
                placeholder: 'sk-ant-...',
                required: true,
                helpText: 'Get your API key from console.anthropic.com',
            },
        ],
        docsUrl: 'https://docs.anthropic.com',
    },
    // Productivity - Additional
    {
        id: 'trello',
        name: 'Trello',
        description: 'Manage boards, lists, and cards',
        icon: 'trello',
        color: '#0079BF',
        category: 'productivity',
        authType: 'api_key',
        fields: [
            {
                id: 'apiKey',
                label: 'API Key',
                type: 'password',
                placeholder: 'Your Trello API key',
                required: true,
                helpText: 'Get from trello.com/app-key',
            },
            {
                id: 'token',
                label: 'Token',
                type: 'password',
                placeholder: 'Your Trello token',
                required: true,
            },
        ],
        docsUrl: 'https://developer.atlassian.com/cloud/trello/',
    },
    {
        id: 'airtable',
        name: 'Airtable',
        description: 'Work with Airtable bases and records',
        icon: 'airtable',
        color: '#18BFFF',
        category: 'productivity',
        authType: 'api_key',
        fields: [
            {
                id: 'apiKey',
                label: 'API Key',
                type: 'password',
                placeholder: 'Your Airtable API key',
                required: true,
                helpText: 'Get from airtable.com/account',
            },
        ],
        docsUrl: 'https://airtable.com/developers/web/api',
    },
    {
        id: 'asana',
        name: 'Asana',
        description: 'Manage tasks, projects, and teams',
        icon: 'asana',
        color: '#F06A6A',
        category: 'productivity',
        authType: 'oauth2',
        oauth: {
            clientId: '',
            authUrl: 'https://app.asana.com/-/oauth_authorize',
            tokenUrl: 'https://app.asana.com/-/oauth_token',
            scopes: ['default'],
            redirectUri: `${getBaseUrl()}/api/oauth/callback/asana`,
        },
        docsUrl: 'https://developers.asana.com',
    },
    // E-commerce & CRM
    {
        id: 'shopify',
        name: 'Shopify',
        description: 'Manage products, orders, and customers',
        icon: 'shopify',
        color: '#96BF48',
        category: 'productivity',
        authType: 'api_key',
        fields: [
            {
                id: 'shopUrl',
                label: 'Shop URL',
                type: 'url',
                placeholder: 'myshop.myshopify.com',
                required: true,
            },
            {
                id: 'accessToken',
                label: 'Admin API Access Token',
                type: 'password',
                required: true,
                helpText: 'Create a private app to get the access token',
            },
        ],
        docsUrl: 'https://shopify.dev/docs/api',
    },
    {
        id: 'stripe',
        name: 'Stripe',
        description: 'Process payments and manage subscriptions',
        icon: 'stripe',
        color: '#635BFF',
        category: 'productivity',
        authType: 'api_key',
        fields: [
            {
                id: 'secretKey',
                label: 'Secret Key',
                type: 'password',
                placeholder: 'sk_live_... or sk_test_...',
                required: true,
                helpText: 'Get from Stripe Dashboard > Developers > API keys',
            },
        ],
        docsUrl: 'https://stripe.com/docs/api',
    },
    {
        id: 'hubspot',
        name: 'HubSpot',
        description: 'Manage contacts, deals, and marketing',
        icon: 'hubspot',
        color: '#FF7A59',
        category: 'productivity',
        authType: 'oauth2',
        oauth: {
            clientId: '',
            authUrl: 'https://app.hubspot.com/oauth/authorize',
            tokenUrl: 'https://api.hubapi.com/oauth/v1/token',
            scopes: ['contacts', 'content'],
            redirectUri: `${getBaseUrl()}/api/oauth/callback/hubspot`,
        },
        docsUrl: 'https://developers.hubspot.com/docs/api',
    },
    {
        id: 'salesforce',
        name: 'Salesforce',
        description: 'CRM, leads, opportunities, and more',
        icon: 'salesforce',
        color: '#00A1E0',
        category: 'productivity',
        authType: 'oauth2',
        oauth: {
            clientId: '',
            authUrl: 'https://login.salesforce.com/services/oauth2/authorize',
            tokenUrl: 'https://login.salesforce.com/services/oauth2/token',
            scopes: ['api', 'refresh_token'],
            redirectUri: `${getBaseUrl()}/api/oauth/callback/salesforce`,
        },
        docsUrl: 'https://developer.salesforce.com/docs',
    },
    // Communication - Additional
    {
        id: 'twilio',
        name: 'Twilio',
        description: 'Send SMS, make calls, and manage communications',
        icon: 'twilio',
        color: '#F22F46',
        category: 'communication',
        authType: 'api_key',
        fields: [
            {
                id: 'accountSid',
                label: 'Account SID',
                type: 'text',
                required: true,
                placeholder: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
            },
            {
                id: 'authToken',
                label: 'Auth Token',
                type: 'password',
                required: true,
            },
            {
                id: 'phoneNumber',
                label: 'From Phone Number',
                type: 'text',
                placeholder: '+1234567890',
                helpText: 'Your Twilio phone number',
            },
        ],
        docsUrl: 'https://www.twilio.com/docs',
    },
    {
        id: 'sendgrid',
        name: 'SendGrid',
        description: 'Send transactional and marketing emails',
        icon: 'sendgrid',
        color: '#1A82E2',
        category: 'communication',
        authType: 'api_key',
        fields: [
            {
                id: 'apiKey',
                label: 'API Key',
                type: 'password',
                required: true,
                placeholder: 'SG.xxxxxx',
                helpText: 'Create an API key in SendGrid settings',
            },
        ],
        docsUrl: 'https://docs.sendgrid.com',
    },
    {
        id: 'telegram',
        name: 'Telegram Bot',
        description: 'Send messages and manage Telegram bots',
        icon: 'telegram',
        color: '#0088CC',
        category: 'communication',
        authType: 'api_key',
        fields: [
            {
                id: 'botToken',
                label: 'Bot Token',
                type: 'password',
                required: true,
                placeholder: '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11',
                helpText: 'Get from @BotFather on Telegram',
            },
        ],
        docsUrl: 'https://core.telegram.org/bots/api',
    },
    // Cloud & DevOps
    {
        id: 'aws',
        name: 'Amazon Web Services',
        description: 'S3, Lambda, SES, and other AWS services',
        icon: 'aws',
        color: '#FF9900',
        category: 'storage',
        authType: 'api_key',
        fields: [
            {
                id: 'accessKeyId',
                label: 'Access Key ID',
                type: 'text',
                required: true,
                placeholder: 'AKIAIOSFODNN7EXAMPLE',
            },
            {
                id: 'secretAccessKey',
                label: 'Secret Access Key',
                type: 'password',
                required: true,
            },
            {
                id: 'region',
                label: 'Region',
                type: 'text',
                placeholder: 'us-east-1',
                helpText: 'AWS region (e.g., us-east-1, eu-west-1)',
            },
        ],
        docsUrl: 'https://docs.aws.amazon.com',
    },
    {
        id: 'azure',
        name: 'Microsoft Azure',
        description: 'Azure services including Blob Storage, Functions',
        icon: 'azure',
        color: '#0078D4',
        category: 'storage',
        authType: 'api_key',
        fields: [
            {
                id: 'connectionString',
                label: 'Connection String',
                type: 'password',
                required: true,
                helpText: 'Azure Storage connection string',
            },
        ],
        docsUrl: 'https://docs.microsoft.com/azure',
    },
    // Databases
    {
        id: 'mongodb',
        name: 'MongoDB',
        description: 'Connect to MongoDB databases',
        icon: 'mongodb',
        color: '#47A248',
        category: 'storage',
        authType: 'api_key',
        fields: [
            {
                id: 'connectionString',
                label: 'Connection String',
                type: 'password',
                required: true,
                placeholder: 'mongodb+srv://user:pass@cluster.mongodb.net/db',
                helpText: 'MongoDB connection URI',
            },
        ],
        docsUrl: 'https://docs.mongodb.com',
    },
    {
        id: 'postgresql',
        name: 'PostgreSQL',
        description: 'Connect to PostgreSQL databases',
        icon: 'postgres',
        color: '#336791',
        category: 'storage',
        authType: 'basic',
        fields: [
            {
                id: 'host',
                label: 'Host',
                type: 'text',
                required: true,
                placeholder: 'localhost',
            },
            {
                id: 'port',
                label: 'Port',
                type: 'text',
                placeholder: '5432',
            },
            {
                id: 'database',
                label: 'Database',
                type: 'text',
                required: true,
            },
            {
                id: 'username',
                label: 'Username',
                type: 'text',
                required: true,
            },
            {
                id: 'password',
                label: 'Password',
                type: 'password',
                required: true,
            },
            {
                id: 'ssl',
                label: 'SSL Mode',
                type: 'select',
                options: [
                    { value: 'disable', label: 'Disable' },
                    { value: 'require', label: 'Require' },
                    { value: 'verify-full', label: 'Verify Full' },
                ],
            },
        ],
        docsUrl: 'https://www.postgresql.org/docs/',
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

// OAuth popup window reference
let oauthPopup: Window | null = null;

// Start OAuth flow in a popup window (n8n style)
export function startOAuthFlow(
    provider: ConnectionProvider,
    onSuccess?: (connection: SavedConnection) => void,
    onError?: (error: string) => void
): void {
    if (provider.authType !== 'oauth2' || !provider.oauth) {
        throw new Error('Provider does not support OAuth');
    }

    const { clientId, authUrl, scopes } = provider.oauth;
    
    // If no client ID is configured, create a demo connection directly
    if (!clientId) {
        // Create demo connection via API
        createDemoConnection(provider, onSuccess, onError);
        return;
    }
    
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
        redirect_uri: `${window.location.origin}/oauth/callback`,
        response_type: 'code',
        scope: scopes.join(' '),
        state,
    });

    // Special handling for different providers
    if (provider.id === 'notion') {
        params.set('owner', 'user');
    }
    
    if (provider.id.startsWith('google') || provider.id === 'gmail' || provider.id === 'google-calendar' || provider.id === 'google-sheets' || provider.id === 'google-drive') {
        params.set('access_type', 'offline');
        params.set('prompt', 'consent');
    }

    const oauthUrl = `${authUrl}?${params.toString()}`;
    
    // Calculate popup window position (centered)
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    // Close any existing popup
    if (oauthPopup && !oauthPopup.closed) {
        oauthPopup.close();
    }
    
    // Open OAuth popup
    oauthPopup = window.open(
        oauthUrl,
        'oauth_popup',
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,location=yes,status=yes`
    );
    
    if (!oauthPopup) {
        onError?.('Failed to open popup window. Please allow popups for this site.');
        return;
    }
    
    // Set up message listener for popup communication
    const messageHandler = (event: MessageEvent) => {
        // Verify origin
        if (event.origin !== window.location.origin) {
            return;
        }
        
        if (event.data?.type === 'OAUTH_CALLBACK') {
            window.removeEventListener('message', messageHandler);
            
            if (event.data.success && event.data.connection) {
                onSuccess?.(event.data.connection);
            } else {
                onError?.(event.data.error || 'Authentication failed');
            }
        }
    };
    
    window.addEventListener('message', messageHandler);
    
    // Clean up on popup close (polling since there's no reliable close event)
    const pollTimer = setInterval(() => {
        if (oauthPopup?.closed) {
            clearInterval(pollTimer);
            window.removeEventListener('message', messageHandler);
        }
    }, 500);
    
    // Timeout after 5 minutes
    setTimeout(() => {
        clearInterval(pollTimer);
        window.removeEventListener('message', messageHandler);
        if (oauthPopup && !oauthPopup.closed) {
            oauthPopup.close();
        }
    }, 5 * 60 * 1000);
}

// Create a demo connection when OAuth isn't configured
async function createDemoConnection(
    provider: ConnectionProvider,
    onSuccess?: (connection: SavedConnection) => void,
    onError?: (error: string) => void
): Promise<void> {
    try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        const res = await fetch(`${API_BASE_URL}/connections`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                providerId: provider.id,
                name: `[Demo] My ${provider.name}`,
                credentials: {
                    accessToken: `demo_token_${Date.now()}`,
                    isDemo: true,
                },
            }),
        });
        
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to create demo connection');
        }
        
        const connection = await res.json();
        onSuccess?.(connection);
    } catch (error) {
        console.error('Demo connection error:', error);
        onError?.(error instanceof Error ? error.message : 'Failed to create connection');
    }
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
