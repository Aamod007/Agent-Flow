// Cost Tracking Service - Track AI usage costs across providers

export interface ModelPricing {
  inputPer1M: number;  // Cost per 1M input tokens
  outputPer1M: number; // Cost per 1M output tokens
  currency: string;
}

// Pricing as of Jan 2025 (update periodically)
export const MODEL_PRICING: Record<string, ModelPricing> = {
  // OpenAI
  'gpt-4o': { inputPer1M: 2.50, outputPer1M: 10.00, currency: 'USD' },
  'gpt-4o-mini': { inputPer1M: 0.15, outputPer1M: 0.60, currency: 'USD' },
  'gpt-4-turbo': { inputPer1M: 10.00, outputPer1M: 30.00, currency: 'USD' },
  'gpt-4': { inputPer1M: 30.00, outputPer1M: 60.00, currency: 'USD' },
  'gpt-3.5-turbo': { inputPer1M: 0.50, outputPer1M: 1.50, currency: 'USD' },
  'o1': { inputPer1M: 15.00, outputPer1M: 60.00, currency: 'USD' },
  'o1-mini': { inputPer1M: 3.00, outputPer1M: 12.00, currency: 'USD' },

  // Google Gemini
  'gemini-2.0-flash-exp': { inputPer1M: 0.00, outputPer1M: 0.00, currency: 'USD' }, // Free tier
  'gemini-1.5-pro': { inputPer1M: 1.25, outputPer1M: 5.00, currency: 'USD' },
  'gemini-1.5-flash': { inputPer1M: 0.075, outputPer1M: 0.30, currency: 'USD' },
  'gemini-1.0-pro': { inputPer1M: 0.50, outputPer1M: 1.50, currency: 'USD' },

  // Anthropic Claude
  'claude-3-5-sonnet-20241022': { inputPer1M: 3.00, outputPer1M: 15.00, currency: 'USD' },
  'claude-3-opus-20240229': { inputPer1M: 15.00, outputPer1M: 75.00, currency: 'USD' },
  'claude-3-haiku-20240307': { inputPer1M: 0.25, outputPer1M: 1.25, currency: 'USD' },

  // Groq (Very cheap due to custom hardware)
  'llama-3.3-70b-versatile': { inputPer1M: 0.59, outputPer1M: 0.79, currency: 'USD' },
  'llama-3.1-8b-instant': { inputPer1M: 0.05, outputPer1M: 0.08, currency: 'USD' },
  'mixtral-8x7b-32768': { inputPer1M: 0.24, outputPer1M: 0.24, currency: 'USD' },

  // Ollama (Local - Free!)
  'ollama/*': { inputPer1M: 0.00, outputPer1M: 0.00, currency: 'USD' },
};

export interface UsageRecord {
  id: string;
  workflowId: string;
  executionId: string;
  nodeId: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  duration: number; // ms
  timestamp: Date;
}

export interface CostSummary {
  totalCost: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalRequests: number;
  byProvider: Record<string, {
    cost: number;
    requests: number;
    inputTokens: number;
    outputTokens: number;
  }>;
  byModel: Record<string, {
    cost: number;
    requests: number;
    inputTokens: number;
    outputTokens: number;
  }>;
  byWorkflow: Record<string, {
    cost: number;
    requests: number;
  }>;
}

export interface CostAlert {
  type: 'budget_warning' | 'budget_exceeded' | 'unusual_usage';
  message: string;
  currentCost: number;
  threshold: number;
  timestamp: Date;
}

class CostTrackingService {
  private usageRecords: UsageRecord[] = [];
  private budgetLimit: number = 100; // Default $100/month
  private alertThreshold: number = 0.8; // Alert at 80%
  private alerts: CostAlert[] = [];

  // Calculate cost for a single API call
  calculateCost(
    model: string,
    inputTokens: number,
    outputTokens: number
  ): number {
    // Check for exact model match
    let pricing = MODEL_PRICING[model];

    // Check for provider prefix (e.g., ollama/*)
    if (!pricing) {
      const provider = model.split('/')[0];
      if (provider) {
        pricing = MODEL_PRICING[`${provider}/*`];
      }
    }

    // Check for partial model match
    if (!pricing) {
      const modelKey = Object.keys(MODEL_PRICING).find(key => 
        model.toLowerCase().includes(key.toLowerCase()) ||
        key.toLowerCase().includes(model.toLowerCase())
      );
      if (modelKey) {
        pricing = MODEL_PRICING[modelKey];
      }
    }

    if (!pricing) {
      console.warn(`[CostTracking] Unknown model pricing: ${model}, using estimate`);
      // Use a conservative estimate for unknown models
      pricing = { inputPer1M: 1.00, outputPer1M: 2.00, currency: 'USD' };
    }

    const inputCost = (inputTokens / 1_000_000) * pricing.inputPer1M;
    const outputCost = (outputTokens / 1_000_000) * pricing.outputPer1M;

    return Math.round((inputCost + outputCost) * 1_000_000) / 1_000_000; // 6 decimal precision
  }

