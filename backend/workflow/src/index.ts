import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';
import multer from 'multer';

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
// Using type assertion to handle extended client types
const prismaBase = new PrismaClient().$extends(withAccelerate());
const prisma = prismaBase as unknown as PrismaClient;
// Cast for template operations (new models added to schema)
const prismaAny = prismaBase as any;

app.use(cors());
app.use(express.json());

// Serve static files (avatars, uploads, etc.)
app.use('/files', express.static(path.join(__dirname, '../../../files')));

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

// ============== Template Marketplace Endpoints ==============

// Default system templates
const SYSTEM_TEMPLATES = [
    // ============== FEATURED TEMPLATES ==============
    {
        id: 'research-pipeline',
        name: 'Research Pipeline',
        description: 'Scrape web content, summarize key points, and generate a comprehensive report with conditional branching',
        category: 'research',
        icon: '🔬',
        authorId: 'system',
        authorName: 'AgentFlow Team',
        isPublic: true,
        isFeatured: true,
        likes: 245,
        downloads: 1823,
        version: '2.0.0',
        tags: ['research', 'web-scraping', 'summarization', 'conditions'],
        nodes: [
            { id: 'trigger-1', type: 'trigger', data: { label: 'Manual Start', triggerType: 'manual', config: {} }, position: { x: 50, y: 200 } },
            { id: 'scraper-1', type: 'agent', data: { label: 'Web Scraper', agentType: 'web-scraper', config: { model: 'gemini-2.0-flash', temperature: 0.3, systemPrompt: 'Extract main content from the given URL. Return structured data with title, content, and metadata.' } }, position: { x: 250, y: 200 } },
            { id: 'condition-1', type: 'condition', data: { label: 'Content Check', conditionType: 'contains', field: 'content', value: '', operator: 'isNotEmpty', config: {} }, position: { x: 450, y: 200 } },
            { id: 'summarizer-1', type: 'agent', data: { label: 'Summarizer', agentType: 'summarizer', config: { model: 'gemini-2.0-flash', temperature: 0.5, systemPrompt: 'Create a concise summary of the main points. Include key facts and insights.' } }, position: { x: 650, y: 100 } },
            { id: 'error-handler', type: 'agent', data: { label: 'Error Handler', agentType: 'default', config: { model: 'gemini-2.0-flash', systemPrompt: 'Generate an error message explaining the content could not be extracted.' } }, position: { x: 650, y: 300 } },
            { id: 'merge-1', type: 'merge', data: { label: 'Merge Results', mergeType: 'waitAny', config: {} }, position: { x: 850, y: 200 } },
            { id: 'writer-1', type: 'agent', data: { label: 'Report Writer', agentType: 'writer', config: { model: 'gemini-2.5-pro', temperature: 0.7, systemPrompt: 'Write a comprehensive research report based on the summary. Include introduction, findings, and conclusion.' } }, position: { x: 1050, y: 200 } }
        ],
        edges: [
            { id: 'e-t1-s1', source: 'trigger-1', target: 'scraper-1' },
            { id: 'e-s1-c1', source: 'scraper-1', target: 'condition-1' },
            { id: 'e-c1-sum', source: 'condition-1', target: 'summarizer-1', sourceHandle: 'true' },
            { id: 'e-c1-err', source: 'condition-1', target: 'error-handler', sourceHandle: 'false' },
            { id: 'e-sum-m1', source: 'summarizer-1', target: 'merge-1' },
            { id: 'e-err-m1', source: 'error-handler', target: 'merge-1' },
            { id: 'e-m1-w1', source: 'merge-1', target: 'writer-1' }
        ]
    },
    {
        id: 'content-generator',
        name: 'Multi-Platform Content Generator',
        description: 'Generate blog posts, social media content, and marketing copy with loop-based batch processing',
        category: 'content',
        icon: '✍️',
        authorId: 'system',
        authorName: 'AgentFlow Team',
        isPublic: true,
        isFeatured: true,
        likes: 189,
        downloads: 1456,
        version: '2.0.0',
        tags: ['content', 'writing', 'marketing', 'batch-processing'],
        nodes: [
            { id: 'trigger-1', type: 'trigger', data: { label: 'Webhook Start', triggerType: 'webhook', config: { method: 'POST', path: '/generate-content' } }, position: { x: 50, y: 200 } },
            { id: 'set-1', type: 'set', data: { label: 'Set Platforms', operations: [{ field: 'platforms', value: '["blog", "twitter", "linkedin"]', type: 'json' }], config: {} }, position: { x: 250, y: 200 } },
            { id: 'researcher-1', type: 'agent', data: { label: 'Topic Researcher', agentType: 'research', config: { model: 'gemini-2.0-flash', systemPrompt: 'Research the given topic and provide key points, trends, and interesting angles for content creation.' } }, position: { x: 450, y: 200 } },
            { id: 'loop-1', type: 'loop', data: { label: 'Loop Platforms', arrayField: 'platforms', itemVariable: 'platform', config: {} }, position: { x: 650, y: 200 } },
            { id: 'switch-1', type: 'switch', data: { label: 'Platform Router', switchField: 'platform', cases: ['blog', 'twitter', 'linkedin'], config: {} }, position: { x: 850, y: 200 } },
            { id: 'blog-writer', type: 'agent', data: { label: 'Blog Writer', agentType: 'writer', config: { model: 'gemini-2.5-pro', temperature: 0.7, systemPrompt: 'Write a detailed blog post (800-1200 words) with engaging introduction, body sections, and conclusion.' } }, position: { x: 1100, y: 50 } },
            { id: 'twitter-writer', type: 'agent', data: { label: 'Twitter Writer', agentType: 'writer', config: { model: 'gemini-2.0-flash', temperature: 0.8, systemPrompt: 'Write engaging Twitter/X content. Create a thread of 3-5 tweets, each under 280 characters.' } }, position: { x: 1100, y: 200 } },
            { id: 'linkedin-writer', type: 'agent', data: { label: 'LinkedIn Writer', agentType: 'writer', config: { model: 'gemini-2.0-flash', temperature: 0.6, systemPrompt: 'Write professional LinkedIn content (150-300 words) with insights and a call-to-action.' } }, position: { x: 1100, y: 350 } },
            { id: 'merge-1', type: 'merge', data: { label: 'Collect Content', mergeType: 'append', config: {} }, position: { x: 1350, y: 200 } },
            { id: 'respond-1', type: 'respond-webhook', data: { label: 'Return Results', responseBody: '{{ $json }}', statusCode: 200, config: {} }, position: { x: 1550, y: 200 } }
        ],
        edges: [
            { id: 'e1', source: 'trigger-1', target: 'set-1' },
            { id: 'e2', source: 'set-1', target: 'researcher-1' },
            { id: 'e3', source: 'researcher-1', target: 'loop-1' },
            { id: 'e4', source: 'loop-1', target: 'switch-1' },
            { id: 'e5a', source: 'switch-1', target: 'blog-writer', sourceHandle: 'case-0' },
            { id: 'e5b', source: 'switch-1', target: 'twitter-writer', sourceHandle: 'case-1' },
            { id: 'e5c', source: 'switch-1', target: 'linkedin-writer', sourceHandle: 'case-2' },
            { id: 'e6a', source: 'blog-writer', target: 'merge-1' },
            { id: 'e6b', source: 'twitter-writer', target: 'merge-1' },
            { id: 'e6c', source: 'linkedin-writer', target: 'merge-1' },
            { id: 'e7', source: 'merge-1', target: 'respond-1' }
        ]
    },
    {
        id: 'api-data-pipeline',
        name: 'API Data Pipeline',
        description: 'Fetch data from external APIs, transform it, and analyze with code execution',
        category: 'analysis',
        icon: '📊',
        authorId: 'system',
        authorName: 'AgentFlow Team',
        isPublic: true,
        isFeatured: true,
        likes: 156,
        downloads: 987,
        version: '2.0.0',
        tags: ['data', 'api', 'analytics', 'code', 'http'],
        nodes: [
            { id: 'trigger-1', type: 'trigger', data: { label: 'Schedule', triggerType: 'schedule', config: { cron: '0 9 * * *', timezone: 'UTC' } }, position: { x: 50, y: 200 } },
            { id: 'http-1', type: 'http', data: { label: 'Fetch API Data', method: 'GET', url: 'https://api.example.com/data', headers: { 'Authorization': 'Bearer {{ $env.API_KEY }}' }, config: {} }, position: { x: 250, y: 200 } },
            { id: 'code-1', type: 'code', data: { label: 'Transform Data', language: 'javascript', code: `// Transform the API response
const items = $input.data || [];
const transformed = items.map(item => ({
  id: item.id,
  name: item.name.toUpperCase(),
  value: parseFloat(item.value) * 1.1,
  timestamp: new Date().toISOString()
}));
return { items: transformed, count: transformed.length };`, config: {} }, position: { x: 500, y: 200 } },
            { id: 'condition-1', type: 'condition', data: { label: 'Has Data?', conditionType: 'expression', field: 'count', operator: 'greaterThan', value: '0', config: {} }, position: { x: 750, y: 200 } },
            { id: 'analyst-1', type: 'agent', data: { label: 'Data Analyst', agentType: 'data-analyst', config: { model: 'gemini-2.5-pro', systemPrompt: 'Analyze the transformed data. Identify trends, anomalies, and key insights. Provide actionable recommendations.' } }, position: { x: 1000, y: 100 } },
            { id: 'set-empty', type: 'set', data: { label: 'Set Empty', operations: [{ field: 'analysis', value: 'No data available for analysis', type: 'string' }], config: {} }, position: { x: 1000, y: 300 } },
            { id: 'merge-1', type: 'merge', data: { label: 'Merge', mergeType: 'waitAny', config: {} }, position: { x: 1250, y: 200 } },
            { id: 'http-2', type: 'http', data: { label: 'Send Report', method: 'POST', url: 'https://api.example.com/reports', body: '{{ $json }}', headers: { 'Content-Type': 'application/json' }, config: {} }, position: { x: 1500, y: 200 } }
        ],
        edges: [
            { id: 'e1', source: 'trigger-1', target: 'http-1' },
            { id: 'e2', source: 'http-1', target: 'code-1' },
            { id: 'e3', source: 'code-1', target: 'condition-1' },
            { id: 'e4a', source: 'condition-1', target: 'analyst-1', sourceHandle: 'true' },
            { id: 'e4b', source: 'condition-1', target: 'set-empty', sourceHandle: 'false' },
            { id: 'e5a', source: 'analyst-1', target: 'merge-1' },
            { id: 'e5b', source: 'set-empty', target: 'merge-1' },
            { id: 'e6', source: 'merge-1', target: 'http-2' }
        ]
    },
    {
        id: 'customer-support-bot',
        name: 'Intelligent Support Bot',
        description: 'Multi-tier customer support with routing, escalation, and automated responses',
        category: 'support',
        icon: '💬',
        authorId: 'system',
        authorName: 'AgentFlow Team',
        isPublic: true,
        isFeatured: true,
        likes: 198,
        downloads: 1254,
        version: '2.0.0',
        tags: ['support', 'chatbot', 'automation', 'routing'],
        nodes: [
            { id: 'trigger-1', type: 'trigger', data: { label: 'Webhook', triggerType: 'webhook', config: { method: 'POST', path: '/support' } }, position: { x: 50, y: 250 } },
            { id: 'classifier', type: 'agent', data: { label: 'Intent Classifier', agentType: 'sentiment', config: { model: 'gemini-2.0-flash', systemPrompt: 'Classify the customer query into categories: billing, technical, sales, general. Also detect sentiment (positive, neutral, negative) and urgency (low, medium, high). Return JSON: {"category": "", "sentiment": "", "urgency": ""}' } }, position: { x: 250, y: 250 } },
            { id: 'code-parse', type: 'code', data: { label: 'Parse Classification', language: 'javascript', code: `// Parse the classification result
const result = JSON.parse($input.text || '{}');
return {
  category: result.category || 'general',
  sentiment: result.sentiment || 'neutral',
  urgency: result.urgency || 'low',
  needsEscalation: result.sentiment === 'negative' && result.urgency === 'high'
};`, config: {} }, position: { x: 500, y: 250 } },
            { id: 'condition-escalate', type: 'condition', data: { label: 'Needs Escalation?', conditionType: 'equals', field: 'needsEscalation', value: 'true', config: {} }, position: { x: 750, y: 250 } },
            { id: 'switch-category', type: 'switch', data: { label: 'Route by Category', switchField: 'category', cases: ['billing', 'technical', 'sales', 'general'], config: {} }, position: { x: 1000, y: 150 } },
            { id: 'billing-agent', type: 'agent', data: { label: 'Billing Agent', agentType: 'default', config: { model: 'gemini-2.0-flash', systemPrompt: 'You are a billing support specialist. Help with payment issues, refunds, invoices, and subscription questions. Be professional and empathetic.' } }, position: { x: 1300, y: 0 } },
            { id: 'tech-agent', type: 'agent', data: { label: 'Tech Support', agentType: 'default', config: { model: 'gemini-2.0-flash', systemPrompt: 'You are a technical support specialist. Help with bugs, errors, setup issues, and feature questions. Provide step-by-step solutions.' } }, position: { x: 1300, y: 100 } },
            { id: 'sales-agent', type: 'agent', data: { label: 'Sales Agent', agentType: 'default', config: { model: 'gemini-2.0-flash', systemPrompt: 'You are a sales representative. Help with pricing, features, demos, and enterprise inquiries. Be helpful and informative.' } }, position: { x: 1300, y: 200 } },
            { id: 'general-agent', type: 'agent', data: { label: 'General Support', agentType: 'default', config: { model: 'gemini-2.0-flash', systemPrompt: 'You are a general support agent. Help with any questions and route complex issues appropriately.' } }, position: { x: 1300, y: 300 } },
            { id: 'escalation-http', type: 'http', data: { label: 'Notify Team', method: 'POST', url: 'https://slack.com/api/chat.postMessage', body: '{"channel": "#support-urgent", "text": "Urgent escalation: {{ $input.query }}"}', config: {} }, position: { x: 1000, y: 400 } },
            { id: 'escalation-response', type: 'set', data: { label: 'Escalation Message', operations: [{ field: 'response', value: 'Your request has been escalated to our senior support team. You will receive a response within 1 hour.', type: 'string' }], config: {} }, position: { x: 1300, y: 400 } },
            { id: 'merge-1', type: 'merge', data: { label: 'Collect Response', mergeType: 'waitAny', config: {} }, position: { x: 1550, y: 250 } },
            { id: 'respond-1', type: 'respond-webhook', data: { label: 'Send Response', responseBody: '{{ $json.response || $json.text }}', statusCode: 200, config: {} }, position: { x: 1750, y: 250 } }
        ],
        edges: [
            { id: 'e1', source: 'trigger-1', target: 'classifier' },
            { id: 'e2', source: 'classifier', target: 'code-parse' },
            { id: 'e3', source: 'code-parse', target: 'condition-escalate' },
            { id: 'e4a', source: 'condition-escalate', target: 'switch-category', sourceHandle: 'false' },
            { id: 'e4b', source: 'condition-escalate', target: 'escalation-http', sourceHandle: 'true' },
            { id: 'e5a', source: 'switch-category', target: 'billing-agent', sourceHandle: 'case-0' },
            { id: 'e5b', source: 'switch-category', target: 'tech-agent', sourceHandle: 'case-1' },
            { id: 'e5c', source: 'switch-category', target: 'sales-agent', sourceHandle: 'case-2' },
            { id: 'e5d', source: 'switch-category', target: 'general-agent', sourceHandle: 'case-3' },
            { id: 'e6', source: 'escalation-http', target: 'escalation-response' },
            { id: 'e7a', source: 'billing-agent', target: 'merge-1' },
            { id: 'e7b', source: 'tech-agent', target: 'merge-1' },
            { id: 'e7c', source: 'sales-agent', target: 'merge-1' },
            { id: 'e7d', source: 'general-agent', target: 'merge-1' },
            { id: 'e7e', source: 'escalation-response', target: 'merge-1' },
            { id: 'e8', source: 'merge-1', target: 'respond-1' }
        ]
    },
    // ============== MORE TEMPLATES ==============
    {
        id: 'code-review-pipeline',
        name: 'Automated Code Review',
        description: 'Review code for bugs, security issues, and best practices with multi-agent analysis',
        category: 'development',
        icon: '🔍',
        authorId: 'system',
        authorName: 'AgentFlow Team',
        isPublic: true,
        isFeatured: false,
        likes: 167,
        downloads: 892,
        version: '1.0.0',
        tags: ['code-review', 'development', 'security', 'quality'],
        nodes: [
            { id: 'trigger-1', type: 'trigger', data: { label: 'Webhook', triggerType: 'webhook', config: { method: 'POST', path: '/review-code' } }, position: { x: 50, y: 200 } },
            { id: 'set-code', type: 'set', data: { label: 'Extract Code', operations: [{ field: 'code', value: '{{ $input.body.code }}', type: 'expression' }, { field: 'language', value: '{{ $input.body.language || "javascript" }}', type: 'expression' }], config: {} }, position: { x: 250, y: 200 } },
            { id: 'bug-reviewer', type: 'agent', data: { label: 'Bug Detector', agentType: 'code-reviewer', config: { model: 'gemini-2.5-pro', systemPrompt: 'Analyze the code for potential bugs, logic errors, and edge cases. List each issue with line reference and severity (critical/high/medium/low).' } }, position: { x: 500, y: 50 } },
            { id: 'security-reviewer', type: 'agent', data: { label: 'Security Analyzer', agentType: 'code-reviewer', config: { model: 'gemini-2.5-pro', systemPrompt: 'Analyze the code for security vulnerabilities: SQL injection, XSS, CSRF, authentication issues, data exposure. Provide remediation steps.' } }, position: { x: 500, y: 200 } },
            { id: 'style-reviewer', type: 'agent', data: { label: 'Style Checker', agentType: 'code-reviewer', config: { model: 'gemini-2.0-flash', systemPrompt: 'Review code style, naming conventions, documentation, and best practices. Suggest improvements for readability and maintainability.' } }, position: { x: 500, y: 350 } },
            { id: 'merge-1', type: 'merge', data: { label: 'Collect Reviews', mergeType: 'waitAll', config: {} }, position: { x: 750, y: 200 } },
            { id: 'summarizer', type: 'agent', data: { label: 'Report Generator', agentType: 'summarizer', config: { model: 'gemini-2.5-pro', systemPrompt: 'Combine all code review findings into a structured report. Prioritize critical issues, group by category, and provide an overall code quality score (1-10).' } }, position: { x: 1000, y: 200 } },
            { id: 'respond-1', type: 'respond-webhook', data: { label: 'Return Report', responseBody: '{{ $json }}', statusCode: 200, config: {} }, position: { x: 1250, y: 200 } }
        ],
        edges: [
            { id: 'e1', source: 'trigger-1', target: 'set-code' },
            { id: 'e2a', source: 'set-code', target: 'bug-reviewer' },
            { id: 'e2b', source: 'set-code', target: 'security-reviewer' },
            { id: 'e2c', source: 'set-code', target: 'style-reviewer' },
            { id: 'e3a', source: 'bug-reviewer', target: 'merge-1' },
            { id: 'e3b', source: 'security-reviewer', target: 'merge-1' },
            { id: 'e3c', source: 'style-reviewer', target: 'merge-1' },
            { id: 'e4', source: 'merge-1', target: 'summarizer' },
            { id: 'e5', source: 'summarizer', target: 'respond-1' }
        ]
    },
    {
        id: 'email-automation',
        name: 'Smart Email Automation',
        description: 'Process incoming emails, categorize, and auto-respond based on content',
        category: 'content',
        icon: '📧',
        authorId: 'system',
        authorName: 'AgentFlow Team',
        isPublic: true,
        isFeatured: false,
        likes: 134,
        downloads: 756,
        version: '1.0.0',
        tags: ['email', 'automation', 'communication'],
        nodes: [
            { id: 'trigger-1', type: 'trigger', data: { label: 'Email Webhook', triggerType: 'webhook', config: { method: 'POST', path: '/email-handler' } }, position: { x: 50, y: 200 } },
            { id: 'analyzer', type: 'agent', data: { label: 'Email Analyzer', agentType: 'sentiment', config: { model: 'gemini-2.0-flash', systemPrompt: 'Analyze email: extract sender intent, urgency, required action. Return JSON: {"intent": "", "urgency": "low/medium/high", "requiresReply": true/false, "suggestedLabel": ""}' } }, position: { x: 250, y: 200 } },
            { id: 'code-1', type: 'code', data: { label: 'Parse Analysis', language: 'javascript', code: `const analysis = JSON.parse($input.text || '{}');
return {
  ...analysis,
  shouldAutoReply: analysis.requiresReply && analysis.urgency !== 'high'
};`, config: {} }, position: { x: 500, y: 200 } },
            { id: 'condition-1', type: 'condition', data: { label: 'Auto-Reply?', conditionType: 'equals', field: 'shouldAutoReply', value: 'true', config: {} }, position: { x: 750, y: 200 } },
            { id: 'reply-writer', type: 'agent', data: { label: 'Reply Writer', agentType: 'email', config: { model: 'gemini-2.0-flash', systemPrompt: 'Write a professional, helpful email reply. Match the tone of the original message. Keep it concise and actionable.' } }, position: { x: 1000, y: 100 } },
            { id: 'set-pending', type: 'set', data: { label: 'Mark Pending', operations: [{ field: 'status', value: 'pending_manual_review', type: 'string' }], config: {} }, position: { x: 1000, y: 300 } },
            { id: 'merge-1', type: 'merge', data: { label: 'Merge', mergeType: 'waitAny', config: {} }, position: { x: 1250, y: 200 } },
            { id: 'respond-1', type: 'respond-webhook', data: { label: 'Response', responseBody: '{{ $json }}', statusCode: 200, config: {} }, position: { x: 1500, y: 200 } }
        ],
        edges: [
            { id: 'e1', source: 'trigger-1', target: 'analyzer' },
            { id: 'e2', source: 'analyzer', target: 'code-1' },
            { id: 'e3', source: 'code-1', target: 'condition-1' },
            { id: 'e4a', source: 'condition-1', target: 'reply-writer', sourceHandle: 'true' },
            { id: 'e4b', source: 'condition-1', target: 'set-pending', sourceHandle: 'false' },
            { id: 'e5a', source: 'reply-writer', target: 'merge-1' },
            { id: 'e5b', source: 'set-pending', target: 'merge-1' },
            { id: 'e6', source: 'merge-1', target: 'respond-1' }
        ]
    },
    {
        id: 'document-processor',
        name: 'Document Processing Pipeline',
        description: 'Extract, transform, and analyze documents with OCR-like capabilities',
        category: 'analysis',
        icon: '📄',
        authorId: 'system',
        authorName: 'AgentFlow Team',
        isPublic: true,
        isFeatured: false,
        likes: 112,
        downloads: 623,
        version: '1.0.0',
        tags: ['documents', 'extraction', 'analysis'],
        nodes: [
            { id: 'trigger-1', type: 'trigger', data: { label: 'Upload Trigger', triggerType: 'webhook', config: { method: 'POST', path: '/process-doc' } }, position: { x: 50, y: 200 } },
            { id: 'extractor', type: 'agent', data: { label: 'Content Extractor', agentType: 'default', config: { model: 'gemini-2.5-pro', systemPrompt: 'Extract all text content from the document. Preserve structure, headers, lists, and tables where possible. Return clean, structured text.' } }, position: { x: 300, y: 200 } },
            { id: 'classifier', type: 'agent', data: { label: 'Document Classifier', agentType: 'default', config: { model: 'gemini-2.0-flash', systemPrompt: 'Classify document type: invoice, contract, report, letter, form, other. Extract key metadata: date, parties, amounts, key terms. Return JSON.' } }, position: { x: 550, y: 200 } },
            { id: 'code-1', type: 'code', data: { label: 'Structure Data', language: 'javascript', code: `const metadata = JSON.parse($input.text || '{}');
return {
  documentType: metadata.type || 'unknown',
  extractedData: metadata,
  processedAt: new Date().toISOString()
};`, config: {} }, position: { x: 800, y: 200 } },
            { id: 'summarizer', type: 'agent', data: { label: 'Summarizer', agentType: 'summarizer', config: { model: 'gemini-2.0-flash', systemPrompt: 'Create a brief executive summary of the document highlighting key points, action items, and important dates.' } }, position: { x: 1050, y: 200 } },
            { id: 'respond-1', type: 'respond-webhook', data: { label: 'Return Results', responseBody: '{{ $json }}', statusCode: 200, config: {} }, position: { x: 1300, y: 200 } }
        ],
        edges: [
            { id: 'e1', source: 'trigger-1', target: 'extractor' },
            { id: 'e2', source: 'extractor', target: 'classifier' },
            { id: 'e3', source: 'classifier', target: 'code-1' },
            { id: 'e4', source: 'code-1', target: 'summarizer' },
            { id: 'e5', source: 'summarizer', target: 'respond-1' }
        ]
    },
    {
        id: 'lead-qualification',
        name: 'AI Lead Qualification',
        description: 'Score and qualify incoming leads with intelligent routing',
        category: 'support',
        icon: '🎯',
        authorId: 'system',
        authorName: 'AgentFlow Team',
        isPublic: true,
        isFeatured: false,
        likes: 145,
        downloads: 834,
        version: '1.0.0',
        tags: ['sales', 'leads', 'automation', 'crm'],
        nodes: [
            { id: 'trigger-1', type: 'trigger', data: { label: 'New Lead', triggerType: 'webhook', config: { method: 'POST', path: '/new-lead' } }, position: { x: 50, y: 200 } },
            { id: 'enricher', type: 'http', data: { label: 'Enrich Data', method: 'GET', url: 'https://api.clearbit.com/v2/people/find?email={{ $input.email }}', headers: { 'Authorization': 'Bearer {{ $env.CLEARBIT_KEY }}' }, config: {} }, position: { x: 250, y: 200 } },
            { id: 'scorer', type: 'agent', data: { label: 'Lead Scorer', agentType: 'data-analyst', config: { model: 'gemini-2.0-flash', systemPrompt: 'Score this lead 1-100 based on: company size, job title, engagement level, fit with ICP. Return JSON: {"score": number, "reasons": [], "tier": "hot/warm/cold"}' } }, position: { x: 500, y: 200 } },
            { id: 'code-1', type: 'code', data: { label: 'Parse Score', language: 'javascript', code: `const result = JSON.parse($input.text || '{}');
return {
  score: result.score || 0,
  tier: result.tier || 'cold',
  reasons: result.reasons || [],
  isHighValue: result.score >= 70
};`, config: {} }, position: { x: 750, y: 200 } },
            { id: 'switch-1', type: 'switch', data: { label: 'Route by Tier', switchField: 'tier', cases: ['hot', 'warm', 'cold'], config: {} }, position: { x: 1000, y: 200 } },
            { id: 'hot-action', type: 'http', data: { label: 'Alert Sales', method: 'POST', url: 'https://hooks.slack.com/...', body: '{"text": "🔥 Hot lead: {{ $input.email }} (Score: {{ $json.score }})"}', config: {} }, position: { x: 1250, y: 50 } },
            { id: 'warm-action', type: 'agent', data: { label: 'Draft Outreach', agentType: 'email', config: { model: 'gemini-2.0-flash', systemPrompt: 'Write a personalized outreach email for this warm lead. Reference their company and potential pain points.' } }, position: { x: 1250, y: 200 } },
            { id: 'cold-action', type: 'set', data: { label: 'Add to Nurture', operations: [{ field: 'action', value: 'add_to_nurture_campaign', type: 'string' }], config: {} }, position: { x: 1250, y: 350 } },
            { id: 'merge-1', type: 'merge', data: { label: 'Merge', mergeType: 'waitAny', config: {} }, position: { x: 1500, y: 200 } },
            { id: 'respond-1', type: 'respond-webhook', data: { label: 'Response', responseBody: '{{ $json }}', statusCode: 200, config: {} }, position: { x: 1750, y: 200 } }
        ],
        edges: [
            { id: 'e1', source: 'trigger-1', target: 'enricher' },
            { id: 'e2', source: 'enricher', target: 'scorer' },
            { id: 'e3', source: 'scorer', target: 'code-1' },
            { id: 'e4', source: 'code-1', target: 'switch-1' },
            { id: 'e5a', source: 'switch-1', target: 'hot-action', sourceHandle: 'case-0' },
            { id: 'e5b', source: 'switch-1', target: 'warm-action', sourceHandle: 'case-1' },
            { id: 'e5c', source: 'switch-1', target: 'cold-action', sourceHandle: 'case-2' },
            { id: 'e6a', source: 'hot-action', target: 'merge-1' },
            { id: 'e6b', source: 'warm-action', target: 'merge-1' },
            { id: 'e6c', source: 'cold-action', target: 'merge-1' },
            { id: 'e7', source: 'merge-1', target: 'respond-1' }
        ]
    },
    {
        id: 'social-media-monitor',
        name: 'Social Media Monitor',
        description: 'Monitor brand mentions, analyze sentiment, and auto-respond to engagement',
        category: 'research',
        icon: '📱',
        authorId: 'system',
        authorName: 'AgentFlow Team',
        isPublic: true,
        isFeatured: false,
        likes: 128,
        downloads: 712,
        version: '1.0.0',
        tags: ['social-media', 'monitoring', 'sentiment', 'engagement'],
        nodes: [
            { id: 'trigger-1', type: 'trigger', data: { label: 'Schedule', triggerType: 'schedule', config: { cron: '*/15 * * * *', timezone: 'UTC' } }, position: { x: 50, y: 200 } },
            { id: 'http-twitter', type: 'http', data: { label: 'Fetch Mentions', method: 'GET', url: 'https://api.twitter.com/2/tweets/search/recent?query={{ $env.BRAND_NAME }}', headers: { 'Authorization': 'Bearer {{ $env.TWITTER_TOKEN }}' }, config: {} }, position: { x: 250, y: 200 } },
            { id: 'loop-1', type: 'loop', data: { label: 'Process Mentions', arrayField: 'data', itemVariable: 'mention', config: {} }, position: { x: 500, y: 200 } },
            { id: 'sentiment', type: 'agent', data: { label: 'Sentiment Analysis', agentType: 'sentiment', config: { model: 'gemini-2.0-flash', systemPrompt: 'Analyze sentiment: positive, neutral, negative. Detect if this needs a response. Return JSON: {"sentiment": "", "needsResponse": boolean, "priority": "low/medium/high"}' } }, position: { x: 750, y: 200 } },
            { id: 'condition-1', type: 'condition', data: { label: 'Needs Response?', conditionType: 'expression', field: 'needsResponse', value: 'true', config: {} }, position: { x: 1000, y: 200 } },
            { id: 'responder', type: 'agent', data: { label: 'Draft Response', agentType: 'writer', config: { model: 'gemini-2.0-flash', systemPrompt: 'Write a friendly, on-brand social media response. Keep it under 280 characters. Match the platforms tone.' } }, position: { x: 1250, y: 100 } },
            { id: 'skip-set', type: 'set', data: { label: 'Log Only', operations: [{ field: 'action', value: 'logged', type: 'string' }], config: {} }, position: { x: 1250, y: 300 } },
            { id: 'merge-1', type: 'merge', data: { label: 'Collect', mergeType: 'append', config: {} }, position: { x: 1500, y: 200 } }
        ],
        edges: [
            { id: 'e1', source: 'trigger-1', target: 'http-twitter' },
            { id: 'e2', source: 'http-twitter', target: 'loop-1' },
            { id: 'e3', source: 'loop-1', target: 'sentiment' },
            { id: 'e4', source: 'sentiment', target: 'condition-1' },
            { id: 'e5a', source: 'condition-1', target: 'responder', sourceHandle: 'true' },
            { id: 'e5b', source: 'condition-1', target: 'skip-set', sourceHandle: 'false' },
            { id: 'e6a', source: 'responder', target: 'merge-1' },
            { id: 'e6b', source: 'skip-set', target: 'merge-1' }
        ]
    },
    {
        id: 'daily-digest',
        name: 'Automated Daily Digest',
        description: 'Aggregate news, updates, and metrics into a daily summary email',
        category: 'content',
        icon: '📰',
        authorId: 'system',
        authorName: 'AgentFlow Team',
        isPublic: true,
        isFeatured: false,
        likes: 95,
        downloads: 567,
        version: '1.0.0',
        tags: ['digest', 'news', 'automation', 'email'],
        nodes: [
            { id: 'trigger-1', type: 'trigger', data: { label: 'Daily 8 AM', triggerType: 'schedule', config: { cron: '0 8 * * *', timezone: 'America/New_York' } }, position: { x: 50, y: 200 } },
            { id: 'http-news', type: 'http', data: { label: 'Fetch News', method: 'GET', url: 'https://newsapi.org/v2/top-headlines?category=technology&apiKey={{ $env.NEWS_API_KEY }}', config: {} }, position: { x: 250, y: 100 } },
            { id: 'http-metrics', type: 'http', data: { label: 'Fetch Metrics', method: 'GET', url: 'https://api.analytics.com/daily-summary', headers: { 'Authorization': 'Bearer {{ $env.ANALYTICS_KEY }}' }, config: {} }, position: { x: 250, y: 300 } },
            { id: 'merge-data', type: 'merge', data: { label: 'Combine Data', mergeType: 'waitAll', config: {} }, position: { x: 500, y: 200 } },
            { id: 'summarizer', type: 'agent', data: { label: 'News Summarizer', agentType: 'summarizer', config: { model: 'gemini-2.0-flash', systemPrompt: 'Summarize the top 5 most relevant news items. Keep each summary to 2-3 sentences.' } }, position: { x: 750, y: 200 } },
            { id: 'composer', type: 'agent', data: { label: 'Email Composer', agentType: 'email', config: { model: 'gemini-2.5-pro', systemPrompt: 'Compose a professional daily digest email. Include: greeting, news highlights, key metrics, and a motivational closing. Use clean HTML formatting.' } }, position: { x: 1000, y: 200 } },
            { id: 'http-send', type: 'http', data: { label: 'Send Email', method: 'POST', url: 'https://api.sendgrid.com/v3/mail/send', headers: { 'Authorization': 'Bearer {{ $env.SENDGRID_KEY }}', 'Content-Type': 'application/json' }, body: '{"personalizations":[{"to":[{"email":"{{ $env.DIGEST_EMAIL }}"}]}],"from":{"email":"digest@company.com"},"subject":"Daily Digest - {{ $today }}","content":[{"type":"text/html","value":"{{ $json.email }}"}]}', config: {} }, position: { x: 1250, y: 200 } }
        ],
        edges: [
            { id: 'e1a', source: 'trigger-1', target: 'http-news' },
            { id: 'e1b', source: 'trigger-1', target: 'http-metrics' },
            { id: 'e2a', source: 'http-news', target: 'merge-data' },
            { id: 'e2b', source: 'http-metrics', target: 'merge-data' },
            { id: 'e3', source: 'merge-data', target: 'summarizer' },
            { id: 'e4', source: 'summarizer', target: 'composer' },
            { id: 'e5', source: 'composer', target: 'http-send' }
        ]
    }
];

