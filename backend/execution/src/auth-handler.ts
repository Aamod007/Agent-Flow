/**
 * Authentication Module
 * 
 * Provides authentication support for HTTP Request nodes
 * Supports: API Key, Basic Auth, Bearer Token, OAuth2
 */

// ============================================================
// Types
// ============================================================

export type AuthType = 'none' | 'apiKey' | 'basic' | 'bearer' | 'oauth2';

export interface AuthConfig {
    type: AuthType;
    apiKey?: ApiKeyAuth;
    basic?: BasicAuth;
    bearer?: BearerAuth;
    oauth2?: OAuth2Auth;
}

export interface ApiKeyAuth {
    key: string;
    value: string;
    location: 'header' | 'query' | 'cookie';
}

export interface BasicAuth {
    username: string;
    password: string;
}

export interface BearerAuth {
    token: string;
}

export interface OAuth2Auth {
    grantType: 'authorization_code' | 'client_credentials' | 'refresh_token';
    clientId: string;
    clientSecret: string;
    accessToken?: string;
    refreshToken?: string;
    tokenUrl: string;
    authUrl?: string;      // For authorization_code flow
    redirectUri?: string;  // For authorization_code flow
    scope?: string;
    tokenExpiry?: number;  // Unix timestamp
}

export interface RequestConfig {
    url: string;
    method: string;
    headers: Record<string, string>;
    query?: Record<string, string>;
    body?: unknown;
}

// ============================================================
// Authentication Handler Class
// ============================================================

export class AuthenticationHandler {
    private tokenCache: Map<string, { token: string; expiry: number }> = new Map();

    /**
     * Apply authentication to request configuration
     */
    async applyAuth(request: RequestConfig, auth: AuthConfig): Promise<RequestConfig> {
        switch (auth.type) {
            case 'none':
                return request;
            case 'apiKey':
                return this.applyApiKey(request, auth.apiKey!);
            case 'basic':
                return this.applyBasicAuth(request, auth.basic!);
            case 'bearer':
                return this.applyBearerToken(request, auth.bearer!);
            case 'oauth2':
                return this.applyOAuth2(request, auth.oauth2!);
            default:
                return request;
        }
    }

    /**
     * Apply API Key authentication
     */
    private applyApiKey(request: RequestConfig, config: ApiKeyAuth): RequestConfig {
        const result = { ...request };

        switch (config.location) {
            case 'header':
                result.headers = {
                    ...result.headers,
                    [config.key]: config.value
                };
                break;
            case 'query':
                result.query = {
                    ...result.query,
                    [config.key]: config.value
                };
                break;
            case 'cookie':
                const existingCookie = result.headers['Cookie'] || '';
                result.headers = {
                    ...result.headers,
                    'Cookie': existingCookie
                        ? `${existingCookie}; ${config.key}=${config.value}`
                        : `${config.key}=${config.value}`
                };
                break;
        }

        return result;
    }

    /**
     * Apply Basic authentication
     */
    private applyBasicAuth(request: RequestConfig, config: BasicAuth): RequestConfig {
        const credentials = Buffer.from(`${config.username}:${config.password}`).toString('base64');

        return {
            ...request,
            headers: {
                ...request.headers,
                'Authorization': `Basic ${credentials}`
            }
        };
    }

    /**
     * Apply Bearer token authentication
     */
    private applyBearerToken(request: RequestConfig, config: BearerAuth): RequestConfig {
        return {
            ...request,
            headers: {
                ...request.headers,
                'Authorization': `Bearer ${config.token}`
            }
        };
    }

    /**
     * Apply OAuth2 authentication
     */
    private async applyOAuth2(request: RequestConfig, config: OAuth2Auth): Promise<RequestConfig> {
        // Check for valid cached token
        const cacheKey = `${config.clientId}-${config.scope || 'default'}`;
        const cached = this.tokenCache.get(cacheKey);

        let accessToken: string;

        if (cached && cached.expiry > Date.now()) {
            accessToken = cached.token;
        } else if (config.accessToken && config.tokenExpiry && config.tokenExpiry > Date.now()) {
            accessToken = config.accessToken;
        } else {
            // Fetch new token
            accessToken = await this.fetchOAuth2Token(config);
        }

        return {
            ...request,
            headers: {
                ...request.headers,
                'Authorization': `Bearer ${accessToken}`
            }
        };
    }

    /**
     * Fetch OAuth2 access token
     */
    private async fetchOAuth2Token(config: OAuth2Auth): Promise<string> {
        const params = new URLSearchParams();

        switch (config.grantType) {
            case 'client_credentials':
                params.set('grant_type', 'client_credentials');
                params.set('client_id', config.clientId);
                params.set('client_secret', config.clientSecret);
                if (config.scope) params.set('scope', config.scope);
                break;

            case 'refresh_token':
                if (!config.refreshToken) {
                    throw new Error('Refresh token required');
                }
                params.set('grant_type', 'refresh_token');
                params.set('refresh_token', config.refreshToken);
                params.set('client_id', config.clientId);
                params.set('client_secret', config.clientSecret);
                break;

            case 'authorization_code':
                throw new Error('Authorization code flow requires user interaction');
        }

        const response = await fetch(config.tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString()
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`OAuth2 token request failed: ${error}`);
        }

        const data = await response.json() as {
            access_token: string;
            expires_in?: number;
            refresh_token?: string;
        };

