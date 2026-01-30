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
    getTemplates: async (): Promise<Template[]> => {
        const res = await fetch(`${API_BASE_URL}/templates`);
        if (!res.ok) throw new Error('Failed to fetch templates');
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
};