// Get all templates (system + community)
app.get('/templates', async (req, res) => {
    try {
        const { category, search, authorId, featured } = req.query;
        
        // Get community templates from database
        let communityTemplates: any[] = [];
        try {
            const where: any = { isPublic: true };
            if (category && category !== 'all') where.category = category;
            if (authorId) where.authorId = authorId;
            if (featured === 'true') where.isFeatured = true;
            
            communityTemplates = await prismaAny.template.findMany({
                where,
                orderBy: [
                    { isFeatured: 'desc' },
                    { downloads: 'desc' },
                    { likes: 'desc' }
                ]
            });
            
            // Parse definition JSON
            communityTemplates = communityTemplates.map((t: any) => ({
                ...t,
                ...JSON.parse(t.definition)
            }));
        } catch (err) {
            // If Template table doesn't exist yet, just use system templates
            console.log('Community templates not available yet');
        }
        
        // Combine system templates with community templates
        let allTemplates = [...SYSTEM_TEMPLATES, ...communityTemplates];
        
        // Filter by category
        if (category && category !== 'all') {
            allTemplates = allTemplates.filter(t => t.category === category);
        }
        
        // Filter by search term
        if (search) {
            const searchLower = (search as string).toLowerCase();
            allTemplates = allTemplates.filter(t =>
                t.name.toLowerCase().includes(searchLower) ||
                t.description.toLowerCase().includes(searchLower) ||
                t.tags?.some((tag: string) => tag.toLowerCase().includes(searchLower))
            );
        }
        
        res.json(allTemplates);
    } catch (error) {
        console.error('Error fetching templates:', error);
        res.status(500).json({ error: 'Failed to fetch templates' });
    }
});

