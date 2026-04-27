import React, { useState, useEffect } from 'react';
import { 
  History, 
  RotateCcw, 
  GitBranch, 
  Clock, 
  User,
  Plus,
  Minus,
  Edit3,
  ChevronRight,
  Save,
  Eye
} from 'lucide-react';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

interface WorkflowVersion {
  id: string;
  version: number;
  name: string;
  description?: string;
  createdAt: string;
  createdBy?: string;
  changes?: {
    type: string;
    nodeId?: string;
    nodeName?: string;
  }[];
  isAutoSave: boolean;
  nodes: any[];
  edges: any[];
}

interface VersionHistoryProps {
  workflowId: string;
  currentVersion?: number;
  onRestore: (version: WorkflowVersion) => void;
  onPreview: (version: WorkflowVersion) => void;
}

export function VersionHistory({ 
  workflowId, 
  currentVersion, 
  onRestore,
  onPreview 
}: VersionHistoryProps) {
  const [versions, setVersions] = useState<WorkflowVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<WorkflowVersion | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareVersions, setCompareVersions] = useState<[string | null, string | null]>([null, null]);

  // Mock data for demonstration - replace with API call
  useEffect(() => {
    const fetchVersions = async () => {
      setLoading(true);
      try {
        // In production, fetch from API:
        // const response = await fetch(`/api/workflows/${workflowId}/versions`);
        // const data = await response.json();
        
        // Demo data
        const demoVersions: WorkflowVersion[] = [
          {
            id: 'v3',
            version: 3,
            name: 'Email Automation Workflow',
            description: 'Added error handling',
            createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            createdBy: 'You',
            changes: [
              { type: 'node_added', nodeName: 'Error Handler' },
              { type: 'edge_added' }
            ],
            isAutoSave: false,
            nodes: [],
            edges: []
          },
          {
            id: 'v2',
            version: 2,
            name: 'Email Automation Workflow',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            createdBy: 'You',
            changes: [
              { type: 'node_modified', nodeName: 'AI Agent' },
              { type: 'settings_changed' }
            ],
            isAutoSave: true,
            nodes: [],
            edges: []
          },
          {
            id: 'v1',
            version: 1,
            name: 'Email Automation Workflow',
            description: 'Initial version',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
            createdBy: 'You',
            changes: [],
            isAutoSave: false,
            nodes: [],
            edges: []
          }
        ];
        
        setVersions(demoVersions);
      } catch (error) {
        console.error('Failed to fetch versions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVersions();
  }, [workflowId]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getChangeIcon = (type: string) => {
    switch (type) {
      case 'node_added':
        return <Plus className="h-3 w-3 text-green-500" />;
      case 'node_removed':
        return <Minus className="h-3 w-3 text-red-500" />;
      case 'node_modified':
        return <Edit3 className="h-3 w-3 text-blue-500" />;
      default:
        return <ChevronRight className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getChangeText = (change: { type: string; nodeName?: string }) => {
    switch (change.type) {
      case 'node_added':
        return `Added "${change.nodeName}"`;
      case 'node_removed':
        return `Removed "${change.nodeName}"`;
      case 'node_modified':
        return `Modified "${change.nodeName}"`;
      case 'edge_added':
        return 'Added connection';
      case 'edge_removed':
        return 'Removed connection';
      case 'settings_changed':
        return 'Updated settings';
      default:
        return change.type;
    }
  };

  const handleRestoreClick = (version: WorkflowVersion) => {
    setSelectedVersion(version);
  };

  const confirmRestore = () => {
    if (selectedVersion) {
      onRestore(selectedVersion);
      setSelectedVersion(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5" />
          <span className="font-semibold">Version History</span>
        </div>
        <Button
          variant={compareMode ? "secondary" : "ghost"}
          size="sm"
          onClick={() => {
            setCompareMode(!compareMode);
            setCompareVersions([null, null]);
          }}
        >
          <GitBranch className="h-4 w-4 mr-1" />
          Compare
        </Button>
      </div>

      {/* Compare Instructions */}
      {compareMode && (
        <div className="p-3 bg-muted/50 border-b text-sm text-muted-foreground">
          Select two versions to compare their differences
        </div>
      )}

      {/* Version List */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
          </div>
        ) : versions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <History className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No version history yet</p>
          </div>
        ) : (
          <div className="p-2">
            {versions.map((version, index) => (
              <div
                key={version.id}
                className={`relative p-3 rounded-lg border mb-2 transition-colors ${
                  version.version === currentVersion
                    ? 'border-primary bg-primary/5'
                    : 'hover:bg-muted/50'
                } ${
                  compareMode && (compareVersions.includes(version.id))
                    ? 'ring-2 ring-primary'
                    : ''
                }`}
                onClick={() => {
                  if (compareMode) {
                    if (compareVersions[0] === version.id) {
                      setCompareVersions([null, compareVersions[1]]);
                    } else if (compareVersions[1] === version.id) {
                      setCompareVersions([compareVersions[0], null]);
                    } else if (!compareVersions[0]) {
                      setCompareVersions([version.id, compareVersions[1]]);
                    } else if (!compareVersions[1]) {
                      setCompareVersions([compareVersions[0], version.id]);
                    }
                  }
                }}
              >
                {/* Timeline connector */}
                {index < versions.length - 1 && (
                  <div className="absolute left-6 top-12 bottom-0 w-px bg-border -mb-2" />
                )}

                <div className="flex items-start gap-3">
                  {/* Version indicator */}
                  <div className={`flex items-center justify-center h-6 w-6 rounded-full text-xs font-medium ${
                    version.version === currentVersion
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}>
                    {version.version}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Version header */}
                    <div className="flex items-center gap-2 mb-1">
                      {version.version === currentVersion && (
                        <Badge variant="outline" className="text-xs">Current</Badge>
                      )}
                      {version.isAutoSave && (
                        <Badge variant="secondary" className="text-xs">Auto-save</Badge>
                      )}
                    </div>

                    {/* Description */}
                    {version.description && (
                      <p className="text-sm font-medium mb-1">{version.description}</p>
                    )}

                    {/* Changes */}
                    {version.changes && version.changes.length > 0 && (
                      <div className="space-y-1 mb-2">
                        {version.changes.slice(0, 3).map((change, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            {getChangeIcon(change.type)}
                            <span>{getChangeText(change)}</span>
                          </div>
                        ))}
                        {version.changes.length > 3 && (
                          <div className="text-xs text-muted-foreground">
                            +{version.changes.length - 3} more changes
                          </div>
                        )}
                      </div>
                    )}

                    {/* Meta */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(version.createdAt)}
                      </div>
                      {version.createdBy && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {version.createdBy}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {!compareMode && version.version !== currentVersion && (
                      <div className="flex items-center gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            onPreview(version);
                          }}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Preview
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRestoreClick(version);
                          }}
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Restore
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Restore Confirmation Dialog */}
      <Dialog open={!!selectedVersion} onOpenChange={() => setSelectedVersion(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore Version {selectedVersion?.version}?</DialogTitle>
            <DialogDescription>
              This will restore your workflow to version {selectedVersion?.version} 
              {selectedVersion?.description && ` (${selectedVersion.description})`}.
              Your current workflow will be saved as a new version before restoring.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setSelectedVersion(null)}>
              Cancel
            </Button>
            <Button onClick={confirmRestore}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Restore Version
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default VersionHistory;
