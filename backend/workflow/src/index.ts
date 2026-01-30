import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

// Import trigger routers
import webhookRouter from './webhooks';
import schedulerRouter, { initializeSchedules } from './scheduler';
import versionsRouter from './versions';
import permissionsRouter from './permissions';

// Load .env from project root (works from both root and backend/workflow)
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const app = express();
const PORT = process.env.WORKFLOW_PORT || process.env.PORT || 3001;
const EXECUTION_SERVICE_URL = process.env.EXECUTION_SERVICE_URL || 'http://localhost:3002';

// Initialize Prisma with Accelerate (or standard if direct)
const prisma = new PrismaClient().$extends(withAccelerate());

app.use(cors());
app.use(express.json());

// Mount routers
app.use(webhookRouter);
app.use(schedulerRouter);
app.use(versionsRouter);
app.use(permissionsRouter);


// Get all workflows
app.get('/workflows', async (req, res) => {
    try {
        const workflows = await prisma.workflow.findMany({
            orderBy: { updatedAt: 'desc' }
        });
        res.json(workflows);
    } catch (error) {
        console.error('Error fetching workflows:', error);
        res.status(500).json({ error: 'Failed to fetch workflows' });
    }
});

// Get single workflow
app.get('/workflows/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const workflow = await prisma.workflow.findUnique({ where: { id } });
        if (!workflow) return res.status(404).json({ error: 'Workflow not found' });
        res.json(workflow);
    } catch (error) {
        console.error('Error fetching workflow:', error);
        res.status(500).json({ error: 'Failed to fetch workflow' });
    }
});

// Create workflow
app.post('/workflows', async (req, res) => {
    try {
        const { name, description } = req.body;
        const workflow = await prisma.workflow.create({
            data: {
                name,
                description,
                status: 'draft',
                definition: '{}'
            }
        });
        res.json(workflow);
    } catch (error) {
        console.error('Error creating workflow:', error);
        res.status(500).json({ error: 'Failed to create workflow' });
    }
});

// Update workflow
app.put('/workflows/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, definition, status } = req.body;

        const workflow = await prisma.workflow.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(description !== undefined && { description }),
                ...(definition && { definition: typeof definition === 'string' ? definition : JSON.stringify(definition) }),
                ...(status && { status }),
            }
        });
        res.json(workflow);
    } catch (error) {
        console.error('Error updating workflow:', error);
        res.status(500).json({ error: 'Failed to update workflow' });
    }
});

// Delete workflow
app.delete('/workflows/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Delete associated executions first
        await prisma.execution.deleteMany({ where: { workflowId: id } });

        // Delete the workflow
        await prisma.workflow.delete({ where: { id } });

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting workflow:', error);
        res.status(500).json({ error: 'Failed to delete workflow' });
    }
});