// Get user's own templates
app.get('/templates/my', async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) {
            return res.status(400).json({ error: 'User ID required' });
        }
        
        try {
            const templates = await prismaAny.template.findMany({
                where: { authorId: userId as string },
                orderBy: { createdAt: 'desc' }
            });
            
            const parsed = templates.map((t: any) => ({
                ...t,
                ...JSON.parse(t.definition)
            }));
            
            res.json(parsed);
        } catch (dbError) {
            // Table doesn't exist yet - return empty array
            console.log('Template table not available yet, returning empty array');
            res.json([]);
        }
    } catch (error) {
        console.error('Error fetching user templates:', error);
        res.status(500).json({ error: 'Failed to fetch templates' });
    }
});

// Submit a new template (from existing workflow)
app.post('/templates', async (req, res) => {
    try {
        const { 
            name, 
            description, 
            category, 
            icon, 
            nodes, 
            edges, 
            authorId, 
            authorName,
            tags,
            isPublic = true 
        } = req.body;
        
        if (!name || !description || !category || !nodes || !authorId || !authorName) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        try {
            const template = await prismaAny.template.create({
                data: {
                    name,
                    description,
                    category,
                    icon: icon || '🤖',
                    definition: JSON.stringify({ nodes, edges }),
                    authorId,
                    authorName,
                    isPublic,
                    tags: tags || [category],
                    version: '1.0.0'
                }
            });
            
            // Return with parsed definition
            res.status(201).json({
                ...template,
                nodes,
                edges
            });
        } catch (dbError) {
            console.error('Template table not available:', dbError);
            res.status(503).json({ error: 'Template sharing is not available yet. Please run database migrations.' });
        }
    } catch (error) {
        console.error('Error creating template:', error);
        res.status(500).json({ error: 'Failed to create template' });
    }
});

