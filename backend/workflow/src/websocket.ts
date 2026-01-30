/**
 * WebSocket Module
 * 
 * Real-time execution updates via WebSocket connections
 */

import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';

// ============================================================
// Types
// ============================================================

export interface ExecutionUpdate {
    type: 'execution_started' | 'node_started' | 'node_completed' | 'node_failed' | 'execution_completed' | 'execution_failed';
    executionId: string;
    workflowId: string;
    nodeId?: string;
    nodeName?: string;
    status: string;
    data?: unknown;
    error?: string;
    timestamp: string;
}

interface ClientConnection {
    ws: WebSocket;
    subscriptions: Set<string>; // workflowIds or executionIds
    userId?: string;
}

// ============================================================
// WebSocket Manager Class
// ============================================================

export class WebSocketManager {
    private wss: WebSocketServer | null = null;
    private clients: Map<string, ClientConnection> = new Map();
    private clientIdCounter = 0;

    /**
     * Initialize WebSocket server
     */
    initialize(server: HttpServer): void {
        this.wss = new WebSocketServer({
            server,
            path: '/ws'
        });

        this.wss.on('connection', (ws, req) => {
            const clientId = `client_${++this.clientIdCounter}`;

            // Extract userId from query if available
            const url = new URL(req.url || '', `http://${req.headers.host}`);
            const userId = url.searchParams.get('userId') || undefined;

            this.clients.set(clientId, {
                ws,
                subscriptions: new Set(),
                userId
            });

            console.log(`[WS] Client connected: ${clientId}`);

            // Handle incoming messages
            ws.on('message', (data) => {
                this.handleMessage(clientId, data.toString());
            });

            // Handle disconnect
            ws.on('close', () => {
                this.clients.delete(clientId);
                console.log(`[WS] Client disconnected: ${clientId}`);
            });

            // Send welcome message
            ws.send(JSON.stringify({
                type: 'connected',
                clientId,
                timestamp: new Date().toISOString()
            }));
        });

        console.log('[WS] WebSocket server initialized on /ws');
    }

    /**
     * Handle incoming WebSocket messages
     */
    private handleMessage(clientId: string, message: string): void {
        try {
            const data = JSON.parse(message);
            const client = this.clients.get(clientId);

            if (!client) return;

            switch (data.action) {
                case 'subscribe':
                    // Subscribe to workflow or execution updates
                    if (data.workflowId) {
                        client.subscriptions.add(`workflow:${data.workflowId}`);
                        console.log(`[WS] ${clientId} subscribed to workflow ${data.workflowId}`);
                    }
                    if (data.executionId) {
                        client.subscriptions.add(`execution:${data.executionId}`);
                        console.log(`[WS] ${clientId} subscribed to execution ${data.executionId}`);
                    }
                    break;

                case 'unsubscribe':
                    if (data.workflowId) {
                        client.subscriptions.delete(`workflow:${data.workflowId}`);
                    }
                    if (data.executionId) {
                        client.subscriptions.delete(`execution:${data.executionId}`);
                    }
                    break;

                case 'ping':
                    client.ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
                    break;
            }
        } catch (error) {
            console.error('[WS] Error handling message:', error);
        }
    }

    /**
     * Broadcast execution update to subscribed clients
     */
    broadcast(update: ExecutionUpdate): void {
        const message = JSON.stringify(update);
        const workflowKey = `workflow:${update.workflowId}`;
        const executionKey = `execution:${update.executionId}`;

        for (const [clientId, client] of this.clients) {
            if (client.ws.readyState !== WebSocket.OPEN) continue;

            // Check if client is subscribed
            if (client.subscriptions.has(workflowKey) || client.subscriptions.has(executionKey)) {
                try {
                    client.ws.send(message);
                } catch (error) {
                    console.error(`[WS] Error sending to ${clientId}:`, error);
                }
            }
        }
    }

    /**
     * Send update to all clients subscribed to a specific user
     */
    broadcastToUser(userId: string, update: ExecutionUpdate): void {
        const message = JSON.stringify(update);

        for (const [_, client] of this.clients) {
            if (client.userId === userId && client.ws.readyState === WebSocket.OPEN) {
                try {
                    client.ws.send(message);
                } catch (error) {
                    console.error('[WS] Error sending to user:', error);
                }
            }
        }
    }

    /**
     * Get connected client count
     */
    getClientCount(): number {
        return this.clients.size;
    }

    /**
     * Close all connections
     */
    shutdown(): void {
        for (const [_, client] of this.clients) {
            client.ws.close();
        }
        this.clients.clear();
        this.wss?.close();
    }
}

// ============================================================
// Singleton Instance
// ============================================================

let wsManager: WebSocketManager | null = null;

/**
 * Get or create WebSocket manager instance
 */
export function getWebSocketManager(): WebSocketManager {
    if (!wsManager) {
        wsManager = new WebSocketManager();
    }
    return wsManager;
}

// ============================================================
// Helper Functions for Execution Events
// ============================================================

export function emitExecutionStarted(
    executionId: string,
    workflowId: string
): void {
    getWebSocketManager().broadcast({
        type: 'execution_started',
        executionId,
        workflowId,
        status: 'running',
        timestamp: new Date().toISOString()
    });
}

export function emitNodeStarted(
    executionId: string,
    workflowId: string,
    nodeId: string,
    nodeName: string
): void {
    getWebSocketManager().broadcast({
        type: 'node_started',
        executionId,
        workflowId,
        nodeId,
        nodeName,
        status: 'running',
        timestamp: new Date().toISOString()
    });
}

export function emitNodeCompleted(
    executionId: string,
    workflowId: string,
    nodeId: string,
    nodeName: string,
    data?: unknown
): void {
    getWebSocketManager().broadcast({
        type: 'node_completed',
        executionId,
        workflowId,
        nodeId,
        nodeName,
        status: 'completed',
        data,
        timestamp: new Date().toISOString()
    });
}

export function emitNodeFailed(
    executionId: string,
    workflowId: string,
    nodeId: string,
    nodeName: string,
    error: string
): void {
    getWebSocketManager().broadcast({
        type: 'node_failed',
        executionId,
        workflowId,
        nodeId,
        nodeName,
        status: 'failed',
        error,
        timestamp: new Date().toISOString()
    });
}

export function emitExecutionCompleted(
    executionId: string,
    workflowId: string,
    result?: unknown
): void {
    getWebSocketManager().broadcast({
        type: 'execution_completed',
        executionId,
        workflowId,
        status: 'completed',
        data: result,
        timestamp: new Date().toISOString()
    });
}

export function emitExecutionFailed(
    executionId: string,
    workflowId: string,
    error: string
): void {
    getWebSocketManager().broadcast({
        type: 'execution_failed',
        executionId,
        workflowId,
        status: 'failed',
        error,
        timestamp: new Date().toISOString()
    });
}