// Execute workflow
app.post('/workflows/:id/execute', async (req, res) => {
    try {
        const { id } = req.params;
        const { input = {} } = req.body;

        // Fetch the workflow
        const workflow = await prisma.workflow.findUnique({ where: { id } });
        if (!workflow) {
            return res.status(404).json({ error: 'Workflow not found' });
        }

        // Parse the workflow definition
        let definition;
        try {
            definition = JSON.parse(workflow.definition || '{}');
        } catch (e) {
            return res.status(400).json({ error: 'Invalid workflow definition' });
        }

        const nodes = definition.nodes || [];
        const edges = definition.edges || [];

        if (nodes.length === 0) {
            return res.status(400).json({ error: 'Workflow has no agents to execute' });
        }

        // Create execution record
        const execution = await prisma.execution.create({
            data: {
                workflowId: id,
                status: 'running',
                logs: JSON.stringify([{
                    timestamp: new Date().toISOString(),
                    level: 'info',
                    message: 'Execution started'
                }])
            }
        });

        // Update workflow status
        await prisma.workflow.update({
            where: { id },
            data: { status: 'running' }
        });

        // Topologically sort agents
        const sortedAgents = topologicalSort(nodes, edges);

        // Execute agents in order
        const results: any[] = [];
        const history: any[] = [];
        let currentInput = input;
        let hasError = false;
        const logs: any[] = [{
            timestamp: new Date().toISOString(),
            level: 'info',
            message: 'Execution started'
        }];

        for (const node of sortedAgents) {
            const agent = {
                id: node.id,
                type: node.data?.agentType || 'default',
                label: node.data?.label || 'Unnamed Agent',
                config: {
                    model: node.data?.config?.model || 'gemini-2.5-flash',
                    temperature: node.data?.config?.temperature ?? 0.7,
                    maxTokens: node.data?.config?.maxTokens ?? 2048,
                    systemPrompt: node.data?.config?.systemPrompt,
                    provider: node.data?.config?.provider || 'gemini',
                    outputFormat: node.data?.config?.outputFormat || 'text',
                }
            };

            logs.push({
                timestamp: new Date().toISOString(),
                level: 'info',
                message: `Starting agent: ${agent.label} (${agent.type})`
            });

            // Update execution logs
            await prisma.execution.update({
                where: { id: execution.id },
                data: { logs: JSON.stringify(logs) }
            });

            try {
                // Call execution service
                const response = await fetch(`${EXECUTION_SERVICE_URL}/execute`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        agent,
                        input: currentInput,
                        context: {
                            executionId: execution.id,
                            workflowId: id,
                            workflow: { id, agents: sortedAgents, connections: edges },
                            input: currentInput,
                            variables: {},
                            history
                        }
                    })
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.details || error.error || 'Execution failed');
                }

                const result = await response.json();
                results.push(result);

                // Add to history for next agent
                history.push({
                    agentId: agent.id,
                    input: currentInput,
                    output: result.output,
                    timestamp: new Date().toISOString()
                });

                // Pass output as input to next agent
                currentInput = result.output;

                logs.push({
                    timestamp: new Date().toISOString(),
                    level: result.status === 'completed' ? 'success' : 'error',
                    message: `Agent ${agent.label}: ${result.status}`,
                    details: {
                        tokensUsed: result.tokensUsed,
                        latencyMs: result.latencyMs,
                        model: result.model,
                        provider: result.provider
                    }
                });

                if (result.status === 'failed') {
                    hasError = true;
                    logs.push({
                        timestamp: new Date().toISOString(),
                        level: 'error',
                        message: `Agent failed: ${result.error}`
                    });
                    break;
                }
            } catch (error: any) {
                hasError = true;
                logs.push({
                    timestamp: new Date().toISOString(),
                    level: 'error',
                    message: `Execution error: ${error.message}`
                });
                break;
            }
        }

        // Mark execution as completed or failed
        const finalStatus = hasError ? 'failed' : 'completed';
        logs.push({
            timestamp: new Date().toISOString(),
            level: hasError ? 'error' : 'success',
            message: `Execution ${finalStatus}`
        });

        await prisma.execution.update({
            where: { id: execution.id },
            data: {
                status: finalStatus,
                logs: JSON.stringify(logs),
                result: JSON.stringify(results),
                endedAt: new Date()
            }
        });

        await prisma.workflow.update({
            where: { id },
            data: { status: 'idle' }
        });

        res.json({
            executionId: execution.id,
            status: finalStatus,
            message: `Executed ${results.length} of ${sortedAgents.length} agents`,
            results
        });

    } catch (error: any) {
        console.error('Execution error:', error);
        res.status(500).json({ error: 'Failed to execute workflow', details: error.message });
    }
});

// Get execution status
app.get('/executions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const execution = await prisma.execution.findUnique({
            where: { id },
            include: { workflow: true }
        });
        if (!execution) {
            return res.status(404).json({ error: 'Execution not found' });
        }
        res.json(execution);
    } catch (error) {
        console.error('Error fetching execution:', error);
        res.status(500).json({ error: 'Failed to fetch execution' });
    }
});