// Update a template
app.put('/templates/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, category, icon, nodes, edges, tags, isPublic } = req.body;
        const { userId } = req.query;
        
        try {
            // Check ownership
            const existing = await prismaAny.template.findUnique({ where: { id } });
            if (!existing) {
                return res.status(404).json({ error: 'Template not found' });
            }
            if (existing.authorId !== userId) {
                return res.status(403).json({ error: 'Not authorized to edit this template' });
            }
            
            const template = await prismaAny.template.update({
                where: { id },
                data: {
                    ...(name && { name }),
                    ...(description && { description }),
                    ...(category && { category }),
                    ...(icon && { icon }),
                    ...(nodes && edges && { definition: JSON.stringify({ nodes, edges }) }),
                    ...(tags && { tags }),
                    ...(typeof isPublic === 'boolean' && { isPublic })
                }
            });
            
            res.json({
                ...template,
                ...JSON.parse(template.definition)
            });
        } catch (dbError) {
            console.error('Template table not available:', dbError);
            res.status(503).json({ error: 'Template editing is not available yet. Please run database migrations.' });
        }
    } catch (error) {
        console.error('Error updating template:', error);
        res.status(500).json({ error: 'Failed to update template' });
    }
});

// Delete a template
app.delete('/templates/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.query;
        
        try {
            // Check ownership
            const existing = await prismaAny.template.findUnique({ where: { id } });
            if (!existing) {
                return res.status(404).json({ error: 'Template not found' });
            }
            if (existing.authorId !== userId) {
                return res.status(403).json({ error: 'Not authorized to delete this template' });
            }
            
            await prismaAny.template.delete({ where: { id } });
            res.json({ success: true });
        } catch (dbError) {
            console.error('Template table not available:', dbError);
            res.status(503).json({ error: 'Template deletion is not available yet. Please run database migrations.' });
        }
    } catch (error) {
        console.error('Error deleting template:', error);
        res.status(500).json({ error: 'Failed to delete template' });
    }
});

