/**
 * Schedule Trigger Module
 * 
 * Manages cron-based scheduled workflow executions
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import * as cron from 'node-cron';

const router = Router();
const prisma = new PrismaClient();

// Store active cron jobs
const activeJobs: Map<string, cron.ScheduledTask> = new Map();

// ============================================================
// Common Cron Presets
// ============================================================

export const CRON_PRESETS: Record<string, string> = {
    'every-minute': '* * * * *',
    'every-5-minutes': '*/5 * * * *',
    'every-15-minutes': '*/15 * * * *',
    'every-30-minutes': '*/30 * * * *',
    'every-hour': '0 * * * *',
    'every-day-9am': '0 9 * * *',
    'every-day-midnight': '0 0 * * *',
    'every-monday-9am': '0 9 * * 1',
    'every-weekday-9am': '0 9 * * 1-5',
    'every-month-1st': '0 0 1 * *',
};

// ============================================================
// Schedule CRUD Endpoints
// ============================================================

/**
 * Create a new schedule for a workflow
 */
router.post('/workflows/:workflowId/schedules', async (req: Request, res: Response) => {
    try {
        const workflowId = req.params.workflowId as string;
        const {
            cronExpr,
            timezone = 'UTC'
        } = req.body;

        // Validate workflow exists
        const workflow = await prisma.workflow.findUnique({
            where: { id: workflowId }
        });

        if (!workflow) {
            return res.status(404).json({ error: 'Workflow not found' });
        }

        // Validate cron expression
        if (!cron.validate(cronExpr)) {
            return res.status(400).json({
                error: 'Invalid cron expression',
                hint: 'Format: minute hour day month weekday',
                examples: CRON_PRESETS
            });
        }

        // Create schedule record
        const schedule = await prisma.schedule.create({
            data: {
                workflowId,
                cronExpr,
                timezone,
                isActive: true
            }
        });

        // Start the cron job
        startScheduleJob(schedule.id, cronExpr, workflowId, timezone);

        res.status(201).json({
            id: schedule.id,
            workflowId: schedule.workflowId,
            cronExpr: schedule.cronExpr,
            timezone: schedule.timezone,
            isActive: schedule.isActive,
            createdAt: schedule.createdAt
        });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error creating schedule:', error);
        res.status(500).json({ error: 'Failed to create schedule', details: message });
    }
});

/**
 * List schedules for a workflow
 */
router.get('/workflows/:workflowId/schedules', async (req: Request, res: Response) => {
    try {
        const workflowId = req.params.workflowId as string;

        const schedules = await prisma.schedule.findMany({
            where: { workflowId },
            orderBy: { createdAt: 'desc' }
        });

        res.json(schedules.map((s) => ({
            id: s.id,
            cronExpr: s.cronExpr,
            timezone: s.timezone,
            isActive: s.isActive,
            lastRunAt: s.lastRunAt,
            nextRunAt: s.nextRunAt,
            runCount: s.runCount,
            createdAt: s.createdAt
        })));

    } catch (error: unknown) {
        console.error('Error listing schedules:', error);
        res.status(500).json({ error: 'Failed to list schedules' });
    }
});

/**
 * Update a schedule
 */
router.put('/schedules/:id', async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const { cronExpr, timezone, isActive } = req.body;

        const schedule = await prisma.schedule.findUnique({ where: { id } });
        if (!schedule) {
            return res.status(404).json({ error: 'Schedule not found' });
        }

        // Validate new cron expression if provided
        if (cronExpr && !cron.validate(cronExpr)) {
            return res.status(400).json({ error: 'Invalid cron expression' });
        }

        const updated = await prisma.schedule.update({
            where: { id },
            data: {
                cronExpr: cronExpr || schedule.cronExpr,
                timezone: timezone || schedule.timezone,
                isActive: isActive !== undefined ? isActive : schedule.isActive
            }
        });

        // Update running job
        stopScheduleJob(id);
        if (updated.isActive) {
            startScheduleJob(id, updated.cronExpr, updated.workflowId, updated.timezone);
        }

        res.json({
            id: updated.id,
            cronExpr: updated.cronExpr,
            timezone: updated.timezone,
            isActive: updated.isActive
        });

    } catch (error: unknown) {
        console.error('Error updating schedule:', error);
        res.status(500).json({ error: 'Failed to update schedule' });
    }
});

/**
 * Delete a schedule
 */
router.delete('/schedules/:id', async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;

        // Stop running job
        stopScheduleJob(id);

        await prisma.schedule.delete({ where: { id } });

        res.json({ success: true });

    } catch (error: unknown) {
        console.error('Error deleting schedule:', error);
        res.status(500).json({ error: 'Failed to delete schedule' });
    }
});

/**
 * Toggle schedule active status
 */
