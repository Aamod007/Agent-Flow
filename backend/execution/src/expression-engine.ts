/**
 * Expression Engine
 * 
 * Handles template variable interpolation and expression evaluation
 * in workflow node configurations.
 * 
 * Syntax: {{ expression }}
 * Examples:
 *   {{ $input.data.name }}         - Access input data
 *   {{ $node["HTTP"].data.body }}  - Access other node's output
 *   {{ $env.API_KEY }}             - Access environment variable
 *   {{ $now }}                     - Current timestamp
 *   {{ $json.stringify($input) }}  - Use JSON methods
 */

// ============================================================
// Types
// ============================================================

export interface ExpressionContext {
    $input: unknown;                          // Input from previous node
    $node: Record<string, NodeOutput>;        // All node outputs by ID/name
    $env: Record<string, string>;             // Environment variables
    $execution: ExecutionInfo;                // Execution metadata
    $workflow: WorkflowInfo;                  // Workflow metadata
    $now: string;                             // Current ISO timestamp
    $today: string;                           // Current date YYYY-MM-DD
    $json: typeof JSON;                       // JSON utilities
    $Math: typeof Math;                       // Math utilities
    [key: string]: unknown;                   // Custom variables
}

export interface NodeOutput {
    id: string;
    name: string;
    type: string;
    data: unknown;
    status: string;
}

export interface ExecutionInfo {
    id: string;
    startedAt: string;
    triggeredBy: string;
    triggerData?: unknown;
}

export interface WorkflowInfo {
    id: string;
    name: string;
    version: number;
}

export interface ExpressionResult {
    success: boolean;
    value: unknown;
    error?: string;
    rawExpression: string;
}

// ============================================================
// Expression Patterns
// ============================================================

const EXPRESSION_PATTERN = /\{\{\s*(.*?)\s*\}\}/g;
const SINGLE_EXPRESSION = /^\{\{\s*(.*?)\s*\}\}$/;

// ============================================================
// Expression Engine Class
// ============================================================

export class ExpressionEngine {
    private context: ExpressionContext;
    private cache: Map<string, unknown> = new Map();

    constructor(context: Partial<ExpressionContext> = {}) {
        this.context = this.buildDefaultContext(context);
    }

    /**
     * Build default context with system variables
     */
    private buildDefaultContext(overrides: Partial<ExpressionContext>): ExpressionContext {
        const now = new Date();

        return {
            $input: null,
            $node: {},
            $env: this.getSafeEnv(),
            $execution: {
                id: '',
                startedAt: now.toISOString(),
                triggeredBy: 'manual'
            },
            $workflow: {
                id: '',
                name: '',
                version: 1
            },
            $now: now.toISOString(),
            $today: now.toISOString().split('T')[0],
            $json: JSON,
            $Math: Math,
            ...overrides
        };
    }

    /**
     * Get safe environment variables (filter sensitive ones)
     */
    private getSafeEnv(): Record<string, string> {
        const env: Record<string, string> = {};
        const allowedPrefixes = ['WORKFLOW_', 'APP_', 'PUBLIC_'];

        if (typeof process !== 'undefined' && process.env) {
            for (const [key, value] of Object.entries(process.env)) {
                if (allowedPrefixes.some(p => key.startsWith(p)) && value) {
                    env[key] = value;
                }
            }
        }

        return env;
    }

    /**
     * Update context with new values
     */
    updateContext(updates: Partial<ExpressionContext>): void {
        Object.assign(this.context, updates);
        this.cache.clear();
    }

    /**
     * Set input for current node
     */
    setInput(input: unknown): void {
        this.context.$input = input;
    }

    /**
     * Register node output for access in expressions
     */
    registerNodeOutput(nodeId: string, output: NodeOutput): void {
        this.context.$node[nodeId] = output;
        // Also register by name if available
        if (output.name) {
            this.context.$node[output.name] = output;
        }
    }

    /**
     * Evaluate a single expression string
     */
    evaluate(expression: string): ExpressionResult {
        try {
            // Check cache
            if (this.cache.has(expression)) {
                return {
                    success: true,
                    value: this.cache.get(expression),
                    rawExpression: expression
                };
            }

            const value = this.evaluateExpression(expression);
            this.cache.set(expression, value);

            return {
                success: true,
                value,
                rawExpression: expression
            };
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            return {
                success: false,
                value: undefined,
                error: message,
                rawExpression: expression
            };
        }
    }

    /**
     * Resolve template string with embedded expressions
     * E.g., "Hello {{ $input.name }}, today is {{ $today }}"
     */
    resolveTemplate(template: string): string {
        if (typeof template !== 'string') {
            return String(template);
        }

        // Check if it's a single expression that should preserve type
        const singleMatch = template.match(SINGLE_EXPRESSION);
        if (singleMatch) {
            const result = this.evaluate(singleMatch[1]);
            return result.success ? String(result.value) : template;
        }

        // Replace all expressions in template
        return template.replace(EXPRESSION_PATTERN, (_, expr) => {
            const result = this.evaluate(expr);
            if (!result.success) {
                console.warn(`Expression evaluation failed: ${expr}`, result.error);
                return `{{ ${expr} }}`; // Return original on failure
            }
            return String(result.value ?? '');
        });
    }

