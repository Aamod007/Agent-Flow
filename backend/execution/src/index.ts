import * as fs from 'fs';
import path from 'path';
import { Worker, Job, Queue } from 'bullmq';
import { AgentRunner } from './runner';
import { Agent, ExecutionContext, ExecutionJob } from './types';
import { modelProvider } from './model-provider.service';
import express from 'express';
import cors from 'cors';

// Load .env from project root
function loadEnv() {
    const paths = [
        path.resolve(__dirname, '../../../.env'),  // From src folder to root
        path.resolve(process.cwd(), '.env'),  // Fallback: current directory
    ];
    
    for (const envPath of paths) {
        if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, 'utf-8');
            const lines = content.split(/\r?\n/);
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed && !trimmed.startsWith('#')) {
                    const eqIndex = trimmed.indexOf('=');
                    if (eqIndex > 0) {
                        const key = trimmed.substring(0, eqIndex).trim();
                        const value = trimmed.substring(eqIndex + 1).trim();
                        if (key && value) {
                            process.env[key] = value;
                        }
                    }
                }
            }
            console.log(`Loaded env from: ${envPath}`);
            break;
        }
    }
}

loadEnv();

// Reinitialize model provider after env is loaded
modelProvider.reinitialize();

console.log('Environment:', {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY ? 'SET' : 'NOT SET',
    SKIP_REDIS: process.env.SKIP_REDIS
});

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379');
const PORT = process.env.PORT || 3002;

const app = express();
app.use(cors());
app.use(express.json());

console.log('Starting Execution Service...');

const runner = new AgentRunner();

// Check if Redis is available
let redisAvailable = false;
let worker: Worker | null = null;
let agentQueue: Queue | null = null;

async function initializeRedis() {
    // Skip Redis if explicitly disabled
    if (process.env.SKIP_REDIS === 'true') {
        console.log('Redis disabled via SKIP_REDIS. Running in direct execution mode.');
        redisAvailable = false;
        return;
    }

    try {
        console.log(`Attempting to connect to Redis at ${REDIS_HOST}:${REDIS_PORT}...`);

        // Test connection first with a timeout
        const { createClient } = await import('redis');
        const testClient = createClient({
            socket: {
                host: REDIS_HOST,
                port: REDIS_PORT,
                connectTimeout: 3000,
                reconnectStrategy: false // Don't reconnect on test
            }
        });
        
        testClient.on('error', () => {}); // Suppress errors during test
        
        await testClient.connect();
        await testClient.ping();
        await testClient.quit();
        
        console.log('Redis connection test successful.');

        agentQueue = new Queue('agent-processing', {
            connection: {
                host: REDIS_HOST,
                port: REDIS_PORT,
                maxRetriesPerRequest: 3
            }
        });

        worker = new Worker('agent-processing', async (job: Job<ExecutionJob>) => {
            console.log(`[Worker] Received job ${job.id}`);

            const { agent, input, context } = job.data;

            if (!agent || !agent.id) {
                throw new Error('Invalid job data: Missing agent definition');
            }

            try {
                const result = await runner.run(agent, input, context);
                console.log(`[Worker] Job ${job.id} completed successfully.`);
                return result;
            } catch (error: any) {
                console.error(`[Worker] Job ${job.id} failed:`, error.message);
                throw error;
            }
        }, {
            connection: {
                host: REDIS_HOST,
                port: REDIS_PORT,
                maxRetriesPerRequest: 3
            },
            concurrency: 5
        });

        worker.on('completed', job => {
            console.log(`${job.id} has completed!`);
        });

        worker.on('failed', (job, err) => {
            console.log(`${job?.id} has failed with ${err.message}`);
        });

        redisAvailable = true;
        console.log('Redis connection established. Worker listening for jobs...');
    } catch (error: any) {
        console.warn(`Redis not available (${error.message}). Running in direct execution mode.`);
        console.log('Tip: Set SKIP_REDIS=true to disable Redis connection attempts.');
        redisAvailable = false;
    }
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'execution',
        redis: redisAvailable ? 'connected' : 'disconnected',
        mode: redisAvailable ? 'queue' : 'direct'
    });
});

// Execute agent directly (for when Redis is not available or for single agent execution)
app.post('/execute', async (req, res) => {
    try {
        const { agent, input, context } = req.body as ExecutionJob;

        if (!agent || !agent.id) {
            return res.status(400).json({ error: 'Missing agent definition' });
        }

        // Validate agent
        const validation = runner.validateAgent(agent);
        if (!validation.valid) {
            return res.status(400).json({ error: 'Invalid agent configuration', details: validation.errors });
        }

        // Execute directly
        const result = await runner.run(agent, input, context);
        res.json(result);
    } catch (error: any) {
        console.error('Direct execution failed:', error);
        res.status(500).json({ error: 'Execution failed', details: error.message });
    }
});

// Queue agent for execution (when Redis is available)
app.post('/queue', async (req, res) => {
    try {
        if (!redisAvailable || !agentQueue) {
            return res.status(503).json({ error: 'Queue not available. Use /execute for direct execution.' });
        }

        const { agent, input, context } = req.body as ExecutionJob;

        if (!agent || !agent.id) {
            return res.status(400).json({ error: 'Missing agent definition' });
        }

        const job = await agentQueue.add('execute-agent', { agent, input, context }, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 1000 }
        });

        res.json({ jobId: job.id, status: 'queued' });
    } catch (error: any) {
        console.error('Failed to queue job:', error);
        res.status(500).json({ error: 'Failed to queue job', details: error.message });
    }
});

// Get job status
app.get('/jobs/:id', async (req, res) => {
    try {
        if (!redisAvailable || !agentQueue) {
            return res.status(503).json({ error: 'Queue not available' });
        }

        const job = await agentQueue.getJob(req.params.id);
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        const state = await job.getState();
        const result = job.returnvalue;

        res.json({
            jobId: job.id,
            state,
            result,
            progress: job.progress,
            attemptsMade: job.attemptsMade,
            timestamp: job.timestamp
        });
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to get job status', details: error.message });
    }
});

// Check model provider status
app.get('/providers', async (req, res) => {
    try {
        const { modelProvider } = await import('./model-provider.service');
        const status = await modelProvider.checkProviderStatus();
        res.json(status);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to check provider status', details: error.message });
    }
});

// Get available models for a provider
app.get('/providers/:provider/models', async (req, res) => {
    try {
        const { modelProvider } = await import('./model-provider.service');
        const models = await modelProvider.getAvailableModels(req.params.provider);
        res.json({ provider: req.params.provider, models });
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to get models', details: error.message });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Execution Service running on port ${PORT}`);
});

// Initialize Redis connection (non-blocking)
initializeRedis();
