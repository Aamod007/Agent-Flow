// Ollama Provider - Run AI models locally for free
// Requires Ollama to be installed: https://ollama.ai

export interface OllamaModel {
  name: string;
  size: string;
  digest: string;
  modifiedAt: string;
}

export interface OllamaGenerateResponse {
  model: string;
  response: string;
  done: boolean;
  totalDuration?: number;
  loadDuration?: number;
  promptEvalCount?: number;
  evalCount?: number;
}

export class OllamaProvider {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:11434') {
    this.baseUrl = baseUrl;
  }

  // Check if Ollama is running
  async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  // List available models
  async listModels(): Promise<OllamaModel[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) {
        throw new Error('Failed to fetch models');
      }
      const data = await response.json();
      return data.models || [];
    } catch (error) {
      console.error('[Ollama] Failed to list models:', error);
      return [];
    }
  }

  // Pull a model if not already available
  async pullModel(modelName: string, onProgress?: (progress: number) => void): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName, stream: true })
      });

      if (!response.ok) {
        throw new Error('Failed to pull model');
      }

      const reader = response.body?.getReader();
      if (!reader) return false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = new TextDecoder().decode(value);
        const lines = text.split('\n').filter(Boolean);
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.completed && data.total && onProgress) {
              onProgress((data.completed / data.total) * 100);
            }
          } catch {}
        }
      }

      return true;
    } catch (error) {
      console.error('[Ollama] Failed to pull model:', error);
      return false;
    }
  }

  // Generate a response (non-streaming)
  async generateResponse(
    model: string,
    prompt: string,
    config: {
      systemPrompt?: string;
      temperature?: number;
      maxTokens?: number;
      topP?: number;
      topK?: number;
    } = {}
  ): Promise<{
    content: string;
    usage: {
      inputTokens: number;
      outputTokens: number;
      totalTokens: number;
    };
    duration: number;
    cost: number;
  }> {
    const startTime = Date.now();

    const requestBody: any = {
      model,
      prompt,
      stream: false,
      options: {
        temperature: config.temperature ?? 0.7,
        num_predict: config.maxTokens ?? 2048,
        top_p: config.topP ?? 0.9,
        top_k: config.topK ?? 40
      }
    };

    if (config.systemPrompt) {
      requestBody.system = config.systemPrompt;
    }

    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama error: ${errorText}`);
    }

    const data: OllamaGenerateResponse = await response.json();
    const duration = Date.now() - startTime;

    // Estimate tokens (Ollama provides eval counts)
    const inputTokens = data.promptEvalCount || this.estimateTokens(prompt);
    const outputTokens = data.evalCount || this.estimateTokens(data.response);

    return {
      content: data.response,
      usage: {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens
      },
      duration,
      cost: 0 // Ollama is free!
    };
  }

  // Generate with streaming
  async *generateStream(
    model: string,
    prompt: string,
    config: {
      systemPrompt?: string;
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): AsyncGenerator<string, void, unknown> {
    const requestBody: any = {
      model,
      prompt,
      stream: true,
      options: {
        temperature: config.temperature ?? 0.7,
        num_predict: config.maxTokens ?? 2048
      }
    };

    if (config.systemPrompt) {
      requestBody.system = config.systemPrompt;
    }

    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error('Ollama streaming failed');
    }

    const reader = response.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value);
      const lines = text.split('\n').filter(Boolean);

      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          if (data.response) {
            yield data.response;
          }
        } catch {}
      }
    }
  }

  // Chat completion (multi-turn conversation)
  async chat(
    model: string,
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    config: {
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): Promise<{
    content: string;
    usage: {
      inputTokens: number;
      outputTokens: number;
      totalTokens: number;
    };
    cost: number;
  }> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        options: {
          temperature: config.temperature ?? 0.7,
          num_predict: config.maxTokens ?? 2048
        }
      })
    });

    if (!response.ok) {
      throw new Error('Ollama chat failed');
    }

    const data = await response.json();

    // Estimate tokens
    const inputText = messages.map(m => m.content).join(' ');
    const inputTokens = data.prompt_eval_count || this.estimateTokens(inputText);
    const outputTokens = data.eval_count || this.estimateTokens(data.message.content);

    return {
      content: data.message.content,
      usage: {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens
      },
      cost: 0
    };
  }

  // Estimate tokens (rough approximation: ~4 chars per token)
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  // Get model info
  async getModelInfo(modelName: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/show`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName })
      });
      
      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  }
}

// Popular Ollama models with descriptions
export const POPULAR_OLLAMA_MODELS = [
  {
    name: 'llama3.2',
    displayName: 'Llama 3.2 (3B)',
    description: 'Latest Meta model, great for general tasks',
    size: '2GB',
    recommended: true
  },
  {
    name: 'llama3.2:1b',
    displayName: 'Llama 3.2 (1B)',
    description: 'Smaller, faster version',
    size: '1.3GB',
    recommended: false
  },
  {
    name: 'mistral',
    displayName: 'Mistral 7B',
    description: 'Excellent for coding and reasoning',
    size: '4.1GB',
    recommended: true
  },
  {
    name: 'codellama',
    displayName: 'Code Llama',
    description: 'Specialized for code generation',
    size: '3.8GB',
    recommended: true
  },
  {
    name: 'phi3',
    displayName: 'Phi-3 Mini',
    description: 'Microsoft small but capable model',
    size: '2.2GB',
    recommended: false
  },
  {
    name: 'gemma2',
    displayName: 'Gemma 2 (9B)',
    description: 'Google open model',
    size: '5.4GB',
    recommended: false
  },
  {
    name: 'qwen2.5',
    displayName: 'Qwen 2.5 (7B)',
    description: 'Alibaba multilingual model',
    size: '4.4GB',
    recommended: false
  }
];

// Singleton instance
export const ollamaProvider = new OllamaProvider(
  process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
);

export default ollamaProvider;