  // Record usage from an API call
  recordUsage(record: Omit<UsageRecord, 'id' | 'cost' | 'timestamp'>): UsageRecord {
    const cost = this.calculateCost(record.model, record.inputTokens, record.outputTokens);
    
    const fullRecord: UsageRecord = {
      ...record,
      id: `usage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      cost,
      timestamp: new Date()
    };

    this.usageRecords.push(fullRecord);
    this.checkBudgetAlerts();

    console.log(`[CostTracking] Recorded: ${record.model} - ${record.totalTokens} tokens - $${cost.toFixed(6)}`);

    return fullRecord;
  }

  // Get summary for a time period
  getSummary(startDate?: Date, endDate?: Date): CostSummary {
    let records = this.usageRecords;

    if (startDate || endDate) {
      records = records.filter(r => {
        if (startDate && r.timestamp < startDate) return false;
        if (endDate && r.timestamp > endDate) return false;
        return true;
      });
    }

    const summary: CostSummary = {
      totalCost: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalRequests: records.length,
      byProvider: {},
      byModel: {},
      byWorkflow: {}
    };

    for (const record of records) {
      summary.totalCost += record.cost;
      summary.totalInputTokens += record.inputTokens;
      summary.totalOutputTokens += record.outputTokens;

      // By provider
      if (!summary.byProvider[record.provider]) {
        summary.byProvider[record.provider] = { cost: 0, requests: 0, inputTokens: 0, outputTokens: 0 };
      }
      summary.byProvider[record.provider].cost += record.cost;
      summary.byProvider[record.provider].requests += 1;
      summary.byProvider[record.provider].inputTokens += record.inputTokens;
      summary.byProvider[record.provider].outputTokens += record.outputTokens;

      // By model
      if (!summary.byModel[record.model]) {
        summary.byModel[record.model] = { cost: 0, requests: 0, inputTokens: 0, outputTokens: 0 };
      }
      summary.byModel[record.model].cost += record.cost;
      summary.byModel[record.model].requests += 1;
      summary.byModel[record.model].inputTokens += record.inputTokens;
      summary.byModel[record.model].outputTokens += record.outputTokens;

      // By workflow
      if (!summary.byWorkflow[record.workflowId]) {
        summary.byWorkflow[record.workflowId] = { cost: 0, requests: 0 };
      }
      summary.byWorkflow[record.workflowId].cost += record.cost;
      summary.byWorkflow[record.workflowId].requests += 1;
    }

    return summary;
  }

  // Get monthly summary
  getMonthlySummary(): CostSummary {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return this.getSummary(startOfMonth);
  }

  // Set budget limit
  setBudgetLimit(limit: number): void {
    this.budgetLimit = limit;
    this.checkBudgetAlerts();
  }

  // Check and create alerts
  private checkBudgetAlerts(): void {
    const monthlyCost = this.getMonthlySummary().totalCost;

    // Budget warning (at threshold)
    if (monthlyCost >= this.budgetLimit * this.alertThreshold && monthlyCost < this.budgetLimit) {
      const existing = this.alerts.find(a => 
        a.type === 'budget_warning' && 
        a.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000)
      );
      
      if (!existing) {
        this.alerts.push({
          type: 'budget_warning',
          message: `You've used ${Math.round((monthlyCost / this.budgetLimit) * 100)}% of your monthly budget`,
          currentCost: monthlyCost,
          threshold: this.budgetLimit * this.alertThreshold,
          timestamp: new Date()
        });
      }
    }

    // Budget exceeded
    if (monthlyCost >= this.budgetLimit) {
      const existing = this.alerts.find(a => 
        a.type === 'budget_exceeded' && 
        a.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000)
      );
      
      if (!existing) {
        this.alerts.push({
          type: 'budget_exceeded',
          message: `Monthly budget exceeded! Current: $${monthlyCost.toFixed(2)}, Limit: $${this.budgetLimit.toFixed(2)}`,
          currentCost: monthlyCost,
          threshold: this.budgetLimit,
          timestamp: new Date()
        });
      }
    }
  }

  // Get recent alerts
  getAlerts(): CostAlert[] {
    return this.alerts.slice(-10);
  }

  // Clear alerts
  clearAlerts(): void {
    this.alerts = [];
  }

  // Get usage for a specific execution
  getExecutionUsage(executionId: string): UsageRecord[] {
    return this.usageRecords.filter(r => r.executionId === executionId);
  }

  // Get total cost for an execution
  getExecutionCost(executionId: string): number {
    return this.getExecutionUsage(executionId).reduce((sum, r) => sum + r.cost, 0);
  }

  // Export records for persistence
  exportRecords(): UsageRecord[] {
    return [...this.usageRecords];
  }

  // Import records (e.g., from database)
  importRecords(records: UsageRecord[]): void {
    this.usageRecords = records;
    this.checkBudgetAlerts();
  }

  // Get cost optimization suggestions
  getOptimizationSuggestions(): string[] {
    const suggestions: string[] = [];
    const summary = this.getMonthlySummary();

    // Check for expensive models that could be replaced
    if (summary.byModel['gpt-4'] || summary.byModel['gpt-4-turbo']) {
      suggestions.push('Consider using GPT-4o-mini for simpler tasks to reduce costs by up to 95%');
    }

    if (summary.byModel['claude-3-opus-20240229']) {
      suggestions.push('Consider using Claude 3.5 Sonnet for most tasks - it\'s 5x cheaper with similar quality');
    }

    // Check for local model usage
    const hasOllama = Object.keys(summary.byModel).some(m => m.includes('ollama') || m.includes('llama'));
    if (!hasOllama && summary.totalCost > 10) {
      suggestions.push('Try Ollama for local inference - it\'s free and works offline');
    }

    // Check for Groq usage
    const hasGroq = Object.keys(summary.byProvider).includes('groq');
    if (!hasGroq && summary.totalCost > 5) {
      suggestions.push('Groq offers very fast inference at low cost - great for high-volume tasks');
    }

    // Token optimization
    if (summary.totalInputTokens > summary.totalOutputTokens * 3) {
      suggestions.push('Consider summarizing long inputs before sending to AI to reduce input token costs');
    }

    return suggestions;
  }
}

// Singleton instance
export const costTracker = new CostTrackingService();

export default costTracker;