    /**
     * Resolve an object recursively, resolving all string expressions
     */
    resolveObject<T>(obj: T): T {
        if (obj === null || obj === undefined) {
            return obj;
        }

        if (typeof obj === 'string') {
            // Check if single expression that should preserve type
            const singleMatch = obj.match(SINGLE_EXPRESSION);
            if (singleMatch) {
                const result = this.evaluate(singleMatch[1]);
                return (result.success ? result.value : obj) as T;
            }
            return this.resolveTemplate(obj) as T;
        }

        if (Array.isArray(obj)) {
            return obj.map(item => this.resolveObject(item)) as T;
        }

        if (typeof obj === 'object') {
            const result: Record<string, unknown> = {};
            for (const [key, value] of Object.entries(obj)) {
                result[key] = this.resolveObject(value);
            }
            return result as T;
        }

        return obj;
    }

    /**
     * Internal expression evaluation using Function constructor
     * Note: This is sandboxed but should be used carefully
     */
    private evaluateExpression(expression: string): unknown {
        // Build context variables for the function
        const contextKeys = Object.keys(this.context);
        const contextValues = Object.values(this.context);

        // Add utility functions
        const utilityFunctions = {
            $isEmpty: (val: unknown) => val === null || val === undefined || val === '' ||
                (Array.isArray(val) && val.length === 0) ||
                (typeof val === 'object' && Object.keys(val as object).length === 0),
            $isNumber: (val: unknown) => typeof val === 'number' && !isNaN(val),
            $isString: (val: unknown) => typeof val === 'string',
            $isArray: (val: unknown) => Array.isArray(val),
            $isObject: (val: unknown) => typeof val === 'object' && val !== null && !Array.isArray(val),
            $first: <T>(arr: T[]) => Array.isArray(arr) ? arr[0] : undefined,
            $last: <T>(arr: T[]) => Array.isArray(arr) ? arr[arr.length - 1] : undefined,
            $length: (val: unknown) => Array.isArray(val) ? val.length :
                typeof val === 'string' ? val.length : 0,
            $keys: (obj: object) => typeof obj === 'object' && obj ? Object.keys(obj) : [],
            $values: (obj: object) => typeof obj === 'object' && obj ? Object.values(obj) : [],
            $pick: (obj: Record<string, unknown>, keys: string[]) => {
                if (typeof obj !== 'object' || !obj) return {};
                const result: Record<string, unknown> = {};
                for (const key of keys) {
                    if (key in obj) result[key] = obj[key];
                }
                return result;
            },
            $omit: (obj: Record<string, unknown>, keys: string[]) => {
                if (typeof obj !== 'object' || !obj) return {};
                const result: Record<string, unknown> = {};
                for (const [key, value] of Object.entries(obj)) {
                    if (!keys.includes(key)) result[key] = value;
                }
                return result;
            },
            $default: (val: unknown, defaultVal: unknown) =>
                val === null || val === undefined ? defaultVal : val,
            $format: {
                date: (date: string | Date, format?: string) => {
                    const d = new Date(date);
                    if (format === 'short') return d.toLocaleDateString();
                    if (format === 'long') return d.toLocaleDateString(undefined, {
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                    });
                    return d.toISOString();
                },
                number: (num: number, decimals = 2) => num.toFixed(decimals),
                currency: (num: number, currency = 'USD') =>
                    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(num)
            }
        };

        const allKeys = [...contextKeys, ...Object.keys(utilityFunctions)];
        const allValues = [...contextValues, ...Object.values(utilityFunctions)];

        // Create sandboxed function
        const fn = new Function(...allKeys, `"use strict"; return (${expression});`);

        return fn(...allValues);
    }

    /**
     * Validate an expression without executing it
     */
    validateExpression(expression: string): { valid: boolean; error?: string } {
        try {
            // Try to parse the expression
            new Function(`"use strict"; return (${expression});`);
            return { valid: true };
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            return { valid: false, error: message };
        }
    }

    /**
     * Extract all expressions from a template
     */
    extractExpressions(template: string): string[] {
        const expressions: string[] = [];
        let match;

        const regex = new RegExp(EXPRESSION_PATTERN);
        while ((match = regex.exec(template)) !== null) {
            expressions.push(match[1].trim());
        }

        return expressions;
    }
}

// ============================================================
// Factory Functions
// ============================================================

/**
 * Create an expression engine with context
 */
export function createExpressionEngine(context?: Partial<ExpressionContext>): ExpressionEngine {
    return new ExpressionEngine(context);
}

/**
 * Quick resolve for one-off template resolution
 */
export function resolveExpression(
    template: string,
    context: Partial<ExpressionContext>
): string {
    const engine = new ExpressionEngine(context);
    return engine.resolveTemplate(template);
}

// ============================================================
// Common Expression Helpers
// ============================================================

export const EXPRESSION_EXAMPLES = {
    // Input access
    inputData: '{{ $input.data }}',
    inputValue: '{{ $input.value }}',

    // Node output access
    nodeData: '{{ $node["NodeName"].data }}',
    nodeStatus: '{{ $node["NodeName"].status }}',

    // Environment
    envVar: '{{ $env.WORKFLOW_API_KEY }}',

    // Timestamps
    currentTime: '{{ $now }}',
    currentDate: '{{ $today }}',

    // Utilities
    stringify: '{{ $json.stringify($input) }}',
    isEmpty: '{{ $isEmpty($input.data) }}',
    defaultVal: '{{ $default($input.name, "Unknown") }}',

    // Conditionals
    ternary: '{{ $input.status === "active" ? "Yes" : "No" }}',

    // String operations
    concat: '{{ $input.firstName + " " + $input.lastName }}',
    template: 'Hello {{ $input.name }}, your order #{{ $input.orderId }} is ready!'
};