router.patch('/schedules/:id/toggle', async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;

        const schedule = await prisma.schedule.findUnique({ where: { id } });
        if (!schedule) {
            return res.status(404).json({ error: 'Schedule not found' });
        }

        const newState = !schedule.isActive;

        const updated = await prisma.schedule.update({
            where: { id },
            data: { isActive: newState }
        });

        // Start or stop job
        if (newState) {
            startScheduleJob(id, updated.cronExpr, updated.workflowId, updated.timezone);
        } else {
            stopScheduleJob(id);
        }

        res.json({
            id: updated.id,
            isActive: updated.isActive
        });

    } catch (error: unknown) {
        console.error('Error toggling schedule:', error);
        res.status(500).json({ error: 'Failed to toggle schedule' });
    }
});

/**
 * Manually trigger a scheduled workflow
 */
router.post('/schedules/:id/trigger', async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;

        const schedule = await prisma.schedule.findUnique({ where: { id } });
        if (!schedule) {
            return res.status(404).json({ error: 'Schedule not found' });
        }

        const result = await triggerScheduledExecution(id, schedule.workflowId);

        res.json(result);

    } catch (error: unknown) {
        console.error('Error triggering schedule:', error);
        res.status(500).json({ error: 'Failed to trigger schedule' });
    }
});

/**
 * Get cron presets
 */
router.get('/schedules/presets', (_req: Request, res: Response) => {
    res.json(CRON_PRESETS);
});

// ============================================================
// Cron Job Management
// ============================================================

function startScheduleJob(
    scheduleId: string,
    cronExpr: string,
    workflowId: string,
    timezone: string
): void {
    // Stop existing job if any
    stopScheduleJob(scheduleId);

    try {
        const job = cron.schedule(cronExpr, async () => {
            console.log(`[Schedule] Triggering workflow ${workflowId} for schedule ${scheduleId}`);
            try {
                await triggerScheduledExecution(scheduleId, workflowId);
            } catch (error) {
                console.error(`[Schedule] Error executing ${scheduleId}:`, error);
            }
        }, {
            timezone
        });

        activeJobs.set(scheduleId, job);
        console.log(`[Schedule] Started job ${scheduleId} with cron: ${cronExpr}`);

    } catch (error) {
        console.error(`[Schedule] Failed to start job ${scheduleId}:`, error);
    }
}

function stopScheduleJob(scheduleId: string): void {
    const job = activeJobs.get(scheduleId);
    if (job) {
        job.stop();
        activeJobs.delete(scheduleId);
        console.log(`[Schedule] Stopped job ${scheduleId}`);
    }
}

// ============================================================
// Helper Functions
// ============================================================

async function triggerScheduledExecution(
    scheduleId: string,
    workflowId: string
): Promise<Record<string, unknown>> {
    const triggerData = {
        type: 'schedule',
        scheduleId,
        triggeredAt: new Date().toISOString()
    };

    // Create execution record
    const execution = await prisma.execution.create({
        data: {
            workflowId,
            status: 'pending',
            triggeredBy: 'schedule',
            triggerData: JSON.stringify(triggerData),
            logs: JSON.stringify([{
                timestamp: new Date().toISOString(),
                level: 'info',
                message: `Workflow triggered by schedule: ${scheduleId}`
            }])
        }
    });

    // Update schedule stats
    await prisma.schedule.update({
        where: { id: scheduleId },
        data: {
            lastRunAt: new Date(),
            runCount: { increment: 1 }
        }
    });

    // Update execution status
    await prisma.execution.update({
        where: { id: execution.id },
        data: { status: 'running' }
    });

    try {
        // TODO: Integrate with graph-executor.ts for actual execution
        const result = {
            executionId: execution.id,
            workflowId,
            status: 'completed',
            output: {
                triggerData,
                message: 'Workflow executed via schedule'
            }
        };

        await prisma.execution.update({
            where: { id: execution.id },
            data: {
                status: 'completed',
                endedAt: new Date(),
                result: JSON.stringify(result)
            }
        });

        return result;

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        await prisma.execution.update({
            where: { id: execution.id },
            data: {
                status: 'failed',
                endedAt: new Date()
            }
        });
        throw new Error(message);
    }
}

// ============================================================
// Initialize Schedules on Startup
// ============================================================

export async function initializeSchedules(): Promise<void> {
    console.log('[Schedule] Initializing active schedules...');

    try {
        const activeSchedules = await prisma.schedule.findMany({
            where: { isActive: true }
        });

        for (const schedule of activeSchedules) {
            startScheduleJob(
                schedule.id,
                schedule.cronExpr,
                schedule.workflowId,
                schedule.timezone
            );
        }

        console.log(`[Schedule] Initialized ${activeSchedules.length} schedules`);

    } catch (error) {
        console.error('[Schedule] Failed to initialize schedules:', error);
    }
}

export default router;
