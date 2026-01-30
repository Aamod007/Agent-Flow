import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ModelConfig {
    model: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    topK?: number;
}

export interface GenerationRequest {
    prompt: string;
    systemPrompt?: string;
    config: ModelConfig;
    provider?: 'gemini' | 'ollama' | 'groq' | 'openai';
}

export interface GenerationResponse {
    text: string;
    tokensUsed: {
        prompt: number;
        completion: number;
        total: number;
    };
    latencyMs: number;
    model: string;
    provider: string;
}

export class ModelProviderService {
    private geminiClient: GoogleGenerativeAI | null = null;
    private ollamaBaseUrl: string;
    private groqApiKey: string | null = null;
    private openaiApiKey: string | null = null;

    constructor() {
        // Initialize Gemini
        if (process.env.GEMINI_API_KEY) {
            this.geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        }

        // Ollama configuration
        this.ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

        // Other providers
        this.groqApiKey = process.env.GROQ_API_KEY || null;
        this.openaiApiKey = process.env.OPENAI_API_KEY || null;
    }

    async generate(request: GenerationRequest): Promise<GenerationResponse> {
        const provider = this.determineProvider(request.config.model, request.provider);
        const startTime = Date.now();

        switch (provider) {
            case 'gemini':
                return this.generateWithGemini(request, startTime);
            case 'ollama':
                return this.generateWithOllama(request, startTime);
            case 'groq':
                return this.generateWithGroq(request, startTime);
            case 'openai':
                return this.generateWithOpenAI(request, startTime);
            default:
                throw new Error(`Unknown provider: ${provider}`);
        }
    }

    private determineProvider(model: string, preferredProvider?: string): string {
        if (preferredProvider) return preferredProvider;

        // Auto-detect provider based on model name
        if (model.startsWith('gemini')) return 'gemini';
        if (model.startsWith('gpt')) return 'openai';
        if (model.startsWith('llama') || model.startsWith('mixtral')) {
            // Check if Groq is available for these models
            if (this.groqApiKey && model.includes('groq')) return 'groq';
            return 'ollama';
        }
        if (model.startsWith('claude')) return 'openai'; // Via OpenAI-compatible endpoint

        // Default to Gemini
        return 'gemini';
    }

    private async generateWithGemini(request: GenerationRequest, startTime: number): Promise<GenerationResponse> {
        if (!this.geminiClient) {
            throw new Error('Gemini API key not configured');
        }

        const model = this.geminiClient.getGenerativeModel({
            model: request.config.model,
            generationConfig: {
                temperature: request.config.temperature ?? 0.7,
                maxOutputTokens: request.config.maxTokens ?? 2048,
                topP: request.config.topP ?? 0.95,
                topK: request.config.topK ?? 40,
            },
        });

        // Build prompt with system instruction
        let fullPrompt = '';
        if (request.systemPrompt) {
            fullPrompt = `System: ${request.systemPrompt}\n\nUser: ${request.prompt}`;
        } else {
            fullPrompt = request.prompt;
        }

        const result = await model.generateContent(fullPrompt);
        const response = result.response;
        const text = response.text();

        // Estimate token usage (Gemini doesn't return exact counts)
        const promptTokens = Math.ceil(fullPrompt.length / 4);
        const completionTokens = Math.ceil(text.length / 4);

        return {
            text,
            tokensUsed: {
                prompt: promptTokens,
                completion: completionTokens,
                total: promptTokens + completionTokens,
            },
            latencyMs: Date.now() - startTime,
            model: request.config.model,
            provider: 'gemini',
        };
    }

