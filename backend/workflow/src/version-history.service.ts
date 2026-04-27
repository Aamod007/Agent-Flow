// Version History Service - Track workflow changes over time

export interface WorkflowVersion {
  id: string;
  workflowId: string;
  version: number;
  name: string;
  description?: string;
  nodes: any[];
  edges: any[];
  settings: Record<string, any>;
  createdAt: Date;
  createdBy?: string;
  changes?: VersionChange[];
  isAutoSave: boolean;
}

export interface VersionChange {
  type: 'node_added' | 'node_removed' | 'node_modified' | 'edge_added' | 'edge_removed' | 'settings_changed';
  nodeId?: string;
  nodeName?: string;
  field?: string;
  oldValue?: any;
  newValue?: any;
}

class VersionHistoryService {
  private versions: Map<string, WorkflowVersion[]> = new Map();
  private maxVersions: number = 50;
  private autoSaveInterval: number = 60000; // 1 minute
  private pendingChanges: Map<string, any> = new Map();

  // Create a new version
  createVersion(
    workflowId: string,
    workflow: {
      name: string;
      nodes: any[];
      edges: any[];
      settings?: Record<string, any>;
    },
    options: {
      description?: string;
      createdBy?: string;
      isAutoSave?: boolean;
    } = {}
  ): WorkflowVersion {
    const workflowVersions = this.versions.get(workflowId) || [];
    const lastVersion = workflowVersions[workflowVersions.length - 1];
    
    // Calculate changes from previous version
    const changes = lastVersion 
      ? this.calculateChanges(lastVersion, workflow)
      : [];

    // Don't create version if no changes and not first version
    if (lastVersion && changes.length === 0 && !options.description) {
      return lastVersion;
    }

    const newVersion: WorkflowVersion = {
      id: `ver_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      workflowId,
      version: (lastVersion?.version || 0) + 1,
      name: workflow.name,
      description: options.description,
      nodes: JSON.parse(JSON.stringify(workflow.nodes)),
      edges: JSON.parse(JSON.stringify(workflow.edges)),
      settings: workflow.settings || {},
      createdAt: new Date(),
      createdBy: options.createdBy,
      changes,
      isAutoSave: options.isAutoSave || false
    };

    workflowVersions.push(newVersion);

    // Trim old versions if exceeding max (keep first, last N, and non-autosave)
    if (workflowVersions.length > this.maxVersions) {
      const toKeep = workflowVersions.filter((v, i) => 
        i === 0 || // Keep first
        i >= workflowVersions.length - 20 || // Keep last 20
        !v.isAutoSave // Keep all manual saves
      );
      this.versions.set(workflowId, toKeep);
    } else {
      this.versions.set(workflowId, workflowVersions);
    }

    console.log(`[VersionHistory] Created version ${newVersion.version} for workflow ${workflowId}`);

    return newVersion;
  }

  // Calculate changes between versions
  private calculateChanges(
    oldVersion: WorkflowVersion,
    newWorkflow: { nodes: any[]; edges: any[]; settings?: Record<string, any> }
  ): VersionChange[] {
    const changes: VersionChange[] = [];

    // Check nodes
    const oldNodeIds = new Set(oldVersion.nodes.map(n => n.id));
    const newNodeIds = new Set(newWorkflow.nodes.map(n => n.id));

    // Added nodes
    for (const node of newWorkflow.nodes) {
      if (!oldNodeIds.has(node.id)) {
        changes.push({
          type: 'node_added',
          nodeId: node.id,
          nodeName: node.data?.label || node.type
        });
      }
    }

    // Removed nodes
    for (const node of oldVersion.nodes) {
      if (!newNodeIds.has(node.id)) {
        changes.push({
          type: 'node_removed',
          nodeId: node.id,
          nodeName: node.data?.label || node.type
        });
      }
    }

    // Modified nodes
    for (const newNode of newWorkflow.nodes) {
      if (oldNodeIds.has(newNode.id)) {
        const oldNode = oldVersion.nodes.find(n => n.id === newNode.id);
        if (oldNode && JSON.stringify(oldNode.data) !== JSON.stringify(newNode.data)) {
          changes.push({
            type: 'node_modified',
            nodeId: newNode.id,
            nodeName: newNode.data?.label || newNode.type
          });
        }
      }
    }

    // Check edges
    const oldEdgeIds = new Set(oldVersion.edges.map(e => `${e.source}-${e.target}`));
    const newEdgeIds = new Set(newWorkflow.edges.map(e => `${e.source}-${e.target}`));

    for (const edge of newWorkflow.edges) {
      const edgeId = `${edge.source}-${edge.target}`;
      if (!oldEdgeIds.has(edgeId)) {
        changes.push({ type: 'edge_added' });
      }
    }

    for (const edge of oldVersion.edges) {
      const edgeId = `${edge.source}-${edge.target}`;
      if (!newEdgeIds.has(edgeId)) {
        changes.push({ type: 'edge_removed' });
      }
    }

    // Check settings
    if (JSON.stringify(oldVersion.settings) !== JSON.stringify(newWorkflow.settings || {})) {
      changes.push({ type: 'settings_changed' });
    }

    return changes;
  }

  // Get all versions for a workflow
  getVersions(workflowId: string): WorkflowVersion[] {
    return this.versions.get(workflowId) || [];
  }

  // Get a specific version
  getVersion(workflowId: string, versionId: string): WorkflowVersion | null {
    const versions = this.versions.get(workflowId) || [];
    return versions.find(v => v.id === versionId) || null;
  }

  // Get version by number
  getVersionByNumber(workflowId: string, versionNumber: number): WorkflowVersion | null {
    const versions = this.versions.get(workflowId) || [];
    return versions.find(v => v.version === versionNumber) || null;
  }

  // Get latest version
  getLatestVersion(workflowId: string): WorkflowVersion | null {
    const versions = this.versions.get(workflowId) || [];
    return versions[versions.length - 1] || null;
  }

  // Compare two versions
  compareVersions(
    workflowId: string,
    versionId1: string,
    versionId2: string
  ): {
    addedNodes: string[];
    removedNodes: string[];
    modifiedNodes: string[];
    addedEdges: number;
    removedEdges: number;
  } {
    const v1 = this.getVersion(workflowId, versionId1);
    const v2 = this.getVersion(workflowId, versionId2);

    if (!v1 || !v2) {
      throw new Error('Version not found');
    }

    const v1NodeIds = new Set(v1.nodes.map(n => n.id));
    const v2NodeIds = new Set(v2.nodes.map(n => n.id));

    const addedNodes: string[] = [];
    const removedNodes: string[] = [];
    const modifiedNodes: string[] = [];

    // Check added/removed
    for (const node of v2.nodes) {
      if (!v1NodeIds.has(node.id)) {
        addedNodes.push(node.id);
      }
    }

    for (const node of v1.nodes) {
      if (!v2NodeIds.has(node.id)) {
        removedNodes.push(node.id);
      }
    }

    // Check modified
    for (const node of v2.nodes) {
      if (v1NodeIds.has(node.id)) {
        const oldNode = v1.nodes.find(n => n.id === node.id);
        if (JSON.stringify(oldNode?.data) !== JSON.stringify(node.data)) {
          modifiedNodes.push(node.id);
        }
      }
    }

    // Count edge changes
    const v1EdgeIds = new Set(v1.edges.map(e => `${e.source}-${e.target}`));
    const v2EdgeIds = new Set(v2.edges.map(e => `${e.source}-${e.target}`));

    let addedEdges = 0;
    let removedEdges = 0;

    for (const edgeId of v2EdgeIds) {
      if (!v1EdgeIds.has(edgeId)) addedEdges++;
    }

    for (const edgeId of v1EdgeIds) {
      if (!v2EdgeIds.has(edgeId)) removedEdges++;
    }

    return {
      addedNodes,
      removedNodes,
      modifiedNodes,
      addedEdges,
      removedEdges
    };
  }

  // Restore a version
  restoreVersion(workflowId: string, versionId: string): WorkflowVersion | null {
    const version = this.getVersion(workflowId, versionId);
    if (!version) return null;

    // Create a new version that restores the old state
    return this.createVersion(workflowId, {
      name: version.name,
      nodes: version.nodes,
      edges: version.edges,
      settings: version.settings
    }, {
      description: `Restored from version ${version.version}`,
      isAutoSave: false
    });
  }

  // Delete a version (except first and last)
  deleteVersion(workflowId: string, versionId: string): boolean {
    const versions = this.versions.get(workflowId) || [];
    const index = versions.findIndex(v => v.id === versionId);

    if (index <= 0 || index === versions.length - 1) {
      return false; // Can't delete first or last version
    }

    versions.splice(index, 1);
    this.versions.set(workflowId, versions);
    return true;
  }

  // Export versions for persistence
  exportVersions(workflowId: string): WorkflowVersion[] {
    return this.versions.get(workflowId) || [];
  }

  // Import versions (e.g., from database)
  importVersions(workflowId: string, versions: WorkflowVersion[]): void {
    this.versions.set(workflowId, versions);
  }

  // Get version summary
  getVersionSummary(workflowId: string): {
    totalVersions: number;
    firstVersion: Date | null;
    lastVersion: Date | null;
    autoSaveCount: number;
    manualSaveCount: number;
  } {
    const versions = this.versions.get(workflowId) || [];
    
    return {
      totalVersions: versions.length,
      firstVersion: versions[0]?.createdAt || null,
      lastVersion: versions[versions.length - 1]?.createdAt || null,
      autoSaveCount: versions.filter(v => v.isAutoSave).length,
      manualSaveCount: versions.filter(v => !v.isAutoSave).length
    };
  }
}

// Singleton instance
export const versionHistory = new VersionHistoryService();

export default versionHistory;
