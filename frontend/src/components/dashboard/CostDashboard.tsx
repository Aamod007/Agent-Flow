import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Zap,
  Cpu,
  AlertTriangle,
  Lightbulb,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';

interface CostSummary {
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

interface CostDashboardProps {
  workflowId?: string;
  compact?: boolean;
}

export function CostDashboard({ workflowId, compact = false }: CostDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<CostSummary | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [budgetLimit, setBudgetLimit] = useState(100);
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('month');

  // Mock data - replace with API call
  useEffect(() => {
    const fetchCostData = async () => {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      // Demo data
      setSummary({
        totalCost: 12.47,
        totalInputTokens: 2_340_000,
        totalOutputTokens: 890_000,
        totalRequests: 156,
        byProvider: {
          'openai': { cost: 5.23, requests: 45, inputTokens: 800_000, outputTokens: 320_000 },
          'gemini': { cost: 0.00, requests: 89, inputTokens: 1_200_000, outputTokens: 450_000 },
          'groq': { cost: 0.12, requests: 22, inputTokens: 340_000, outputTokens: 120_000 },
          'ollama': { cost: 0.00, requests: 0, inputTokens: 0, outputTokens: 0 }
        },
        byModel: {
          'gpt-4o-mini': { cost: 3.45, requests: 30, inputTokens: 500_000, outputTokens: 200_000 },
          'gpt-4o': { cost: 1.78, requests: 15, inputTokens: 300_000, outputTokens: 120_000 },
          'gemini-2.0-flash-exp': { cost: 0.00, requests: 89, inputTokens: 1_200_000, outputTokens: 450_000 },
          'llama-3.3-70b-versatile': { cost: 0.12, requests: 22, inputTokens: 340_000, outputTokens: 120_000 }
        },
        byWorkflow: {
          'workflow_1': { cost: 8.34, requests: 120 },
          'workflow_2': { cost: 4.13, requests: 36 }
        }
      });

      setSuggestions([
        'Use Gemini Flash (free tier) for simple classification tasks',
        'Groq is 10x cheaper than OpenAI for Llama models',
        'Try Ollama for local inference - it\'s completely free!'
      ]);

      setLoading(false);
    };

    fetchCostData();
  }, [workflowId, period]);

  const formatCost = (cost: number) => {
    if (cost === 0) return 'Free';
    if (cost < 0.01) return `$${cost.toFixed(4)}`;
    if (cost < 1) return `$${cost.toFixed(3)}`;
    return `$${cost.toFixed(2)}`;
  };

  const formatTokens = (tokens: number) => {
    if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
    if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`;
    return tokens.toString();
  };

  const getProviderColor = (provider: string) => {
    const colors: Record<string, string> = {
      openai: 'bg-emerald-500',
      gemini: 'bg-blue-500',
      groq: 'bg-orange-500',
      ollama: 'bg-purple-500',
      anthropic: 'bg-amber-500'
    };
    return colors[provider.toLowerCase()] || 'bg-gray-500';
  };

  const budgetUsage = summary ? (summary.totalCost / budgetLimit) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (compact) {
    return (
      <div className="p-4 space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              This Month
            </div>
            <div className="text-xl font-bold">{formatCost(summary?.totalCost || 0)}</div>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Zap className="h-4 w-4" />
              Requests
            </div>
            <div className="text-xl font-bold">{summary?.totalRequests || 0}</div>
          </div>
        </div>

        {/* Budget Bar */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Budget Usage</span>
            <span className={budgetUsage > 80 ? 'text-red-500' : ''}>{Math.round(budgetUsage)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all ${
                budgetUsage > 80 ? 'bg-red-500' : budgetUsage > 50 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(budgetUsage, 100)}%` }}
            />
          </div>
        </div>

        {/* Top Suggestion */}
        {suggestions.length > 0 && (
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5" />
              <p className="text-sm text-yellow-700 dark:text-yellow-300">{suggestions[0]}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Cost Dashboard
          </h2>
          <p className="text-muted-foreground">Track and optimize your AI spending</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className="px-3 py-2 bg-background border rounded-md text-sm"
          >
            <option value="day">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          <Button variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              Total Cost
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCost(summary?.totalCost || 0)}</div>
            <div className="flex items-center gap-1 text-sm text-green-500">
              <TrendingDown className="h-3 w-3" />
              23% vs last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Zap className="h-4 w-4" />
              API Requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalRequests || 0}</div>
            <div className="flex items-center gap-1 text-sm text-blue-500">
              <TrendingUp className="h-3 w-3" />
              12% vs last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Cpu className="h-4 w-4" />
              Total Tokens
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatTokens((summary?.totalInputTokens || 0) + (summary?.totalOutputTokens || 0))}
            </div>
            <div className="text-sm text-muted-foreground">
              {formatTokens(summary?.totalInputTokens || 0)} in / {formatTokens(summary?.totalOutputTokens || 0)} out
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" />
              Budget Status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(budgetUsage)}%</div>
            <div className="h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
              <div 
                className={`h-full ${budgetUsage > 80 ? 'bg-red-500' : 'bg-green-500'}`}
                style={{ width: `${Math.min(budgetUsage, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Provider Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cost by Provider</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {summary && Object.entries(summary.byProvider)
              .sort(([, a], [, b]) => b.cost - a.cost)
              .map(([provider, data]) => (
                <div key={provider} className="flex items-center gap-4">
                  <div className={`h-3 w-3 rounded-full ${getProviderColor(provider)}`} />
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium capitalize">{provider}</span>
                      <span className="text-muted-foreground">
                        {data.requests} requests • {formatCost(data.cost)}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getProviderColor(provider)}`}
                        style={{ 
                          width: `${summary.totalCost > 0 ? (data.cost / summary.totalCost) * 100 : 0}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Model Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Model Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {summary && Object.entries(summary.byModel)
              .sort(([, a], [, b]) => b.requests - a.requests)
              .map(([model, data]) => (
                <div key={model} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <div className="font-medium">{model}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatTokens(data.inputTokens)} in / {formatTokens(data.outputTokens)} out
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCost(data.cost)}</div>
                    <div className="text-sm text-muted-foreground">{data.requests} requests</div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Optimization Suggestions */}
      {suggestions.length > 0 && (
        <Card className="bg-yellow-500/5 border-yellow-500/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Cost Optimization Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-yellow-500 mt-0.5">•</span>
                  {suggestion}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default CostDashboard;
