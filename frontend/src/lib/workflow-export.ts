// Workflow Export/Import Utilities

export interface ExportedWorkflow {
  version: string;
  exportedAt: string;
  workflow: {
    name: string;
    description?: string;
    nodes: any[];
    edges: any[];
    settings?: Record<string, any>;
  };
  metadata?: {
    originalId?: string;
    author?: string;
    tags?: string[];
  };
}

// Export workflow to JSON
export function exportWorkflowToJSON(
  workflow: {
    id?: string;
    name: string;
    description?: string;
    nodes: any[];
    edges: any[];
    settings?: Record<string, any>;
  },
  options?: {
    includeCredentials?: boolean;
    author?: string;
    tags?: string[];
  }
): ExportedWorkflow {
  // Deep clone to avoid mutations
  const cleanedNodes = workflow.nodes.map(node => {
    const cleanNode = { ...node, data: { ...node.data } };
    
    // Remove sensitive data unless explicitly requested
    if (!options?.includeCredentials) {
      if (cleanNode.data?.credentials) {
        cleanNode.data.credentials = '[REMOVED]';
      }
      if (cleanNode.data?.apiKey) {
        cleanNode.data.apiKey = '[REMOVED]';
      }
    }
    
    // Remove runtime data
    delete cleanNode.data?.executionOutput;
    delete cleanNode.data?.lastError;
    
    return cleanNode;
  });

  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    workflow: {
      name: workflow.name,
      description: workflow.description,
      nodes: cleanedNodes,
      edges: workflow.edges,
      settings: workflow.settings
    },
    metadata: {
      originalId: workflow.id,
      author: options?.author,
      tags: options?.tags
    }
  };
}

// Import workflow from JSON
export function importWorkflowFromJSON(
  json: string | ExportedWorkflow
): {
  success: boolean;
  workflow?: ExportedWorkflow['workflow'];
  metadata?: ExportedWorkflow['metadata'];
  error?: string;
  warnings?: string[];
} {
  const warnings: string[] = [];

  try {
    const data: ExportedWorkflow = typeof json === 'string' ? JSON.parse(json) : json;

    // Validate structure
    if (!data.workflow) {
      return { success: false, error: 'Invalid workflow file: missing workflow data' };
    }

    if (!data.workflow.nodes || !Array.isArray(data.workflow.nodes)) {
      return { success: false, error: 'Invalid workflow file: missing or invalid nodes' };
    }

    if (!data.workflow.edges || !Array.isArray(data.workflow.edges)) {
      return { success: false, error: 'Invalid workflow file: missing or invalid edges' };
    }

    // Check version compatibility
    if (data.version && data.version !== '1.0') {
      warnings.push(`Workflow was exported with version ${data.version}, some features may not be compatible`);
    }

    // Check for removed credentials
    const hasRemovedCreds = data.workflow.nodes.some(
      node => node.data?.credentials === '[REMOVED]' || node.data?.apiKey === '[REMOVED]'
    );
    
    if (hasRemovedCreds) {
      warnings.push('Some credentials were removed during export and need to be reconfigured');
    }

    // Generate new IDs to avoid conflicts
    const idMap = new Map<string, string>();
    
    const newNodes = data.workflow.nodes.map(node => {
      const newId = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      idMap.set(node.id, newId);
      return {
        ...node,
        id: newId,
        // Offset position slightly to make it clear it's imported
        position: {
          x: (node.position?.x || 0) + 50,
          y: (node.position?.y || 0) + 50
        }
      };
    });

    const newEdges = data.workflow.edges.map(edge => ({
      ...edge,
      id: `edge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: idMap.get(edge.source) || edge.source,
      target: idMap.get(edge.target) || edge.target
    }));

    return {
      success: true,
      workflow: {
        ...data.workflow,
        name: `${data.workflow.name} (Imported)`,
        nodes: newNodes,
        edges: newEdges
      },
      metadata: data.metadata,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to parse workflow file: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

// Download workflow as file
export function downloadWorkflow(workflow: ExportedWorkflow, filename?: string) {
  const json = JSON.stringify(workflow, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `${workflow.workflow.name.replace(/[^a-z0-9]/gi, '_')}.agentflow.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Read workflow from file input
export function readWorkflowFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

// Validate workflow structure (basic validation)
export function validateWorkflow(workflow: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!workflow.name || typeof workflow.name !== 'string') {
    errors.push('Workflow must have a name');
  }

  if (!Array.isArray(workflow.nodes)) {
    errors.push('Workflow must have a nodes array');
  } else {
    workflow.nodes.forEach((node: any, index: number) => {
      if (!node.id) errors.push(`Node at index ${index} is missing an id`);
      if (!node.type) errors.push(`Node at index ${index} is missing a type`);
      if (!node.position || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
        errors.push(`Node at index ${index} has invalid position`);
      }
    });
  }

  if (!Array.isArray(workflow.edges)) {
    errors.push('Workflow must have an edges array');
  } else {
    const nodeIds = new Set(workflow.nodes?.map((n: any) => n.id) || []);
    workflow.edges.forEach((edge: any, index: number) => {
      if (!edge.source) errors.push(`Edge at index ${index} is missing source`);
      if (!edge.target) errors.push(`Edge at index ${index} is missing target`);
      if (edge.source && !nodeIds.has(edge.source)) {
        errors.push(`Edge at index ${index} references non-existent source node: ${edge.source}`);
      }
      if (edge.target && !nodeIds.has(edge.target)) {
        errors.push(`Edge at index ${index} references non-existent target node: ${edge.target}`);
      }
    });
  }

  return { valid: errors.length === 0, errors };
}
