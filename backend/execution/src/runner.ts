import { modelProvider, type GenerationResponse } from './model-provider.service';
import { Agent, ExecutionContext, ExecutionResult } from './types';

export class AgentRunner {
    async run(agent: Agent, input: unknown, context: ExecutionContext): Promise<ExecutionResult> {
        const startTime = Date.now();

        try {
            // Build the prompt based on agent type
            const prompt = this.buildPrompt(agent, input, context);

            // Generate response using model provider
            const response = await modelProvider.generate({
                prompt,
                systemPrompt: agent.config.systemPrompt,
                config: {
                    model: agent.config.model || 'gemini-2.5-flash',
                    temperature: agent.config.temperature ?? 0.7,
                    maxTokens: agent.config.maxTokens ?? 2048,
                },
                provider: agent.config.provider,
            });

            // Post-process output based on agent type
            const processedOutput = this.processOutput(agent, response);

            return {
                agentId: agent.id,
                agentType: agent.type,
                status: 'completed',
                output: processedOutput,
                tokensUsed: response.tokensUsed,
                latencyMs: response.latencyMs,
                model: response.model,
                provider: response.provider,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error(`Agent ${agent.id} execution failed:`, error);

            return {
                agentId: agent.id,
                agentType: agent.type,
                status: 'failed',
                output: null,
                error: error instanceof Error ? error.message : 'Unknown error',
                tokensUsed: { prompt: 0, completion: 0, total: 0 },
                latencyMs: Date.now() - startTime,
                model: agent.config.model || 'unknown',
                provider: agent.config.provider || 'unknown',
                timestamp: new Date().toISOString(),
            };
        }
    }

    private buildPrompt(agent: Agent, input: unknown, context: ExecutionContext): string {
        const parts: string[] = [];

        // Add context history if available
        if (context.history && context.history.length > 0) {
            parts.push('## Previous Steps:');
            context.history.forEach((step, index) => {
                parts.push(`### Step ${index + 1} (${step.agentId}):`);
                parts.push(`Output: ${JSON.stringify(step.output).substring(0, 500)}`);
            });
            parts.push('');
        }

        // Add current input
        parts.push('## Current Task Input:');
        if (typeof input === 'string') {
            parts.push(input);
        } else {
            parts.push(JSON.stringify(input, null, 2));
        }

        // Add type-specific instructions
        const typeInstructions = this.getTypeInstructions(agent.type);
        if (typeInstructions) {
            parts.push('');
            parts.push('## Instructions:');
            parts.push(typeInstructions);
        }

        // Add output format instructions
        if (agent.config.outputFormat === 'json') {
            parts.push('');
            parts.push('## Output Format:');
            parts.push('Respond ONLY with valid JSON. Do not include any markdown code blocks or extra text.');
        }

        return parts.join('\n');
    }

    private getTypeInstructions(agentType: string): string | null {
        const instructions: Record<string, string> = {
            'web-scraper': 'Extract the requested data from the provided content. Focus on accuracy and completeness.',
            'summarizer': 'Create a concise summary that captures the key points. Be clear and well-organized.',
            'writer': 'Generate engaging, well-structured content. Follow any style or formatting guidelines provided.',
            'code-generator': 'Write clean, efficient, and well-documented code. Include appropriate comments.',
            'data-analyst': 'Analyze the data thoroughly and provide actionable insights with supporting evidence.',
            'translator': 'Provide an accurate translation that maintains the original meaning and tone.',
            'qa-agent': 'Answer the question accurately based on the provided context. Cite relevant information.',
            'classifier': 'Classify the input according to the provided categories. Explain your reasoning.',
            'extractor': 'Extract the specified entities or information accurately. Format as structured data.',
            'validator': 'Validate the input against the specified criteria. Report any issues found.',
            'researcher': 'Research the topic thoroughly and provide comprehensive, accurate information.',
            'default': 'Process the input and provide a helpful, accurate response.',
        };

        return instructions[agentType] || instructions['default'];
    }

    private processOutput(agent: Agent, response: GenerationResponse): unknown {
        const text = response.text.trim();

        // Handle JSON output format
        if (agent.config.outputFormat === 'json') {
            try {
                // Try to extract JSON from the response
                const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
                if (jsonMatch) {
                    return JSON.parse(jsonMatch[0]);
                }
                return JSON.parse(text);
            } catch {
                // Return as text if JSON parsing fails
                return { text, parseError: 'Failed to parse as JSON' };
            }
        }

        // Default: return as text
        return text;
    }

    // Validate agent configuration
    validateAgent(agent: Agent): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!agent.id) errors.push('Agent ID is required');
        if (!agent.type) errors.push('Agent type is required');
        if (!agent.config.model) errors.push('Model is required');

        if (agent.config.temperature !== undefined) {
            if (agent.config.temperature < 0 || agent.config.temperature > 2) {
                errors.push('Temperature must be between 0 and 2');
            }
        }

        if (agent.config.maxTokens !== undefined) {
            if (agent.config.maxTokens < 1 || agent.config.maxTokens > 100000) {
                errors.push('Max tokens must be between 1 and 100000');
            }
        }

        return { valid: errors.length === 0, errors };
    }
}

// Export singleton
export const agentRunner = new AgentRunner();