// Get all executions for a workflow
app.get('/workflows/:id/executions', async (req, res) => {
    try {
        const { id } = req.params;
        const executions = await prisma.execution.findMany({
            where: { workflowId: id },
            orderBy: { startedAt: 'desc' }
        });
        res.json(executions);
    } catch (error) {
        console.error('Error fetching executions:', error);
        res.status(500).json({ error: 'Failed to fetch executions' });
    }
});

// Get analytics/metrics
app.get('/analytics', async (req, res) => {
    try {
        const [
            totalWorkflows,
            totalExecutions,
            successfulExecutions,
            failedExecutions,
            recentExecutions
        ] = await Promise.all([
            prisma.workflow.count(),
            prisma.execution.count(),
            prisma.execution.count({ where: { status: 'completed' } }),
            prisma.execution.count({ where: { status: 'failed' } }),
            prisma.execution.findMany({
                take: 10,
                orderBy: { startedAt: 'desc' },
                include: { workflow: { select: { name: true } } }
            })
        ]);

        const successRate = totalExecutions > 0
            ? Math.round((successfulExecutions / totalExecutions) * 100)
            : 0;

        res.json({
            totalWorkflows,
            totalExecutions,
            successfulExecutions,
            failedExecutions,
            successRate,
            recentExecutions: recentExecutions.map((e: any) => ({
                id: e.id,
                workflowName: e.workflow.name,
                status: e.status,
                startedAt: e.startedAt,
                endedAt: e.endedAt
            }))
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});

// Get templates (seed data for now)
app.get('/templates', async (req, res) => {
    const templates = [
        {
            id: 'research-pipeline',
            name: 'Research Pipeline',
            description: 'Scrape web content, summarize key points, and generate a report',
            category: 'research',
            icon: '🔬',
            nodes: [
                { id: '1', type: 'agent', data: { label: 'Web Scraper', agentType: 'web-scraper', config: { model: 'gemini-2.0-flash', temperature: 0.3 } }, position: { x: 100, y: 100 } },
                { id: '2', type: 'agent', data: { label: 'Summarizer', agentType: 'summarizer', config: { model: 'gemini-2.0-flash', temperature: 0.5 } }, position: { x: 400, y: 100 } },
                { id: '3', type: 'agent', data: { label: 'Report Writer', agentType: 'writer', config: { model: 'gemini-2.5-pro', temperature: 0.7 } }, position: { x: 700, y: 100 } }
            ],
            edges: [
                { id: 'e1-2', source: '1', target: '2' },
                { id: 'e2-3', source: '2', target: '3' }
            ]
        },
        {
            id: 'content-generator',
            name: 'Content Generator',
            description: 'Generate blog posts, social media content, and marketing copy',
            category: 'content',
            icon: '✍️',
            nodes: [
                { id: '1', type: 'agent', data: { label: 'Topic Researcher', agentType: 'researcher', config: { model: 'gemini-2.0-flash' } }, position: { x: 100, y: 100 } },
                { id: '2', type: 'agent', data: { label: 'Content Writer', agentType: 'writer', config: { model: 'gemini-2.5-pro' } }, position: { x: 400, y: 100 } }
            ],
            edges: [
                { id: 'e1-2', source: '1', target: '2' }
            ]
        },
        {
            id: 'data-analysis',
            name: 'Data Analysis Pipeline',
            description: 'Analyze data, extract insights, and create visualizations',
            category: 'analysis',
            icon: '📊',
            nodes: [
                { id: '1', type: 'agent', data: { label: 'Data Extractor', agentType: 'extractor', config: { model: 'gemini-2.0-flash', outputFormat: 'json' } }, position: { x: 100, y: 100 } },
                { id: '2', type: 'agent', data: { label: 'Analyst', agentType: 'data-analyst', config: { model: 'gemini-2.5-pro' } }, position: { x: 400, y: 100 } }
            ],
            edges: [
                { id: 'e1-2', source: '1', target: '2' }
            ]
        },
        {
            id: 'qa-bot',
            name: 'Q&A Assistant',
            description: 'Answer questions based on provided context or documentation',
            category: 'support',
            icon: '💬',
            nodes: [
                { id: '1', type: 'agent', data: { label: 'Q&A Agent', agentType: 'qa-agent', config: { model: 'gemini-2.0-flash', systemPrompt: 'You are a helpful assistant that answers questions based on the provided context.' } }, position: { x: 250, y: 150 } }
            ],
            edges: []
        }
    ];

    res.json(templates);
});

// ============== User & Settings Endpoints ==============

// Get or create default user (simplified auth - in production, use proper auth)
app.get('/user', async (req, res) => {
    try {
        // For now, get or create a default user
        let user = await prisma.user.findFirst({
            include: { settings: true }
        });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    email: 'user@example.com',
                    name: 'User',
                    settings: {
                        create: {}
                    }
                },
                include: { settings: true }
            });
        }

        res.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// Update user profile
app.put('/user', async (req, res) => {
    try {
        const { name, email, company, role } = req.body;

        let user = await prisma.user.findFirst();
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user = await prisma.user.update({
            where: { id: user.id },
            data: {
                ...(name !== undefined && { name }),
                ...(email !== undefined && { email }),
                ...(company !== undefined && { company }),
                ...(role !== undefined && { role }),
            },
            include: { settings: true }
        });

        res.json(user);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// Get user settings
app.get('/user/settings', async (req, res) => {
    try {
        let user = await prisma.user.findFirst();
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        let settings = await prisma.userSettings.findUnique({
            where: { userId: user.id }
        });

        if (!settings) {
            settings = await prisma.userSettings.create({
                data: { userId: user.id }
            });
        }

        res.json(settings);
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

// Update user settings
app.put('/user/settings', async (req, res) => {
    try {
        const {
            theme,
            accentColor,
            emailNotifications,
            browserNotifications,
            workflowComplete,
            workflowFailed,
            weeklyReport
        } = req.body;

        let user = await prisma.user.findFirst();
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const settings = await prisma.userSettings.upsert({
            where: { userId: user.id },
            update: {
                ...(theme !== undefined && { theme }),
                ...(accentColor !== undefined && { accentColor }),
                ...(emailNotifications !== undefined && { emailNotifications }),
                ...(browserNotifications !== undefined && { browserNotifications }),
                ...(workflowComplete !== undefined && { workflowComplete }),
                ...(workflowFailed !== undefined && { workflowFailed }),
                ...(weeklyReport !== undefined && { weeklyReport }),
            },
            create: {
                userId: user.id,
                theme: theme || 'dark',
                accentColor: accentColor || 'indigo',
                emailNotifications: emailNotifications ?? true,
                browserNotifications: browserNotifications ?? true,
                workflowComplete: workflowComplete ?? true,
                workflowFailed: workflowFailed ?? true,
                weeklyReport: weeklyReport ?? false,
            }
        });

        res.json(settings);
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

// ============== API Keys Management ==============

// Get all API keys for user (masked)
app.get('/user/api-keys', async (req, res) => {
    try {
        let user = await prisma.user.findFirst();
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const apiKeys = await prisma.apiKey.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' }
        });

        // Mask the API keys for security
        const maskedKeys = apiKeys.map(key => ({
            ...key,
            key: maskApiKey(key.key)
        }));

        res.json(maskedKeys);
    } catch (error) {
        console.error('Error fetching API keys:', error);
        res.status(500).json({ error: 'Failed to fetch API keys' });
    }
});

// Add new API key
app.post('/user/api-keys', async (req, res) => {
    try {
        const { name, provider, key } = req.body;

        if (!name || !provider || !key) {
            return res.status(400).json({ error: 'Name, provider, and key are required' });
        }

        let user = await prisma.user.findFirst();
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const apiKey = await prisma.apiKey.create({
            data: {
                userId: user.id,
                name,
                provider,
                key, // In production, encrypt this!
                status: 'active'
            }
        });

        res.json({
            ...apiKey,
            key: maskApiKey(apiKey.key)
        });
    } catch (error) {
        console.error('Error creating API key:', error);
        res.status(500).json({ error: 'Failed to create API key' });
    }
});

// Update API key
app.put('/user/api-keys/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, key, status } = req.body;

        const apiKey = await prisma.apiKey.update({
            where: { id },
            data: {
                ...(name !== undefined && { name }),
                ...(key !== undefined && { key }),
                ...(status !== undefined && { status }),
            }
        });

        res.json({
            ...apiKey,
            key: maskApiKey(apiKey.key)
        });
    } catch (error) {
        console.error('Error updating API key:', error);
        res.status(500).json({ error: 'Failed to update API key' });
    }
});

// Delete API key
app.delete('/user/api-keys/:id', async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.apiKey.delete({ where: { id } });

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting API key:', error);
        res.status(500).json({ error: 'Failed to delete API key' });
    }
});

// Helper function to mask API keys
function maskApiKey(key: string): string {
    if (key.length <= 8) return '****';
    return key.substring(0, 4) + '...' + key.substring(key.length - 4);
}

// ============== Analytics Enhancements ==============

// Get execution history with time-series data for charts
app.get('/analytics/history', async (req, res) => {
    try {
        const { days = 7 } = req.query;
        const daysNum = parseInt(days as string, 10);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysNum);

        const executions = await prisma.execution.findMany({
            where: {
                startedAt: { gte: startDate }
            },
            orderBy: { startedAt: 'asc' },
            select: {
                id: true,
                status: true,
                startedAt: true,
                endedAt: true,
                workflow: { select: { name: true } }
            }
        });

        // Group by date
        const dailyStats: Record<string, { date: string; completed: number; failed: number; total: number }> = {};

        for (let i = 0; i < daysNum; i++) {
            const date = new Date();
            date.setDate(date.getDate() - (daysNum - 1 - i));
            const dateStr = date.toISOString().split('T')[0];
            dailyStats[dateStr] = { date: dateStr, completed: 0, failed: 0, total: 0 };
        }

        executions.forEach((exec: any) => {
            const dateStr = exec.startedAt.toISOString().split('T')[0];
            if (dailyStats[dateStr]) {
                dailyStats[dateStr].total++;
                if (exec.status === 'completed') dailyStats[dateStr].completed++;
                if (exec.status === 'failed') dailyStats[dateStr].failed++;
            }
        });

        res.json({
            history: Object.values(dailyStats),
            executions: executions.map((e: any) => ({
                id: e.id,
                workflowName: e.workflow.name,
                status: e.status,
                startedAt: e.startedAt,
                endedAt: e.endedAt
            }))
        });
    } catch (error) {
        console.error('Error fetching analytics history:', error);
        res.status(500).json({ error: 'Failed to fetch analytics history' });
    }
});

// Topological sort for agent execution order
function topologicalSort(nodes: any[], edges: any[]): any[] {
    const inDegree = new Map<string, number>();
    const adjacency = new Map<string, string[]>();

    // Initialize
    for (const node of nodes) {
        inDegree.set(node.id, 0);
        adjacency.set(node.id, []);
    }

    // Build graph
    for (const edge of edges) {
        const targets = adjacency.get(edge.source) || [];
        targets.push(edge.target);
        adjacency.set(edge.source, targets);
        inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    }

    // Kahn's algorithm
    const queue: string[] = [];
    for (const [id, degree] of inDegree) {
        if (degree === 0) queue.push(id);
    }

    const sorted: any[] = [];
    while (queue.length > 0) {
        const current = queue.shift()!;
        const node = nodes.find(n => n.id === current);
        if (node) sorted.push(node);

        for (const neighbor of (adjacency.get(current) || [])) {
            inDegree.set(neighbor, (inDegree.get(neighbor) || 1) - 1);
            if (inDegree.get(neighbor) === 0) {
                queue.push(neighbor);
            }
        }
    }

    return sorted;
}

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'workflow' });
});

app.listen(PORT, async () => {
    console.log(`Workflow Service running on port ${PORT}`);

    // Initialize scheduled triggers on startup
    try {
        await initializeSchedules();
        console.log('Scheduled triggers initialized');
    } catch (error) {
        console.error('Failed to initialize schedules:', error);
    }
});