// Like/unlike a template
app.post('/templates/:id/like', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({ error: 'User ID required' });
        }
        
        try {
            // Check if already liked
            const existingLike = await prismaAny.templateLike.findUnique({
                where: { templateId_userId: { templateId: id, userId: userId } }
            });
            
            if (existingLike) {
                // Unlike
                await prismaAny.templateLike.delete({
                    where: { id: existingLike.id }
                });
                await prismaAny.template.update({
                    where: { id },
                    data: { likes: { decrement: 1 } }
                });
                res.json({ liked: false });
            } else {
                // Like
                await prismaAny.templateLike.create({
                    data: { templateId: id, userId }
                });
                await prismaAny.template.update({
                    where: { id },
                    data: { likes: { increment: 1 } }
                });
                res.json({ liked: true });
            }
        } catch (dbError) {
            console.error('Like feature not available:', dbError);
            res.status(503).json({ error: 'Like feature is not available yet. Please run database migrations.' });
        }
    } catch (error) {
        console.error('Error toggling like:', error);
        res.status(500).json({ error: 'Failed to toggle like' });
    }
});

// Download/use a template (increments download count)
app.post('/templates/:id/download', async (req, res) => {
    try {
        const { id } = req.params;
        
        // For system templates, just return success
        const systemTemplate = SYSTEM_TEMPLATES.find(t => t.id === id);
        if (systemTemplate) {
            return res.json({ success: true, template: systemTemplate });
        }
        
        try {
            // For community templates, increment download count
            const template = await prismaAny.template.update({
                where: { id },
                data: { downloads: { increment: 1 } }
            });
            
            res.json({ 
                success: true, 
                template: {
                    ...template,
                    ...JSON.parse(template.definition)
                }
            });
        } catch (dbError) {
            // If table doesn't exist, just return success without tracking
            res.json({ success: true });
        }
    } catch (error) {
        console.error('Error downloading template:', error);
        res.status(500).json({ error: 'Failed to download template' });
    }
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

// Configure multer for avatar uploads
const avatarStorage = multer.diskStorage({
    destination: (_req: any, _file: any, cb: any) => {
        const uploadsDir = path.join(__dirname, '../../../files/avatars');
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        cb(null, uploadsDir);
    },
    filename: (_req: any, file: any, cb: any) => {
        const ext = path.extname(file.originalname);
        cb(null, `avatar-${Date.now()}${ext}`);
    }
});

const avatarUpload = multer({
    storage: avatarStorage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
    fileFilter: (_req: any, file: any, cb: any) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, GIF and WebP are allowed.'));
        }
    }
});

