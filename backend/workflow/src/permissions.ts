/**
 * User Roles & Permissions Module
 * 
 * Manages user roles, team memberships, and workflow permissions
 */

import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// ============================================================
// Types
// ============================================================

export type UserRole = 'owner' | 'admin' | 'editor' | 'viewer';
export type WorkflowPermission = 'view' | 'edit' | 'execute' | 'admin';

interface PermissionCheck {
    userId: string;
    workflowId: string;
    requiredPermission: WorkflowPermission;
}

// Permission hierarchy (higher includes lower)
const PERMISSION_HIERARCHY: Record<WorkflowPermission, number> = {
    view: 1,
    execute: 2,
    edit: 3,
    admin: 4
};

const ROLE_DEFAULT_PERMISSIONS: Record<UserRole, WorkflowPermission> = {
    owner: 'admin',
    admin: 'admin',
    editor: 'edit',
    viewer: 'view'
};

// ============================================================
// Team CRUD Endpoints
// ============================================================

/**
 * Create a new team
 */
router.post('/teams', async (req: Request, res: Response) => {
    try {
        const { name, description, ownerId } = req.body;

        if (!name || !ownerId) {
            return res.status(400).json({ error: 'Name and ownerId are required' });
        }

        const team = await prisma.team.create({
            data: {
                name,
                description,
                ownerId,
                members: {
                    create: {
                        userId: ownerId,
                        role: 'owner'
                    }
                }
            },
            include: {
                members: true
            }
        });

        res.status(201).json(team);

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error creating team:', error);
        res.status(500).json({ error: 'Failed to create team', details: message });
    }
});

/**
 * Get all teams for a user
 */
router.get('/users/:userId/teams', async (req: Request, res: Response) => {
    try {
        const userId = req.params.userId as string;

        const memberships = await prisma.teamMember.findMany({
            where: { userId },
            include: {
                team: {
                    include: {
                        members: {
                            select: { userId: true, role: true }
                        }
                    }
                }
            }
        });

        res.json(memberships.map(m => ({
            teamId: m.team.id,
            name: m.team.name,
            description: m.team.description,
            role: m.role,
            memberCount: m.team.members.length
        })));

    } catch (error: unknown) {
        console.error('Error listing teams:', error);
        res.status(500).json({ error: 'Failed to list teams' });
    }
});

/**
 * Get team details
 */
router.get('/teams/:id', async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;

        const team = await prisma.team.findUnique({
            where: { id },
            include: {
                members: {
                    include: {
                        // We can't include user here without User relation on TeamMember
                        // For now, just return the userId
                    }
                }
            }
        });

        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }

        res.json(team);

    } catch (error: unknown) {
        console.error('Error getting team:', error);
        res.status(500).json({ error: 'Failed to get team' });
    }
});

/**
 * Add member to team
 */
router.post('/teams/:id/members', async (req: Request, res: Response) => {
    try {
        const teamId = req.params.id as string;
        const { userId, role = 'member' } = req.body;

        // Check team exists
        const team = await prisma.team.findUnique({ where: { id: teamId } });
        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }

        // Check not already a member
        const existing = await prisma.teamMember.findUnique({
            where: { teamId_userId: { teamId, userId } }
        });
        if (existing) {
            return res.status(400).json({ error: 'User is already a team member' });
        }

        const member = await prisma.teamMember.create({
            data: {
                teamId,
                userId,
                role
            }
        });

        res.status(201).json(member);

    } catch (error: unknown) {
        console.error('Error adding team member:', error);
        res.status(500).json({ error: 'Failed to add team member' });
    }
});

/**
 * Remove member from team
 */
router.delete('/teams/:teamId/members/:userId', async (req: Request, res: Response) => {
    try {
        const teamId = req.params.teamId as string;
        const userId = req.params.userId as string;

        // Check if this is the owner
        const team = await prisma.team.findUnique({ where: { id: teamId } });
        if (team?.ownerId === userId) {
            return res.status(400).json({ error: 'Cannot remove team owner' });
        }

        await prisma.teamMember.delete({
            where: { teamId_userId: { teamId, userId } }
        });

        res.json({ success: true });

    } catch (error: unknown) {
        console.error('Error removing team member:', error);
        res.status(500).json({ error: 'Failed to remove team member' });
    }
});

/**
 * Update member role
 */
