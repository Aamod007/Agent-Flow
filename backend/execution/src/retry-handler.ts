/**
 * Retry Handler Module
 * 
 * Provides retry logic with exponential backoff and timeout handling
 * for workflow node execution.
 */

// ============================================================
// Types
// ============================================================

export interface RetryConfig {
    enabled: boolean;
    maxAttempts: number;        // Maximum retry attempts (default: 3)
    initialDelayMs: number;     // Initial delay before first retry (default: 1000)
    maxDelayMs: number;         // Maximum delay between retries (default: 30000)
    backoffMultiplier: number;  // Exponential backoff multiplier (default: 2)
    retryOn?: string[];         // Error types to retry on (e.g., ['NETWORK_ERROR', 'TIMEOUT'])
}

export interface TimeoutConfig {
    enabled: boolean;
    executionTimeoutMs: number; // Max time for node execution (default: 60000)
    connectionTimeoutMs: number; // Max time for connection (default: 10000)
}

export interface ExecutionOptions {
    retry?: Partial<RetryConfig>;
    timeout?: Partial<TimeoutConfig>;
    onRetry?: (attempt: number, error: Error, delayMs: number) => void;
    onTimeout?: () => void;
}

export interface ExecutionResult<T> {
    success: boolean;
    data?: T;
    error?: Error;
    attempts: number;
    totalDurationMs: number;
}

// ============================================================
// Default Configurations
// ============================================================

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
    enabled: true,
    maxAttempts: 3,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
    retryOn: ['NETWORK_ERROR', 'TIMEOUT', 'RATE_LIMIT', 'SERVICE_UNAVAILABLE']
};

export const DEFAULT_TIMEOUT_CONFIG: TimeoutConfig = {
    enabled: true,
    executionTimeoutMs: 60000,  // 1 minute
    connectionTimeoutMs: 10000   // 10 seconds
};

// ============================================================
// Retry Handler Class
// ============================================================

export class RetryHandler {
    private config: RetryConfig;
    private timeoutConfig: TimeoutConfig;

    constructor(
        retryConfig?: Partial<RetryConfig>,
        timeoutConfig?: Partial<TimeoutConfig>
    ) {
        this.config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
        this.timeoutConfig = { ...DEFAULT_TIMEOUT_CONFIG, ...timeoutConfig };
    }

    /**
     * Execute a function with retry and timeout support
     */
    async execute<T>(
        fn: () => Promise<T>,
        options?: ExecutionOptions
    ): Promise<ExecutionResult<T>> {
        const retryConfig = { ...this.config, ...options?.retry };
        const timeoutConfig = { ...this.timeoutConfig, ...options?.timeout };

        const startTime = Date.now();
        let lastError: Error | undefined;
        let attempts = 0;

        while (attempts < retryConfig.maxAttempts) {
            attempts++;

            try {
                // Wrap execution with timeout if enabled
                const result = timeoutConfig.enabled
                    ? await this.withTimeout(fn, timeoutConfig.executionTimeoutMs)
                    : await fn();

                return {
                    success: true,
                    data: result,
                    attempts,
                    totalDurationMs: Date.now() - startTime
                };

            } catch (error: unknown) {
                lastError = error instanceof Error ? error : new Error(String(error));

                // Check if we should retry
                const isLastAttempt = attempts >= retryConfig.maxAttempts;
                const shouldRetry = retryConfig.enabled &&
                    !isLastAttempt &&
                    this.shouldRetryError(lastError, retryConfig.retryOn);

                if (!shouldRetry) {
                    break;
                }

                // Calculate delay with exponential backoff
                const delayMs = this.calculateDelay(attempts, retryConfig);

                // Notify about retry
                options?.onRetry?.(attempts, lastError, delayMs);

                // Wait before retrying
                await this.delay(delayMs);
            }
        }

        return {
            success: false,
            error: lastError,
            attempts,
            totalDurationMs: Date.now() - startTime
        };
    }

