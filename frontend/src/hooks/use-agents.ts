import { useState, useEffect, useCallback } from 'react';

interface AgentTemplate {
    id: string;
    type: string;
    name: string;
    description: string;
    category: string;
    icon: string;
    defaultConfig: {
        model: string;
        temperature: number;
        maxTokens: number;
        systemPrompt: string;
    };
}

interface ModelProvider {
    id: string;
    name: string;
    type: 'cloud' | 'local';
    icon: string;
    models: Model[];
    isAvailable: boolean;
    status: 'connected' | 'disconnected' | 'error';
}

interface Model {
    id: string;
    name: string;
    displayName: string;
    contextWindow: number;
    costPer1kTokens?: {
        input: number;
        output: number;
    };
}

const AGENT_TEMPLATES: AgentTemplate[] = [
    {
        id: 'web-scraper',
        type: 'web-scraper',
        name: 'Web Scraper',
        description: 'Extract structured data from websites',
        category: 'Research',
        icon: 'globe',
        defaultConfig: {
            model: 'gemini-2.0-flash',
            temperature: 0.3,
            maxTokens: 4096,
            systemPrompt: 'You are a web scraping agent. Extract the requested information from the provided URL content.',
        },
    },
    {
        id: 'summarizer',
        type: 'summarizer',
        name: 'Summarizer',
        description: 'Create concise summaries of text',
        category: 'Content',
        icon: 'file-text',
        defaultConfig: {
            model: 'gemini-2.0-flash',
            temperature: 0.5,
            maxTokens: 2048,
            systemPrompt: 'You are a summarization expert. Create clear, concise summaries that capture the key points.',
        },
    },
    {
        id: 'writer',
        type: 'writer',
        name: 'Content Writer',
        description: 'Generate long-form content',
        category: 'Content',
        icon: 'pen-tool',
        defaultConfig: {
            model: 'gemini-2.5-pro',
            temperature: 0.7,
            maxTokens: 8192,
            systemPrompt: 'You are an expert content writer. Create engaging, well-structured content based on the given outline or topic.',
        },
    },
    {
        id: 'code-generator',
        type: 'code-generator',
        name: 'Code Generator',
        description: 'Write code from specifications',
        category: 'Development',
        icon: 'code',
        defaultConfig: {
            model: 'gemini-2.5-pro',
            temperature: 0.2,
            maxTokens: 4096,
            systemPrompt: 'You are an expert programmer. Write clean, efficient code based on the given specifications.',
        },
    },
    {
        id: 'data-analyst',
        type: 'data-analyst',
        name: 'Data Analyst',
        description: 'Analyze data and generate insights',
        category: 'Analysis',
        icon: 'bar-chart',
        defaultConfig: {
            model: 'gemini-2.5-pro',
            temperature: 0.3,
            maxTokens: 4096,
            systemPrompt: 'You are a data analysis expert. Analyze the provided data and generate actionable insights.',
        },
    },
];

