/**
 * Version History Module
 * 
 * Manages workflow versioning, snapshots, and rollbacks
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// ============================================================
// Types
// ============================================================

interface VersionCreateRequest {
    name?: string;
    description?: string;
}

interface WorkflowDefinition {
    nodes: unknown[];
    edges: unknown[];
    viewport?: { x: number; y: number; zoom: number };
}

// ============================================================
// Version CRUD Endpoints
// ============================================================

/**
 * Create a new version of a workflow
 */
router.post('/workflows/:workflowId/versions', async (req: Request, res: Response) => {
    try {
        const workflowId = req.params.workflowId as string;
        const { name, description } = req.body as VersionCreateRequest;

        // Get current workflow
        const workflow = await prisma.workflow.findUnique({
            where: { id: workflowId }
        });

        if (!workflow) {
            return res.status(404).json({ error: 'Workflow not found' });
        }

        // Get the latest version number
        const latestVersion = await prisma.workflowVersion.findFirst({
            where: { workflowId },
            orderBy: { version: 'desc' }
        });

        const newVersionNumber = (latestVersion?.version || 0) + 1;

        // Create version snapshot
        const version = await prisma.workflowVersion.create({
            data: {
                workflowId,
                version: newVersionNumber,
                name: name || `Version ${newVersionNumber}`,
                definition: workflow.definition,
                createdBy: workflow.userId || undefined
            }
        });

        // Update workflow's current version
        await prisma.workflow.update({
            where: { id: workflowId },
            data: { currentVersion: newVersionNumber }
        });

        res.status(201).json({
            id: version.id,
            version: version.version,
            name: version.name,
            createdAt: version.createdAt,
            message: description || `Created version ${newVersionNumber}`
        });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error creating version:', error);
        res.status(500).json({ error: 'Failed to create version', details: message });
    }
});

/**
 * List all versions of a workflow
 */
router.get('/workflows/:workflowId/versions', async (req: Request, res: Response) => {
    try {
        const workflowId = req.params.workflowId as string;

        const versions = await prisma.workflowVersion.findMany({
            where: { workflowId },
            orderBy: { version: 'desc' },
            select: {
                id: true,
                version: true,
                name: true,
                createdBy: true,
                createdAt: true
            }
        });

        // Get current version from workflow
        const workflow = await prisma.workflow.findUnique({
            where: { id: workflowId },
            select: { currentVersion: true }
        });

        res.json({
            currentVersion: workflow?.currentVersion || 1,
            versions
        });

    } catch (error: unknown) {
        console.error('Error listing versions:', error);
        res.status(500).json({ error: 'Failed to list versions' });
    }
});

/**
 * Get a specific version
 */
router.get('/versions/:id', async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;

        const version = await prisma.workflowVersion.findUnique({
            where: { id }
        });

        if (!version) {
            return res.status(404).json({ error: 'Version not found' });
        }

        res.json({
            id: version.id,
            workflowId: version.workflowId,
            version: version.version,
            name: version.name,
            definition: JSON.parse(version.definition),
            createdBy: version.createdBy,
            createdAt: version.createdAt
        });

    } catch (error: unknown) {
        console.error('Error getting version:', error);
        res.status(500).json({ error: 'Failed to get version' });
    }
});

/**
 * Restore a workflow to a specific version
 */
router.post('/versions/:id/restore', async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;

        const version = await prisma.workflowVersion.findUnique({
            where: { id }
        });

        if (!version) {
            return res.status(404).json({ error: 'Version not found' });
        }

        // Create a new version before restoring (backup current state)
        const workflow = await prisma.workflow.findUnique({
            where: { id: version.workflowId }
        });

        if (!workflow) {
            return res.status(404).json({ error: 'Workflow not found' });
        }

        // Get latest version number
        const latestVersion = await prisma.workflowVersion.findFirst({
            where: { workflowId: version.workflowId },
            orderBy: { version: 'desc' }
        });

        const backupVersionNumber = (latestVersion?.version || 0) + 1;

        // Create backup of current state
        await prisma.workflowVersion.create({
            data: {
                workflowId: version.workflowId,
                version: backupVersionNumber,
                name: `Backup before restore to v${version.version}`,
                definition: workflow.definition,
                createdBy: workflow.userId || undefined
            }
        });

        // Restore the workflow definition
        await prisma.workflow.update({
            where: { id: version.workflowId },
            data: {
                definition: version.definition,
                currentVersion: backupVersionNumber,
                updatedAt: new Date()
            }
        });

        res.json({
            success: true,
            restoredVersion: version.version,
            backupVersion: backupVersionNumber,
            message: `Restored to version ${version.version}. Current state backed up as version ${backupVersionNumber}.`
        });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error restoring version:', error);
        res.status(500).json({ error: 'Failed to restore version', details: message });
    }
});

/**
 * Compare two versions
 */
router.get('/workflows/:workflowId/versions/compare', async (req: Request, res: Response) => {
    try {
        const workflowId = req.params.workflowId as string;
        const { v1, v2 } = req.query;

        if (!v1 || !v2) {
            return res.status(400).json({ error: 'Both v1 and v2 query params are required' });
        }

        const version1 = await prisma.workflowVersion.findFirst({
            where: { workflowId, version: parseInt(v1 as string) }
        });

        const version2 = await prisma.workflowVersion.findFirst({
            where: { workflowId, version: parseInt(v2 as string) }
        });

        if (!version1 || !version2) {
            return res.status(404).json({ error: 'One or both versions not found' });
        }

        const def1: WorkflowDefinition = JSON.parse(version1.definition);
        const def2: WorkflowDefinition = JSON.parse(version2.definition);

        // Simple diff calculation
        const diff = calculateDiff(def1, def2);

        res.json({
            v1: { version: version1.version, name: version1.name },
            v2: { version: version2.version, name: version2.name },
            diff
        });

    } catch (error: unknown) {
        console.error('Error comparing versions:', error);
        res.status(500).json({ error: 'Failed to compare versions' });
    }
});