    /**
     * Wrap a promise with a timeout
     */
    async withTimeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new TimeoutError(`Execution timed out after ${timeoutMs}ms`));
            }, timeoutMs);

            fn()
                .then((result) => {
                    clearTimeout(timer);
                    resolve(result);
                })
                .catch((error) => {
                    clearTimeout(timer);
                    reject(error);
                });
        });
    }

    /**
     * Calculate delay with exponential backoff
     */
    private calculateDelay(attempt: number, config: RetryConfig): number {
        const delay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt - 1);
        // Add jitter (±10%)
        const jitter = delay * 0.1 * (Math.random() * 2 - 1);
        return Math.min(delay + jitter, config.maxDelayMs);
    }

    /**
     * Determine if an error should trigger a retry
     */
    private shouldRetryError(error: Error, retryOn?: string[]): boolean {
        // Always retry on timeout errors
        if (error instanceof TimeoutError) {
            return true;
        }

        // Check error type/code
        const errorType = this.getErrorType(error);
        if (retryOn && retryOn.length > 0) {
            return retryOn.includes(errorType);
        }

        // Default: retry on network-like errors
        return ['NETWORK_ERROR', 'ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT'].includes(errorType);
    }

    /**
     * Extract error type from error object
     */
    private getErrorType(error: Error): string {
        // Check for error code (Node.js style)
        if ('code' in error && typeof (error as NodeJS.ErrnoException).code === 'string') {
            return (error as NodeJS.ErrnoException).code as string;
        }

        // Check for HTTP status codes
        if ('status' in error) {
            const status = (error as unknown as { status: number }).status;
            if (status === 429) return 'RATE_LIMIT';
            if (status === 503) return 'SERVICE_UNAVAILABLE';
            if (status >= 500) return 'SERVER_ERROR';
        }

        // Check error name
        if (error.name === 'TimeoutError') return 'TIMEOUT';
        if (error.name === 'NetworkError') return 'NETWORK_ERROR';

        return 'UNKNOWN_ERROR';
    }

    /**
     * Utility delay function
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// ============================================================
// Custom Error Classes
// ============================================================

export class TimeoutError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'TimeoutError';
    }
}

export class RetryExhaustedError extends Error {
    public attempts: number;
    public lastError?: Error;

    constructor(message: string, attempts: number, lastError?: Error) {
        super(message);
        this.name = 'RetryExhaustedError';
        this.attempts = attempts;
        this.lastError = lastError;
    }
}

// ============================================================
// Error Workflow Trigger
// ============================================================

export interface ErrorWorkflowData {
    originalWorkflowId: string;
    originalExecutionId: string;
    failedNodeId: string;
    failedNodeType: string;
    error: {
        message: string;
        type: string;
        stack?: string;
    };
    retryAttempts: number;
    timestamp: string;
    input?: unknown;
}

/**
 * Trigger error workflow when a node fails
 */
export async function triggerErrorWorkflow(
    errorWorkflowId: string,
    errorData: ErrorWorkflowData,
    prisma: {
        execution: {
            create: (args: { data: Record<string, unknown> }) => Promise<{ id: string }>;
        };
    }
): Promise<string> {
    // Create execution record for error workflow
    const execution = await prisma.execution.create({
        data: {
            workflowId: errorWorkflowId,
            status: 'pending',
            triggeredBy: 'error',
            triggerData: JSON.stringify(errorData),
            logs: JSON.stringify([{
                timestamp: new Date().toISOString(),
                level: 'info',
                message: `Error workflow triggered for failed node: ${errorData.failedNodeId}`
            }])
        }
    });

    // TODO: Actually execute the error workflow via graph-executor
    console.log(`[ErrorWorkflow] Triggered error workflow ${errorWorkflowId} with execution ${execution.id}`);

    return execution.id;
}

// ============================================================
// Factory Functions
// ============================================================

/**
 * Create a retry handler with custom configuration
 */
export function createRetryHandler(
    retryConfig?: Partial<RetryConfig>,
    timeoutConfig?: Partial<TimeoutConfig>
): RetryHandler {
    return new RetryHandler(retryConfig, timeoutConfig);
}

/**
 * Execute a function with default retry settings
 */
export async function executeWithRetry<T>(
    fn: () => Promise<T>,
    options?: ExecutionOptions
): Promise<ExecutionResult<T>> {
    const handler = new RetryHandler(options?.retry, options?.timeout);
    return handler.execute(fn, options);
}

// ============================================================
// Presets for Common Use Cases
// ============================================================

export const RETRY_PRESETS = {
    // Aggressive retry for critical operations
    critical: {
        maxAttempts: 5,
        initialDelayMs: 500,
        maxDelayMs: 60000,
        backoffMultiplier: 2
    },
    // Standard retry for API calls
    standard: {
        maxAttempts: 3,
        initialDelayMs: 1000,
        maxDelayMs: 30000,
        backoffMultiplier: 2
    },
    // Light retry for quick operations
    light: {
        maxAttempts: 2,
        initialDelayMs: 500,
        maxDelayMs: 5000,
        backoffMultiplier: 1.5
    },
    // No retry - fail fast
    none: {
        enabled: false,
        maxAttempts: 1,
        initialDelayMs: 0,
        maxDelayMs: 0,
        backoffMultiplier: 1
    }
} as const;

export const TIMEOUT_PRESETS = {
    // Long timeout for slow operations
    long: {
        executionTimeoutMs: 300000,  // 5 minutes
        connectionTimeoutMs: 30000    // 30 seconds
    },
    // Standard timeout
    standard: {
        executionTimeoutMs: 60000,   // 1 minute
        connectionTimeoutMs: 10000    // 10 seconds
    },
    // Short timeout for quick operations
    short: {
        executionTimeoutMs: 15000,   // 15 seconds
        connectionTimeoutMs: 5000     // 5 seconds
    }
} as const;