// Upload user avatar
app.post('/user/avatar', avatarUpload.single('avatar'), async (req: any, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        let user = await prisma.user.findFirst();
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Delete old avatar if it exists
        if (user.avatar) {
            const oldAvatarPath = path.join(__dirname, '../../../', user.avatar);
            if (fs.existsSync(oldAvatarPath)) {
                fs.unlinkSync(oldAvatarPath);
            }
        }

        // Save the avatar path relative to files folder
        const avatarPath = `/files/avatars/${req.file.filename}`;

        user = await prisma.user.update({
            where: { id: user.id },
            data: { avatar: avatarPath },
            include: { settings: true }
        });

        res.json(user);
    } catch (error) {
        console.error('Error uploading avatar:', error);
        res.status(500).json({ error: 'Failed to upload avatar' });
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

// ============== Connections ==============
// Type assertion for connection model (regenerate Prisma client to remove)
const connectionModel = (prisma as any).connection;

// Get all connections
app.get('/connections', async (req, res) => {
    try {
        let user = await prisma.user.findFirst();
        if (!user) {
            return res.json([]);
        }

        const connections = await connectionModel.findMany({
            where: { userId: user.id },
            orderBy: { connectedAt: 'desc' }
        });

        // Mask credentials before sending
        res.json(connections.map((c: any) => ({
            ...c,
            credentials: '***' // Never send actual credentials to frontend
        })));
    } catch (error) {
        console.error('Error fetching connections:', error);
        res.status(500).json({ error: 'Failed to fetch connections' });
    }
});

// Create new connection
app.post('/connections', async (req, res) => {
    try {
        const { providerId, name, credentials } = req.body;

        if (!providerId || !name) {
            return res.status(400).json({ error: 'Provider ID and name are required' });
        }

        let user = await prisma.user.findFirst();
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const connection = await connectionModel.create({
            data: {
                userId: user.id,
                providerId,
                name,
                credentials: JSON.stringify(credentials || {}), // In production, encrypt this!
                status: 'active',
                connectedAt: new Date()
            }
        });

        res.json({
            ...connection,
            credentials: '***'
        });
    } catch (error) {
        console.error('Error creating connection:', error);
        res.status(500).json({ error: 'Failed to create connection' });
    }
});

// Update connection
app.put('/connections/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, credentials } = req.body;

        const connection = await connectionModel.update({
            where: { id },
            data: {
                ...(name !== undefined && { name }),
                ...(credentials !== undefined && { credentials: JSON.stringify(credentials) }),
            }
        });

        res.json({
            ...connection,
            credentials: '***'
        });
    } catch (error) {
        console.error('Error updating connection:', error);
        res.status(500).json({ error: 'Failed to update connection' });
    }
});