const DEFAULT_PROVIDERS: ModelProvider[] = [
    {
        id: 'gemini',
        name: 'Gemini',
        type: 'cloud',
        icon: '✨',
        isAvailable: true,
        status: 'connected',
        models: [
            { id: 'gemini-2.0-flash', name: 'gemini-2.0-flash', displayName: 'Gemini 2.0 Flash', contextWindow: 1000000, costPer1kTokens: { input: 0.0001, output: 0.0004 } },
            { id: 'gemini-2.5-flash', name: 'gemini-2.5-flash', displayName: 'Gemini 2.5 Flash', contextWindow: 1000000, costPer1kTokens: { input: 0.000075, output: 0.0003 } },
            { id: 'gemini-2.5-pro', name: 'gemini-2.5-pro', displayName: 'Gemini 2.5 Pro', contextWindow: 1000000, costPer1kTokens: { input: 0.00125, output: 0.005 } },
        ],
    },
    {
        id: 'ollama',
        name: 'Ollama',
        type: 'local',
        icon: '🦙',
        isAvailable: false,
        status: 'disconnected',
        models: [
            { id: 'llama3', name: 'llama3', displayName: 'Llama 3', contextWindow: 8192 },
            { id: 'llama3:70b', name: 'llama3:70b', displayName: 'Llama 3 70B', contextWindow: 8192 },
            { id: 'mistral', name: 'mistral', displayName: 'Mistral', contextWindow: 32768 },
            { id: 'codellama', name: 'codellama', displayName: 'Code Llama', contextWindow: 16384 },
        ],
    },
    {
        id: 'groq',
        name: 'Groq',
        type: 'cloud',
        icon: '⚡',
        isAvailable: true,
        status: 'connected',
        models: [
            { id: 'llama-3.1-70b-versatile', name: 'llama-3.1-70b-versatile', displayName: 'Llama 3.1 70B', contextWindow: 131072, costPer1kTokens: { input: 0.00059, output: 0.00079 } },
            { id: 'llama-3.1-8b-instant', name: 'llama-3.1-8b-instant', displayName: 'Llama 3.1 8B', contextWindow: 131072, costPer1kTokens: { input: 0.00005, output: 0.00008 } },
            { id: 'mixtral-8x7b-32768', name: 'mixtral-8x7b-32768', displayName: 'Mixtral 8x7B', contextWindow: 32768, costPer1kTokens: { input: 0.00024, output: 0.00024 } },
        ],
    },
    {
        id: 'openai',
        name: 'OpenAI',
        type: 'cloud',
        icon: '🤖',
        isAvailable: false,
        status: 'disconnected',
        models: [
            { id: 'gpt-4o', name: 'gpt-4o', displayName: 'GPT-4o', contextWindow: 128000, costPer1kTokens: { input: 0.005, output: 0.015 } },
            { id: 'gpt-4o-mini', name: 'gpt-4o-mini', displayName: 'GPT-4o Mini', contextWindow: 128000, costPer1kTokens: { input: 0.00015, output: 0.0006 } },
            { id: 'gpt-4-turbo', name: 'gpt-4-turbo', displayName: 'GPT-4 Turbo', contextWindow: 128000, costPer1kTokens: { input: 0.01, output: 0.03 } },
        ],
    },
];

export function useAgents() {
    const [templates] = useState<AgentTemplate[]>(AGENT_TEMPLATES);
    const [providers, setProviders] = useState<ModelProvider[]>(DEFAULT_PROVIDERS);
    const [loading, setLoading] = useState(false);

    // Check Ollama connection
    const checkOllamaConnection = useCallback(async () => {
        try {
            const response = await fetch('http://localhost:11434/api/tags', {
                method: 'GET',
            });

            if (response.ok) {
                const data = await response.json();
                const models = data.models?.map((m: { name: string }) => ({
                    id: m.name,
                    name: m.name,
                    displayName: m.name,
                    contextWindow: 8192,
                })) || [];

                setProviders((prev) =>
                    prev.map((p) =>
                        p.id === 'ollama'
                            ? { ...p, isAvailable: true, status: 'connected', models: models.length > 0 ? models : p.models }
                            : p
                    )
                );
                return true;
            }
        } catch {
            setProviders((prev) =>
                prev.map((p) =>
                    p.id === 'ollama'
                        ? { ...p, isAvailable: false, status: 'disconnected' }
                        : p
                )
            );
        }
        return false;
    }, []);

    // Get template by type
    const getTemplate = useCallback((type: string) => {
        return templates.find((t) => t.type === type);
    }, [templates]);

    // Get provider by ID
    const getProvider = useCallback((providerId: string) => {
        return providers.find((p) => p.id === providerId);
    }, [providers]);

    // Get model by ID
    const getModel = useCallback((providerId: string, modelId: string) => {
        const provider = providers.find((p) => p.id === providerId);
        return provider?.models.find((m) => m.id === modelId);
    }, [providers]);

    // Get all available models
    const getAvailableModels = useCallback(() => {
        return providers
            .filter((p) => p.isAvailable)
            .flatMap((p) =>
                p.models.map((m) => ({
                    ...m,
                    providerId: p.id,
                    providerName: p.name,
                    providerIcon: p.icon,
                }))
            );
    }, [providers]);

    // Check all provider connections on mount
    useEffect(() => {
        checkOllamaConnection();
    }, [checkOllamaConnection]);

    return {
        templates,
        providers,
        loading,
        getTemplate,
        getProvider,
        getModel,
        getAvailableModels,
        checkOllamaConnection,
        refreshProviders: () => {
            checkOllamaConnection();
        },
    };
}
