import React from 'react';
import { 
  Play, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Clock, 
  Zap, 
  DollarSign,
  RefreshCw 
} from 'lucide-react';
import { useExecutionMonitor } from '../../hooks/use-execution-monitor';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';

interface ExecutionPanelProps {
  workflowId: string;
  onNodeHighlight?: (nodeId: string | null) => void;
}

export function ExecutionPanel({ workflowId, onNodeHighlight }: ExecutionPanelProps) {
  const {
    connected,
    executionState,
    isRunning,
    isComplete,
    isFailed,
    getDuration,
    getNodeList,
    reset
  } = useExecutionMonitor({
    onNodeStart: (nodeId) => onNodeHighlight?.(nodeId),
    onExecutionComplete: () => onNodeHighlight?.(null),
    onExecutionFailed: () => onNodeHighlight?.(null)
  });

  const nodeList = getNodeList();
  const duration = getDuration();

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  };

  const formatCost = (cost: number) => {
    if (cost === 0) return 'Free';
    if (cost < 0.01) return `$${cost.toFixed(6)}`;
    if (cost < 1) return `$${cost.toFixed(4)}`;
    return `$${cost.toFixed(2)}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'completed':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'failed':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="flex flex-col h-full bg-background border-l">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          <span className="font-semibold">Execution Monitor</span>
          {!connected && (
            <Badge variant="outline\" className="text-xs text-yellow-500 border-yellow-500/50">
              Disconnected
            </Badge>
          )}
        </div>
        {executionState.status !== 'idle' && (
          <Button variant="ghost" size="sm" onClick={reset}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Status Bar */}
      {executionState.status !== 'idle' && (
        <div className={`p-3 border-b ${getStatusColor(executionState.status)}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(executionState.status)}
              <span className="font-medium capitalize">{executionState.status}</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatDuration(duration)}
              </div>
              {executionState.totalCost > 0 && (
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5" />
                  {formatCost(executionState.totalCost)}
                </div>
              )}
            </div>
          </div>
          
          {/* Progress Bar */}
          {isRunning && (
            <div className="mt-2">
              <div className="h-1.5 bg-background/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-300 ease-out"
                  style={{ width: `${executionState.progress}%` }}
                />
              </div>
              <div className="text-xs mt-1 opacity-70">
                {Math.round(executionState.progress)}% complete
              </div>
            </div>
          )}
        </div>
      )}

      {/* Node List */}
      <ScrollArea className="flex-1">
        {executionState.status === 'idle' ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
            <Play className="h-12 w-12 mb-4 opacity-30" />
            <p className="text-sm">Run a workflow to see execution details</p>
            <p className="text-xs mt-2 opacity-70">
              Real-time monitoring of each node
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {nodeList.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Waiting for execution to start...
              </div>
            ) : (
              nodeList.map((node, index) => (
                <div 
                  key={node.nodeId}
                  className={`p-3 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50 ${
                    executionState.currentNode === node.nodeId ? 'bg-blue-500/5 border-blue-500/30' : ''
                  }`}
                  onClick={() => onNodeHighlight?.(node.nodeId)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-muted text-xs font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{node.nodeName}</span>
                        {getStatusIcon(node.status)}
                      </div>
                      {node.duration !== undefined && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {formatDuration(node.duration)}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Node Output Preview */}
                  {node.output && node.status === 'completed' && (
                    <div className="mt-2 p-2 bg-muted/50 rounded text-xs font-mono overflow-hidden">
                      <div className="truncate opacity-70">
                        {typeof node.output === 'string' 
                          ? node.output.substring(0, 100)
                          : JSON.stringify(node.output).substring(0, 100)}
                        {(typeof node.output === 'string' ? node.output : JSON.stringify(node.output)).length > 100 && '...'}
                      </div>
                    </div>
                  )}
                  
                  {/* Error Message */}
                  {node.error && (
                    <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-500">
                      {node.error}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </ScrollArea>

      {/* Footer with Summary */}
      {isComplete && (
        <div className="p-4 border-t bg-green-500/5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-green-600 font-medium">Execution Complete</span>
            <div className="flex items-center gap-3 text-muted-foreground">
              <span>{nodeList.length} nodes</span>
              <span>{formatDuration(duration)}</span>
              {executionState.totalCost > 0 && (
                <span>{formatCost(executionState.totalCost)}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {isFailed && executionState.error && (
        <div className="p-4 border-t bg-red-500/5">
          <div className="text-sm text-red-500">
            <span className="font-medium">Error: </span>
            {executionState.error}
          </div>
        </div>
      )}
    </div>
  );
}

export default ExecutionPanel;