        // Cache the token
        const cacheKey = `${config.clientId}-${config.scope || 'default'}`;
        const expiresIn = data.expires_in || 3600; // Default 1 hour

        this.tokenCache.set(cacheKey, {
            token: data.access_token,
            expiry: Date.now() + (expiresIn * 1000) - 60000 // 1 minute buffer
        });

        return data.access_token;
    }

    /**
     * Clear token cache
     */
    clearCache(): void {
        this.tokenCache.clear();
    }

    /**
     * Validate authentication configuration
     */
    validateConfig(auth: AuthConfig): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        switch (auth.type) {
            case 'apiKey':
                if (!auth.apiKey?.key) errors.push('API key name is required');
                if (!auth.apiKey?.value) errors.push('API key value is required');
                if (!auth.apiKey?.location) errors.push('API key location is required');
                break;

            case 'basic':
                if (!auth.basic?.username) errors.push('Username is required');
                if (!auth.basic?.password) errors.push('Password is required');
                break;

            case 'bearer':
                if (!auth.bearer?.token) errors.push('Bearer token is required');
                break;

            case 'oauth2':
                if (!auth.oauth2?.clientId) errors.push('Client ID is required');
                if (!auth.oauth2?.clientSecret) errors.push('Client secret is required');
                if (!auth.oauth2?.tokenUrl) errors.push('Token URL is required');
                if (!auth.oauth2?.grantType) errors.push('Grant type is required');
                break;
        }

        return { valid: errors.length === 0, errors };
    }
}

// ============================================================
// Credential Manager
// ============================================================

export interface StoredCredential {
    id: string;
    name: string;
    type: AuthType;
    config: AuthConfig;
    createdAt: string;
    updatedAt: string;
}

/**
 * Manager for storing and retrieving credentials
 * Note: In production, credentials should be encrypted
 */
export class CredentialManager {
    private credentials: Map<string, StoredCredential> = new Map();

    /**
     * Store a credential
     */
    store(id: string, name: string, config: AuthConfig): StoredCredential {
        const credential: StoredCredential = {
            id,
            name,
            type: config.type,
            config: this.maskSensitiveData(config),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.credentials.set(id, credential);
        return credential;
    }

    /**
     * Retrieve a credential
     */
    get(id: string): StoredCredential | undefined {
        return this.credentials.get(id);
    }

    /**
     * Get full config (unmasked) - use carefully
     */
    getFullConfig(id: string): AuthConfig | undefined {
        // In production, this would decrypt from secure storage
        return this.credentials.get(id)?.config;
    }

    /**
     * List all credentials (masked)
     */
    list(): StoredCredential[] {
        return Array.from(this.credentials.values()).map(c => ({
            ...c,
            config: this.maskSensitiveData(c.config)
        }));
    }

    /**
     * Delete a credential
     */
    delete(id: string): boolean {
        return this.credentials.delete(id);
    }

    /**
     * Mask sensitive data in config
     */
    private maskSensitiveData(config: AuthConfig): AuthConfig {
        const masked = { ...config };

        if (masked.apiKey) {
            masked.apiKey = {
                ...masked.apiKey,
                value: this.maskString(masked.apiKey.value)
            };
        }

        if (masked.basic) {
            masked.basic = {
                ...masked.basic,
                password: this.maskString(masked.basic.password)
            };
        }

        if (masked.bearer) {
            masked.bearer = {
                ...masked.bearer,
                token: this.maskString(masked.bearer.token)
            };
        }

        if (masked.oauth2) {
            masked.oauth2 = {
                ...masked.oauth2,
                clientSecret: this.maskString(masked.oauth2.clientSecret),
                accessToken: masked.oauth2.accessToken
                    ? this.maskString(masked.oauth2.accessToken)
                    : undefined,
                refreshToken: masked.oauth2.refreshToken
                    ? this.maskString(masked.oauth2.refreshToken)
                    : undefined
            };
        }

        return masked;
    }

    /**
     * Mask a string value
     */
    private maskString(value: string): string {
        if (value.length <= 4) return '****';
        return value.slice(0, 2) + '*'.repeat(Math.min(value.length - 4, 10)) + value.slice(-2);
    }
}

// ============================================================
// Factory Functions
// ============================================================

/**
 * Create authentication handler
 */
export function createAuthHandler(): AuthenticationHandler {
    return new AuthenticationHandler();
}

/**
 * Create credential manager
 */
export function createCredentialManager(): CredentialManager {
    return new CredentialManager();
}

// ============================================================
// Presets
// ============================================================

export const AUTH_PRESETS: Record<string, Partial<AuthConfig>> = {
    openai: {
        type: 'bearer',
        bearer: { token: '' }
    },
    github: {
        type: 'bearer',
        bearer: { token: '' }
    },
    stripe: {
        type: 'bearer',
        bearer: { token: '' }
    },
    sendgrid: {
        type: 'apiKey',
        apiKey: { key: 'Authorization', value: 'Bearer ', location: 'header' }
    },
    mailchimp: {
        type: 'basic',
        basic: { username: 'anystring', password: '' }
    },
    slack: {
        type: 'bearer',
        bearer: { token: '' }
    },
    aws: {
        type: 'apiKey',
        apiKey: { key: 'x-api-key', value: '', location: 'header' }
    }
};