// Delete connection
app.delete('/connections/:id', async (req, res) => {
    try {
        const { id } = req.params;

        await connectionModel.delete({ where: { id } });

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting connection:', error);
        res.status(500).json({ error: 'Failed to delete connection' });
    }
});

// Test connection
app.post('/connections/:id/test', async (req, res) => {
    try {
        const { id } = req.params;

        const connection = await connectionModel.findUnique({
            where: { id }
        });

        if (!connection) {
            return res.status(404).json({ success: false, error: 'Connection not found' });
        }

        // In a real implementation, you would test the connection based on provider
        // For now, we'll simulate a test
        const credentials = JSON.parse(connection.credentials);
        
        // Update lastUsed
        await connectionModel.update({
            where: { id },
            data: { lastUsed: new Date() }
        });

        // Simulate provider-specific tests
        const testResults: Record<string, () => { success: boolean; error?: string }> = {
            github: () => ({ success: credentials.token ? true : false, error: credentials.token ? undefined : 'No token configured' }),
            slack: () => ({ success: credentials.botToken ? true : false, error: credentials.botToken ? undefined : 'No bot token configured' }),
            discord: () => ({ success: credentials.botToken ? true : false, error: credentials.botToken ? undefined : 'No bot token configured' }),
            webhook: () => ({ success: credentials.url ? true : false, error: credentials.url ? undefined : 'No webhook URL configured' }),
            'http-api': () => ({ success: credentials.baseUrl ? true : false, error: credentials.baseUrl ? undefined : 'No base URL configured' }),
        };

        const testFn = testResults[connection.providerId];
        if (testFn) {
            const result = testFn();
            res.json(result);
        } else {
            // Default: assume success for OAuth connections
            res.json({ success: true });
        }
    } catch (error) {
        console.error('Error testing connection:', error);
        res.status(500).json({ success: false, error: 'Failed to test connection' });
    }
});

