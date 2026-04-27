// Real-time WebSocket service for live execution monitoring
import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

interface ExecutionEvent {
  executionId: string;
  nodeId?: string;
  status: 'started' | 'node-started' | 'node-completed' | 'node-failed' | 'completed' | 'failed';
  data?: any;
  error?: string;
  timestamp: Date;
}

class WebSocketService {
  private io: Server | null = null;
  private executionRooms: Map<string, Set<string>> = new Map();

  init(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: ['http://localhost:5173', 'http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true
      },
      path: '/ws'
    });

    this.io.on('connection', (socket: Socket) => {
      console.log('[WebSocket] Client connected:', socket.id);

      // Join execution room to receive updates
      socket.on('join-execution', (executionId: string) => {
        const room = `execution-${executionId}`;
        socket.join(room);
        
        if (!this.executionRooms.has(executionId)) {
          this.executionRooms.set(executionId, new Set());
        }
        this.executionRooms.get(executionId)!.add(socket.id);
        
        console.log(`[WebSocket] Client ${socket.id} joined ${room}`);
      });

      // Leave execution room
      socket.on('leave-execution', (executionId: string) => {
        const room = `execution-${executionId}`;
        socket.leave(room);
        
        if (this.executionRooms.has(executionId)) {
          this.executionRooms.get(executionId)!.delete(socket.id);
        }
        
        console.log(`[WebSocket] Client ${socket.id} left ${room}`);
      });

      // Join workflow room for general updates
      socket.on('join-workflow', (workflowId: string) => {
        socket.join(`workflow-${workflowId}`);
        console.log(`[WebSocket] Client ${socket.id} joined workflow-${workflowId}`);
      });

      socket.on('disconnect', () => {
        console.log('[WebSocket] Client disconnected:', socket.id);
        
        // Clean up room memberships
        this.executionRooms.forEach((clients, executionId) => {
          clients.delete(socket.id);
          if (clients.size === 0) {
            this.executionRooms.delete(executionId);
          }
        });
      });
    });

    console.log('[WebSocket] Server initialized');
    return this.io;
  }

  // Emit when execution starts
  emitExecutionStarted(executionId: string, workflowId: string, totalNodes: number) {
    this.emit(`execution-${executionId}`, 'execution-started', {
      executionId,
      workflowId,
      totalNodes,
      timestamp: new Date()
    });
  }

  // Emit when a node starts processing
  emitNodeStarted(executionId: string, nodeId: string, nodeName: string, nodeType: string) {
    this.emit(`execution-${executionId}`, 'node-started', {
      executionId,
      nodeId,
      nodeName,
      nodeType,
      timestamp: new Date()
    });
  }

  // Emit when a node completes successfully
  emitNodeCompleted(executionId: string, nodeId: string, output: any, duration: number, tokensUsed?: number, cost?: number) {
    this.emit(`execution-${executionId}`, 'node-completed', {
      executionId,
      nodeId,
      output: this.truncateOutput(output),
      duration,
      tokensUsed,
      cost,
      timestamp: new Date()
    });
  }

  // Emit when a node fails
  emitNodeFailed(executionId: string, nodeId: string, error: string) {
    this.emit(`execution-${executionId}`, 'node-failed', {
      executionId,
      nodeId,
      error,
      timestamp: new Date()
    });
  }

  // Emit when execution completes
  emitExecutionCompleted(executionId: string, result: any, totalDuration: number, totalCost: number) {
    this.emit(`execution-${executionId}`, 'execution-completed', {
      executionId,
      result: this.truncateOutput(result),
      totalDuration,
      totalCost,
      timestamp: new Date()
    });
  }

  // Emit when execution fails
  emitExecutionFailed(executionId: string, error: string) {
    this.emit(`execution-${executionId}`, 'execution-failed', {
      executionId,
      error,
      timestamp: new Date()
    });
  }

  // Emit progress update
  emitProgress(executionId: string, completedNodes: number, totalNodes: number) {
    this.emit(`execution-${executionId}`, 'execution-progress', {
      executionId,
      completedNodes,
      totalNodes,
      percentage: Math.round((completedNodes / totalNodes) * 100),
      timestamp: new Date()
    });
  }

  // Generic emit helper
  private emit(room: string, event: string, data: any) {
    if (this.io) {
      this.io.to(room).emit(event, data);
    }
  }

  // Truncate large outputs to prevent memory issues
  private truncateOutput(output: any, maxLength: number = 5000): any {
    if (typeof output === 'string' && output.length > maxLength) {
      return output.substring(0, maxLength) + '... [truncated]';
    }
    if (typeof output === 'object') {
      const str = JSON.stringify(output);
      if (str.length > maxLength) {
        return JSON.parse(str.substring(0, maxLength) + '"}');
      }
    }
    return output;
  }

  // Get connected clients count for an execution
  getClientsCount(executionId: string): number {
    return this.executionRooms.get(executionId)?.size || 0;
  }
}

// Singleton instance
export const wsService = new WebSocketService();
export default wsService;