    private async generateWithOllama(request: GenerationRequest, startTime: number): Promise<GenerationResponse> {
        const response = await fetch(`${this.ollamaBaseUrl}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: request.config.model,
                prompt: request.prompt,
                system: request.systemPrompt,
                stream: false,
                options: {
                    temperature: request.config.temperature ?? 0.7,
                    num_predict: request.config.maxTokens ?? 2048,
                    top_p: request.config.topP ?? 0.95,
                    top_k: request.config.topK ?? 40,
                },
            }),
        });

        if (!response.ok) {
            throw new Error(`Ollama error: ${response.statusText}`);
        }

        const data = await response.json();

        return {
            text: data.response,
            tokensUsed: {
                prompt: data.prompt_eval_count || 0,
                completion: data.eval_count || 0,
                total: (data.prompt_eval_count || 0) + (data.eval_count || 0),
            },
            latencyMs: Date.now() - startTime,
            model: request.config.model,
            provider: 'ollama',
        };
    }

    private async generateWithGroq(request: GenerationRequest, startTime: number): Promise<GenerationResponse> {
        if (!this.groqApiKey) {
            throw new Error('Groq API key not configured');
        }

        const messages = [];
        if (request.systemPrompt) {
            messages.push({ role: 'system', content: request.systemPrompt });
        }
        messages.push({ role: 'user', content: request.prompt });

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.groqApiKey}`,
            },
            body: JSON.stringify({
                model: request.config.model,
                messages,
                temperature: request.config.temperature ?? 0.7,
                max_tokens: request.config.maxTokens ?? 2048,
                top_p: request.config.topP ?? 0.95,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Groq error: ${error.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const choice = data.choices[0];

        return {
            text: choice.message.content,
            tokensUsed: {
                prompt: data.usage.prompt_tokens,
                completion: data.usage.completion_tokens,
                total: data.usage.total_tokens,
            },
            latencyMs: Date.now() - startTime,
            model: request.config.model,
            provider: 'groq',
        };
    }

    private async generateWithOpenAI(request: GenerationRequest, startTime: number): Promise<GenerationResponse> {
        if (!this.openaiApiKey) {
            throw new Error('OpenAI API key not configured');
        }

        const messages = [];
        if (request.systemPrompt) {
            messages.push({ role: 'system', content: request.systemPrompt });
        }
        messages.push({ role: 'user', content: request.prompt });

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.openaiApiKey}`,
            },
            body: JSON.stringify({
                model: request.config.model,
                messages,
                temperature: request.config.temperature ?? 0.7,
                max_tokens: request.config.maxTokens ?? 2048,
                top_p: request.config.topP ?? 0.95,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`OpenAI error: ${error.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const choice = data.choices[0];

        return {
            text: choice.message.content,
            tokensUsed: {
                prompt: data.usage.prompt_tokens,
                completion: data.usage.completion_tokens,
                total: data.usage.total_tokens,
            },
            latencyMs: Date.now() - startTime,
            model: request.config.model,
            provider: 'openai',
        };
    }

    // Check provider availability
    async checkProviderStatus(): Promise<Record<string, { available: boolean; error?: string }>> {
        const status: Record<string, { available: boolean; error?: string }> = {};

        // Check Gemini
        status.gemini = {
            available: !!this.geminiClient,
            error: this.geminiClient ? undefined : 'GEMINI_API_KEY not configured',
        };

        // Check Ollama
        try {
            const response = await fetch(`${this.ollamaBaseUrl}/api/tags`, {
                method: 'GET',
                signal: AbortSignal.timeout(2000),
            });
            status.ollama = { available: response.ok };
        } catch (error) {
            status.ollama = { available: false, error: 'Ollama not running or unreachable' };
        }

        // Check Groq
        status.groq = {
            available: !!this.groqApiKey,
            error: this.groqApiKey ? undefined : 'GROQ_API_KEY not configured',
        };

        // Check OpenAI
        status.openai = {
            available: !!this.openaiApiKey,
            error: this.openaiApiKey ? undefined : 'OPENAI_API_KEY not configured',
        };

        return status;
    }

    // Get available models for a provider
    async getAvailableModels(provider: string): Promise<string[]> {
        switch (provider) {
            case 'gemini':
                return [
                    'gemini-2.0-flash',
                    'gemini-2.5-flash',
                    'gemini-2.5-pro',
                ];
            case 'ollama':
                try {
                    const response = await fetch(`${this.ollamaBaseUrl}/api/tags`);
                    if (response.ok) {
                        const data = await response.json();
                        return data.models?.map((m: { name: string }) => m.name) || [];
                    }
                } catch {
                    return [];
                }
                return [];
            case 'groq':
                return [
                    'llama-3.1-70b-versatile',
                    'llama-3.1-8b-instant',
                    'mixtral-8x7b-32768',
                ];
            case 'openai':
                return [
                    'gpt-4o',
                    'gpt-4o-mini',
                    'gpt-4-turbo',
                ];
            default:
                return [];
        }
    }

    // Reinitialize clients (call after env is loaded)
    reinitialize() {
        if (process.env.GEMINI_API_KEY) {
            this.geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            console.log('Gemini client initialized');
        }
        this.groqApiKey = process.env.GROQ_API_KEY || null;
        this.openaiApiKey = process.env.OPENAI_API_KEY || null;
    }

}

// Export singleton instance
export const modelProvider = new ModelProviderService();