// OAuth callback handler
app.post('/oauth/callback', async (req, res) => {
    try {
        const { code, state } = req.body;

        if (!code || !state) {
            return res.status(400).json({ error: 'Code and state are required' });
        }

        // Decode state to get provider info
        let stateData;
        try {
            stateData = JSON.parse(Buffer.from(state, 'base64').toString());
        } catch {
            return res.status(400).json({ error: 'Invalid state parameter' });
        }

        const { providerId } = stateData;

        // In a real implementation, you would:
        // 1. Exchange the code for tokens using the provider's token endpoint
        // 2. Store the tokens securely
        // 3. Fetch user info from the provider

        let user = await prisma.user.findFirst();
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Create connection with placeholder tokens
        // In production, you'd exchange the code for real tokens here
        const connection = await connectionModel.create({
            data: {
                userId: user.id,
                providerId,
                name: `My ${providerId.charAt(0).toUpperCase() + providerId.slice(1)}`,
                credentials: JSON.stringify({
                    accessToken: `mock_token_${Date.now()}`,
                    refreshToken: `mock_refresh_${Date.now()}`,
                    expiresAt: new Date(Date.now() + 3600000).toISOString()
                }),
                status: 'active',
                connectedAt: new Date()
            }
        });

        res.json({
            connection: {
                ...connection,
                credentials: '***'
            },
            provider: providerId
        });
    } catch (error) {
        console.error('Error handling OAuth callback:', error);
        res.status(500).json({ error: 'Failed to complete OAuth flow' });
    }
});

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

