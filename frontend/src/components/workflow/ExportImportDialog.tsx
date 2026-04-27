import React, { useRef, useState } from 'react';
import { Upload, Download, FileJson, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { 
  exportWorkflowToJSON, 
  importWorkflowFromJSON, 
  downloadWorkflow,
  readWorkflowFile 
} from '../../lib/workflow-export';

interface ExportImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'export' | 'import';
  workflow?: {
    id?: string;
    name: string;
    description?: string;
    nodes: any[];
    edges: any[];
    settings?: Record<string, any>;
  };
  onImport?: (workflow: any) => void;
}

export function ExportImportDialog({
  open,
  onOpenChange,
  mode,
  workflow,
  onImport
}: ExportImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    message: string;
    warnings?: string[];
    workflow?: any;
  } | null>(null);

  const handleExport = () => {
    if (!workflow) return;

    const exported = exportWorkflowToJSON(workflow, {
      includeCredentials: false
    });

    downloadWorkflow(exported);
    onOpenChange(false);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    try {
      const content = await readWorkflowFile(file);
      const result = importWorkflowFromJSON(content);

      if (result.success && result.workflow) {
        setImportResult({
          success: true,
          message: `Successfully imported "${result.workflow.name}"`,
          warnings: result.warnings,
          workflow: result.workflow
        });
      } else {
        setImportResult({
          success: false,
          message: result.error || 'Failed to import workflow'
        });
      }
    } catch (error) {
      setImportResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to read file'
      });
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleConfirmImport = () => {
    if (importResult?.success && importResult.workflow && onImport) {
      onImport(importResult.workflow);
      onOpenChange(false);
      setImportResult(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) setImportResult(null);
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'export' ? (
              <>
                <Download className="h-5 w-5" />
                Export Workflow
              </>
            ) : (
              <>
                <Upload className="h-5 w-5" />
                Import Workflow
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {mode === 'export'
              ? 'Download your workflow as a JSON file that can be shared or imported later.'
              : 'Import a workflow from a previously exported JSON file.'}
          </DialogDescription>
        </DialogHeader>

        {mode === 'export' ? (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-start gap-3">
                <FileJson className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="font-medium">{workflow?.name || 'Workflow'}</p>
                  <p className="text-sm text-muted-foreground">
                    {workflow?.nodes?.length || 0} nodes, {workflow?.edges?.length || 0} connections
                  </p>
                </div>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">Note:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Credentials and API keys will be removed for security</li>
                <li>You'll need to reconfigure connections after importing</li>
              </ul>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Download JSON
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {!importResult && (
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm font-medium">Click to select a file</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supports .json and .agentflow.json files
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.agentflow.json"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>
            )}

            {importing && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
              </div>
            )}

            {importResult && (
              <div className={`p-4 rounded-lg ${
                importResult.success ? 'bg-green-500/10' : 'bg-red-500/10'
              }`}>
                <div className="flex items-start gap-3">
                  {importResult.success ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className={`font-medium ${
                      importResult.success ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {importResult.message}
                    </p>
                    
                    {importResult.warnings && importResult.warnings.length > 0 && (
                      <ul className="mt-2 text-sm text-muted-foreground list-disc list-inside">
                        {importResult.warnings.map((warning, i) => (
                          <li key={i}>{warning}</li>
                        ))}
                      </ul>
                    )}

                    {importResult.success && importResult.workflow && (
                      <div className="mt-3 p-3 bg-background rounded border">
                        <p className="text-sm font-medium">{importResult.workflow.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {importResult.workflow.nodes?.length || 0} nodes, {' '}
                          {importResult.workflow.edges?.length || 0} connections
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                onOpenChange(false);
                setImportResult(null);
              }}>
                Cancel
              </Button>
              {importResult?.success ? (
                <Button onClick={handleConfirmImport}>
                  Import Workflow
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setImportResult(null)}
                  disabled={!importResult}
                >
                  Try Again
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default ExportImportDialog;