/**
 * Delete a version (except current)
 */
router.delete('/versions/:id', async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;

        const version = await prisma.workflowVersion.findUnique({
            where: { id }
        });

        if (!version) {
            return res.status(404).json({ error: 'Version not found' });
        }

        // Check if this is the current version
        const workflow = await prisma.workflow.findUnique({
            where: { id: version.workflowId },
            select: { currentVersion: true }
        });

        if (workflow?.currentVersion === version.version) {
            return res.status(400).json({
                error: 'Cannot delete current version. Please restore another version first.'
            });
        }

        await prisma.workflowVersion.delete({ where: { id } });

        res.json({ success: true });

    } catch (error: unknown) {
        console.error('Error deleting version:', error);
        res.status(500).json({ error: 'Failed to delete version' });
    }
});

// ============================================================
// Import/Export Endpoints
// ============================================================

/**
 * Export workflow as JSON
 */
router.get('/workflows/:workflowId/export', async (req: Request, res: Response) => {
    try {
        const workflowId = req.params.workflowId as string;
        const { version: versionParam } = req.query;

        let definition: string;
        let workflowData: { name: string; description: string | null; currentVersion: number };

        if (versionParam) {
            // Export specific version
            const version = await prisma.workflowVersion.findFirst({
                where: {
                    workflowId,
                    version: parseInt(versionParam as string)
                }
            });

            if (!version) {
                return res.status(404).json({ error: 'Version not found' });
            }

            definition = version.definition;
            const workflow = await prisma.workflow.findUnique({
                where: { id: workflowId },
                select: { name: true, description: true, currentVersion: true }
            });
            workflowData = workflow!;
        } else {
            // Export current state
            const workflow = await prisma.workflow.findUnique({
                where: { id: workflowId }
            });

            if (!workflow) {
                return res.status(404).json({ error: 'Workflow not found' });
            }

            definition = workflow.definition;
            workflowData = {
                name: workflow.name,
                description: workflow.description,
                currentVersion: workflow.currentVersion
            };
        }

        const exportData = {
            _format: 'agentflow-workflow',
            _version: '1.0',
            exportedAt: new Date().toISOString(),
            workflow: {
                name: workflowData.name,
                description: workflowData.description,
                version: versionParam ? parseInt(versionParam as string) : workflowData.currentVersion,
                definition: JSON.parse(definition)
            }
        };

        res.setHeader('Content-Type', 'application/json');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${workflowData.name.replace(/[^a-z0-9]/gi, '_')}_v${exportData.workflow.version}.json"`
        );
        res.json(exportData);

    } catch (error: unknown) {
        console.error('Error exporting workflow:', error);
        res.status(500).json({ error: 'Failed to export workflow' });
    }
});

/**
 * Import workflow from JSON
 */
router.post('/workflows/import', async (req: Request, res: Response) => {
    try {
        const importData = req.body;
        const { userId } = req.query;

        // Validate format
        if (importData._format !== 'agentflow-workflow') {
            return res.status(400).json({
                error: 'Invalid format. Expected AgentFlow workflow export file.'
            });
        }

        const { workflow: importedWorkflow } = importData;

        // Create new workflow
        const workflow = await prisma.workflow.create({
            data: {
                name: importedWorkflow.name + ' (Imported)',
                description: importedWorkflow.description,
                definition: JSON.stringify(importedWorkflow.definition),
                userId: userId as string || undefined,
                status: 'draft',
                currentVersion: 1
            }
        });

        // Create initial version
        await prisma.workflowVersion.create({
            data: {
                workflowId: workflow.id,
                version: 1,
                name: 'Imported Version',
                definition: JSON.stringify(importedWorkflow.definition),
                createdBy: userId as string || undefined
            }
        });

        res.status(201).json({
            id: workflow.id,
            name: workflow.name,
            message: 'Workflow imported successfully'
        });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error importing workflow:', error);
        res.status(500).json({ error: 'Failed to import workflow', details: message });
    }
});

// ============================================================
// Helper Functions
// ============================================================

interface DiffResult {
    nodesAdded: string[];
    nodesRemoved: string[];
    nodesModified: string[];
    edgesAdded: number;
    edgesRemoved: number;
    summary: string;
}

function calculateDiff(def1: WorkflowDefinition, def2: WorkflowDefinition): DiffResult {
    const nodes1 = new Map((def1.nodes as { id: string }[]).map(n => [n.id, n]));
    const nodes2 = new Map((def2.nodes as { id: string }[]).map(n => [n.id, n]));

    const nodesAdded: string[] = [];
    const nodesRemoved: string[] = [];
    const nodesModified: string[] = [];

    // Find added and modified nodes
    for (const [id, node] of nodes2) {
        if (!nodes1.has(id)) {
            nodesAdded.push(id);
        } else if (JSON.stringify(nodes1.get(id)) !== JSON.stringify(node)) {
            nodesModified.push(id);
        }
    }

    // Find removed nodes
    for (const id of nodes1.keys()) {
        if (!nodes2.has(id)) {
            nodesRemoved.push(id);
        }
    }

    const edgesAdded = (def2.edges?.length || 0) - (def1.edges?.length || 0);

    return {
        nodesAdded,
        nodesRemoved,
        nodesModified,
        edgesAdded: Math.max(0, edgesAdded),
        edgesRemoved: Math.max(0, -edgesAdded),
        summary: `${nodesAdded.length} added, ${nodesRemoved.length} removed, ${nodesModified.length} modified`
    };
}

export default router;
