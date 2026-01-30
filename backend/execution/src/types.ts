// Shared types for execution service

// ==========================================
// NODE TYPES
// ==========================================

export type NodeType = 
    | 'agent'           // AI/LLM agent node
    | 'condition'       // IF/ELSE branching
    | 'switch'          // Multiple output branches
    | 'loop'            // Iterate over array
    | 'merge'           // Combine branches
    | 'http'            // HTTP request
    | 'transformer'     // Data transformation
    | 'trigger'         // Webhook/schedule trigger
    | 'code';           // Custom JavaScript code

// ==========================================
// RETRY & ERROR HANDLING
// ==========================================

export interface RetryConfig {
    enabled: boolean;
    maxAttempts: number;      // e.g., 3
    delayMs: number;          // Initial delay e.g., 1000
    backoffMultiplier: number; // e.g., 2 for exponential backoff
}

export interface TimeoutConfig {
    enabled: boolean;
    timeoutMs: number;
}

export interface ErrorHandling {
    retry: RetryConfig;
    timeout: TimeoutConfig;
    continueOnError: boolean;
}

// ==========================================
// NODE CONFIGURATIONS
// ==========================================

export interface BaseNodeConfig {
    errorHandling?: ErrorHandling;
}

export interface AgentConfig extends BaseNodeConfig {
    model: string;
    temperature: number;
    maxTokens: number;
    systemPrompt?: string;
    provider?: 'gemini' | 'ollama' | 'groq' | 'openai';
    inputMapping?: Record<string, string>;
    outputFormat?: 'text' | 'json' | 'markdown';
    tools?: string[];
    [key: string]: unknown;
}

export interface ConditionConfig extends BaseNodeConfig {
    field: string;           // Field to evaluate e.g., "input.value"
    operator: ConditionOperator;
    value: unknown;          // Value to compare against
    expression?: string;     // Alternative: raw JS expression
}

export type ConditionOperator = 
    | 'equals' 
    | 'notEquals' 
    | 'contains' 
    | 'notContains'
    | 'startsWith'
    | 'endsWith'
    | 'greaterThan' 
    | 'lessThan'
    | 'greaterOrEqual'
    | 'lessOrEqual'
    | 'exists' 
    | 'notExists'
    | 'isEmpty'
    | 'isNotEmpty'
    | 'matches';  // regex

export interface SwitchCase {
    id: string;
    label: string;
    condition: ConditionConfig;
}

export interface SwitchConfig extends BaseNodeConfig {
    field: string;           // Field to switch on
    cases: SwitchCase[];
    defaultCase?: string;    // Output handle for default
}

export interface LoopConfig extends BaseNodeConfig {
    iterateOver: string;     // Field containing array e.g., "input.items"
    itemVariable: string;    // Variable name for current item e.g., "item"
    indexVariable: string;   // Variable name for index e.g., "index"
    maxIterations?: number;  // Safety limit
}

export interface MergeConfig extends BaseNodeConfig {
    mode: 'waitAll' | 'waitAny' | 'append';
    outputField?: string;    // Where to store merged data
}

export interface HttpConfig extends BaseNodeConfig {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    url: string;             // Supports expressions {{input.url}}
    headers?: Record<string, string>;
    body?: string;           // JSON string, supports expressions
    authentication?: {
        type: 'none' | 'apiKey' | 'basic' | 'bearer';
        apiKeyHeader?: string;
        apiKeyValue?: string;
        username?: string;
        password?: string;
        token?: string;
    };
    responseType?: 'json' | 'text' | 'binary';
}

export type TransformOperation = 
    | { type: 'set'; field: string; value: unknown }
    | { type: 'rename'; from: string; to: string }
    | { type: 'delete'; field: string }
    | { type: 'filter'; condition: string }  // JS expression
    | { type: 'map'; expression: string }    // JS expression
    | { type: 'pick'; fields: string[] }
    | { type: 'omit'; fields: string[] };

export interface TransformerConfig extends BaseNodeConfig {
    operations: TransformOperation[];
}

export interface TriggerConfig extends BaseNodeConfig {
    triggerType: 'webhook' | 'schedule' | 'manual';
    webhookPath?: string;
    webhookMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    cronExpression?: string;
    timezone?: string;
}

export interface CodeConfig extends BaseNodeConfig {
    language: 'javascript';
    code: string;            // User's code
    timeout?: number;        // Sandbox timeout
}

// ==========================================
// GENERIC NODE
// ==========================================

export interface Node {
    id: string;
    type: NodeType;
    label: string;
    position: { x: number; y: number };
    data: {
        label: string;
        nodeType: NodeType;
        config: AgentConfig | ConditionConfig | SwitchConfig | LoopConfig | 
                MergeConfig | HttpConfig | TransformerConfig | TriggerConfig | CodeConfig;
    };
}

// ==========================================
// LEGACY TYPES (kept for compatibility)
// ==========================================

export interface Agent {
    id: string;
    workflowId?: string;
    type: string;
    label: string;
    config: AgentConfig;
}

export interface Workflow {
    id: string;
    agents: Agent[];
    connections: Connection[];
    errorWorkflowId?: string;
}

export interface Connection {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
}

// ==========================================
// EXECUTION CONTEXT
// ==========================================

export interface ExecutionContext {
    executionId: string;
    workflowId: string;
    workflow: Workflow;
    input: unknown;
    variables: Record<string, unknown>;
    history: ExecutionHistoryEntry[];
    
    // New fields for graph execution
    nodeOutputs: Map<string, unknown>;       // Outputs keyed by node ID
    executedNodes: Set<string>;              // Track completed nodes
    currentBranch?: string;                  // For conditional execution
    loopState?: {
        nodeId: string;
        currentIndex: number;
        items: unknown[];
    };
}

export interface ExecutionHistoryEntry {
    agentId: string;
    nodeType?: NodeType;
    input: unknown;
    output: unknown;
    timestamp: string;
    duration?: number;
    error?: string;
    retryCount?: number;
}

export interface ExecutionResult {
    agentId: string;
    agentType: string;
    status: 'completed' | 'failed' | 'skipped';
    output: unknown;
    error?: string;
    tokensUsed?: {
        prompt: number;
        completion: number;
        total: number;
    };
    latencyMs: number;
    model?: string;
    provider?: string;
    timestamp: string;
    retryCount?: number;
}

export interface ExecutionJob {
    agent: Agent;
    input: unknown;
    context: ExecutionContext;
}

// ==========================================
// TRIGGER TYPES
// ==========================================

export interface WebhookPayload {
    method: string;
    headers: Record<string, string>;
    body: unknown;
    query: Record<string, string>;
    path: string;
    timestamp: string;
}

export interface SchedulePayload {
    scheduledTime: string;
    cronExpression: string;
    executionNumber: number;
}
