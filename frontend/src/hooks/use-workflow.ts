import { useState, useCallback, useEffect, useRef } from 'react';
import { api, type Workflow } from '@/lib/api';

interface UseWorkflowOptions {
    autoFetch?: boolean;
}

interface UseWorkflowReturn {
    workflow: Workflow | null;
    loading: boolean;
    error: Error | null;
    save: (data: Partial<Workflow>) => Promise<void>;
    execute: (input?: object) => Promise<{ executionId: string }>;
    refresh: () => Promise<void>;
}

export function useWorkflow(workflowId: string | undefined, options: UseWorkflowOptions = {}): UseWorkflowReturn {
    const { autoFetch = true } = options;
    const [workflow, setWorkflow] = useState<Workflow | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const isMounted = useRef(true);

    const fetchWorkflow = useCallback(async () => {
        if (!workflowId) {
            setWorkflow(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const data = await api.getWorkflow(workflowId);
            if (isMounted.current) {
                setWorkflow(data);
            }
        } catch (err) {
            if (isMounted.current) {
                setError(err instanceof Error ? err : new Error('Failed to fetch workflow'));
            }
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
        }
    }, [workflowId]);

    const save = useCallback(async (data: Partial<Workflow>) => {
        if (!workflowId) throw new Error('No workflow ID');

        try {
            const saveData: { definition?: object; name?: string; description?: string; status?: string } = {
                ...(data.name !== undefined && { name: data.name }),
                ...(data.description !== undefined && { description: data.description }),
                ...(data.status !== undefined && { status: data.status }),
                ...(data.definition !== undefined && { definition: typeof data.definition === 'string' ? JSON.parse(data.definition) : data.definition }),
            };
            const updated = await api.saveWorkflow(workflowId, saveData);
            if (isMounted.current) {
                setWorkflow(updated);
            }
        } catch (err) {
            throw err instanceof Error ? err : new Error('Failed to save workflow');
        }
    }, [workflowId]);

    const execute = useCallback(async (input?: object) => {
        if (!workflowId) throw new Error('No workflow ID');

        try {
            const result = await api.executeWorkflow(workflowId, input);
            return { executionId: result.executionId };
        } catch (err) {
            throw err instanceof Error ? err : new Error('Failed to execute workflow');
        }
    }, [workflowId]);

    useEffect(() => {
        isMounted.current = true;
        if (autoFetch) {
            fetchWorkflow();
        }
        return () => {
            isMounted.current = false;
        };
    }, [autoFetch, fetchWorkflow]);

    return {
        workflow,
        loading,
        error,
        save,
        execute,
        refresh: fetchWorkflow,
    };
}

// Hook for managing workflow list
export function useWorkflows() {
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchWorkflows = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const data = await api.getWorkflows();
            setWorkflows(data);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch workflows'));
        } finally {
            setLoading(false);
        }
    }, []);

    const createWorkflow = useCallback(async (name: string, description: string) => {
        const newWorkflow = await api.createWorkflow(name, description);
        setWorkflows((prev) => [newWorkflow, ...prev]);
        return newWorkflow;
    }, []);

    const deleteWorkflow = useCallback(async (id: string) => {
        await api.deleteWorkflow(id);
        setWorkflows((prev) => prev.filter((w) => w.id !== id));
    }, []);

    useEffect(() => {
        fetchWorkflows();
    }, [fetchWorkflows]);

    return {
        workflows,
        loading,
        error,
        refresh: fetchWorkflows,
        createWorkflow,
        deleteWorkflow,
    };
}
