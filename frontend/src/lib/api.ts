const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface Workflow {
    id: string;
    name: string;
    description: string;
    definition: string;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export interface Execution {
    id: string;
    workflowId: string;
    status: string;
    logs: string;
    result: string | null;
    startedAt: string;
    endedAt: string | null;
    workflow?: {
        name: string;
    };
}

export interface ExecuteResponse {
    executionId: string;
    status: string;
    message: string;
    results?: ExecutionResult[];
}

export interface ExecutionResult {
    agentId: string;
    agentType: string;
    status: 'completed' | 'failed';
    output: unknown;
    error?: string;
    tokensUsed: {
        prompt: number;
        completion: number;
        total: number;
    };
    latencyMs: number;
    model: string;
    provider: string;
    timestamp: string;
}

export interface Template {
    id: string;
    name: string;
    description: string;
    category: string;
    icon: string;
    nodes: any[];
    edges: any[];
    authorId?: string;
    authorName?: string;
    isPublic?: boolean;
    isFeatured?: boolean;
    likes?: number;
    downloads?: number;
    version?: string;
    tags?: string[];
    createdAt?: string;
    updatedAt?: string;
}

export interface Analytics {
    totalWorkflows: number;
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    successRate: number;
    recentExecutions: {
        id: string;
        workflowName: string;
        status: string;
        startedAt: string;
        endedAt: string | null;
    }[];
}

export interface ProviderStatus {
    gemini: { available: boolean; error?: string };
    ollama: { available: boolean; error?: string };
    groq: { available: boolean; error?: string };
    openai: { available: boolean; error?: string };
}

export interface User {
    id: string;
    email: string;
    name: string | null;
    company: string | null;
    role: string | null;
    avatar: string | null;
    createdAt: string;
    updatedAt: string;
    settings?: UserSettings;
}

export interface UserSettings {
    id: string;
    userId: string;
    theme: string;
    accentColor: string;
    emailNotifications: boolean;
    browserNotifications: boolean;
    workflowComplete: boolean;
    workflowFailed: boolean;
    weeklyReport: boolean;
}

export interface ApiKey {
    id: string;
    userId: string;
    name: string;
    provider: string;
    key: string; // Masked key from API
    status: 'active' | 'inactive';
    createdAt: string;
    updatedAt: string;
}

export interface AnalyticsHistory {
    history: {
        date: string;
        completed: number;
        failed: number;
        total: number;
    }[];
    executions: {
        id: string;
        workflowName: string;
        status: string;
        startedAt: string;
        endedAt: string | null;
    }[];
}

export interface Webhook {
    id: string;
    path: string;
    url: string;
    method: string;
    isActive: boolean;
    callCount?: number;
    lastCalledAt?: string;
    createdAt: string;
}

export interface Schedule {
    id: string;
    cronExpr: string;
    timezone: string;
    isActive: boolean;
    lastRunAt?: string;
    nextRunAt?: string;
    runCount?: number;
    createdAt: string;
}

export const api = {
    // Workflows
    getWorkflows: async (): Promise<Workflow[]> => {
        const res = await fetch(`${API_BASE_URL}/workflows`);
        if (!res.ok) throw new Error('Failed to fetch workflows');
        return res.json();
    },

    getWorkflow: async (id: string): Promise<Workflow> => {
        const res = await fetch(`${API_BASE_URL}/workflows/${id}`);
        if (!res.ok) throw new Error('Failed to fetch workflow');
        return res.json();
    },

    createWorkflow: async (name: string, description: string): Promise<Workflow> => {
        const res = await fetch(`${API_BASE_URL}/workflows`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, description }),
        });
        if (!res.ok) throw new Error('Failed to create workflow');
        return res.json();
    },

    saveWorkflow: async (id: string, data: { definition?: object; name?: string; description?: string; status?: string }): Promise<Workflow> => {
        const res = await fetch(`${API_BASE_URL}/workflows/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to save workflow');
        return res.json();
    },

    deleteWorkflow: async (id: string): Promise<{ success: boolean }> => {
        const res = await fetch(`${API_BASE_URL}/workflows/${id}`, {
            method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete workflow');
        return res.json();
    },

    // Executions
    executeWorkflow: async (id: string, input?: object): Promise<ExecuteResponse> => {
        const res = await fetch(`${API_BASE_URL}/workflows/${id}/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ input: input || {} }),
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Failed to execute workflow');
        }
        return res.json();
    },

    getExecution: async (id: string): Promise<Execution> => {
        const res = await fetch(`${API_BASE_URL}/executions/${id}`);
        if (!res.ok) throw new Error('Failed to fetch execution');
        return res.json();
    },

    getWorkflowExecutions: async (workflowId: string): Promise<Execution[]> => {
        const res = await fetch(`${API_BASE_URL}/workflows/${workflowId}/executions`);
        if (!res.ok) throw new Error('Failed to fetch executions');
        return res.json();
    },

    // Templates
    getTemplates: async (params?: { category?: string; search?: string; featured?: boolean }): Promise<Template[]> => {
        const searchParams = new URLSearchParams();
        if (params?.category) searchParams.set('category', params.category);
        if (params?.search) searchParams.set('search', params.search);
        if (params?.featured) searchParams.set('featured', 'true');
        
        const url = `${API_BASE_URL}/templates${searchParams.toString() ? `?${searchParams}` : ''}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch templates');
        return res.json();
    },

    getMyTemplates: async (userId: string): Promise<Template[]> => {
        const res = await fetch(`${API_BASE_URL}/templates/my?userId=${userId}`);
        if (!res.ok) throw new Error('Failed to fetch user templates');
        return res.json();
    },

    createTemplate: async (template: {
        name: string;
        description: string;
        category: string;
        icon?: string;
        nodes: any[];
        edges: any[];
        authorId: string;
        authorName: string;
        tags?: string[];
        isPublic?: boolean;
    }): Promise<Template> => {
        const res = await fetch(`${API_BASE_URL}/templates`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(template),
        });
        if (!res.ok) throw new Error('Failed to create template');
        return res.json();
    },

    updateTemplate: async (id: string, userId: string, data: Partial<Template>): Promise<Template> => {
        const res = await fetch(`${API_BASE_URL}/templates/${id}?userId=${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to update template');
        return res.json();
    },

    deleteTemplate: async (id: string, userId: string): Promise<{ success: boolean }> => {
        const res = await fetch(`${API_BASE_URL}/templates/${id}?userId=${userId}`, {
            method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete template');
        return res.json();
    },

    likeTemplate: async (id: string, userId: string): Promise<{ liked: boolean }> => {
        const res = await fetch(`${API_BASE_URL}/templates/${id}/like`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
        });
        if (!res.ok) throw new Error('Failed to like template');
        return res.json();
    },

    downloadTemplate: async (id: string): Promise<{ success: boolean; template: Template }> => {
        const res = await fetch(`${API_BASE_URL}/templates/${id}/download`, {
            method: 'POST',
        });
        if (!res.ok) throw new Error('Failed to download template');
        return res.json();
    },

    // Analytics
    getAnalytics: async (): Promise<Analytics> => {
        const res = await fetch(`${API_BASE_URL}/analytics`);
        if (!res.ok) throw new Error('Failed to fetch analytics');
        return res.json();
    },

    // Model Providers
    getProviderStatus: async (): Promise<ProviderStatus> => {
        const res = await fetch(`${API_BASE_URL}/providers`);
        if (!res.ok) throw new Error('Failed to fetch provider status');
        return res.json();
    },

    getProviderModels: async (provider: string): Promise<{ provider: string; models: string[] }> => {
        const res = await fetch(`${API_BASE_URL}/providers/${provider}/models`);
        if (!res.ok) throw new Error('Failed to fetch models');
        return res.json();
    },

    // User
    getCurrentUser: async (): Promise<User> => {
        const res = await fetch(`${API_BASE_URL}/user`);
        if (!res.ok) throw new Error('Failed to fetch user');
        return res.json();
    },

    updateUser: async (data: { name?: string; email?: string; company?: string; role?: string }): Promise<User> => {
        const res = await fetch(`${API_BASE_URL}/user`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to update user');
        return res.json();
    },

    uploadAvatar: async (formData: FormData): Promise<User> => {
        const res = await fetch(`${API_BASE_URL}/user/avatar`, {
            method: 'POST',
            body: formData,
        });
        if (!res.ok) throw new Error('Failed to upload avatar');
        return res.json();
    },

    // User Settings
    getUserSettings: async (): Promise<UserSettings> => {
        const res = await fetch(`${API_BASE_URL}/user/settings`);
        if (!res.ok) throw new Error('Failed to fetch settings');
        return res.json();
    },

    updateUserSettings: async (data: Partial<Omit<UserSettings, 'id' | 'userId'>>): Promise<UserSettings> => {
        const res = await fetch(`${API_BASE_URL}/user/settings`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to update settings');
        return res.json();
    },

    // API Keys
    getApiKeys: async (): Promise<ApiKey[]> => {
        const res = await fetch(`${API_BASE_URL}/user/api-keys`);
        if (!res.ok) throw new Error('Failed to fetch API keys');
        return res.json();
    },

    addApiKey: async (data: { name: string; provider: string; key: string }): Promise<ApiKey> => {
        const res = await fetch(`${API_BASE_URL}/user/api-keys`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to add API key');
        return res.json();
    },

    updateApiKey: async (id: string, data: { name?: string; key?: string; status?: string }): Promise<ApiKey> => {
        const res = await fetch(`${API_BASE_URL}/user/api-keys/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to update API key');
        return res.json();
    },

    deleteApiKey: async (id: string): Promise<{ success: boolean }> => {
        const res = await fetch(`${API_BASE_URL}/user/api-keys/${id}`, {
            method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete API key');
        return res.json();
    },

    // Analytics History (for charts)
    getAnalyticsHistory: async (days: number = 7): Promise<AnalyticsHistory> => {
        const res = await fetch(`${API_BASE_URL}/analytics/history?days=${days}`);
        if (!res.ok) throw new Error('Failed to fetch analytics history');
        return res.json();
    },

    // Connections
    getConnections: async (): Promise<any[]> => {
        const res = await fetch(`${API_BASE_URL}/connections`);
        if (!res.ok) throw new Error('Failed to fetch connections');
        return res.json();
    },

    createConnection: async (data: { providerId: string; name: string; credentials: Record<string, string> }): Promise<any> => {
        const res = await fetch(`${API_BASE_URL}/connections`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to create connection');
        return res.json();
    },

    updateConnection: async (id: string, data: { name?: string; credentials?: Record<string, string> }): Promise<any> => {
        const res = await fetch(`${API_BASE_URL}/connections/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to update connection');
        return res.json();
    },

    deleteConnection: async (id: string): Promise<{ success: boolean }> => {
        const res = await fetch(`${API_BASE_URL}/connections/${id}`, {
            method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete connection');
        return res.json();
    },

    testConnection: async (id: string): Promise<{ success: boolean; error?: string }> => {
        const res = await fetch(`${API_BASE_URL}/connections/${id}/test`, {
            method: 'POST',
        });
        if (!res.ok) throw new Error('Failed to test connection');
        return res.json();
    },

    exchangeOAuthCode: async (code: string, state: string): Promise<{ connection: any; provider: string }> => {
        const res = await fetch(`${API_BASE_URL}/oauth/callback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, state }),
        });
        if (!res.ok) throw new Error('Failed to exchange OAuth code');
        return res.json();
    },

    // ============================================================
    // Webhooks
    // ============================================================

    getWebhooks: async (workflowId: string): Promise<Webhook[]> => {
        const res = await fetch(`${API_BASE_URL}/workflows/${workflowId}/webhooks`);
        if (!res.ok) throw new Error('Failed to fetch webhooks');
        return res.json();
    },

    createWebhook: async (workflowId: string, data: { method?: string; secret?: string }): Promise<Webhook> => {
        const res = await fetch(`${API_BASE_URL}/workflows/${workflowId}/webhooks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to create webhook');
        return res.json();
    },

    deleteWebhook: async (id: string): Promise<{ success: boolean }> => {
        const res = await fetch(`${API_BASE_URL}/webhooks/${id}`, {
            method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete webhook');
        return res.json();
    },

    toggleWebhook: async (id: string): Promise<{ id: string; isActive: boolean }> => {
        const res = await fetch(`${API_BASE_URL}/webhooks/${id}/toggle`, {
            method: 'PATCH',
        });
        if (!res.ok) throw new Error('Failed to toggle webhook');
        return res.json();
    },

    // ============================================================
    // Schedules
    // ============================================================

    getSchedules: async (workflowId: string): Promise<Schedule[]> => {
        const res = await fetch(`${API_BASE_URL}/workflows/${workflowId}/schedules`);
        if (!res.ok) throw new Error('Failed to fetch schedules');
        return res.json();
    },

    createSchedule: async (workflowId: string, data: { cronExpr: string; timezone?: string }): Promise<Schedule> => {
        const res = await fetch(`${API_BASE_URL}/workflows/${workflowId}/schedules`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to create schedule');
        return res.json();
    },

    updateSchedule: async (id: string, data: { cronExpr?: string; timezone?: string; isActive?: boolean }): Promise<Schedule> => {
        const res = await fetch(`${API_BASE_URL}/schedules/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to update schedule');
        return res.json();
    },

    deleteSchedule: async (id: string): Promise<{ success: boolean }> => {
        const res = await fetch(`${API_BASE_URL}/schedules/${id}`, {
            method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete schedule');
        return res.json();
    },

    toggleSchedule: async (id: string): Promise<{ id: string; isActive: boolean }> => {
        const res = await fetch(`${API_BASE_URL}/schedules/${id}/toggle`, {
            method: 'PATCH',
        });
        if (!res.ok) throw new Error('Failed to toggle schedule');
        return res.json();
    },

    triggerSchedule: async (id: string): Promise<{ executionId: string; status: string }> => {
        const res = await fetch(`${API_BASE_URL}/schedules/${id}/trigger`, {
            method: 'POST',
        });
        if (!res.ok) throw new Error('Failed to trigger schedule');
        return res.json();
    },

    getCronPresets: async (): Promise<Record<string, string>> => {
        const res = await fetch(`${API_BASE_URL}/schedules/presets`);
        if (!res.ok) throw new Error('Failed to fetch cron presets');
        return res.json();
    },

    // ============================================================
    // Debug Mode & Execution Control
    // ============================================================

    pauseExecution: async (executionId: string): Promise<{ success: boolean }> => {
        const res = await fetch(`${API_BASE_URL}/executions/${executionId}/pause`, {
            method: 'POST',
        });
        if (!res.ok) throw new Error('Failed to pause execution');
        return res.json();
    },

    resumeExecution: async (executionId: string): Promise<{ success: boolean }> => {
        const res = await fetch(`${API_BASE_URL}/executions/${executionId}/resume`, {
            method: 'POST',
        });
        if (!res.ok) throw new Error('Failed to resume execution');
        return res.json();
    },

    stepExecution: async (executionId: string): Promise<{ nodeId: string; output: any }> => {
        const res = await fetch(`${API_BASE_URL}/executions/${executionId}/step`, {
            method: 'POST',
        });
        if (!res.ok) throw new Error('Failed to step execution');
        return res.json();
    },

    executeWithDebug: async (workflowId: string, input?: object, breakpoints?: string[]): Promise<ExecuteResponse> => {
        const res = await fetch(`${API_BASE_URL}/workflows/${workflowId}/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ input: input || {}, debugMode: true, breakpoints }),
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Failed to execute workflow');
        }
        return res.json();
    },

    // Pin data on nodes
    pinNodeData: async (workflowId: string, nodeId: string, data: { input?: any; output?: any }): Promise<{ success: boolean }> => {
        const res = await fetch(`${API_BASE_URL}/workflows/${workflowId}/nodes/${nodeId}/pin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to pin node data');
        return res.json();
    },

    unpinNodeData: async (workflowId: string, nodeId: string): Promise<{ success: boolean }> => {
        const res = await fetch(`${API_BASE_URL}/workflows/${workflowId}/nodes/${nodeId}/pin`, {
            method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to unpin node data');
        return res.json();
    },
};