router.patch('/teams/:teamId/members/:userId', async (req: Request, res: Response) => {
    try {
        const teamId = req.params.teamId as string;
        const userId = req.params.userId as string;
        const { role } = req.body;

        if (!['owner', 'admin', 'member', 'viewer'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        const member = await prisma.teamMember.update({
            where: { teamId_userId: { teamId, userId } },
            data: { role }
        });

        res.json(member);

    } catch (error: unknown) {
        console.error('Error updating member role:', error);
        res.status(500).json({ error: 'Failed to update member role' });
    }
});

// ============================================================
// Workflow Sharing Endpoints
// ============================================================

/**
 * Share workflow with team
 */
router.post('/workflows/:workflowId/share/team', async (req: Request, res: Response) => {
    try {
        const workflowId = req.params.workflowId as string;
        const { teamId, permission = 'view' } = req.body;

        // Check workflow exists
        const workflow = await prisma.workflow.findUnique({ where: { id: workflowId } });
        if (!workflow) {
            return res.status(404).json({ error: 'Workflow not found' });
        }

        // Check team exists
        const team = await prisma.team.findUnique({ where: { id: teamId } });
        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }

        // Create or update permission
        const workflowPermission = await prisma.workflowPermission.upsert({
            where: {
                // Would need a unique constraint on workflowId+teamId
                id: `${workflowId}-${teamId}` // Placeholder - actual implementation needs proper unique key
            },
            create: {
                workflowId,
                teamId,
                permission
            },
            update: {
                permission
            }
        });

        res.status(201).json(workflowPermission);

    } catch (error: unknown) {
        console.error('Error sharing workflow with team:', error);
        res.status(500).json({ error: 'Failed to share workflow' });
    }
});

/**
 * Share workflow with user directly
 */
router.post('/workflows/:workflowId/share/user', async (req: Request, res: Response) => {
    try {
        const workflowId = req.params.workflowId as string;
        const { userId, permission = 'view' } = req.body;

        const workflow = await prisma.workflow.findUnique({ where: { id: workflowId } });
        if (!workflow) {
            return res.status(404).json({ error: 'Workflow not found' });
        }

        const workflowPermission = await prisma.workflowPermission.create({
            data: {
                workflowId,
                userId,
                permission
            }
        });

        res.status(201).json(workflowPermission);

    } catch (error: unknown) {
        console.error('Error sharing workflow with user:', error);
        res.status(500).json({ error: 'Failed to share workflow' });
    }
});

/**
 * List workflow permissions
 */
router.get('/workflows/:workflowId/permissions', async (req: Request, res: Response) => {
    try {
        const workflowId = req.params.workflowId as string;

        const permissions = await prisma.workflowPermission.findMany({
            where: { workflowId },
            include: {
                team: {
                    select: { id: true, name: true }
                }
            }
        });

        res.json(permissions);

    } catch (error: unknown) {
        console.error('Error listing permissions:', error);
        res.status(500).json({ error: 'Failed to list permissions' });
    }
});

/**
 * Remove workflow permission
 */
router.delete('/permissions/:id', async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;

        await prisma.workflowPermission.delete({ where: { id } });

        res.json({ success: true });

    } catch (error: unknown) {
        console.error('Error removing permission:', error);
        res.status(500).json({ error: 'Failed to remove permission' });
    }
});

// ============================================================
// Permission Check Middleware
// ============================================================

/**
 * Check if user has required permission on workflow
 */
export async function checkWorkflowPermission(
    check: PermissionCheck
): Promise<boolean> {
    const { userId, workflowId, requiredPermission } = check;

    // Check direct ownership
    const workflow = await prisma.workflow.findUnique({
        where: { id: workflowId },
        select: { userId: true }
    });

    if (workflow?.userId === userId) {
        return true; // Owner has all permissions
    }

    // Check direct user permission
    const userPermission = await prisma.workflowPermission.findFirst({
        where: { workflowId, userId }
    });

    if (userPermission) {
        return PERMISSION_HIERARCHY[userPermission.permission as WorkflowPermission] >=
            PERMISSION_HIERARCHY[requiredPermission];
    }

    // Check team permissions
    const userTeams = await prisma.teamMember.findMany({
        where: { userId },
        select: { teamId: true, role: true }
    });

    const teamIds = userTeams.map(t => t.teamId);

    const teamPermissions = await prisma.workflowPermission.findMany({
        where: {
            workflowId,
            teamId: { in: teamIds }
        }
    });

    // Get highest permission from teams
    let highestPermission = 0;
    for (const perm of teamPermissions) {
        const level = PERMISSION_HIERARCHY[perm.permission as WorkflowPermission] || 0;
        if (level > highestPermission) {
            highestPermission = level;
        }
    }

    return highestPermission >= PERMISSION_HIERARCHY[requiredPermission];
}

/**
 * Middleware to require workflow permission
 */
export function requirePermission(permission: WorkflowPermission) {
    return async (req: Request, res: Response, next: NextFunction) => {
        const userId = req.headers['x-user-id'] as string;
        const workflowId = req.params.workflowId || req.params.id;

        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!workflowId) {
            return res.status(400).json({ error: 'Workflow ID required' });
        }

        const hasPermission = await checkWorkflowPermission({
            userId,
            workflowId: workflowId as string,
            requiredPermission: permission
        });

        if (!hasPermission) {
            return res.status(403).json({ error: 'Permission denied' });
        }

        next();
    };
}

export default router;
