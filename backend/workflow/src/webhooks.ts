/**
 * Webhook Trigger Module
 * 
 * Manages webhook URLs for triggering workflow executions
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const router = Router();
const prisma = new PrismaClient();

// ============================================================
// Types
// ============================================================

interface WebhookConfig {
    authentication?: {
        type: 'none' | 'basic' | 'header';
        username?: string;
        password?: string;
        headerName?: string;
        headerValue?: string;
    };
    responseMode: 'onReceived' | 'lastNode';
}

// ============================================================
// Generate unique webhook path
// ============================================================

function generateWebhookPath(): string {
    return crypto.randomBytes(16).toString('hex');
}

// ============================================================
// Webhook CRUD Endpoints
// ============================================================

/**
 * Create a new webhook for a workflow
 */
router.post('/workflows/:workflowId/webhooks', async (req: Request, res: Response) => {
    try {
        const workflowId = req.params.workflowId as string;
        const {
            method = 'POST',
            secret
        } = req.body;

        // Verify workflow exists
        const workflow = await prisma.workflow.findUnique({
            where: { id: workflowId }
        });

        if (!workflow) {
            return res.status(404).json({ error: 'Workflow not found' });
        }

        // Generate unique path
        const path = generateWebhookPath();

        // Create webhook record
        const webhook = await prisma.webhook.create({
            data: {
                workflowId,
                path,
                method,
                secret,
                isActive: true
            }
        });

        // Build full URL
        const baseUrl = process.env.WEBHOOK_BASE_URL || `http://localhost:${process.env.PORT || 3001}`;
        const fullUrl = `${baseUrl}/webhook/${webhook.path}`;

        res.status(201).json({
            id: webhook.id,
            path: webhook.path,
            url: fullUrl,
            method: webhook.method,
            isActive: webhook.isActive,
            createdAt: webhook.createdAt
        });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error creating webhook:', error);
        res.status(500).json({ error: 'Failed to create webhook', details: message });
    }
});

/**
 * List webhooks for a workflow
 */
router.get('/workflows/:workflowId/webhooks', async (req: Request, res: Response) => {
    try {
        const workflowId = req.params.workflowId as string;

        const webhooks = await prisma.webhook.findMany({
            where: { workflowId },
            orderBy: { createdAt: 'desc' }
        });

        const baseUrl = process.env.WEBHOOK_BASE_URL || `http://localhost:${process.env.PORT || 3001}`;

        res.json(webhooks.map((wh) => ({
            id: wh.id,
            path: wh.path,
            url: `${baseUrl}/webhook/${wh.path}`,
            method: wh.method,
            isActive: wh.isActive,
            callCount: wh.callCount,
            lastCalledAt: wh.lastCalledAt,
            createdAt: wh.createdAt
        })));

    } catch (error: unknown) {
        console.error('Error listing webhooks:', error);
        res.status(500).json({ error: 'Failed to list webhooks' });
    }
});

/**
 * Delete a webhook
 */
router.delete('/webhooks/:id', async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;

        await prisma.webhook.delete({
            where: { id }
        });

        res.json({ success: true });

    } catch (error: unknown) {
        console.error('Error deleting webhook:', error);
        res.status(500).json({ error: 'Failed to delete webhook' });
    }
});

/**
 * Toggle webhook active status
 */
router.patch('/webhooks/:id/toggle', async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;

        const webhook = await prisma.webhook.findUnique({ where: { id } });
        if (!webhook) {
            return res.status(404).json({ error: 'Webhook not found' });
        }

        const updated = await prisma.webhook.update({
            where: { id },
            data: { isActive: !webhook.isActive }
        });

        res.json({ id: updated.id, isActive: updated.isActive });

    } catch (error: unknown) {
        console.error('Error toggling webhook:', error);
        res.status(500).json({ error: 'Failed to toggle webhook' });
    }
});

// ============================================================
// Webhook Trigger Endpoint (receives external calls)
// ============================================================

/**
 * Handle incoming webhook requests
 * Supports GET, POST, PUT, DELETE methods
 */
const handleWebhookTrigger = async (req: Request, res: Response) => {
    try {
        const path = req.params.path as string;

        // Find webhook by path
        const webhook = await prisma.webhook.findUnique({
            where: { path },
            include: { workflow: true }
        });

        if (!webhook) {
            return res.status(404).json({ error: 'Webhook not found' });
        }

        if (!webhook.isActive) {
            return res.status(403).json({ error: 'Webhook is disabled' });
        }

        // Check method
        if (webhook.method !== req.method) {
            return res.status(405).json({
                error: `Method not allowed. Expected ${webhook.method}`
            });
        }

        // Validate secret if set
        if (webhook.secret) {
            const providedSecret = req.headers['x-webhook-secret'];
            if (providedSecret !== webhook.secret) {
                return res.status(401).json({ error: 'Invalid webhook secret' });
            }
        }

        // Prepare trigger data
        const triggerData = {
            method: req.method,
            headers: req.headers,
            query: req.query,
            body: req.body,
            params: req.params,
            timestamp: new Date().toISOString(),
            webhookId: webhook.id,
            webhookPath: webhook.path
        };

        // Create execution record
        const execution = await prisma.execution.create({
            data: {
                workflowId: webhook.workflowId,
                status: 'pending',
                triggeredBy: 'webhook',
                triggerData: JSON.stringify(triggerData),
                logs: JSON.stringify([{
                    timestamp: new Date().toISOString(),
                    level: 'info',
                    message: `Workflow triggered by webhook: ${webhook.path}`
                }])
            }
        });

        // Update webhook call stats
        await prisma.webhook.update({
            where: { id: webhook.id },
            data: {
                lastCalledAt: new Date(),
                callCount: { increment: 1 }
            }
        });

        // Respond immediately
        res.json({
            success: true,
            executionId: execution.id,
            message: 'Workflow execution started'
        });

        // Trigger async execution (fire and forget)
        triggerWorkflowExecution(execution.id, webhook.workflowId, triggerData)
            .catch(err => console.error('Async execution error:', err));

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Webhook trigger error:', error);
        res.status(500).json({ error: 'Webhook execution failed', details: message });
    }
};

// Register webhook trigger routes
router.get('/webhook/:path', handleWebhookTrigger);
router.post('/webhook/:path', handleWebhookTrigger);
router.put('/webhook/:path', handleWebhookTrigger);
router.delete('/webhook/:path', handleWebhookTrigger);

// ============================================================
// Helper Functions
// ============================================================

async function triggerWorkflowExecution(
    executionId: string,
    workflowId: string,
    triggerData: Record<string, unknown>
): Promise<Record<string, unknown>> {
    try {
        // Update execution status to running
        await prisma.execution.update({
            where: { id: executionId },
            data: { status: 'running' }
        });

        // Get workflow definition
        const workflow = await prisma.workflow.findUnique({
            where: { id: workflowId }
        });

        if (!workflow) {
            throw new Error('Workflow not found');
        }

        // For now, return a placeholder - integrate with graph-executor later
        const result = {
            executionId,
            workflowId,
            status: 'completed',
            output: {
                triggerData,
                message: 'Workflow executed via webhook'
            }
        };

        // Update execution as completed
        await prisma.execution.update({
            where: { id: executionId },
            data: {
                status: 'completed',
                endedAt: new Date(),
                result: JSON.stringify(result)
            }
        });

        return result;

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        // Update execution as failed
        await prisma.execution.update({
            where: { id: executionId },
            data: {
                status: 'failed',
                endedAt: new Date()
            }
        });
        throw new Error(message);
    }
}

export default router;
